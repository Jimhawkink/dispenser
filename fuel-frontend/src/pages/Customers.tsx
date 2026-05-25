import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, Search, ChevronRight, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { customersApi } from '../services/api';
import { Customer, formatKES } from '../types';
import PageHeader from '../components/shared/PageHeader';
import LoadingSpinner from '../components/shared/LoadingSpinner';

function CustomerCard({ customer, onClick }: { customer: Customer; onClick: () => void }) {
  const initials = customer.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const hasDebt = customer.current_balance > 0;
  return (
    <motion.div whileHover={{ y: -2 }} onClick={onClick}
      className="glass-card-hover p-4 cursor-pointer group">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500/30 to-emerald-700/30 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-sm flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-white truncate">{customer.name}</p>
              <p className="text-xs text-gray-500">{customer.phone}</p>
            </div>
            <ChevronRight size={14} className="text-gray-600 group-hover:text-emerald-400 transition-colors flex-shrink-0 mt-0.5" />
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="font-mono text-xs bg-gray-800/60 text-emerald-400 px-2 py-0.5 rounded">{customer.customer_code}</span>
            <span className={`text-xs font-bold num ${hasDebt ? 'text-red-400' : 'text-emerald-400'}`}>
              {hasDebt ? `Owes ${formatKES(customer.current_balance)}` : 'Clear'}
            </span>
          </div>
          {customer.company_name && <p className="text-xs text-gray-500 mt-1 truncate">{customer.company_name}</p>}
        </div>
      </div>
    </motion.div>
  );
}

function AddCustomerModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ name: '', phone: '', alt_phone: '', email: '', company_name: '', id_number: '', credit_limit: '', payment_preference: 'mpesa', address: '', notes: '', vehicle_plates: '' });
  const [loading, setLoading] = useState(false);
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) { toast.error('Name and phone required'); return; }
    setLoading(true);
    try {
      await customersApi.create({
        ...form,
        credit_limit: parseFloat(form.credit_limit) || 0,
        vehicle_plates: form.vehicle_plates ? form.vehicle_plates.split(',').map(s => s.trim()).filter(Boolean) : [],
      });
      toast.success('Customer added successfully!');
      onSuccess(); onClose();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to add customer');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-800/50">
          <h3 className="font-heading font-semibold text-white flex items-center gap-2"><Plus size={16} className="text-emerald-400" /> Add Customer</h3>
          <button onClick={onClose}><X size={18} className="text-gray-400 hover:text-white" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><label className="label">Full Name *</label><input value={form.name} onChange={e => set('name', e.target.value)} className="input-field" placeholder="John Kamau" required /></div>
            <div><label className="label">Phone *</label><input value={form.phone} onChange={e => set('phone', e.target.value)} className="input-field" placeholder="0712345678" required /></div>
            <div><label className="label">Alt Phone</label><input value={form.alt_phone} onChange={e => set('alt_phone', e.target.value)} className="input-field" placeholder="0700000000" /></div>
            <div><label className="label">Email</label><input type="email" value={form.email} onChange={e => set('email', e.target.value)} className="input-field" placeholder="john@example.com" /></div>
            <div><label className="label">ID / KRA PIN</label><input value={form.id_number} onChange={e => set('id_number', e.target.value)} className="input-field" placeholder="12345678" /></div>
            <div className="col-span-2"><label className="label">Company Name</label><input value={form.company_name} onChange={e => set('company_name', e.target.value)} className="input-field" placeholder="ABC Transport Ltd" /></div>
            <div><label className="label">Credit Limit (KES)</label><input type="number" value={form.credit_limit} onChange={e => set('credit_limit', e.target.value)} className="input-field num" placeholder="50000" /></div>
            <div><label className="label">Payment Preference</label>
              <select value={form.payment_preference} onChange={e => set('payment_preference', e.target.value)} className="input-field">
                <option value="mpesa">M-Pesa</option><option value="bank_transfer">Bank Transfer</option>
                <option value="pesalink">PesaLink</option><option value="cash">Cash</option>
              </select>
            </div>
            <div className="col-span-2"><label className="label">Vehicle Plates (comma separated)</label><input value={form.vehicle_plates} onChange={e => set('vehicle_plates', e.target.value)} className="input-field" placeholder="KCA 123A, KBZ 456B" /></div>
            <div className="col-span-2"><label className="label">Address</label><input value={form.address} onChange={e => set('address', e.target.value)} className="input-field" placeholder="Nairobi, Kenya" /></div>
            <div className="col-span-2"><label className="label">Notes</label><textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} className="input-field resize-none" placeholder="Additional info..." /></div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 py-2.5">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 py-2.5 flex items-center justify-center gap-2">
              {loading && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              Add Customer
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function Customers() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState<'all' | 'debtors' | 'clear'>('all');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['customers', search],
    queryFn: () => customersApi.list({ search, limit: 100, is_active: true }).then(r => r.data.data as Customer[]),
  });

  useEffect(() => { document.title = 'Customers — FuelFlow Pro'; }, []);

  const filtered = (data || []).filter(c =>
    filter === 'debtors' ? c.current_balance > 0 :
    filter === 'clear' ? c.current_balance <= 0 : true
  );

  const stats = {
    total: (data || []).length,
    debtors: (data || []).filter(c => c.current_balance > 0).length,
    totalDebt: (data || []).reduce((s, c) => s + c.current_balance, 0),
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Customers" subtitle={`${stats.total} active customers`} icon={Users}
        actions={<button onClick={() => setShowAdd(true)} className="btn-primary text-sm py-2 flex items-center gap-2"><Plus size={14} /> Add Customer</button>}
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Customers', value: stats.total, sub: 'active accounts', color: 'text-white' },
          { label: 'With Outstanding', value: stats.debtors, sub: 'customers with credit', color: 'text-amber-400' },
          { label: 'Total Outstanding', value: formatKES(stats.totalDebt), sub: 'across all customers', color: 'text-red-400', isKES: true },
        ].map(s => (
          <div key={s.label} className="glass-card p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{s.label}</p>
            <p className={`font-heading font-bold text-2xl num ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-600 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, code, phone..." className="input-field pl-8 py-2 text-sm" />
        </div>
        <div className="flex gap-1 p-1 bg-gray-900/60 rounded-xl">
          {([['all','All'],['debtors','Debtors'],['clear','Clear']] as const).map(([v, l]) => (
            <button key={v} onClick={() => setFilter(v)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === v ? 'bg-emerald-500 text-white' : 'text-gray-400 hover:text-white'}`}>{l}</button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? <LoadingSpinner /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence>
            {filtered.map((c, i) => (
              <motion.div key={c.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }}>
                <CustomerCard customer={c} onClick={() => navigate(`/customers/${c.id}`)} />
              </motion.div>
            ))}
          </AnimatePresence>
          {filtered.length === 0 && <div className="col-span-full text-center py-16 text-gray-500">No customers found</div>}
        </div>
      )}

      {showAdd && <AddCustomerModal onClose={() => setShowAdd(false)} onSuccess={refetch} />}
    </div>
  );
}
