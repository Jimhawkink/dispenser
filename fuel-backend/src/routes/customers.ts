import express, { Request, Response } from 'express';
import supabase from '../config/supabase';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// GET /api/customers
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { search, is_active, page = '1', limit = '50' } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    let query = supabase.from('fuel_customers').select('*', { count: 'exact' });
    if (is_active !== undefined) query = query.eq('is_active', is_active === 'true');
    if (search) query = query.or(`name.ilike.%${search}%,customer_code.ilike.%${search}%,phone.ilike.%${search}%,company_name.ilike.%${search}%`);
    query = query.order('name', { ascending: true }).range(offset, offset + parseInt(limit as string) - 1);
    const { data, count, error } = await query;
    if (error) throw error;
    res.json({ success: true, data: data || [], pagination: { page: parseInt(page as string), limit: parseInt(limit as string), total: count || 0, pages: Math.ceil((count || 0) / parseInt(limit as string)) } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch customers' });
  }
});

// GET /api/customers/:id
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase.from('fuel_customers').select('*').eq('id', req.params.id).single();
    if (error || !data) { res.status(404).json({ success: false, error: 'Customer not found' }); return; }
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch customer' });
  }
});

// POST /api/customers
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { name, phone, alt_phone, email, company_name, vehicle_plates, id_number, credit_limit, payment_preference, address, notes } = req.body;
    if (!name || !phone) { res.status(400).json({ success: false, error: 'Name and phone are required' }); return; }
    const { data, error } = await supabase.from('fuel_customers').insert({
      name, phone, alt_phone: alt_phone || null, email: email || null,
      company_name: company_name || null, vehicle_plates: vehicle_plates || [],
      id_number: id_number || null, credit_limit: credit_limit || 0,
      payment_preference: payment_preference || 'mpesa', address: address || null,
      notes: notes || null, created_by: req.user!.id
    }).select('*').single();
    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e.code === '23505') { res.status(409).json({ success: false, error: 'Phone number already registered' }); return; }
    res.status(500).json({ success: false, error: 'Failed to create customer' });
  }
});

// PUT /api/customers/:id
router.put('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { name, phone, alt_phone, email, company_name, vehicle_plates, id_number, credit_limit, payment_preference, address, notes, is_active } = req.body;
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (alt_phone !== undefined) updates.alt_phone = alt_phone;
    if (email !== undefined) updates.email = email;
    if (company_name !== undefined) updates.company_name = company_name;
    if (vehicle_plates !== undefined) updates.vehicle_plates = vehicle_plates;
    if (id_number !== undefined) updates.id_number = id_number;
    if (credit_limit !== undefined) updates.credit_limit = credit_limit;
    if (payment_preference !== undefined) updates.payment_preference = payment_preference;
    if (address !== undefined) updates.address = address;
    if (notes !== undefined) updates.notes = notes;
    if (is_active !== undefined) updates.is_active = is_active;
    const { data, error } = await supabase.from('fuel_customers').update(updates).eq('id', req.params.id).select('*').single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update customer' });
  }
});

// DELETE /api/customers/:id (soft delete)
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    await supabase.from('fuel_customers').update({ is_active: false, updated_at: new Date().toISOString() }).eq('id', req.params.id);
    res.json({ success: true, message: 'Customer deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to deactivate customer' });
  }
});

// GET /api/customers/:id/transactions — sales + payments
router.get('/:id/transactions', authenticate, async (req: Request, res: Response) => {
  try {
    const [salesRes, paymentsRes] = await Promise.all([
      supabase.from('fuel_sales').select('id, sale_number, sale_date, total_amount, amount_paid, balance_due, payment_status, payment_type').eq('customer_id', req.params.id).order('sale_date', { ascending: false }).limit(100),
      supabase.from('fuel_payments').select('id, payment_number, payment_date, amount, payment_channel, status, transaction_reference').eq('customer_id', req.params.id).order('payment_date', { ascending: false }).limit(100),
    ]);
    res.json({ success: true, data: { sales: salesRes.data || [], payments: paymentsRes.data || [] } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch transactions' });
  }
});

// GET /api/customers/:id/statement — credit ledger
router.get('/:id/statement', authenticate, async (req: Request, res: Response) => {
  try {
    const { from, to } = req.query;
    let query = supabase.from('fuel_credit_ledger').select('*').eq('customer_id', req.params.id);
    if (from) query = query.gte('created_at', from as string);
    if (to) query = query.lte('created_at', `${to}T23:59:59`);
    query = query.order('created_at', { ascending: true });
    const { data: ledger } = await query;
    const { data: customer } = await supabase.from('fuel_customers').select('id, name, customer_code, phone, email, company_name, current_balance, credit_limit').eq('id', req.params.id).single();
    res.json({ success: true, data: { customer, ledger: ledger || [] } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch statement' });
  }
});

// GET /api/customers/:id/balance
router.get('/:id/balance', authenticate, async (req: Request, res: Response) => {
  try {
    const { data } = await supabase.from('fuel_customers').select('current_balance, credit_limit').eq('id', req.params.id).single();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch balance' });
  }
});

export default router;
