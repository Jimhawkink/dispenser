import express, { Request, Response } from 'express';
import supabase from '../config/supabase';
import { authenticate, requireAdmin } from '../middleware/auth';
import { addDebitEntry, addCreditEntry } from '../services/ledger.service';
import { sendSaleConfirmationSMS } from '../services/sms.service';

const router = express.Router();

// GET /api/sales
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { customer_id, payment_status, payment_type, from, to, page = '1', limit = '50', search } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    let query = supabase.from('fuel_sales')
      .select(`*, customer:fuel_customers(id, name, customer_code, phone, company_name)`, { count: 'exact' });
    if (customer_id) query = query.eq('customer_id', customer_id);
    if (payment_status) query = query.eq('payment_status', payment_status);
    if (payment_type) query = query.eq('payment_type', payment_type);
    if (from) query = query.gte('sale_date', from as string);
    if (to) query = query.lte('sale_date', `${to}T23:59:59`);
    if (search) query = query.ilike('sale_number', `%${search}%`);
    query = query.order('sale_date', { ascending: false }).range(offset, offset + parseInt(limit as string) - 1);
    const { data, count, error } = await query;
    if (error) throw error;
    res.json({ success: true, data: data || [], pagination: { page: parseInt(page as string), limit: parseInt(limit as string), total: count || 0, pages: Math.ceil((count || 0) / parseInt(limit as string)) } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch sales' });
  }
});

// GET /api/sales/:id
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { data: sale, error } = await supabase.from('fuel_sales')
      .select(`*, customer:fuel_customers(id, name, customer_code, phone, email, company_name, current_balance)`)
      .eq('id', req.params.id).single();
    if (error || !sale) { res.status(404).json({ success: false, error: 'Sale not found' }); return; }
    const { data: items } = await supabase.from('fuel_sale_items')
      .select(`*, product:fuel_products(id, name, code, unit, colour)`).eq('sale_id', req.params.id);
    const { data: allocations } = await supabase.from('fuel_payment_allocations')
      .select(`*, payment:fuel_payments(payment_number, payment_channel, transaction_reference, payment_date)`).eq('sale_id', req.params.id);
    res.json({ success: true, data: { ...sale, items: items || [], allocations: allocations || [] } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch sale' });
  }
});

// POST /api/sales
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { customer_id, payment_type, items, notes, amount_paid = 0, payment_channel } = req.body;
    if (!customer_id || !items || !items.length) {
      res.status(400).json({ success: false, error: 'customer_id and items are required' }); return;
    }

    // Validate customer
    const { data: customer } = await supabase.from('fuel_customers').select('id, name, phone, current_balance, credit_limit').eq('id', customer_id).single();
    if (!customer) { res.status(404).json({ success: false, error: 'Customer not found' }); return; }

    // Calculate totals & validate stock
    let subtotal = 0;
    const validatedItems: Array<{ product_id: string; litres: number; price_per_litre: number; subtotal: number; name: string; code: string }> = [];
    for (const item of items) {
      const { data: product } = await supabase.from('fuel_products').select('id, name, code, selling_price_per_litre, current_stock_litres').eq('id', item.product_id).eq('is_active', true).single();
      if (!product) { res.status(400).json({ success: false, error: `Product ${item.product_id} not found` }); return; }
      if (product.current_stock_litres < item.litres) {
        res.status(400).json({ success: false, error: `Insufficient stock for ${product.name}. Available: ${product.current_stock_litres}L` }); return;
      }
      const itemSubtotal = parseFloat((item.litres * (item.price_per_litre || product.selling_price_per_litre)).toFixed(2));
      subtotal += itemSubtotal;
      validatedItems.push({ product_id: item.product_id, litres: item.litres, price_per_litre: item.price_per_litre || product.selling_price_per_litre, subtotal: itemSubtotal, name: product.name, code: product.code });
    }

    const totalAmount = subtotal;
    const paidAmount = payment_type === 'pay_now' ? parseFloat(amount_paid.toString()) : 0;
    let paymentStatus: string;
    if (payment_type === 'pay_later') {
      paymentStatus = 'credit';
    } else if (paidAmount >= totalAmount) {
      paymentStatus = 'paid';
    } else if (paidAmount > 0) {
      paymentStatus = 'partial';
    } else {
      paymentStatus = 'pending';
    }

    // Insert sale
    const { data: sale, error: saleError } = await supabase.from('fuel_sales').insert({
      customer_id, sale_date: new Date().toISOString(), subtotal, total_amount: totalAmount,
      amount_paid: paidAmount, payment_status: paymentStatus, payment_type: payment_type || 'pay_now',
      notes: notes || null, created_by: req.user!.id
    }).select('id, sale_number').single();
    if (saleError || !sale) throw saleError;

    // Insert items & reduce stock
    for (const item of validatedItems) {
      await supabase.from('fuel_sale_items').insert({ sale_id: sale.id, product_id: item.product_id, litres: item.litres, price_per_litre: item.price_per_litre, subtotal: item.subtotal });
      await supabase.from('fuel_products').update({ current_stock_litres: supabase.rpc as unknown as number }).eq('id', item.product_id);
      // Decrement stock via RPC-like approach
      const { data: prod } = await supabase.from('fuel_products').select('current_stock_litres').eq('id', item.product_id).single();
      if (prod) {
        await supabase.from('fuel_products').update({ current_stock_litres: Math.max(0, prod.current_stock_litres - item.litres), updated_at: new Date().toISOString() }).eq('id', item.product_id);
      }
    }

    // Ledger entries
    const balanceDue = totalAmount - paidAmount;
    if (balanceDue > 0) {
      await addDebitEntry(customer_id, balanceDue, 'sale', sale.id, sale.sale_number, `Sale ${sale.sale_number} - Balance due`, req.user!.id);
    }
    if (paidAmount > 0) {
      // Record payment
      await supabase.from('fuel_payments').insert({
        customer_id, amount: paidAmount, payment_channel: payment_channel || 'cash',
        payment_date: new Date().toISOString(), status: 'reconciled', auto_matched: true,
        notes: `Direct payment for sale ${sale.sale_number}`, created_by: req.user!.id
      });
      if (balanceDue <= 0) {
        // Full payment — no debit needed, just record
      }
    }

    // SMS
    const smsEnabled = await getSystemSetting('sms_on_sale');
    if (smsEnabled === 'true' && customer.phone) {
      const mainItem = validatedItems[0];
      await sendSaleConfirmationSMS(customer.name, customer.phone, sale.sale_number, totalAmount, mainItem?.litres || 0, mainItem?.name || 'Fuel');
    }

    const { data: fullSale } = await supabase.from('fuel_sales')
      .select(`*, customer:fuel_customers(id, name, customer_code, phone)`).eq('id', sale.id).single();
    const { data: saleItems } = await supabase.from('fuel_sale_items')
      .select(`*, product:fuel_products(name, code, unit)`).eq('sale_id', sale.id);

    res.status(201).json({ success: true, data: { ...fullSale, items: saleItems || [] } });
  } catch (err) {
    console.error('[Sales] Create error:', err);
    res.status(500).json({ success: false, error: 'Failed to create sale' });
  }
});

// DELETE /api/sales/:id — void sale (admin only)
router.delete('/:id', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { reason } = req.body;
    const { data: sale } = await supabase.from('fuel_sales').select('*').eq('id', req.params.id).single();
    if (!sale) { res.status(404).json({ success: false, error: 'Sale not found' }); return; }
    if (sale.payment_status === 'void') { res.status(400).json({ success: false, error: 'Sale already voided' }); return; }
    await supabase.from('fuel_sales').update({
      payment_status: 'void', voided_at: new Date().toISOString(),
      voided_by: req.user!.id, void_reason: reason || 'Admin voided', updated_at: new Date().toISOString()
    }).eq('id', req.params.id);
    // Reverse ledger if balance was due
    if (sale.balance_due > 0) {
      await addCreditEntry(sale.customer_id, sale.balance_due, 'adjustment', sale.id, sale.sale_number, `Sale ${sale.sale_number} voided - balance reversed`, req.user!.id);
    }
    res.json({ success: true, message: 'Sale voided successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to void sale' });
  }
});

async function getSystemSetting(key: string): Promise<string> {
  const { data } = await supabase.from('fuel_system_settings').select('value').eq('key', key).single();
  return data?.value || '';
}

export default router;
