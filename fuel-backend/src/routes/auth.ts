import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import supabase from '../config/supabase';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ success: false, error: 'Email and password required' });
      return;
    }

    const { data: user } = await supabase
      .from('fuel_users')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .eq('is_active', true)
      .single();

    if (!user) {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
      return;
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
      return;
    }

    // Update last login
    await supabase.from('fuel_users').update({ last_login: new Date().toISOString() }).eq('id', user.id);

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    const { password_hash: _, ...userSafe } = user;
    res.json({ success: true, data: { token, user: userSafe } });
  } catch (err) {
    console.error('[Auth] Login error:', err);
    res.status(500).json({ success: false, error: 'Login failed' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const { data: user } = await supabase
      .from('fuel_users')
      .select('id, name, email, role, phone, avatar_url, is_active, last_login, created_at')
      .eq('id', req.user!.id)
      .single();

    if (!user) { res.status(404).json({ success: false, error: 'User not found' }); return; }
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to get user' });
  }
});

// PUT /api/auth/change-password
router.put('/change-password', authenticate, async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const { data: user } = await supabase.from('fuel_users').select('password_hash').eq('id', req.user!.id).single();
    if (!user) { res.status(404).json({ success: false, error: 'User not found' }); return; }
    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) { res.status(400).json({ success: false, error: 'Current password incorrect' }); return; }
    const hash = await bcrypt.hash(newPassword, 12);
    await supabase.from('fuel_users').update({ password_hash: hash, updated_at: new Date().toISOString() }).eq('id', req.user!.id);
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to change password' });
  }
});

// GET /api/auth/users — admin only
router.get('/users', authenticate, requireAdmin, async (_req: Request, res: Response) => {
  try {
    const { data } = await supabase
      .from('fuel_users')
      .select('id, name, email, role, phone, is_active, last_login, created_at')
      .order('created_at', { ascending: true });
    res.json({ success: true, data: data || [] });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
});

// POST /api/auth/users — admin only
router.post('/users', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, phone } = req.body;
    if (!name || !email || !password || !role) {
      res.status(400).json({ success: false, error: 'Name, email, password and role are required' }); return;
    }
    const { data: existing } = await supabase.from('fuel_users').select('id').eq('email', email.toLowerCase()).single();
    if (existing) { res.status(409).json({ success: false, error: 'Email already exists' }); return; }
    const hash = await bcrypt.hash(password, 12);
    const { data } = await supabase.from('fuel_users').insert({
      name, email: email.toLowerCase(), password_hash: hash, role, phone: phone || null
    }).select('id, name, email, role, phone, is_active, created_at').single();
    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to create user' });
  }
});

// PUT /api/auth/users/:id — admin only
router.put('/users/:id', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { name, role, phone, is_active, password } = req.body;
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (name) updates.name = name;
    if (role) updates.role = role;
    if (phone !== undefined) updates.phone = phone;
    if (is_active !== undefined) updates.is_active = is_active;
    if (password) updates.password_hash = await bcrypt.hash(password, 12);
    const { data } = await supabase.from('fuel_users').update(updates)
      .eq('id', req.params.id).select('id, name, email, role, phone, is_active').single();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update user' });
  }
});

export default router;
