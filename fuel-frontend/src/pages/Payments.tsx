import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Search, Filter, CheckCircle2, AlertCircle, Clock, X, Link2, RefreshCw } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { paymentsApi, customersApi } from '../services/api';
import { Payment, Customer } from '../types';
import PageHeader from '../components/shared/PageHeader';
import LoadingSpinner from '../components/shared/LoadingSpinner';

const CHANNELS: Record<string, { label: string; color: string }> = {
  mpesa_stk:      { label: 'M-Pesa STK',     color: 'badge-green' },
  mpesa_c2b:      { label: 'M-Pesa C2B',     color: 'badge-green' },
  pesalink:       { label: 'PesaLink',        color: 'badge-blue' },
  bank_transfer:  { label: 'Bank Transfer',   color: 'badge-blue' },
  bank_deposit:   { label: 'Bank Deposit',    color: 'badge-orange' },
  cash:           { label: 'Cash',            color: 'badge-yellow' },
  intasend:       { label: 'IntaSend',        color: 'badge-blue' },
};

const STATUS: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  confirmed:    { label: 'Confirmed',   color: 'badge-green',  icon: CheckCircle2 },
  reconciled:   { label: 'Reconciled', color: 'badge-green',  icon: CheckCircle2 },
  pending:      { label: 'Pending',    color: 'badge-yellow', icon: Clock },
  unmatched:    { label: 'Unmatched',  color: 'badge-orange', icon: AlertCircle },
  failed:       { label: 'Failed',     color: 'badge-red',    icon: X },
};

function ManualPaymentModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    customer_id: '', amount: '', payment_channel: 'cash',
    transaction_reference: '', phone_number: '', payer_name: '',
    payment_date: new Date().toISOString().split('T')[0], notes: '',
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const { data: customers = [] } = useQuery({
    queryKey: ['customers', ''],
    queryFn: () => customersApi.list({}).then(r => r.data.data as Customer[]),
  });

  const mutation = useMutation({
    mutationFn: () => paymentsApi.create(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payments'] });
      toast.success('Payment recorded!');
      onClose();
    },
    onError: () => toast.error('Failed to record payment'),
  });

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="font-heading font-bold text-slate-800">Record Payment</h2>
            <p className="text-xs text-slate-500 mt-0.5">Add a manual payment entry</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
        </div>
        <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
          <div>
            <label className="label">Customer</label>
            <select value={form.customer_id} onChange={e => set('customer_id', e.target.value)} className="input-field">
              <option value="">— Select Customer (optional) —</option>
              {customers.map((c: Customer) => <option key={c.id} value={c.id}>{c.name} ({c.customer_code})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Amount (KES) *</label>
              <input type="number" value={form.amount} onChange={e => set('amount', e.target.value)} className="input-field" placeholder="5000" />
            </div>
            <div>
              <label className="label">Channel *</label>
              <select value={form.payment_channel} onChange={e => set('payment_channel', e.target.value)} className="input-field">
                {Object.entries(CHANNELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Reference / Trans ID</label>
              <input value={form.transaction_reference} onChange={e => set('transaction_reference', e.target.value)} className="input-field" placeholder="QGH3X8K..." />
            </div>
            <div>
              <label className="label">Payer Phone</label>
              <input value={form.phone_number} onChange={e => set('phone_number', e.target.value)} className="input-field" placeholder="0712345678" />
            </div>
            <div>
              <label className="label">Payer Name</label>
              <input value={form.payer_name} onChange={e => set('payer_name', e.target.value)} className="input-field" placeholder="John Kamau" />
            </div>
            <div>
              <label className="label">Payment Date</label>
              <input type="date" value={form.payment_date} onChange={e => set('payment_date', e.target.value)} className="input-field" />
            </div>
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} className="input-field resize-none" rows={2} placeholder="Optional notes..." />
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
          <button onClick={onClose} className="btn-secondary flex-1 py-2.5">Cancel</button>
          <button onClick={() => mutation.mutate()} disabled={mutation.isPending || !form.amount} className="btn-primary flex-1 py-2.5 flex items-center justify-center gap-2">
            {mutation.isPending && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            Record Payment
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function MatchModal({ payment, onClose }: { payment: Payment; onClose: () => void }) {
  const qc = useQueryClient();
  const [customerId, setCustomerId] = useState('');
  const { data: customers = [] } = useQuery({
    queryKey: ['customers', ''],
    queryFn: () => customersApi.list({}).then(r => r.data.data as Customer[]),
  });
  const mutation = useMutation({
    mutationFn: () => paymentsApi.match(payment.id, customerId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payments'] });
      toast.success('Payment matched!');
      onClose();
    },
    onError: () => toast.error('Failed to match payment'),
  });

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h3 className="font-bold text-slate-800 mb-1">Match Unmatched Payment</h3>
        <p className="text-sm text-slate-500 mb-4">KES {Number(payment.amount).toLocaleString()} · {payment.transaction_reference || 'No ref'}</p>
        <label className="label">Select Customer</label>
        <select value={customerId} onChange={e => setCustomerId(e.target.value)} className="input-field mb-4">
          <option value="">— Select Customer —</option>
          {customers.map((c: Customer) => <option key={c.id} value={c.id}>{c.name} ({c.customer_code}) — Bal: KES {c.current_balance?.toLocaleString()}</option>)}
        </select>
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1 py-2.5">Cancel</button>
          <button onClick={() => mutation.mutate()} disabled={!customerId || mutation.isPending} className="btn-primary flex-1 py-2.5 flex items-center justify-center gap-2">
            {mutation.isPending && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            <Link2 size={14} /> Match Payment
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function Payments() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showManual, setShowManual] = useState(false);
  const [matchPayment, setMatchPayment] = useState<Payment | undefined>();

  useEffect(() => { document.title = 'Payments — FuelFlow Pro'; }, []);

  const { data: payments = [], isLoading, refetch } = useQuery({
    queryKey: ['payments', search, statusFilter],
    queryFn: () => paymentsApi.list({ search, status: statusFilter === 'all' ? undefined : statusFilter }).then(r => r.data.data as Payment[]),
  });

  const { data: unmatched = [] } = useQuery({
    queryKey: ['unmatched-payments'],
    queryFn: () => paymentsApi.getUnmatched().then(r => r.data.data as Payment[]),
    refetchInterval: 30000,
  });

  const totals = {
    today: payments.filter((p: Payment) => new Date(p.payment_date || p.created_at).toDateString() === new Date().toDateString()).reduce((s: number, p: Payment) => s + Number(p.amount), 0),
    total: payments.reduce((s: number, p: Payment) => s + Number(p.amount), 0),
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        subtitle={`${payments.length} payments · KES ${totals.total.toLocaleString()} total`}
        icon={CreditCard}
        actions={
          <div className="flex gap-2">
            <button onClick={() => refetch()} className="btn-secondary text-sm py-2 flex items-center gap-2"><RefreshCw size={14} /> Refresh</button>
            <button onClick={() => setShowManual(true)} className="btn-primary text-sm py-2 flex items-center gap-2"><CreditCard size={14} /> Record Payment</button>
          </div>
        }
      />

      {/* Unmatched alert */}
      {unmatched.length > 0 && (
        <div className="glass-card p-4 border-orange-200 bg-orange-50">
          <div className="flex items-center gap-3">
            <AlertCircle size={20} className="text-orange-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-orange-800 text-sm">{unmatched.length} Unmatched Payment{unmatched.length > 1 ? 's' : ''}</p>
              <p className="text-xs text-orange-600">Payments received but not matched to any customer. Click to match manually.</p>
            </div>
          </div>
          <div className="mt-3 space-y-2">
            {unmatched.slice(0, 3).map((p: Payment) => (
              <div key={p.id} className="flex items-center justify-between bg-white rounded-lg p-3 border border-orange-200">
                <div>
                  <p className="text-sm font-semibold text-slate-800">KES {Number(p.amount).toLocaleString()}</p>
                  <p className="text-xs text-slate-500">{p.payer_name || 'Unknown'} · {p.transaction_reference || 'No ref'}</p>
                </div>
                <button onClick={() => setMatchPayment(p)} className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1">
                  <Link2 size={12} /> Match
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Today's Collections", value: `KES ${totals.today.toLocaleString()}`, color: 'text-emerald-700' },
          { label: 'Total Shown', value: `KES ${totals.total.toLocaleString()}`, color: 'text-slate-700' },
          { label: 'Unmatched', value: unmatched.length, color: unmatched.length > 0 ? 'text-orange-600' : 'text-slate-500' },
          { label: 'Count', value: payments.length, color: 'text-slate-700' },
        ].map((s, i) => (
          <div key={i} className="glass-card p-4">
            <p className="text-xs text-slate-500 mb-1">{s.label}</p>
            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm flex-1 max-w-xs">
          <Search size={15} className="text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} className="bg-transparent text-sm text-slate-700 outline-none flex-1 placeholder:text-slate-400" placeholder="Search ref, name, phone..." />
        </div>
        <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
          {['all', 'confirmed', 'reconciled', 'pending', 'unmatched'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${statusFilter === s ? 'bg-emerald-500 text-white' : 'text-slate-500 hover:text-slate-700'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {isLoading ? <LoadingSpinner /> : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  {['#', 'Date', 'Customer', 'Amount', 'Channel', 'Reference', 'Status', 'Auto'].map(h => (
                    <th key={h} className="table-header text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.map((p: Payment, i: number) => {
                  const ch = CHANNELS[p.payment_channel] || { label: p.payment_channel, color: 'badge-gray' };
                  const st = STATUS[p.status] || { label: p.status, color: 'badge-gray', icon: Clock };
                  return (
                    <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="table-row">
                      <td className="table-cell text-xs text-slate-400">{p.payment_number}</td>
                      <td className="table-cell text-slate-500 whitespace-nowrap text-xs">
                        {format(new Date(p.payment_date || p.created_at), 'dd MMM, HH:mm')}
                      </td>
                      <td className="table-cell">
                        {p.customer ? (
                          <div>
                            <p className="font-medium text-slate-800 text-xs">{p.customer.name}</p>
                            <p className="text-slate-400 text-xs">{p.payer_name}</p>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">{p.payer_name || '—'}</span>
                        )}
                      </td>
                      <td className="table-cell font-bold text-slate-800 whitespace-nowrap">KES {Number(p.amount).toLocaleString()}</td>
                      <td className="table-cell"><span className={`badge ${ch.color}`}>{ch.label}</span></td>
                      <td className="table-cell text-xs text-slate-400 max-w-[120px] truncate">{p.transaction_reference || '—'}</td>
                      <td className="table-cell"><span className={`badge ${st.color}`}>{st.label}</span></td>
                      <td className="table-cell">
                        {p.status === 'unmatched' ? (
                          <button onClick={() => setMatchPayment(p)} className="text-xs text-orange-600 hover:text-orange-800 font-medium flex items-center gap-1">
                            <Link2 size={11} /> Match
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">{p.auto_matched ? '✓ Auto' : 'Manual'}</span>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
                {payments.length === 0 && (
                  <tr><td colSpan={8} className="text-center py-12 text-slate-400 text-sm">No payments found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showManual && <ManualPaymentModal onClose={() => setShowManual(false)} />}
        {matchPayment && <MatchModal payment={matchPayment} onClose={() => setMatchPayment(undefined)} />}
      </AnimatePresence>
    </div>
  );
}
