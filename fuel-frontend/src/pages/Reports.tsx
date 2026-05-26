import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Calendar, Download, AlertCircle, TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth, subDays } from 'date-fns';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { reportsApi } from '../services/api';
import { formatKES, CHANNEL_COLORS, PaymentChannel } from '../types';
import PageHeader from '../components/shared/PageHeader';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import StatusBadge from '../components/shared/StatusBadge';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const CHANNEL_LABELS: Record<string, string> = {
  mpesa_stk: 'M-Pesa STK', mpesa_c2b: 'M-Pesa Paybill',
  pesalink: 'PesaLink', bank_transfer: 'Bank Transfer',
  bank_deposit: 'Bank Deposit', cash: 'Cash', intasend: 'IntaSend',
};

export default function Reports() {
  const [tab, setTab] = useState<'daily' | 'summary' | 'aging'>('daily');
  const [dailyDate, setDailyDate] = useState(new Date().toISOString().slice(0, 10));
  const [from, setFrom] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => { document.title = 'Reports — FuelFlow Pro'; }, []);

  const { data: daily, isLoading: dLoading } = useQuery({
    queryKey: ['daily-report', dailyDate],
    queryFn: () => reportsApi.daily(dailyDate).then(r => r.data.data),
    enabled: tab === 'daily',
  });

  const { data: summary, isLoading: sLoading } = useQuery({
    queryKey: ['summary-report', from, to],
    queryFn: () => reportsApi.summary(from, to).then(r => r.data.data),
    enabled: tab === 'summary',
  });

  const { data: aging, isLoading: aLoading } = useQuery({
    queryKey: ['aging-report'],
    queryFn: () => reportsApi.aging().then(r => r.data.data as unknown[]),
    enabled: tab === 'aging',
  });

  const channelChart = (channels: { channel: string; amount: number; count: number }[]) => ({
    labels: channels.map(c => CHANNEL_LABELS[c.channel] || c.channel),
    datasets: [{
      data: channels.map(c => c.amount),
      backgroundColor: channels.map(c => `${CHANNEL_COLORS[c.channel as PaymentChannel] || '#6b7280'}33`),
      borderColor: channels.map(c => CHANNEL_COLORS[c.channel as PaymentChannel] || '#6b7280'),
      borderWidth: 2, hoverOffset: 6,
    }],
  });

  const productBarChart = (products: { name: string; litres: number; revenue: number; colour: string }[]) => ({
    labels: products.map(p => p.name),
    datasets: [
      { label: 'Revenue (KES)', data: products.map(p => p.revenue), backgroundColor: products.map(p => `${p.colour}33`), borderColor: products.map(p => p.colour), borderWidth: 2, borderRadius: 6 },
    ],
  });

  const chartOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#6b7280', font: { size: 11 } } }, y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#6b7280', font: { size: 11 }, callback: (v: number|string) => `KES ${Number(v)/1000}k` } } } };
  const doughnutOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' as const, labels: { color: '#9ca3af', font: { size: 11 }, boxWidth: 12, padding: 10 } } }, cutout: '65%' };

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" subtitle="Financial reports and analytics" icon={BarChart3}
        actions={<button className="btn-secondary text-sm py-2 flex items-center gap-2"><Download size={14} /> Export</button>}
      />

      {/* Tab navigation */}
      <div className="flex gap-1 p-1 bg-white/80 rounded-xl w-fit">
        {([['daily','Daily Report'],['summary','Period Summary'],['aging','Aging Report']] as const).map(([v, l]) => (
          <button key={v} onClick={() => setTab(v)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === v ? 'bg-emerald-500 text-white shadow-brand' : 'text-slate-500 hover:text-slate-900'}`}>{l}</button>
        ))}
      </div>

      {/* ── DAILY TAB ── */}
      {tab === 'daily' && (
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-xl px-3 py-2">
              <Calendar size={14} className="text-slate-500" />
              <input type="date" value={dailyDate} onChange={e => setDailyDate(e.target.value)} className="bg-transparent text-slate-800 text-sm outline-none" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setDailyDate(format(subDays(new Date(dailyDate), 1), 'yyyy-MM-dd'))} className="btn-secondary py-2 px-3 text-xs">← Prev</button>
              <button onClick={() => setDailyDate(new Date().toISOString().slice(0, 10))} className="btn-secondary py-2 px-3 text-xs">Today</button>
              <button onClick={() => setDailyDate(format(new Date(new Date(dailyDate).getTime() + 86400000), 'yyyy-MM-dd'))} className="btn-secondary py-2 px-3 text-xs">Next →</button>
            </div>
          </div>

          {dLoading ? <LoadingSpinner /> : daily && (
            <>
              {/* KPI row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Sales', value: formatKES(daily.total_sales), sub: `${daily.sales_count} transactions` },
                  { label: 'Collected', value: formatKES(daily.total_collected), sub: `${daily.payments_count} payments` },
                  { label: 'Credit Given', value: formatKES(daily.total_credit), sub: 'outstanding from today', red: daily.total_credit > 0 },
                  { label: 'Collection Rate', value: `${daily.total_sales > 0 ? ((daily.total_collected / daily.total_sales) * 100).toFixed(0) : 0}%`, sub: 'of daily sales' },
                ].map(k => (
                  <div key={k.label} className="glass-card p-4">
                    <p className="text-xs text-slate-400 uppercase tracking-wider">{k.label}</p>
                    <p className={`font-heading font-bold text-2xl mt-1 num ${k.red ? 'text-amber-400' : 'text-slate-800'}`}>{k.value}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{k.sub}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Volume by product */}
                {daily.volume_by_product?.length > 0 && (
                  <div className="glass-card p-5">
                    <h3 className="section-title mb-4 flex items-center gap-2"><TrendingUp size={15} className="text-emerald-400" /> Revenue by Product</h3>
                    <div className="h-48"><Bar data={productBarChart(daily.volume_by_product)} options={chartOpts} /></div>
                    <div className="mt-3 space-y-2">
                      {daily.volume_by_product.map((p: { name: string; litres: number; revenue: number }) => (
                        <div key={p.name} className="flex justify-between text-xs">
                          <span className="text-slate-500">{p.name}</span>
                          <span className="text-slate-600 num">{p.litres.toFixed(0)}L · {formatKES(p.revenue)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Channel breakdown */}
                {daily.channels?.length > 0 && (
                  <div className="glass-card p-5">
                    <h3 className="section-title mb-4">Payment Channels</h3>
                    <div className="h-48"><Doughnut data={channelChart(daily.channels)} options={doughnutOpts} /></div>
                    <div className="mt-3 space-y-1.5">
                      {daily.channels.map((c: { channel: string; amount: number; count: number }) => (
                        <div key={c.channel} className="flex justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ background: CHANNEL_COLORS[c.channel as PaymentChannel] || '#6b7280' }} />
                            <span className="text-slate-500">{CHANNEL_LABELS[c.channel] || c.channel}</span>
                          </div>
                          <span className="text-slate-600 num">{c.count}x · {formatKES(c.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── SUMMARY TAB ── */}
      {tab === 'summary' && (
        <div className="space-y-5">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-xl px-3 py-2">
              <Calendar size={14} className="text-slate-500" />
              <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="bg-transparent text-slate-800 text-sm outline-none" />
              <span className="text-slate-400 text-sm">to</span>
              <input type="date" value={to} onChange={e => setTo(e.target.value)} className="bg-transparent text-slate-800 text-sm outline-none" />
            </div>
          </div>

          {sLoading ? <LoadingSpinner /> : summary && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Revenue', value: formatKES(summary.total_revenue) },
                  { label: 'Total Collected', value: formatKES(summary.total_collected) },
                  { label: 'Outstanding', value: formatKES(summary.total_outstanding), red: true },
                  { label: 'Transactions', value: summary.total_sales },
                ].map(k => (
                  <div key={k.label} className="glass-card p-4">
                    <p className="text-xs text-slate-400 uppercase tracking-wider">{k.label}</p>
                    <p className={`font-heading font-bold text-2xl mt-1 num ${k.red ? 'text-amber-400' : 'text-slate-800'}`}>{k.value}</p>
                  </div>
                ))}
              </div>
              {summary.by_channel?.length > 0 && (
                <div className="glass-card p-5">
                  <h3 className="section-title mb-4">Channel Breakdown</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead><tr className="border-b border-slate-100">
                        <th className="table-header text-left">Channel</th><th className="table-header text-right">Transactions</th><th className="table-header text-right">Amount</th>
                      </tr></thead>
                      <tbody>
                        {summary.by_channel.map((c: { channel: string; count: number; amount: number }) => (
                          <tr key={c.channel} className="table-row">
                            <td className="table-cell"><div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{ background: CHANNEL_COLORS[c.channel as PaymentChannel] || '#6b7280' }} /><span className="text-sm text-slate-800">{CHANNEL_LABELS[c.channel] || c.channel}</span></div></td>
                            <td className="table-cell text-right text-sm text-slate-500 num">{c.count}</td>
                            <td className="table-cell text-right font-bold text-emerald-400 num">{formatKES(c.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── AGING TAB ── */}
      {tab === 'aging' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-3">
            <AlertCircle size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-300">Shows customers with outstanding credit balances, sorted by amount. Use this to prioritise debt collection calls.</p>
          </div>
          {aLoading ? <LoadingSpinner /> : (
            <div className="glass-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="border-b border-slate-100">
                    <th className="table-header text-left">Customer</th>
                    <th className="table-header text-right">Outstanding</th>
                    <th className="table-header text-right hidden md:table-cell">Credit Limit</th>
                    <th className="table-header text-center hidden sm:table-cell">Utilization</th>
                    <th className="table-header text-left hidden lg:table-cell">Days</th>
                    <th className="table-header text-center">Bucket</th>
                  </tr></thead>
                  <tbody>
                    {(aging as { id: string; name: string; customer_code: string; phone: string; current_balance: number; credit_limit: number; utilization_pct: number; days_outstanding: number; bucket: string; is_overdue: boolean }[]).map((c, i) => (
                      <motion.tr key={c.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }} className="table-row">
                        <td className="table-cell">
                          <p className="text-sm font-medium text-slate-800">{c.name}</p>
                          <p className="text-xs text-slate-400">{c.customer_code} · {c.phone}</p>
                        </td>
                        <td className="table-cell text-right"><span className="text-red-400 font-bold text-sm num">{formatKES(c.current_balance)}</span></td>
                        <td className="table-cell text-right hidden md:table-cell text-sm num text-slate-500">{formatKES(c.credit_limit)}</td>
                        <td className="table-cell hidden sm:table-cell">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${c.utilization_pct}%`, background: c.utilization_pct > 80 ? '#ef4444' : c.utilization_pct > 50 ? '#f59e0b' : '#10b981' }} />
                            </div>
                            <span className="text-xs text-slate-500 w-10 text-right num">{c.utilization_pct}%</span>
                          </div>
                        </td>
                        <td className="table-cell hidden lg:table-cell text-sm text-slate-500 num">{c.days_outstanding}d</td>
                        <td className="table-cell text-center">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.bucket === 'Over 90 days' ? 'bg-red-500/15 text-red-400' : c.bucket === '61-90 days' ? 'bg-orange-500/15 text-orange-400' : c.bucket === '31-60 days' ? 'bg-amber-500/15 text-amber-400' : 'bg-blue-500/15 text-blue-400'}`}>
                            {c.bucket}
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
                {(aging || []).length === 0 && <div className="text-center py-12 text-slate-400 text-sm">No outstanding balances. Excellent! 🎉</div>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}



