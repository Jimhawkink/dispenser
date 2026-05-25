import express, { Request, Response } from 'express';
import supabase from '../config/supabase';
import { authenticate, requireAdmin } from '../middleware/auth';
import { reconcilePayment } from '../services/reconciliation.service';
import { initiateSTKPush } from '../services/mpesa.service';

const router = express.Router();

// GET /api/payments
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { status, channel, customer_id, from, to, page = '1', limit = '50' } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    let query = supabase.from('fuel_payments')
      .select(`*, customer:fuel_customers(id, name, customer_code, phone)`, { count: 'exact' });
    if (status) query = query.eq('status', status);
    if (channel) query = query.eq('payment_channel', channel);
    if (customer_id) query = query.eq('customer_id', customer_id);
    if (from) query = query.gte('payment_date', from as string);
    if (to) query = query.lte('payment_date', `${to}T23:59:59`);
    query = query.order('payment_date', { ascending: false }).range(offset, offset + parseInt(limit as string) - 1);
    const { data, count, error } = await query;
    if (error) throw error;
    res.json({ success: true, data: data || [], pagination: { page: parseInt(page as string), limit: parseInt(limit as string), total: count || 0, pages: Math.ceil((count || 0) / parseInt(limit as string)) } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch payments' });
  }
});

// GET /api/payments/unmatched
router.get('/unmatched', authenticate, async (_req: Request, res: Response) => {
  try {
    const { data } = await supabase.from('fuel_payments')
      .select('*').eq('status', 'unmatched').order('payment_date', { ascending: false });
    res.json({ success: true, data: data || [] });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch unmatched payments' });
  }
});

// GET /api/payments/:id
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase.from('fuel_payments')
      .select(`*, customer:fuel_customers(id, name, customer_code, phone)`)
      .eq('id', req.params.id).single();
    if (error || !data) { res.status(404).json({ success: false, error: 'Payment not found' }); return; }
    const { data: allocations } = await supabase.from('fuel_payment_allocations')
      .select(`*, sale:fuel_sales(sale_number, total_amount, payment_status)`).eq('payment_id', req.params.id);
    res.json({ success: true, data: { ...data, allocations: allocations || [] } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch payment' });
  }
});

// POST /api/payments — manual payment recording
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { customer_id, amount, payment_channel, transaction_reference, phone_number, payer_name, payment_date, notes, receipt_url } = req.body;
    if (!amount || !payment_channel) { res.status(400).json({ success: false, error: 'Amount and payment channel required' }); return; }
    const { data, error } = await supabase.from('fuel_payments').insert({
      customer_id: customer_id || null, amount, payment_channel, transaction_reference: transaction_reference || null,
      phone_number: phone_number || null, payer_name: payer_name || null,
      payment_date: payment_date || new Date().toISOString(), status: customer_id ? 'confirmed' : 'pending',
      auto_matched: !!customer_id, matched_at: customer_id ? new Date().toISOString() : null,
      matched_by: customer_id ? req.user!.id : null, notes: notes || null, receipt_url: receipt_url || null,
    }).select('id').single();
    if (error) throw error;
    if (data && customer_id) await reconcilePayment(data.id);
    const { data: full } = await supabase.from('fuel_payments').select(`*, customer:fuel_customers(id, name, customer_code)`).eq('id', data!.id).single();
    res.status(201).json({ success: true, data: full });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to record payment' });
  }
});

// PUT /api/payments/:id/match — manually match unmatched payment to customer
router.put('/:id/match', authenticate, async (req: Request, res: Response) => {
  try {
    const { customer_id } = req.body;
    if (!customer_id) { res.status(400).json({ success: false, error: 'customer_id required' }); return; }
    await supabase.from('fuel_payments').update({
      customer_id, status: 'pending', auto_matched: false,
      matched_by: req.user!.id, matched_at: new Date().toISOString(), updated_at: new Date().toISOString()
    }).eq('id', req.params.id);
    const result = await reconcilePayment(req.params.id);
    res.json({ success: true, message: result.matched ? 'Payment matched and reconciled' : 'Payment updated but reconciliation failed', data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to match payment' });
  }
});

// POST /api/payments/:id/allocate — manually allocate to a specific sale
router.post('/:id/allocate', authenticate, async (req: Request, res: Response) => {
  try {
    const { sale_id, amount_allocated } = req.body;
    if (!sale_id || !amount_allocated) { res.status(400).json({ success: false, error: 'sale_id and amount_allocated required' }); return; }
    const { data: sale } = await supabase.from('fuel_sales').select('total_amount, amount_paid, balance_due').eq('id', sale_id).single();
    if (!sale) { res.status(404).json({ success: false, error: 'Sale not found' }); return; }
    const toAllocate = Math.min(amount_allocated, sale.balance_due);
    await supabase.from('fuel_payment_allocations').insert({ payment_id: req.params.id, sale_id, amount_allocated: toAllocate, allocated_by: req.user!.id });
    const newPaid = sale.amount_paid + toAllocate;
    const newStatus = newPaid >= sale.total_amount ? 'paid' : 'partial';
    await supabase.from('fuel_sales').update({ amount_paid: newPaid, payment_status: newStatus, updated_at: new Date().toISOString() }).eq('id', sale_id);
    res.json({ success: true, message: `KES ${toAllocate} allocated to sale` });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to allocate payment' });
  }
});

// POST /api/payments/stk-push — trigger M-Pesa STK Push
router.post('/stk-push', authenticate, async (req: Request, res: Response) => {
  try {
    const { phone, amount, customer_id, description } = req.body;
    if (!phone || !amount) { res.status(400).json({ success: false, error: 'Phone and amount required' }); return; }
    let customerCode = 'FUELFLOW';
    if (customer_id) {
      const { data: c } = await supabase.from('fuel_customers').select('customer_code, name').eq('id', customer_id).single();
      if (c) customerCode = c.customer_code;
    }
    const result = await initiateSTKPush(phone, amount, customerCode, description || 'Fuel Payment');
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[STK Push]', err);
    res.status(500).json({ success: false, error: 'Failed to initiate STK Push' });
  }
});

export default router;
