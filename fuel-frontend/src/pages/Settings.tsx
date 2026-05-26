import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings2, Building2, Bell, CreditCard, Users, Plus, Edit2, Trash2, X, Save } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { settingsApi, authApi } from '../services/api';
import PageHeader from '../components/shared/PageHeader';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import { useAuth } from '../hooks/useAuth';

const TABS = [
  { id: 'general',  label: 'General',  icon: Building2 },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'users',    label: 'Users',    icon: Users },
];

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!value)}
      className={`w-11 h-6 rounded-full transition-all relative ${value ? 'bg-emerald-500' : 'bg-slate-200'}`}>
      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${value ? 'left-5' : 'left-0.5'}`} />
    </button>
  );
}

function GeneralSettings() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['settings'], queryFn: () => settingsApi.get().then(r => r.data.data) });
  const [form, setForm] = useState<Record<string, string>>({});

  useEffect(() => { if (data) setForm(data); }, [data]);

  const mutation = useMutation({
    mutationFn: () => settingsApi.update(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['settings'] }); toast.success('Settings saved!'); },
    onError: () => toast.error('Failed to save settings'),
  });

  if (isLoading) return <LoadingSpinner />;

  const fields = [
    { key: 'business_name',    label: 'Business Name',     type: 'text',   placeholder: 'FuelFlow Pro Station' },
    { key: 'business_phone',   label: 'Business Phone',    type: 'tel',    placeholder: '0712345678' },
    { key: 'credit_grace_days',label: 'Credit Grace Days', type: 'number', placeholder: '30' },
  ];

  const toggles = [
    { key: 'sms_on_payment',  label: 'SMS on payment received' },
    { key: 'sms_on_sale',     label: 'SMS on sale created' },
    { key: 'auto_reconcile',  label: 'Auto-reconcile payments' },
    { key: 'low_stock_alerts',label: 'Low stock alerts' },
  ];

  return (
    <div className="space-y-6">
      <div className="glass-card p-6">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><Building2 size={16} className="text-emerald-600" /> Business Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fields.map(f => (
            <div key={f.key}>
              <label className="label">{f.label}</label>
              <input type={f.type} value={form[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                className="input-field" placeholder={f.placeholder} />
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card p-6">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><Bell size={16} className="text-emerald-600" /> Notifications & Automation</h3>
        <div className="space-y-3">
          {toggles.map(t => (
            <div key={t.key} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
              <span className="text-sm text-slate-700">{t.label}</span>
              <Toggle value={form[t.key] === 'true'} onChange={v => setForm(p => ({ ...p, [t.key]: String(v) }))} />
            </div>
          ))}
        </div>
      </div>

      <button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="btn-primary flex items-center gap-2 py-2.5 px-6">
        {mutation.isPending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={15} />}
        Save Settings
      </button>
    </div>
  );
}

function BankAccountsTab() {
  const qc = useQueryClient();
  const { data: accounts = [], isLoading } = useQuery({ queryKey: ['bank-accounts'], queryFn: () => settingsApi.getBankAccounts().then(r => r.data.data) });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ bank_name: '', account_number: '', account_name: '', branch: '', paybill_number: '', till_number: '', is_primary: false });
  const set = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  const mutation = useMutation({
    mutationFn: () => settingsApi.addBankAccount(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bank-accounts'] }); toast.success('Bank account added!'); setShowForm(false); },
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-slate-600">{accounts.length} bank account(s) configured</p>
        <button onClick={() => setShowForm(true)} className="btn-primary text-sm py-2 flex items-center gap-2"><Plus size={14} /> Add Account</button>
      </div>

      {accounts.map((a: any) => (
        <div key={a.id} className="glass-card p-4 flex items-center justify-between">
          <div>
            <p className="font-semibold text-slate-800 text-sm">{a.bank_name}</p>
            <p className="text-xs text-slate-500">{a.account_number} · {a.account_name}</p>
            {a.paybill_number && <p className="text-xs text-emerald-600 mt-0.5">Paybill: {a.paybill_number}</p>}
          </div>
          {a.is_primary && <span className="badge badge-green">Primary</span>}
        </div>
      ))}

      {showForm && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-800">Add Bank Account</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              {[
                { k: 'bank_name', l: 'Bank Name', p: 'Equity Bank' },
                { k: 'account_number', l: 'Account Number', p: '0123456789' },
                { k: 'account_name', l: 'Account Name', p: 'FuelFlow Pro Ltd' },
                { k: 'branch', l: 'Branch', p: 'Westlands' },
                { k: 'paybill_number', l: 'Paybill Number', p: '247247' },
                { k: 'till_number', l: 'Till Number', p: '123456' },
              ].map(f => (
                <div key={f.k}>
                  <label className="label">{f.l}</label>
                  <input value={(form as any)[f.k]} onChange={e => set(f.k, e.target.value)} className="input-field" placeholder={f.p} />
                </div>
              ))}
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-slate-700">Set as Primary Account</span>
                <Toggle value={form.is_primary} onChange={v => set('is_primary', v)} />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowForm(false)} className="btn-secondary flex-1 py-2.5">Cancel</button>
              <button onClick={() => mutation.mutate()} disabled={mutation.isPending || !form.bank_name} className="btn-primary flex-1 py-2.5">Add Account</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function UsersTab() {
  const { user: me } = useAuth();
  const { data: users = [], isLoading } = useQuery({ queryKey: ['users'], queryFn: () => authApi.getUsers().then(r => r.data.data) });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'cashier', phone: '' });
  const qc = useQueryClient();
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const mutation = useMutation({
    mutationFn: () => authApi.createUser(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('User created!'); setShowForm(false); setForm({ name: '', email: '', password: '', role: 'cashier', phone: '' }); },
    onError: () => toast.error('Failed to create user'),
  });

  const roleColors: Record<string, string> = { admin: 'badge-green', cashier: 'badge-blue', accountant: 'badge-yellow' };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-slate-600">{users.length} system user(s)</p>
        {me?.role === 'admin' && (
          <button onClick={() => setShowForm(true)} className="btn-primary text-sm py-2 flex items-center gap-2"><Plus size={14} /> Add User</button>
        )}
      </div>

      {users.map((u: any) => (
        <div key={u.id} className="glass-card p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {u.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-800 text-sm">{u.name} {u.id === me?.id && <span className="text-xs text-slate-400">(you)</span>}</p>
            <p className="text-xs text-slate-500">{u.email}</p>
          </div>
          <span className={`badge ${roleColors[u.role] || 'badge-gray'} capitalize`}>{u.role}</span>
          {!u.is_active && <span className="badge badge-gray">Inactive</span>}
        </div>
      ))}

      {showForm && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-800">Add System User</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div><label className="label">Full Name</label><input value={form.name} onChange={e => set('name', e.target.value)} className="input-field" placeholder="John Kamau" /></div>
              <div><label className="label">Email</label><input type="email" value={form.email} onChange={e => set('email', e.target.value)} className="input-field" placeholder="john@fuelflow.co.ke" /></div>
              <div><label className="label">Password</label><input type="password" value={form.password} onChange={e => set('password', e.target.value)} className="input-field" placeholder="Min 8 characters" /></div>
              <div><label className="label">Phone</label><input value={form.phone} onChange={e => set('phone', e.target.value)} className="input-field" placeholder="0712345678" /></div>
              <div>
                <label className="label">Role</label>
                <select value={form.role} onChange={e => set('role', e.target.value)} className="input-field">
                  <option value="cashier">Cashier</option>
                  <option value="accountant">Accountant</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowForm(false)} className="btn-secondary flex-1 py-2.5">Cancel</button>
              <button onClick={() => mutation.mutate()} disabled={mutation.isPending || !form.name || !form.email || !form.password} className="btn-primary flex-1 py-2.5">Create User</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default function Settings() {
  const [tab, setTab] = useState('general');
  useEffect(() => { document.title = 'Settings — FuelFlow Pro'; }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle="Configure system preferences and users" icon={Settings2} />

      <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 w-fit shadow-sm">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.id ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
            <t.icon size={15} />{t.label}
          </button>
        ))}
      </div>

      <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        {tab === 'general'  && <GeneralSettings />}
        {tab === 'payments' && <BankAccountsTab />}
        {tab === 'users'    && <UsersTab />}
      </motion.div>
    </div>
  );
}
