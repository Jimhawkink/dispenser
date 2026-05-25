import express, { Request, Response } from 'express';
import supabase from '../config/supabase';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = express.Router();

// GET /api/settings
router.get('/', authenticate, async (_req: Request, res: Response) => {
  try {
    const { data } = await supabase.from('fuel_system_settings').select('key, value, description').order('key');
    const settings: Record<string, string> = {};
    for (const s of (data || [])) settings[s.key] = s.value || '';
    res.json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch settings' });
  }
});

// PUT /api/settings — bulk update
router.put('/', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const updates = req.body as Record<string, string>;
    for (const [key, value] of Object.entries(updates)) {
      await supabase.from('fuel_system_settings').upsert({ key, value, updated_by: req.user!.id, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    }
    res.json({ success: true, message: 'Settings updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update settings' });
  }
});

// GET /api/settings/bank-accounts
router.get('/bank-accounts', authenticate, async (_req: Request, res: Response) => {
  try {
    const { data } = await supabase.from('fuel_bank_accounts').select('*').eq('is_active', true).order('is_primary', { ascending: false });
    res.json({ success: true, data: data || [] });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch bank accounts' });
  }
});

// POST /api/settings/bank-accounts
router.post('/bank-accounts', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { bank_name, account_number, account_name, branch, paybill_number, till_number, account_ref_hint, is_primary } = req.body;
    if (!bank_name || !account_number || !account_name) {
      res.status(400).json({ success: false, error: 'bank_name, account_number and account_name required' }); return;
    }
    if (is_primary) await supabase.from('fuel_bank_accounts').update({ is_primary: false }).eq('is_primary', true);
    const { data, error } = await supabase.from('fuel_bank_accounts').insert({
      bank_name, account_number, account_name, branch: branch || null,
      paybill_number: paybill_number || null, till_number: till_number || null,
      account_ref_hint: account_ref_hint || null, is_primary: is_primary || false,
    }).select('*').single();
    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to create bank account' });
  }
});

// PUT /api/settings/bank-accounts/:id
router.put('/bank-accounts/:id', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { bank_name, account_number, account_name, branch, paybill_number, till_number, account_ref_hint, is_primary, is_active } = req.body;
    if (is_primary) await supabase.from('fuel_bank_accounts').update({ is_primary: false }).neq('id', req.params.id);
    const updates: Record<string, unknown> = {};
    if (bank_name !== undefined) updates.bank_name = bank_name;
    if (account_number !== undefined) updates.account_number = account_number;
    if (account_name !== undefined) updates.account_name = account_name;
    if (branch !== undefined) updates.branch = branch;
    if (paybill_number !== undefined) updates.paybill_number = paybill_number;
    if (till_number !== undefined) updates.till_number = till_number;
    if (account_ref_hint !== undefined) updates.account_ref_hint = account_ref_hint;
    if (is_primary !== undefined) updates.is_primary = is_primary;
    if (is_active !== undefined) updates.is_active = is_active;
    const { data, error } = await supabase.from('fuel_bank_accounts').update(updates).eq('id', req.params.id).select('*').single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update bank account' });
  }
});

export default router;
