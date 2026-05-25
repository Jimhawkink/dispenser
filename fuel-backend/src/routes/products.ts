import express, { Request, Response } from 'express';
import supabase from '../config/supabase';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = express.Router();

// GET /api/products
router.get('/', authenticate, async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabase.from('fuel_products').select('*').eq('is_active', true).order('name');
    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch products' });
  }
});

// POST /api/products
router.post('/', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { name, code, buying_price_per_litre, selling_price_per_litre, current_stock_litres, low_stock_alert_litres, colour } = req.body;
    if (!name || !code || !selling_price_per_litre) { res.status(400).json({ success: false, error: 'Name, code and selling price required' }); return; }
    const { data, error } = await supabase.from('fuel_products').insert({
      name, code: code.toUpperCase(), buying_price_per_litre: buying_price_per_litre || 0,
      selling_price_per_litre, current_stock_litres: current_stock_litres || 0,
      low_stock_alert_litres: low_stock_alert_litres || 500, colour: colour || '#10b981'
    }).select('*').single();
    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to create product' });
  }
});

// PUT /api/products/:id
router.put('/:id', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { name, buying_price_per_litre, selling_price_per_litre, low_stock_alert_litres, colour, is_active } = req.body;
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (name !== undefined) updates.name = name;
    if (buying_price_per_litre !== undefined) updates.buying_price_per_litre = buying_price_per_litre;
    if (selling_price_per_litre !== undefined) updates.selling_price_per_litre = selling_price_per_litre;
    if (low_stock_alert_litres !== undefined) updates.low_stock_alert_litres = low_stock_alert_litres;
    if (colour !== undefined) updates.colour = colour;
    if (is_active !== undefined) updates.is_active = is_active;
    const { data, error } = await supabase.from('fuel_products').update(updates).eq('id', req.params.id).select('*').single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update product' });
  }
});

export default router;
