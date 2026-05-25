import express, { Request, Response } from 'express';
import supabase from '../config/supabase';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// GET /api/dashboard/stats
router.get('/stats', authenticate, async (_req: Request, res: Response) => {
  try {
    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    const todayEnd = new Date(); todayEnd.setHours(23,59,59,999);
    const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - 6); weekStart.setHours(0,0,0,0);

    const [
      todaySalesRes, todayCollRes, outstandingRes, unmatchedRes,
      lowStockRes, channelRes, topDebtorsRes, weeklyRes
    ] = await Promise.all([
      supabase.from('fuel_sales')
        .select('total_amount')
        .gte('sale_date', todayStart.toISOString())
        .lte('sale_date', todayEnd.toISOString())
        .neq('payment_status', 'void'),
      supabase.from('fuel_payments')
        .select('amount')
        .gte('payment_date', todayStart.toISOString())
        .lte('payment_date', todayEnd.toISOString())
        .in('status', ['confirmed','reconciled']),
      supabase.from('fuel_customers')
        .select('current_balance')
        .gt('current_balance', 0)
        .eq('is_active', true),
      supabase.from('fuel_payments')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'unmatched'),
      supabase.from('fuel_products')
        .select('id, name, code, current_stock_litres, low_stock_alert_litres, colour')
        .lte('current_stock_litres', supabase.rpc as unknown as number)
        .eq('is_active', true),
      supabase.from('fuel_payments')
        .select('payment_channel, amount')
        .gte('payment_date', weekStart.toISOString())
        .in('status', ['confirmed','reconciled']),
      supabase.from('fuel_customers')
        .select('id, name, customer_code, current_balance, phone')
        .gt('current_balance', 0)
        .eq('is_active', true)
        .order('current_balance', { ascending: false })
        .limit(10),
      supabase.from('fuel_sales')
        .select('sale_date, total_amount, amount_paid')
        .gte('sale_date', weekStart.toISOString())
        .neq('payment_status', 'void')
        .order('sale_date', { ascending: true }),
    ]);

    // Calculate today's sales total
    const todaySales = (todaySalesRes.data || []).reduce((sum, s) => sum + Number(s.total_amount), 0);
    const todayCollections = (todayCollRes.data || []).reduce((sum, p) => sum + Number(p.amount), 0);
    const totalOutstanding = (outstandingRes.data || []).reduce((sum, c) => sum + Number(c.current_balance), 0);
    const unmatchedCount = unmatchedRes.count || 0;

    // Low stock products (filter manually since raw SQL not available)
    const { data: allProducts } = await supabase.from('fuel_products')
      .select('id, name, code, current_stock_litres, low_stock_alert_litres, colour').eq('is_active', true);
    const lowStockProducts = (allProducts || []).filter(p => p.current_stock_litres <= p.low_stock_alert_litres);

    // Channel breakdown
    const channelMap: Record<string, { amount: number; count: number }> = {};
    for (const p of (channelRes.data || [])) {
      if (!channelMap[p.payment_channel]) channelMap[p.payment_channel] = { amount: 0, count: 0 };
      channelMap[p.payment_channel].amount += Number(p.amount);
      channelMap[p.payment_channel].count += 1;
    }
    const paymentChannels = Object.entries(channelMap).map(([channel, stats]) => ({ channel, ...stats }));

    // Weekly revenue data (group by day)
    const weeklyData: Record<string, { revenue: number; credit: number }> = {};
    for (const s of (weeklyRes.data || [])) {
      const day = s.sale_date.slice(0, 10);
      if (!weeklyData[day]) weeklyData[day] = { revenue: 0, credit: 0 };
      weeklyData[day].revenue += Number(s.total_amount);
      weeklyData[day].credit += Number(s.total_amount) - Number(s.amount_paid);
    }
    const weeklyChart = Object.entries(weeklyData).map(([date, vals]) => ({ date, ...vals }));

    res.json({
      success: true,
      data: {
        today_sales: todaySales,
        today_collections: todayCollections,
        total_outstanding: totalOutstanding,
        unmatched_payments: unmatchedCount,
        low_stock_products: lowStockProducts,
        payment_channels: paymentChannels,
        top_debtors: topDebtorsRes.data || [],
        weekly_chart: weeklyChart,
      }
    });
  } catch (err) {
    console.error('[Dashboard] Stats error:', err);
    res.status(500).json({ success: false, error: 'Failed to load dashboard stats' });
  }
});

// GET /api/dashboard/live-feed — recent 30 payments + sales combined
router.get('/live-feed', authenticate, async (_req: Request, res: Response) => {
  try {
    const { data: payments } = await supabase.from('fuel_payments')
      .select(`id, payment_number, amount, payment_channel, status, transaction_reference, payer_name, phone_number, payment_date, auto_matched, customer:fuel_customers(name, customer_code)`)
      .order('payment_date', { ascending: false }).limit(30);
    res.json({ success: true, data: payments || [] });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to load live feed' });
  }
});

export default router;
