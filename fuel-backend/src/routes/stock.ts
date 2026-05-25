import express, { Request, Response } from 'express';
import supabase from '../config/supabase';
import { authenticate } from '../middleware/auth';
import { sendLowStockAlertSMS } from '../services/sms.service';

const router = express.Router();

// GET /api/stock — current stock levels
router.get('/', authenticate, async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabase.from('fuel_products')
      .select('id, name, code, unit, current_stock_litres, low_stock_alert_litres, selling_price_per_litre, buying_price_per_litre, colour, is_active')
      .eq('is_active', true).order('name');
    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch stock' });
  }
});

// POST /api/stock/delivery — record incoming fuel delivery
router.post('/delivery', authenticate, async (req: Request, res: Response) => {
  try {
    const { product_id, litres_delivered, cost_per_litre, delivery_date, supplier_name, invoice_number, vehicle_number, notes } = req.body;
    if (!product_id || !litres_delivered || !cost_per_litre) {
      res.status(400).json({ success: false, error: 'product_id, litres_delivered and cost_per_litre required' }); return;
    }
    const { data: product } = await supabase.from('fuel_products').select('current_stock_litres, name').eq('id', product_id).single();
    if (!product) { res.status(404).json({ success: false, error: 'Product not found' }); return; }

    const { data, error } = await supabase.from('fuel_stock_deliveries').insert({
      product_id, litres_delivered, cost_per_litre,
      delivery_date: delivery_date || new Date().toISOString(),
      supplier_name: supplier_name || null, invoice_number: invoice_number || null,
      vehicle_number: vehicle_number || null, notes: notes || null, created_by: req.user!.id
    }).select('*').single();
    if (error) throw error;

    // Increase stock
    const newStock = product.current_stock_litres + litres_delivered;
    await supabase.from('fuel_products').update({ current_stock_litres: newStock, updated_at: new Date().toISOString() }).eq('id', product_id);

    res.status(201).json({ success: true, data: { ...data, new_stock: newStock } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to record delivery' });
  }
});

// GET /api/stock/deliveries
router.get('/deliveries', authenticate, async (req: Request, res: Response) => {
  try {
    const { product_id, from, to, page = '1', limit = '50' } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    let query = supabase.from('fuel_stock_deliveries')
      .select(`*, product:fuel_products(id, name, code, colour)`, { count: 'exact' });
    if (product_id) query = query.eq('product_id', product_id);
    if (from) query = query.gte('delivery_date', from as string);
    if (to) query = query.lte('delivery_date', `${to}T23:59:59`);
    query = query.order('delivery_date', { ascending: false }).range(offset, offset + parseInt(limit as string) - 1);
    const { data, count, error } = await query;
    if (error) throw error;
    res.json({ success: true, data: data || [], pagination: { page: parseInt(page as string), limit: parseInt(limit as string), total: count || 0, pages: Math.ceil((count || 0) / parseInt(limit as string)) } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch deliveries' });
  }
});

// POST /api/stock/check-alerts — check low stock and send alerts
router.post('/check-alerts', authenticate, async (_req: Request, res: Response) => {
  try {
    const { data: products } = await supabase.from('fuel_products')
      .select('name, current_stock_litres, low_stock_alert_litres').eq('is_active', true);
    const lowStock = (products || []).filter(p => p.current_stock_litres <= p.low_stock_alert_litres);
    const { data: setting } = await supabase.from('fuel_system_settings').select('value').eq('key', 'business_phone').single();
    if (setting?.value && lowStock.length > 0) {
      for (const p of lowStock) await sendLowStockAlertSMS(setting.value, p.name, p.current_stock_litres);
    }
    res.json({ success: true, data: { low_stock_products: lowStock } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to check alerts' });
  }
});

export default router;
