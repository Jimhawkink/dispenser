import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, ShoppingCart, AlertTriangle, CreditCard, Fuel, TrendingUp, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Filler } from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';
import KPICard from '../components/dashboard/KPICard';
import LivePaymentFeed from '../components/dashboard/LivePaymentFeed';
import { dashboardApi } from '../services/api';
import { DashboardStats, formatKES, formatLitres, CHANNEL_COLORS, PaymentChannel } from '../types';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Filler);

const CHANNEL_DISPLAY: Record<string, string> = {
  mpesa_stk: 'M-Pesa STK', mpesa_c2b: 'M-Pesa Paybill',
  pesalink: 'PesaLink', bank_transfer: 'Bank Transfer',
  bank_deposit: 'Bank Deposit', cash: 'Cash', intasend: 'IntaSend',
};

function StockBar({ name, current, max, colour }: { name: string; current: number; max: number; colour: string }) {
  const pct = Math.min(100, (current / Math.max(max, 1)) * 100);
  const status = pct < 20 ? 'critical' : pct < 40 ? 'low' : 'ok';
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-sm text-slate-600 font-medium">{name}</span>
        <span className={`text-xs font-bold num ${status === 'critical' ? 'text-red-400' : status === 'low' ? 'text-amber-400' : 'text-emerald-400'}`}>
          {formatLitres(current)}
        </span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ background: status === 'critical' ? '#ef4444' : status === 'low' ? '#f59e0b' : colour }}
        />
      </div>
      {status !== 'ok' && (
        <p className={`text-[10px] mt-1 ${status === 'critical' ? 'text-red-400' : 'text-amber-400'}`}>
          {status === 'critical' ? '⚠ Critical — restock immediately' : '↓ Below alert level'}
        </p>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardApi.getStats().then(r => r.data.data as DashboardStats),
    refetchInterval: 60000,
  });

  useEffect(() => { document.title = 'Dashboard — FuelFlow Pro'; }, []);

  const channelChartData = {
    labels: (data?.payment_channels || []).map(c => CHANNEL_DISPLAY[c.channel] || c.channel),
    datasets: [{
      data: (data?.payment_channels || []).map(c => c.amount),
      backgroundColor: (data?.payment_channels || []).map(c => `${CHANNEL_COLORS[c.channel as PaymentChannel] || '#6b7280'}33`),
      borderColor: (data?.payment_channels || []).map(c => CHANNEL_COLORS[c.channel as PaymentChannel] || '#6b7280'),
      borderWidth: 2,
      hoverOffset: 8,
    }],
  };

  const weeklyChartData = {
    labels: (data?.weekly_chart || []).map(d => new Date(d.date).toLocaleDateString('en-KE', { weekday: 'short', day: 'numeric' })),
    datasets: [
      {
        label: 'Revenue',
        data: (data?.weekly_chart || []).map(d => d.revenue),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16,185,129,0.1)',
        tension: 0.4, fill: true, pointBackgroundColor: '#10b981', pointRadius: 4,
      },
      {
        label: 'Credit',
        data: (data?.weekly_chart || []).map(d => d.credit),
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245,158,11,0.05)',
        tension: 0.4, fill: true, pointBackgroundColor: '#f59e0b', pointRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { labels: { color: '#9ca3af', font: { size: 11 }, boxWidth: 12 } } },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#6b7280', font: { size: 11 } } },
      y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#6b7280', font: { size: 11 }, callback: (v: number | string) => `KES ${Number(v).toLocaleString()}` } },
    },
  };

  const doughnutOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' as const, labels: { color: '#9ca3af', font: { size: 11 }, boxWidth: 12, padding: 12 } } },
    cutout: '68%',
  };

  if (isLoading) return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="glass-card h-28 shimmer" />)}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {new Date().toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button onClick={() => refetch()} className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5">
          <TrendingUp size={12} /> Refresh
        </button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Today's Sales" value={data?.today_sales || 0} icon={ShoppingCart} iconColor="text-emerald-400" iconBg="bg-emerald-500/15" delay={0} />
        <KPICard title="Today's Collections" value={data?.today_collections || 0} icon={DollarSign} iconColor="text-blue-400" iconBg="bg-blue-500/15" delay={0.1} />
        <KPICard title="Outstanding Credit" value={data?.total_outstanding || 0} icon={CreditCard} iconColor="text-amber-400" iconBg="bg-amber-500/15" delay={0.2} alert={(data?.total_outstanding || 0) > 100000} />
        <KPICard title="Unmatched Payments" value={data?.unmatched_payments || 0} format="number" icon={AlertTriangle} iconColor="text-red-400" iconBg="bg-red-500/15" delay={0.3} alert={(data?.unmatched_payments || 0) > 0} />
      </div>

      {/* Middle Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Live Feed — spans 2 cols */}
        <div className="lg:col-span-2" style={{ minHeight: 380 }}>
          <LivePaymentFeed />
        </div>
        {/* Channel Doughnut */}
        <div className="glass-card p-5">
          <h3 className="section-title mb-4">Payment Channels</h3>
          {(data?.payment_channels || []).length === 0 ? (
            <div className="flex items-center justify-center h-48 text-slate-400 text-sm">No payments this week</div>
          ) : (
            <>
              <div className="chart-container h-48 mb-4">
                <Doughnut data={channelChartData} options={doughnutOptions} />
              </div>
              <div className="space-y-2">
                {(data?.payment_channels || []).map(c => (
                  <div key={c.channel} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: CHANNEL_COLORS[c.channel as PaymentChannel] || '#6b7280' }} />
                      <span className="text-slate-500">{CHANNEL_DISPLAY[c.channel] || c.channel}</span>
                    </div>
                    <span className="text-slate-600 font-medium num">{formatKES(c.amount)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Weekly Revenue Chart */}
        <div className="lg:col-span-2 glass-card p-5">
          <h3 className="section-title mb-4">7-Day Revenue vs Credit</h3>
          <div className="chart-container h-52">
            <Line data={weeklyChartData} options={chartOptions} />
          </div>
        </div>

        {/* Stock Levels */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Fuel size={16} className="text-amber-400" />
            <h3 className="section-title">Fuel Stock Levels</h3>
          </div>
          {(data?.low_stock_products || []).length > 0 && (
            <div className="mb-3 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
              <p className="text-xs text-red-400 font-medium">⚠ {data?.low_stock_products.length} product(s) below alert level</p>
            </div>
          )}
          <div className="space-y-3">
            {[
              { name: 'Petrol (PMS)', current: 5000, max: 10000, colour: '#f59e0b' },
              { name: 'Diesel (AGO)', current: 8000, max: 15000, colour: '#10b981' },
              { name: 'Kerosene (KER)', current: 3000, max: 8000, colour: '#6366f1' },
            ].map(s => <StockBar key={s.name} {...s} />)}
          </div>
        </div>
      </div>

      {/* Top Debtors */}
      {(data?.top_debtors || []).length > 0 && (
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users size={16} className="text-red-400" />
            <h3 className="section-title">Top Debtors</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="table-header text-left">Customer</th>
                  <th className="table-header text-left hidden sm:table-cell">Code</th>
                  <th className="table-header text-right">Balance Due</th>
                </tr>
              </thead>
              <tbody>
                {(data?.top_debtors || []).slice(0, 8).map((c, i) => (
                  <motion.tr key={c.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="table-row">
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                          {c.name[0].toUpperCase()}
                        </div>
                        <span className="text-slate-700 text-sm">{c.name}</span>
                      </div>
                    </td>
                    <td className="table-cell hidden sm:table-cell">
                      <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">{c.customer_code}</span>
                    </td>
                    <td className="table-cell text-right">
                      <span className="text-red-400 font-bold text-sm num">{formatKES(c.current_balance)}</span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

