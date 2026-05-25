import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Search, Plus, Smartphone, AlertCircle, X, Check, UserCheck } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { format, formatDistanceToNow } from 'date-fns';
import { paymentsApi, customersApi } from '../services/api';
import { Payment, Customer, formatKES, CHANNEL_LABELS, PaymentChannel } from '../types';
import StatusBadge from '../components/shared/StatusBadge';
import PageHeader from '../components/shared/PageHeader';
import LoadingSpinner from '../components/shared/LoadingSpinner';

function ChannelBadge({ channel }: { channel: PaymentChannel }) {
  const cfg: Record<string, string> = {
    mpesa_stk: 'bg-emerald-500/15 text-emerald-400', mpesa_c2b: 'bg-emerald-500/15 text-emerald-400',
    pesalink: 'bg-purple-500/15 text-purple-400', bank_transfer: 'bg-blue-500/15 text-blue-400',
    bank_deposit: 'bg-red-500/15 text-red-400', cash: 'bg-amber-500/15 text-amber-400', intasend: 'bg-cyan-500/15 text-cyan-400',
  };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg[channel] || 'bg-gray-500/15 text-gray-400'}`}>{CHANNEL_LABELS[channel] || channel}</span>;
}

function STKPushModal({ onClose }: { onClose: () => void }) {
  const [phone, setPhone] = useState(''); const [amount, setAmount] = useState(''); const [customerId, setCustomerId] = useState('');
  const [custSearch, setCustSearch] = useState(''); const [loading, setLoading] = useState(false);
  const { data: customers } = useQuery({ queryKey: ['customers-stk', custSearch], queryFn: () => customersApi.list({ search: custSearch, limit: 8 }).then(r => r.data.data as Customer[]), enabled: custSearch.length > 1 });

  const handlePush = async () => {
    if (!phone || !amount) { toast.error('Phone and amount required'); return; }
    setLoading(true);
    try {
      await paymentsApi.stkPush({ phone, amount: parseFloat(amount), customer_id: customerId || undefined, description: 'Fuel Payment' });
      toast.success('STK Push sent! Customer will receive M-Pesa prompt.');
      onClose();
    } catch { toast.error('STK Push failed. Check Daraja credentials.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2"><Smartphone size={18} className="text-emerald-400" /><h3 className="font-heading font-semibold text-white">M-Pesa STK Push</h3></div>
          <button onClick={onClose}><X size={18} className="text-gray-400 hover:text-white" /></button>
        </div>
        <div className="space-y-4">
          <div><label className="label">Customer (optional)</label>
            <input value={custSearch} onChange={e => setCustSearch(e.target.value)} className="input-field" placeholder="Search customer..." />
            {(customers || []).length > 0 && custSearch && (
              <div className="mt-1 glass-card border border-gray-700/50 rounded-xl max-h-36 overflow-y-auto">
                {(customers || []).map(c => <button key={c.id} onClick={() => { setCustomerId(c.id); setPhone(c.phone); setCustSearch(c.name); }} className="w-full px-3 py-2 text-left hover:bg-gray-700/40 text-sm text-white">{c.name} · {c.phone}</button>)}
              </div>
            )}
          </div>
          <div><label className="label">Phone Number</label><input value={phone} onChange={e => setPhone(e.target.value)} className="input-field" placeholder="07XXXXXXXX" /></div>
          <div><label className="label">Amount (KES)</label><input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="input-field num" placeholder="0.00" /></div>
          <motion.button whileTap={{ scale: 0.98 }} onClick={handlePush} disabled={loading} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Smartphone size={16} />}
            {loading ? 'Sending...' : 'Send STK Push'}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

function MatchModal({ payment, onClose, onSuccess }: { payment: Payment; onClose: () => void; onSuccess: () => void }) {
  const [custSearch, setCustSearch] = useState(''); const [selectedId, setSelectedId] = useState(''); const [loading, setLoading] = useState(false);
  const { data: customers } = useQuery({ queryKey: ['customers-match', custSearch], queryFn: () => customersApi.list({ search: custSearch, limit: 8 }).then(r => r.data.data as Customer[]), enabled: custSearch.length > 1 });

  const handleMatch = async () => {
    if (!selectedId) { toast.error('Select a customer'); return; }
    setLoading(true);
    try {
      await paymentsApi.match(payment.id, selectedId);
      toast.success('Payment matched and reconciled!'); onSuccess(); onClose();
    } catch { toast.error('Match failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2"><UserCheck size={18} className="text-amber-400" /><h3 className="font-heading font-semibold text-white">Match Payment</h3></div>
          <button onClick={onClose}><X size={18} className="text-gray-400 hover:text-white" /></button>
        </div>
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-4">
          <p className="text-sm text-amber-400 font-medium">{formatKES(payment.amount)}</p>
          <p className="text-xs text-gray-400 mt-0.5">{CHANNEL_LABELS[payment.payment_channel]} · {payment.transaction_reference || '—'} · {payment.payer_name || 'Unknown'}</p>
        </div>
        <div className="space-y-3">
          <div><label className="label">Search Customer</label>
            <input value={custSearch} onChange={e => setCustSearch(e.target.value)} className="input-field" placeholder="Name, code or phone..." autoFocus />
          </div>
          {(customers || []).length > 0 && (
            <div className="glass-card border border-gray-700/50 rounded-xl max-h-40 overflow-y-auto">
              {(customers || []).map(c => (
                <button key={c.id} onClick={() => { setSelectedId(c.id); setCustSearch(c.name); }}
                  className={`w-full px-3 py-2.5 text-left transition-colors flex items-center justify-between ${selectedId === c.id ? 'bg-emerald-500/10' : 'hover:bg-gray-700/40'}`}>
                  <div><p className="text-sm text-white font-medium">{c.name}</p><p className="text-xs text-gray-500">{c.customer_code} · {c.phone}</p></div>
                  {selectedId === c.id && <Check size={14} className="text-emerald-400" />}
                </button>
              ))}
            </div>
          )}
          <button onClick={handleMatch} disabled={loading || !selectedId} className="btn-primary w-full py-2.5 flex items-center justify-center gap-2">
            {loading && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            Match & Reconcile
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function Payments() {
  const [tab, setTab] = useState<'all' | 'unmatched' | 'reconciled'>('all');
  const [search, setSearch] = useState(''); const [channelFilter, setChannelFilter] = useState('');
  const [showSTK, setShowSTK] = useState(false); const [matchPayment, setMatchPayment] = useState<Payment | null>(null);
  const [showAddManual, setShowAddManual] = useState(false);

  const { data: payments, isLoading, refetch } = useQuery({
    queryKey: ['payments', tab, search, channelFilter],
    queryFn: () => {
      if (tab === 'unmatched') return paymentsApi.getUnmatched().then(r => r.data.data as Payment[]);
      return paymentsApi.list({ status: tab === 'reconciled' ? 'reconciled' : undefined, limit: 100 }).then(r => r.data.data as Payment[]);
    },
    refetchInterval: 30000,
  });

  const { data: unmatched } = useQuery({ queryKey: ['unmatched-count'], queryFn: () => paymentsApi.getUnmatched().then(r => (r.data.data as Payment[]).length), refetchInterval: 30000 });

  useEffect(() => { document.title = 'Payments — FuelFlow Pro'; }, []);

  const filtered = (payments || []).filter(p =>
    (!search || p.transaction_reference?.toLowerCase().includes(search.toLowerCase()) || p.payer_name?.toLowerCase().includes(search.toLowerCase()) || p.customer?.name?.toLowerCase().includes(search.toLowerCase())) &&
    (!channelFilter || p.payment_channel === channelFilter)
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Payments" subtitle="Track and reconcile all incoming payments" icon={CreditCard}
        actions={<>
          <button onClick={() => setShowSTK(true)} className="btn-secondary text-sm py-2 flex items-center gap-2"><Smartphone size={14} /> STK Push</button>
          <button onClick={() => setShowAddManual(true)} className="btn-primary text-sm py-2 flex items-center gap-2"><Plus size={14} /> Record Payment</button>
        </>}
      />

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-900/60 rounded-xl w-fit">
        {([['all','All Payments'],['unmatched',`Unmatched${unmatched ? ` (${unmatched})` : ''}`],['reconciled','Reconciled']] as const).map(([val, label]) => (
          <button key={val} onClick={() => setTab(val)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === val ? 'bg-emerald-500 text-white shadow-brand' : 'text-gray-400 hover:text-white'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Unmatched alert */}
      {tab === 'unmatched' && (unmatched || 0) > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
          <AlertCircle size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-400 font-semibold text-sm">{unmatched} unmatched payment{(unmatched||0) > 1 ? 's' : ''} need attention</p>
            <p className="text-gray-400 text-xs mt-0.5">These payments arrived but couldn't be automatically linked to a customer. Click "Match" to manually assign them.</p>
          </div>
        </motion.div>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search ref, name..." className="input-field pl-8 py-2 text-sm w-52" />
        </div>
        <select value={channelFilter} onChange={e => setChannelFilter(e.target.value)} className="input-field py-2 text-sm w-44">
          <option value="">All Channels</option>
          {Object.entries(CHANNEL_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      {/* Payments table */}
      <div className="glass-card overflow-hidden">
        {isLoading ? <LoadingSpinner /> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-gray-800/50">
                <th className="table-header text-left">Payment</th><th className="table-header text-left hidden md:table-cell">Customer</th>
                <th className="table-header text-left">Channel</th><th className="table-header text-right">Amount</th>
                <th className="table-header text-center hidden sm:table-cell">Status</th>
                <th className="table-header text-left hidden lg:table-cell">Date</th><th className="table-header text-center">Actions</th>
              </tr></thead>
              <tbody>
                <AnimatePresence>
                  {filtered.map((p, i) => (
                    <motion.tr key={p.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                      className={`table-row ${p.status === 'unmatched' ? 'bg-amber-500/5' : ''}`}>
                      <td className="table-cell">
                        <p className="font-mono text-xs text-emerald-400">{p.payment_number}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{p.transaction_reference || '—'}</p>
                        {p.payer_name && <p className="text-xs text-gray-400">{p.payer_name}</p>}
                      </td>
                      <td className="table-cell hidden md:table-cell">
                        {p.customer ? (
                          <div><p className="text-sm text-white">{p.customer.name}</p><p className="text-xs text-gray-500">{p.customer.customer_code}</p></div>
                        ) : <span className="text-xs text-gray-500 italic">Unlinked</span>}
                      </td>
                      <td className="table-cell"><ChannelBadge channel={p.payment_channel} /></td>
                      <td className="table-cell text-right font-bold text-emerald-400 num">{formatKES(p.amount)}</td>
                      <td className="table-cell text-center hidden sm:table-cell"><StatusBadge status={p.status} /></td>
                      <td className="table-cell hidden lg:table-cell text-xs text-gray-400">{formatDistanceToNow(new Date(p.payment_date), { addSuffix: true })}</td>
                      <td className="table-cell text-center">
                        {p.status === 'unmatched' && (
                          <button onClick={() => setMatchPayment(p)} className="btn-secondary text-xs py-1 px-3 border-amber-500/30 text-amber-400 hover:bg-amber-500/10">Match</button>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
            {filtered.length === 0 && <div className="text-center py-12 text-gray-500 text-sm">No payments found</div>}
          </div>
        )}
      </div>

      {showSTK && <STKPushModal onClose={() => setShowSTK(false)} />}
      {matchPayment && <MatchModal payment={matchPayment} onClose={() => setMatchPayment(null)} onSuccess={refetch} />}
    </div>
  );
}
