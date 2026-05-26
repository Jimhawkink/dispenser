import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Phone, Mail, Building2, CreditCard, FileText, TrendingDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { customersApi } from '../services/api';
import { Customer, LedgerEntry, Sale, Payment, formatKES } from '../types';
import StatusBadge from '../components/shared/StatusBadge';
import LoadingSpinner from '../components/shared/LoadingSpinner';

export default function CustomerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: customer, isLoading } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => customersApi.get(id!).then(r => r.data.data as Customer),
    enabled: !!id,
  });

  const { data: statement } = useQuery({
    queryKey: ['customer-statement', id],
    queryFn: () => customersApi.getStatement(id!).then(r => r.data.data as { customer: Customer; ledger: LedgerEntry[] }),
    enabled: !!id,
  });

  const { data: transactions } = useQuery({
    queryKey: ['customer-transactions', id],
    queryFn: () => customersApi.getTransactions(id!).then(r => r.data.data as { sales: Sale[]; payments: Payment[] }),
    enabled: !!id,
  });

  useEffect(() => { document.title = customer ? `${customer.name} — FuelFlow Pro` : 'Customer — FuelFlow Pro'; }, [customer]);

  if (isLoading) return <LoadingSpinner size="lg" text="Loading customer profile..." />;
  if (!customer) return <div className="text-center py-20 text-slate-400">Customer not found</div>;

  const initials = customer.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const utilizationPct = customer.credit_limit > 0 ? Math.min(100, (customer.current_balance / customer.credit_limit) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition-all">
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="page-title">{customer.name}</h1>
          <p className="text-slate-400 text-sm">{customer.customer_code}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="space-y-4">
          <div className="glass-card p-5">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                {initials}
              </div>
              <div>
                <h2 className="font-heading font-bold text-slate-800 text-lg">{customer.name}</h2>
                {customer.company_name && <p className="text-slate-500 text-sm">{customer.company_name}</p>}
                <span className={`text-xs px-2 py-0.5 rounded-full ${customer.is_active ? 'bg-emerald-500/15 text-emerald-400' : 'bg-gray-500/15 text-slate-500'}`}>
                  {customer.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { icon: Phone, label: 'Phone', value: customer.phone },
                customer.alt_phone && { icon: Phone, label: 'Alt Phone', value: customer.alt_phone },
                customer.email && { icon: Mail, label: 'Email', value: customer.email },
                customer.address && { icon: Building2, label: 'Address', value: customer.address },
              ].filter(Boolean).map((item: unknown) => {
                const i = item as { icon: React.ElementType; label: string; value: string };
                return (
                  <div key={i.label} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                      <i.icon size={13} className="text-slate-500" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wide">{i.label}</p>
                      <p className="text-sm text-slate-700">{i.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {(customer.vehicle_plates || []).length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Vehicle Plates</p>
                <div className="flex flex-wrap gap-2">
                  {(customer.vehicle_plates || []).map(plate => (
                    <span key={plate} className="text-xs font-mono bg-slate-100 border border-slate-200 text-slate-600 px-2.5 py-1 rounded-lg">{plate}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Credit Status */}
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4"><CreditCard size={16} className="text-amber-400" /><h3 className="section-title">Credit Status</h3></div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Outstanding Balance</span>
                <span className={`font-bold num ${customer.current_balance > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{formatKES(customer.current_balance)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Credit Limit</span>
                <span className="text-slate-700 num">{formatKES(customer.credit_limit)}</span>
              </div>
              {customer.credit_limit > 0 && (
                <>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Utilization</span>
                    <span className={`font-medium ${utilizationPct > 80 ? 'text-red-400' : utilizationPct > 50 ? 'text-amber-400' : 'text-emerald-400'}`}>{utilizationPct.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${utilizationPct}%` }} transition={{ duration: 0.8 }}
                      className="h-full rounded-full" style={{ background: utilizationPct > 80 ? '#ef4444' : utilizationPct > 50 ? '#f59e0b' : '#10b981' }} />
                  </div>
                  <p className="text-xs text-slate-400">Available: {formatKES(Math.max(0, customer.credit_limit - customer.current_balance))}</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Ledger + Transactions */}
        <div className="lg:col-span-2 space-y-5">
          {/* Recent Sales */}
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4"><FileText size={16} className="text-blue-400" /><h3 className="section-title">Recent Sales</h3></div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-slate-100">
                  <th className="table-header text-left">Sale #</th><th className="table-header text-right">Amount</th>
                  <th className="table-header text-right">Balance</th><th className="table-header text-center">Status</th>
                  <th className="table-header text-left">Date</th>
                </tr></thead>
                <tbody>
                  {(transactions?.sales || []).slice(0, 10).map((s, i) => (
                    <motion.tr key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }} className="table-row">
                      <td className="table-cell font-mono text-xs text-emerald-400">{s.sale_number}</td>
                      <td className="table-cell text-right text-sm num text-white font-medium">{formatKES(s.total_amount)}</td>
                      <td className="table-cell text-right text-sm num"><span className={s.balance_due > 0 ? 'text-red-400' : 'text-slate-400'}>{formatKES(s.balance_due)}</span></td>
                      <td className="table-cell text-center"><StatusBadge status={s.payment_status} size="xs" /></td>
                      <td className="table-cell text-xs text-slate-500">{format(new Date(s.sale_date), 'dd MMM yy')}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
              {(transactions?.sales || []).length === 0 && <div className="text-center py-8 text-slate-400 text-sm">No sales yet</div>}
            </div>
          </div>

          {/* Ledger Statement */}
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4"><TrendingDown size={16} className="text-purple-400" /><h3 className="section-title">Credit Ledger</h3></div>
            <div className="overflow-x-auto max-h-72 overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-white"><tr className="border-b border-slate-100">
                  <th className="table-header text-left">Date</th><th className="table-header text-left">Description</th>
                  <th className="table-header text-right">Debit</th><th className="table-header text-right">Credit</th>
                  <th className="table-header text-right">Balance</th>
                </tr></thead>
                <tbody>
                  {(statement?.ledger || []).map((entry, i) => (
                    <motion.tr key={entry.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="table-row">
                      <td className="table-cell text-xs text-slate-500 whitespace-nowrap">{format(new Date(entry.created_at), 'dd MMM yy')}</td>
                      <td className="table-cell text-xs text-slate-600 max-w-[180px] truncate">{entry.description || entry.reference_code || '—'}</td>
                      <td className="table-cell text-right text-xs num"><span className={entry.entry_type === 'debit' ? 'text-red-400 font-medium' : 'text-slate-500'}>{entry.entry_type === 'debit' ? formatKES(entry.amount) : '—'}</span></td>
                      <td className="table-cell text-right text-xs num"><span className={entry.entry_type === 'credit' ? 'text-emerald-400 font-medium' : 'text-slate-500'}>{entry.entry_type === 'credit' ? formatKES(entry.amount) : '—'}</span></td>
                      <td className="table-cell text-right text-xs num font-medium"><span className={entry.running_balance > 0 ? 'text-amber-400' : 'text-emerald-400'}>{formatKES(entry.running_balance)}</span></td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
              {(statement?.ledger || []).length === 0 && <div className="text-center py-8 text-slate-400 text-sm">No ledger entries</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



