import express, { Request, Response } from 'express';
import supabase from '../config/supabase';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// GET /api/reports/daily?date=2024-01-15
router.get('/daily', authenticate, async (req: Request, res: Response) => {
  try {
    const date = (req.query.date as string) || new Date().toISOString().slice(0, 10);
    const from = `${date}T00:00:00`;
    const to = `${date}T23:59:59`;

    const [salesRes, paymentsRes, productsRes] = await Promise.all([
      supabase.from('fuel_sales').select(`*, customer:fuel_customers(name, customer_code), items:fuel_sale_items(litres, price_per_litre, subtotal, product:fuel_products(name, code))`).gte('sale_date', from).lte('sale_date', to).neq('payment_status', 'void'),
      supabase.from('fuel_payments').select('*').gte('payment_date', from).lte('payment_date', to).in('status', ['confirmed','reconciled']),
      supabase.from('fuel_sale_items').select('litres, subtotal, product_id, product:fuel_products(name, code)').gte('created_at', from).lte('created_at', to),
    ]);

    const sales = salesRes.data || [];
    const payments = paymentsRes.data || [];

    const totalSales = sales.reduce((s, x) => s + Number(x.total_amount), 0);
    const totalCollected = payments.reduce((s, x) => s + Number(x.amount), 0);
    const totalCredit = sales.filter(s => s.payment_status !== 'paid').reduce((s, x) => s + Number(x.balance_due), 0);

    // Volume by fuel type
    const volumeMap: Record<string, { name: string; litres: number; revenue: number }> = {};
    for (const item of (productsRes.data || [])) {
      const key = (item.product as { code: string; name: string })?.code || 'UNK';
      if (!volumeMap[key]) volumeMap[key] = { name: (item.product as { name: string })?.name || key, litres: 0, revenue: 0 };
      volumeMap[key].litres += Number(item.litres);
      volumeMap[key].revenue += Number(item.subtotal);
    }

    // Channel breakdown
    const channelMap: Record<string, { amount: number; count: number }> = {};
    for (const p of payments) {
      if (!channelMap[p.payment_channel]) channelMap[p.payment_channel] = { amount: 0, count: 0 };
      channelMap[p.payment_channel].amount += Number(p.amount);
      channelMap[p.payment_channel].count += 1;
    }

    res.json({
      success: true, data: {
        date, sales_count: sales.length, total_sales: totalSales,
        total_collected: totalCollected, total_credit: totalCredit,
        payments_count: payments.length,
        volume_by_product: Object.values(volumeMap),
        channels: Object.entries(channelMap).map(([ch, v]) => ({ channel: ch, ...v })),
        sales, payments,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to generate daily report' });
  }
});

// GET /api/reports/aging — customers with overdue credit
router.get('/aging', authenticate, async (req: Request, res: Response) => {
  try {
    const graceDays = parseInt((await getSystemSetting('credit_grace_days')) || '30');
    const { data: customers } = await supabase.from('fuel_customers')
      .select('id, name, customer_code, phone, company_name, current_balance, credit_limit')
      .gt('current_balance', 0).eq('is_active', true).order('current_balance', { ascending: false });

    const aging: unknown[] = [];
    for (const c of (customers || [])) {
      const { data: oldestSale } = await supabase.from('fuel_sales')
        .select('sale_date, balance_due').eq('customer_id', c.id)
        .in('payment_status', ['partial','credit','pending'])
        .order('sale_date', { ascending: true }).limit(1).single();

      const daysDue = oldestSale ? Math.floor((Date.now() - new Date(oldestSale.sale_date).getTime()) / 86400000) : 0;
      const bucket = daysDue <= 30 ? '0-30 days' : daysDue <= 60 ? '31-60 days' : daysDue <= 90 ? '61-90 days' : 'Over 90 days';

      aging.push({
        ...c, days_outstanding: daysDue, oldest_sale_date: oldestSale?.sale_date || null,
        is_overdue: daysDue > graceDays, bucket,
        utilization_pct: c.credit_limit > 0 ? Math.round((c.current_balance / c.credit_limit) * 100) : 100,
      });
    }
    res.json({ success: true, data: aging });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to generate aging report' });
  }
});

// GET /api/reports/summary?from=2024-01-01&to=2024-01-31
router.get('/summary', authenticate, async (req: Request, res: Response) => {
  try {
    const { from = new Date(new Date().setDate(1)).toISOString().slice(0,10), to = new Date().toISOString().slice(0,10) } = req.query;
    const fromStr = `${from}T00:00:00`; const toStr = `${to}T23:59:59`;

    const [salesRes, paymentsRes, itemsRes] = await Promise.all([
      supabase.from('fuel_sales').select('id, sale_date, total_amount, amount_paid, balance_due, payment_status, payment_type').gte('sale_date', fromStr).lte('sale_date', toStr).neq('payment_status', 'void'),
      supabase.from('fuel_payments').select('payment_channel, amount, status').gte('payment_date', fromStr).lte('payment_date', toStr).in('status', ['confirmed','reconciled']),
      supabase.from('fuel_sale_items').select('litres, subtotal, product:fuel_products(name, code, colour)').gte('created_at', fromStr).lte('created_at', toStr),
    ]);

    const sales = salesRes.data || [];
    const payments = paymentsRes.data || [];
    const items = itemsRes.data || [];

    const totalRevenue = sales.reduce((s, x) => s + Number(x.total_amount), 0);
    const totalCollected = payments.reduce((s, x) => s + Number(x.amount), 0);
    const totalOutstanding = sales.reduce((s, x) => s + Number(x.balance_due), 0);
    const paidSales = sales.filter(s => s.payment_status === 'paid').length;
    const creditSales = sales.filter(s => s.payment_status === 'credit').length;

    const productMap: Record<string, { name: string; colour: string; litres: number; revenue: number }> = {};
    for (const item of items) {
      const key = (item.product as { code: string })?.code || 'UNK';
      if (!productMap[key]) productMap[key] = { name: (item.product as { name: string })?.name || key, colour: (item.product as { colour: string })?.colour || '#10b981', litres: 0, revenue: 0 };
      productMap[key].litres += Number(item.litres);
      productMap[key].revenue += Number(item.subtotal);
    }

    const channelMap: Record<string, { amount: number; count: number }> = {};
    for (const p of payments) {
      if (!channelMap[p.payment_channel]) channelMap[p.payment_channel] = { amount: 0, count: 0 };
      channelMap[p.payment_channel].amount += Number(p.amount);
      channelMap[p.payment_channel].count += 1;
    }

    res.json({
      success: true, data: {
        period: { from, to }, total_sales: sales.length, total_revenue: totalRevenue,
        total_collected: totalCollected, total_outstanding: totalOutstanding,
        paid_sales: paidSales, credit_sales: creditSales,
        by_product: Object.values(productMap),
        by_channel: Object.entries(channelMap).map(([ch, v]) => ({ channel: ch, ...v })),
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to generate summary report' });
  }
});

async function getSystemSetting(key: string): Promise<string> {
  const { data } = await supabase.from('fuel_system_settings').select('value').eq('key', key).single();
  return data?.value || '';
}

export default router;
