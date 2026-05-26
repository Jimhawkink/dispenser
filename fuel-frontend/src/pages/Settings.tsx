import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Users, Building2, Bell, Key, Plus, X, Shield } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { settingsApi, authApi } from '../services/api';
import { BankAccount, User } from '../types';
import PageHeader from '../components/shared/PageHeader';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import { useAuth } from '../hooks/useAuth';

function GeneralSettings() {
  const { data, isLoading } = useQuery({ queryKey: ['settings'], queryFn: () => settingsApi.get().then(r => r.data.data as Record<string, string>) });
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (data) setForm(data); }, [data]);
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try { await settingsApi.update(form); toast.success('Settings saved!'); }
    catch { toast.error('Failed to save settings'); }
    finally { setSaving(false); }
  };

  if (isLoading) return <LoadingSpinner size="sm" />;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { key: 'business_name', label: 'Business Name', placeholder: 'Karibu Petrol Station' },
          { key: 'business_phone', label: 'Business Phone', placeholder: '0712345678' },
          { key: 'business_email', label: 'Business Email', placeholder: 'info@station.co.ke' },
          { key: 'business_address', label: 'Business Address', placeholder: 'Nairobi, Kenya' },
          { key: 'mpesa_paybill', label: 'M-Pesa Paybill Number', placeholder: '123456' },
          { key: 'credit_grace_days', label: 'Credit Grace Period (Days)', placeholder: '30' },
        ].map(f => (
          <div key={f.key}>
            <label className="label">{f.label}</label>
            <input value={form[f.key] || ''} onChange={e => set(f.key, e.target.value)} className="input-field" placeholder={f.placeholder} />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { key: 'sms_on_sale', label: 'SMS on Sale' },
          { key: 'sms_on_payment', label: 'SMS on Payment' },
          { key: 'low_stock_alerts', label: 'Low Stock Alerts' },
          { key: 'auto_reconcile', label: 'Auto Reconciliation' },
        ].map(f => (
          <div key={f.key} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-sm text-slate-600">{f.label}</span>
            <button onClick={() => set(f.key, form[f.key] === 'true' ? 'false' : 'true')}
              className={`w-10 h-5 rounded-full transition-all relative ${form[f.key] === 'true' ? 'bg-emerald-500' : 'bg-slate-300'}`}>
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${form[f.key] === 'true' ? 'left-5' : 'left-0.5'}`} />
            </button>
          </div>
        ))}
      </div>
      <button onClick={handleSave} disabled={saving}  import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Users, Building2, Bell, Key, Plus, X, Shield } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { settingsApi, authApi } from '../services/api';
import { BankAccount, User } from '../types';
import PageHeader from '../components/shared/PageHeader';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import { useAuth } from '../hooks/useAuth';

function GeneralSettings() {
  const { data, isLoading } = useQuery({ queryKey: ['settings'], queryFn: () => settingsApi.get().then(r => r.data.data as Record<string, string>) });
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (data) setForm(data); }, [data]);
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try { await settingsApi.update(form); toast.success('Settings saved!'); }
    catch { toast.error('Failed to save settings'); }
    finally { setSaving(false); }
  };

  if (isLoading) return <LoadingSpinner size="sm" />;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { key: 'business_name', label: 'Business Name', placeholder: 'Karibu Petrol Station' },
          { key: 'business_phone', label: 'Business Phone', placeholder: '0712345678' },
          { key: 'business_email', label: 'Business Email', placeholder: 'info@station.co.ke' },
          { key: 'business_address', label: 'Business Address', placeholder: 'Nairobi, Kenya' },
          { key: 'mpesa_paybill', label: 'M-Pesa Paybill Number', placeholder: '123456' },
          { key: 'credit_grace_days', label: 'Credit Grace Period (Days)', placeholder: '30' },
        ].map(f => (
          <div key={f.key}>
            <label className="label">{f.label}</label>
            <input value={form[f.key] || ''} onChange={e => set(f.key, e.target.value)} className="input-field" placeholder={f.placeholder} />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { key: 'sms_on_sale', label: 'SMS on Sale' },
          { key: 'sms_on_payment', label: 'SMS on Payment' },
          { key: 'low_stock_alerts', label: 'Low Stock Alerts' },
          { key: 'auto_reconcile', label: 'Auto Reconciliation' },
        ].map(f => (
          <div key={f.key} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-sm text-slate-600">{f.label}</span>
            <button onClick={() => set(f.key, form[f.key] === 'true' ? 'false' : 'true')}
              className={`w-10 h-5 rounded-full transition-all relative ${form[f.key] === 'true' ? 'bg-emerald-500' : 'bg-slate-300'}`}>
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${form[f.key] === 'true' ? 'left-5' : 'left-0.5'}`} />
            </button>
          </div>
        ))}
      </div>
      <button onClick={handleSave} disabled={saving} className="btn-primary py-2.5 px-6 flex items-center gap-2">
        {saving && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
        Save Settings
      </button>
    </div>
  );
}

function BankAccounts() {
  const { data, refetch } = useQuery({ queryKey: ['bank-accounts'], queryFn: () => settingsApi.getBankAccounts().then(r => r.data.data as BankAccount[]) });
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ bank_name: '', account_number: '', account_name: '', branch: '', paybill_number: '', till_number: '', account_ref_hint: '', is_primary: false });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try { await settingsApi.createBankAccount(form); toast.success('Bank account added!'); refetch(); setShowAdd(false); }
    catch { toast.error('Failed to add bank account'); } finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end"><button onClick={() => setShowAdd(v => !v)} className="btn-primary text-sm py-2 flex items-center gap-2"><Plus size={14} /> Add Account</button></div>
      {showAdd && (
        <motion.form initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleAdd} className="glass-card p-5 border border-emerald-500/20 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Bank Name *</label><input value={form.bank_name} onChange={e => set('bank_name', e.target.value)} className="input-field" placeholder="Equity Bank" required /></div>
            <div><label className="label">Account Number *</label><input value={form.account_number} onChange={e => set('account_number', e.target.value)} className="input-field" placeholder="1234567890" required /></div>
            <div><label className="label">Account Name *</label><input value={form.account_name} onChange={e => set('account_name', e.target.value)} className="input-field" placeholder="Karibu Petrol Station" required /></div>
            <div><label className="label">Branch</label><input value={form.branch} onChange={e => set('branch', e.target.value)} className="input-field" placeholder="Westlands" /></div>
            <div><label className="label">Paybill Number</label><input value={form.paybill_number} onChange={e => set('paybill_number', e.target.value)} className="input-field" placeholder="123456" /></div>
            <div><label className="label">Till Number</label><input value={form.till_number} onChange={e => set('till_number', e.target.value)} className="input-field" placeholder="789012" /></div>
            <div className="col-span-2"><label className="label">Account Ref Hint (for Paybill payments)</label><input value={form.account_ref_hint} onChange={e => set('account_ref_hint', e.target.value)} className="input-field" placeholder="e.g. Use customer code as account ref" /></div>
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" checked={form.is_primary} onChange={e => set('is_primary', e.target.checked)} id="primary" className="rounded" />
            <label htmlFor="primary" className="text-sm text-slate-600">Set as primary account</label>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary py-2 px-4 text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary py-2 px-6 text-sm flex items-center gap-2">
              {saving && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />} Add Account
            </button>
          </div>
        </motion.form>
      )}
      <div className="space-y-3">
        {(data || []).map(acc => (
          <div key={acc.id} className={`glass-card p-4 flex items-start justify-between ${acc.is_primary ? 'border-emerald-500/30' : ''}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center"><Building2 size={18} className="text-blue-400" /></div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-slate-800">{acc.bank_name}</p>
                  {acc.is_primary && <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">Primary</span>}
                </div>
                <p className="text-sm text-slate-500">{acc.account_name}</p>
                <p className="font-mono text-xs text-slate-400 mt-0.5">{acc.account_number}{acc.branch ? ` · ${acc.branch}` : ''}</p>
                <div className="flex gap-3 mt-1">
                  {acc.paybill_number && <span className="text-xs text-slate-400">Paybill: {acc.paybill_number}</span>}
                  {acc.till_number && <span className="text-xs text-slate-400">Till: {acc.till_number}</span>}
                </div>
              </div>
            </div>
          </div>
        ))}
        {(data || []).length === 0 && <div className="text-center py-8 text-slate-400 text-sm">No bank accounts configured</div>}
      </div>
    </div>
  );
}

function UserManagement() {
  const { user: currentUser } = useAuth();
  const { data, refetch } = useQuery({ queryKey: ['users'], queryFn: () => authApi.getUsers().then(r => r.data.data as User[]) });
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'cashier', phone: '' });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try { await authApi.createUser(form); toast.success('User created!'); refetch(); setShowAdd(false); setForm({ name: '', email: '', password: '', role: 'cashier', phone: '' }); }
    catch (err: unknown) { toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to create user'); }
    finally { setSaving(false); }
  };

  const toggleActive = async (id: string, is_active: boolean) => {
    try { await authApi.updateUser(id, { is_active }); refetch(); toast.success(`User ${is_active ? 'activated' : 'deactivated'}`); }
    catch { toast.error('Failed to update user'); }
  };

  const ROLE_COLORS: Record<string, string> = { admin: 'bg-emerald-500/15 text-emerald-400', cashier: 'bg-blue-500/15 text-blue-400', accountant: 'bg-amber-500/15 text-amber-400' };

  return (
    <div className="space-y-4">
      {currentUser?.role === 'admin' && <div className="flex justify-end"><button onClick={() => setShowAdd(v => !v)} className="btn-primary text-sm py-2 flex items-center gap-2"><Plus size={14} /> Add User</button></div>}
      {showAdd && (
        <motion.form initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleAdd} className="glass-card p-5 border border-emerald-500/20 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><label className="label">Full Name *</label><input value={form.name} onChange={e => set('name', e.target.value)} className="input-field" placeholder="Jane Wanjiku" required /></div>
            <div><label className="label">Email *</label><input type="email" value={form.email} onChange={e => set('email', e.target.value)} className="input-field" placeholder="jane@station.co.ke" required /></div>
            <div><label className="label">Phone</label><input value={form.phone} onChange={e => set('phone', e.target.value)} className="input-field" placeholder="0712345678" /></div>
            <div><label className="label">Password *</label><input type="password" value={form.password} onChange={e => set('password', e.target.value)} className="input-field" placeholder="••••••••" required /></div>
            <div><label className="label">Role *</label>
              <select value={form.role} onChange={e => set('role', e.target.value)} className="input-field">
                <option value="cashier">Cashier</option><option value="accountant">Accountant</option><option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary py-2 px-4 text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary py-2 px-6 text-sm flex items-center gap-2">
              {saving && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />} Create User
            </button>
          </div>
        </motion.form>
      )}
      <div className="space-y-3">
        {(data || []).map(u => (
          <div key={u.id} className="glass-card p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/30 to-emerald-700/30 flex items-center justify-center text-emerald-400 font-bold text-sm">
                {u.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-slate-800 text-sm">{u.name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${ROLE_COLORS[u.role] || ROLE_COLORS.cashier}`}>{u.role}</span>
                  {u.id === currentUser?.id && <span className="text-xs text-slate-400">(You)</span>}
                </div>
                <p className="text-xs text-slate-400">{u.email}{u.phone ? ` · ${u.phone}` : ''}</p>
              </div>
            </div>
            {currentUser?.role === 'admin' && u.id !== currentUser.id && (
              <button onClick={() => toggleActive(u.id, !u.is_active)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${u.is_active ? 'border-slate-400 text-slate-500 hover:border-red-500/50 hover:text-red-400' : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'}`}>
                {u.is_active ? 'Deactivate' : 'Activate'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Settings() {
  const [tab, setTab] = useState<'general' | 'banks' | 'users'>('general');
  const { user } = useAuth();
  useEffect(() => { document.title = 'Settings — FuelFlow Pro'; }, []);

  const TABS = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'banks', label: 'Bank Accounts', icon: Building2 },
    ...(user?.role === 'admin' ? [{ id: 'users', label: 'User Management', icon: Users }] : []),
  ] as const;

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle="System configuration and management" icon={SettingsIcon} />
      <div className="flex gap-1 p-1 bg-white/80 rounded-xl w-fit flex-wrap">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.id ? 'bg-emerald-500 text-white' : 'text-slate-500 hover:text-slate-900'}`}>
            <t.icon size={14} />{t.label}
          </button>
        ))}
      </div>
      <div className="glass-card p-6">
        {tab === 'general' && <GeneralSettings />}
        {tab === 'banks' && <BankAccounts />}
        {tab === 'users' && user?.role === 'admin' && <UserManagement />}
      </div>
    </div>
  );
}


.Value >
        {saving && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
        Save Settings
      </button>
    </div>
  );
}

function BankAccounts() {
  const { data, refetch } = useQuery({ queryKey: ['bank-accounts'], queryFn: () => settingsApi.getBankAccounts().then(r => r.data.data as BankAccount[]) });
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ bank_name: '', account_number: '', account_name: '', branch: '', paybill_number: '', till_number: '', account_ref_hint: '', is_primary: false });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try { await settingsApi.createBankAccount(form); toast.success('Bank account added!'); refetch(); setShowAdd(false); }
    catch { toast.error('Failed to add bank account'); } finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end"><button onClick={() => setShowAdd(v => !v)}  import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Users, Building2, Bell, Key, Plus, X, Shield } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { settingsApi, authApi } from '../services/api';
import { BankAccount, User } from '../types';
import PageHeader from '../components/shared/PageHeader';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import { useAuth } from '../hooks/useAuth';

function GeneralSettings() {
  const { data, isLoading } = useQuery({ queryKey: ['settings'], queryFn: () => settingsApi.get().then(r => r.data.data as Record<string, string>) });
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (data) setForm(data); }, [data]);
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try { await settingsApi.update(form); toast.success('Settings saved!'); }
    catch { toast.error('Failed to save settings'); }
    finally { setSaving(false); }
  };

  if (isLoading) return <LoadingSpinner size="sm" />;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { key: 'business_name', label: 'Business Name', placeholder: 'Karibu Petrol Station' },
          { key: 'business_phone', label: 'Business Phone', placeholder: '0712345678' },
          { key: 'business_email', label: 'Business Email', placeholder: 'info@station.co.ke' },
          { key: 'business_address', label: 'Business Address', placeholder: 'Nairobi, Kenya' },
          { key: 'mpesa_paybill', label: 'M-Pesa Paybill Number', placeholder: '123456' },
          { key: 'credit_grace_days', label: 'Credit Grace Period (Days)', placeholder: '30' },
        ].map(f => (
          <div key={f.key}>
            <label className="label">{f.label}</label>
            <input value={form[f.key] || ''} onChange={e => set(f.key, e.target.value)} className="input-field" placeholder={f.placeholder} />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { key: 'sms_on_sale', label: 'SMS on Sale' },
          { key: 'sms_on_payment', label: 'SMS on Payment' },
          { key: 'low_stock_alerts', label: 'Low Stock Alerts' },
          { key: 'auto_reconcile', label: 'Auto Reconciliation' },
        ].map(f => (
          <div key={f.key} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-sm text-slate-600">{f.label}</span>
            <button onClick={() => set(f.key, form[f.key] === 'true' ? 'false' : 'true')}
              className={`w-10 h-5 rounded-full transition-all relative ${form[f.key] === 'true' ? 'bg-emerald-500' : 'bg-slate-300'}`}>
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${form[f.key] === 'true' ? 'left-5' : 'left-0.5'}`} />
            </button>
          </div>
        ))}
      </div>
      <button onClick={handleSave} disabled={saving} className="btn-primary py-2.5 px-6 flex items-center gap-2">
        {saving && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
        Save Settings
      </button>
    </div>
  );
}

function BankAccounts() {
  const { data, refetch } = useQuery({ queryKey: ['bank-accounts'], queryFn: () => settingsApi.getBankAccounts().then(r => r.data.data as BankAccount[]) });
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ bank_name: '', account_number: '', account_name: '', branch: '', paybill_number: '', till_number: '', account_ref_hint: '', is_primary: false });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try { await settingsApi.createBankAccount(form); toast.success('Bank account added!'); refetch(); setShowAdd(false); }
    catch { toast.error('Failed to add bank account'); } finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end"><button onClick={() => setShowAdd(v => !v)} className="btn-primary text-sm py-2 flex items-center gap-2"><Plus size={14} /> Add Account</button></div>
      {showAdd && (
        <motion.form initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleAdd} className="glass-card p-5 border border-emerald-500/20 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Bank Name *</label><input value={form.bank_name} onChange={e => set('bank_name', e.target.value)} className="input-field" placeholder="Equity Bank" required /></div>
            <div><label className="label">Account Number *</label><input value={form.account_number} onChange={e => set('account_number', e.target.value)} className="input-field" placeholder="1234567890" required /></div>
            <div><label className="label">Account Name *</label><input value={form.account_name} onChange={e => set('account_name', e.target.value)} className="input-field" placeholder="Karibu Petrol Station" required /></div>
            <div><label className="label">Branch</label><input value={form.branch} onChange={e => set('branch', e.target.value)} className="input-field" placeholder="Westlands" /></div>
            <div><label className="label">Paybill Number</label><input value={form.paybill_number} onChange={e => set('paybill_number', e.target.value)} className="input-field" placeholder="123456" /></div>
            <div><label className="label">Till Number</label><input value={form.till_number} onChange={e => set('till_number', e.target.value)} className="input-field" placeholder="789012" /></div>
            <div className="col-span-2"><label className="label">Account Ref Hint (for Paybill payments)</label><input value={form.account_ref_hint} onChange={e => set('account_ref_hint', e.target.value)} className="input-field" placeholder="e.g. Use customer code as account ref" /></div>
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" checked={form.is_primary} onChange={e => set('is_primary', e.target.checked)} id="primary" className="rounded" />
            <label htmlFor="primary" className="text-sm text-slate-600">Set as primary account</label>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary py-2 px-4 text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary py-2 px-6 text-sm flex items-center gap-2">
              {saving && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />} Add Account
            </button>
          </div>
        </motion.form>
      )}
      <div className="space-y-3">
        {(data || []).map(acc => (
          <div key={acc.id} className={`glass-card p-4 flex items-start justify-between ${acc.is_primary ? 'border-emerald-500/30' : ''}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center"><Building2 size={18} className="text-blue-400" /></div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-slate-800">{acc.bank_name}</p>
                  {acc.is_primary && <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">Primary</span>}
                </div>
                <p className="text-sm text-slate-500">{acc.account_name}</p>
                <p className="font-mono text-xs text-slate-400 mt-0.5">{acc.account_number}{acc.branch ? ` · ${acc.branch}` : ''}</p>
                <div className="flex gap-3 mt-1">
                  {acc.paybill_number && <span className="text-xs text-slate-400">Paybill: {acc.paybill_number}</span>}
                  {acc.till_number && <span className="text-xs text-slate-400">Till: {acc.till_number}</span>}
                </div>
              </div>
            </div>
          </div>
        ))}
        {(data || []).length === 0 && <div className="text-center py-8 text-slate-400 text-sm">No bank accounts configured</div>}
      </div>
    </div>
  );
}

function UserManagement() {
  const { user: currentUser } = useAuth();
  const { data, refetch } = useQuery({ queryKey: ['users'], queryFn: () => authApi.getUsers().then(r => r.data.data as User[]) });
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'cashier', phone: '' });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try { await authApi.createUser(form); toast.success('User created!'); refetch(); setShowAdd(false); setForm({ name: '', email: '', password: '', role: 'cashier', phone: '' }); }
    catch (err: unknown) { toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to create user'); }
    finally { setSaving(false); }
  };

  const toggleActive = async (id: string, is_active: boolean) => {
    try { await authApi.updateUser(id, { is_active }); refetch(); toast.success(`User ${is_active ? 'activated' : 'deactivated'}`); }
    catch { toast.error('Failed to update user'); }
  };

  const ROLE_COLORS: Record<string, string> = { admin: 'bg-emerald-500/15 text-emerald-400', cashier: 'bg-blue-500/15 text-blue-400', accountant: 'bg-amber-500/15 text-amber-400' };

  return (
    <div className="space-y-4">
      {currentUser?.role === 'admin' && <div className="flex justify-end"><button onClick={() => setShowAdd(v => !v)} className="btn-primary text-sm py-2 flex items-center gap-2"><Plus size={14} /> Add User</button></div>}
      {showAdd && (
        <motion.form initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleAdd} className="glass-card p-5 border border-emerald-500/20 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><label className="label">Full Name *</label><input value={form.name} onChange={e => set('name', e.target.value)} className="input-field" placeholder="Jane Wanjiku" required /></div>
            <div><label className="label">Email *</label><input type="email" value={form.email} onChange={e => set('email', e.target.value)} className="input-field" placeholder="jane@station.co.ke" required /></div>
            <div><label className="label">Phone</label><input value={form.phone} onChange={e => set('phone', e.target.value)} className="input-field" placeholder="0712345678" /></div>
            <div><label className="label">Password *</label><input type="password" value={form.password} onChange={e => set('password', e.target.value)} className="input-field" placeholder="••••••••" required /></div>
            <div><label className="label">Role *</label>
              <select value={form.role} onChange={e => set('role', e.target.value)} className="input-field">
                <option value="cashier">Cashier</option><option value="accountant">Accountant</option><option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary py-2 px-4 text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary py-2 px-6 text-sm flex items-center gap-2">
              {saving && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />} Create User
            </button>
          </div>
        </motion.form>
      )}
      <div className="space-y-3">
        {(data || []).map(u => (
          <div key={u.id} className="glass-card p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/30 to-emerald-700/30 flex items-center justify-center text-emerald-400 font-bold text-sm">
                {u.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-slate-800 text-sm">{u.name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${ROLE_COLORS[u.role] || ROLE_COLORS.cashier}`}>{u.role}</span>
                  {u.id === currentUser?.id && <span className="text-xs text-slate-400">(You)</span>}
                </div>
                <p className="text-xs text-slate-400">{u.email}{u.phone ? ` · ${u.phone}` : ''}</p>
              </div>
            </div>
            {currentUser?.role === 'admin' && u.id !== currentUser.id && (
              <button onClick={() => toggleActive(u.id, !u.is_active)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${u.is_active ? 'border-slate-400 text-slate-500 hover:border-red-500/50 hover:text-red-400' : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'}`}>
                {u.is_active ? 'Deactivate' : 'Activate'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Settings() {
  const [tab, setTab] = useState<'general' | 'banks' | 'users'>('general');
  const { user } = useAuth();
  useEffect(() => { document.title = 'Settings — FuelFlow Pro'; }, []);

  const TABS = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'banks', label: 'Bank Accounts', icon: Building2 },
    ...(user?.role === 'admin' ? [{ id: 'users', label: 'User Management', icon: Users }] : []),
  ] as const;

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle="System configuration and management" icon={SettingsIcon} />
      <div className="flex gap-1 p-1 bg-white/80 rounded-xl w-fit flex-wrap">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.id ? 'bg-emerald-500 text-white' : 'text-slate-500 hover:text-slate-900'}`}>
            <t.icon size={14} />{t.label}
          </button>
        ))}
      </div>
      <div className="glass-card p-6">
        {tab === 'general' && <GeneralSettings />}
        {tab === 'banks' && <BankAccounts />}
        {tab === 'users' && user?.role === 'admin' && <UserManagement />}
      </div>
    </div>
  );
}


.Value ><Plus size={14} /> Add Account</button></div>
      {showAdd && (
        <motion.form initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleAdd} className="glass-card p-5 border border-emerald-500/20 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Bank Name *</label><input value={form.bank_name} onChange={e => set('bank_name', e.target.value)} className="input-field" placeholder="Equity Bank" required /></div>
            <div><label className="label">Account Number *</label><input value={form.account_number} onChange={e => set('account_number', e.target.value)} className="input-field" placeholder="1234567890" required /></div>
            <div><label className="label">Account Name *</label><input value={form.account_name} onChange={e => set('account_name', e.target.value)} className="input-field" placeholder="Karibu Petrol Station" required /></div>
            <div><label className="label">Branch</label><input value={form.branch} onChange={e => set('branch', e.target.value)} className="input-field" placeholder="Westlands" /></div>
            <div><label className="label">Paybill Number</label><input value={form.paybill_number} onChange={e => set('paybill_number', e.target.value)} className="input-field" placeholder="123456" /></div>
            <div><label className="label">Till Number</label><input value={form.till_number} onChange={e => set('till_number', e.target.value)} className="input-field" placeholder="789012" /></div>
            <div className="col-span-2"><label className="label">Account Ref Hint (for Paybill payments)</label><input value={form.account_ref_hint} onChange={e => set('account_ref_hint', e.target.value)} className="input-field" placeholder="e.g. Use customer code as account ref" /></div>
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" checked={form.is_primary} onChange={e => set('is_primary', e.target.checked)} id="primary" className="rounded" />
            <label htmlFor="primary" className="text-sm text-slate-600">Set as primary account</label>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary py-2 px-4 text-sm">Cancel</button>
            <button type="submit" disabled={saving}  import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Users, Building2, Bell, Key, Plus, X, Shield } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { settingsApi, authApi } from '../services/api';
import { BankAccount, User } from '../types';
import PageHeader from '../components/shared/PageHeader';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import { useAuth } from '../hooks/useAuth';

function GeneralSettings() {
  const { data, isLoading } = useQuery({ queryKey: ['settings'], queryFn: () => settingsApi.get().then(r => r.data.data as Record<string, string>) });
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (data) setForm(data); }, [data]);
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try { await settingsApi.update(form); toast.success('Settings saved!'); }
    catch { toast.error('Failed to save settings'); }
    finally { setSaving(false); }
  };

  if (isLoading) return <LoadingSpinner size="sm" />;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { key: 'business_name', label: 'Business Name', placeholder: 'Karibu Petrol Station' },
          { key: 'business_phone', label: 'Business Phone', placeholder: '0712345678' },
          { key: 'business_email', label: 'Business Email', placeholder: 'info@station.co.ke' },
          { key: 'business_address', label: 'Business Address', placeholder: 'Nairobi, Kenya' },
          { key: 'mpesa_paybill', label: 'M-Pesa Paybill Number', placeholder: '123456' },
          { key: 'credit_grace_days', label: 'Credit Grace Period (Days)', placeholder: '30' },
        ].map(f => (
          <div key={f.key}>
            <label className="label">{f.label}</label>
            <input value={form[f.key] || ''} onChange={e => set(f.key, e.target.value)} className="input-field" placeholder={f.placeholder} />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { key: 'sms_on_sale', label: 'SMS on Sale' },
          { key: 'sms_on_payment', label: 'SMS on Payment' },
          { key: 'low_stock_alerts', label: 'Low Stock Alerts' },
          { key: 'auto_reconcile', label: 'Auto Reconciliation' },
        ].map(f => (
          <div key={f.key} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-sm text-slate-600">{f.label}</span>
            <button onClick={() => set(f.key, form[f.key] === 'true' ? 'false' : 'true')}
              className={`w-10 h-5 rounded-full transition-all relative ${form[f.key] === 'true' ? 'bg-emerald-500' : 'bg-slate-300'}`}>
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${form[f.key] === 'true' ? 'left-5' : 'left-0.5'}`} />
            </button>
          </div>
        ))}
      </div>
      <button onClick={handleSave} disabled={saving} className="btn-primary py-2.5 px-6 flex items-center gap-2">
        {saving && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
        Save Settings
      </button>
    </div>
  );
}

function BankAccounts() {
  const { data, refetch } = useQuery({ queryKey: ['bank-accounts'], queryFn: () => settingsApi.getBankAccounts().then(r => r.data.data as BankAccount[]) });
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ bank_name: '', account_number: '', account_name: '', branch: '', paybill_number: '', till_number: '', account_ref_hint: '', is_primary: false });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try { await settingsApi.createBankAccount(form); toast.success('Bank account added!'); refetch(); setShowAdd(false); }
    catch { toast.error('Failed to add bank account'); } finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end"><button onClick={() => setShowAdd(v => !v)} className="btn-primary text-sm py-2 flex items-center gap-2"><Plus size={14} /> Add Account</button></div>
      {showAdd && (
        <motion.form initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleAdd} className="glass-card p-5 border border-emerald-500/20 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Bank Name *</label><input value={form.bank_name} onChange={e => set('bank_name', e.target.value)} className="input-field" placeholder="Equity Bank" required /></div>
            <div><label className="label">Account Number *</label><input value={form.account_number} onChange={e => set('account_number', e.target.value)} className="input-field" placeholder="1234567890" required /></div>
            <div><label className="label">Account Name *</label><input value={form.account_name} onChange={e => set('account_name', e.target.value)} className="input-field" placeholder="Karibu Petrol Station" required /></div>
            <div><label className="label">Branch</label><input value={form.branch} onChange={e => set('branch', e.target.value)} className="input-field" placeholder="Westlands" /></div>
            <div><label className="label">Paybill Number</label><input value={form.paybill_number} onChange={e => set('paybill_number', e.target.value)} className="input-field" placeholder="123456" /></div>
            <div><label className="label">Till Number</label><input value={form.till_number} onChange={e => set('till_number', e.target.value)} className="input-field" placeholder="789012" /></div>
            <div className="col-span-2"><label className="label">Account Ref Hint (for Paybill payments)</label><input value={form.account_ref_hint} onChange={e => set('account_ref_hint', e.target.value)} className="input-field" placeholder="e.g. Use customer code as account ref" /></div>
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" checked={form.is_primary} onChange={e => set('is_primary', e.target.checked)} id="primary" className="rounded" />
            <label htmlFor="primary" className="text-sm text-slate-600">Set as primary account</label>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary py-2 px-4 text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary py-2 px-6 text-sm flex items-center gap-2">
              {saving && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />} Add Account
            </button>
          </div>
        </motion.form>
      )}
      <div className="space-y-3">
        {(data || []).map(acc => (
          <div key={acc.id} className={`glass-card p-4 flex items-start justify-between ${acc.is_primary ? 'border-emerald-500/30' : ''}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center"><Building2 size={18} className="text-blue-400" /></div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-slate-800">{acc.bank_name}</p>
                  {acc.is_primary && <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">Primary</span>}
                </div>
                <p className="text-sm text-slate-500">{acc.account_name}</p>
                <p className="font-mono text-xs text-slate-400 mt-0.5">{acc.account_number}{acc.branch ? ` · ${acc.branch}` : ''}</p>
                <div className="flex gap-3 mt-1">
                  {acc.paybill_number && <span className="text-xs text-slate-400">Paybill: {acc.paybill_number}</span>}
                  {acc.till_number && <span className="text-xs text-slate-400">Till: {acc.till_number}</span>}
                </div>
              </div>
            </div>
          </div>
        ))}
        {(data || []).length === 0 && <div className="text-center py-8 text-slate-400 text-sm">No bank accounts configured</div>}
      </div>
    </div>
  );
}

function UserManagement() {
  const { user: currentUser } = useAuth();
  const { data, refetch } = useQuery({ queryKey: ['users'], queryFn: () => authApi.getUsers().then(r => r.data.data as User[]) });
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'cashier', phone: '' });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try { await authApi.createUser(form); toast.success('User created!'); refetch(); setShowAdd(false); setForm({ name: '', email: '', password: '', role: 'cashier', phone: '' }); }
    catch (err: unknown) { toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to create user'); }
    finally { setSaving(false); }
  };

  const toggleActive = async (id: string, is_active: boolean) => {
    try { await authApi.updateUser(id, { is_active }); refetch(); toast.success(`User ${is_active ? 'activated' : 'deactivated'}`); }
    catch { toast.error('Failed to update user'); }
  };

  const ROLE_COLORS: Record<string, string> = { admin: 'bg-emerald-500/15 text-emerald-400', cashier: 'bg-blue-500/15 text-blue-400', accountant: 'bg-amber-500/15 text-amber-400' };

  return (
    <div className="space-y-4">
      {currentUser?.role === 'admin' && <div className="flex justify-end"><button onClick={() => setShowAdd(v => !v)} className="btn-primary text-sm py-2 flex items-center gap-2"><Plus size={14} /> Add User</button></div>}
      {showAdd && (
        <motion.form initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleAdd} className="glass-card p-5 border border-emerald-500/20 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><label className="label">Full Name *</label><input value={form.name} onChange={e => set('name', e.target.value)} className="input-field" placeholder="Jane Wanjiku" required /></div>
            <div><label className="label">Email *</label><input type="email" value={form.email} onChange={e => set('email', e.target.value)} className="input-field" placeholder="jane@station.co.ke" required /></div>
            <div><label className="label">Phone</label><input value={form.phone} onChange={e => set('phone', e.target.value)} className="input-field" placeholder="0712345678" /></div>
            <div><label className="label">Password *</label><input type="password" value={form.password} onChange={e => set('password', e.target.value)} className="input-field" placeholder="••••••••" required /></div>
            <div><label className="label">Role *</label>
              <select value={form.role} onChange={e => set('role', e.target.value)} className="input-field">
                <option value="cashier">Cashier</option><option value="accountant">Accountant</option><option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary py-2 px-4 text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary py-2 px-6 text-sm flex items-center gap-2">
              {saving && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />} Create User
            </button>
          </div>
        </motion.form>
      )}
      <div className="space-y-3">
        {(data || []).map(u => (
          <div key={u.id} className="glass-card p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/30 to-emerald-700/30 flex items-center justify-center text-emerald-400 font-bold text-sm">
                {u.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-slate-800 text-sm">{u.name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${ROLE_COLORS[u.role] || ROLE_COLORS.cashier}`}>{u.role}</span>
                  {u.id === currentUser?.id && <span className="text-xs text-slate-400">(You)</span>}
                </div>
                <p className="text-xs text-slate-400">{u.email}{u.phone ? ` · ${u.phone}` : ''}</p>
              </div>
            </div>
            {currentUser?.role === 'admin' && u.id !== currentUser.id && (
              <button onClick={() => toggleActive(u.id, !u.is_active)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${u.is_active ? 'border-slate-400 text-slate-500 hover:border-red-500/50 hover:text-red-400' : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'}`}>
                {u.is_active ? 'Deactivate' : 'Activate'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Settings() {
  const [tab, setTab] = useState<'general' | 'banks' | 'users'>('general');
  const { user } = useAuth();
  useEffect(() => { document.title = 'Settings — FuelFlow Pro'; }, []);

  const TABS = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'banks', label: 'Bank Accounts', icon: Building2 },
    ...(user?.role === 'admin' ? [{ id: 'users', label: 'User Management', icon: Users }] : []),
  ] as const;

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle="System configuration and management" icon={SettingsIcon} />
      <div className="flex gap-1 p-1 bg-white/80 rounded-xl w-fit flex-wrap">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.id ? 'bg-emerald-500 text-white' : 'text-slate-500 hover:text-slate-900'}`}>
            <t.icon size={14} />{t.label}
          </button>
        ))}
      </div>
      <div className="glass-card p-6">
        {tab === 'general' && <GeneralSettings />}
        {tab === 'banks' && <BankAccounts />}
        {tab === 'users' && user?.role === 'admin' && <UserManagement />}
      </div>
    </div>
  );
}


.Value >
              {saving && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />} Add Account
            </button>
          </div>
        </motion.form>
      )}
      <div className="space-y-3">
        {(data || []).map(acc => (
          <div key={acc.id} className={`glass-card p-4 flex items-start justify-between ${acc.is_primary ? 'border-emerald-500/30' : ''}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center"><Building2 size={18} className="text-blue-400" /></div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-slate-800">{acc.bank_name}</p>
                  {acc.is_primary && <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">Primary</span>}
                </div>
                <p className="text-sm text-slate-500">{acc.account_name}</p>
                <p className="font-mono text-xs text-slate-400 mt-0.5">{acc.account_number}{acc.branch ? ` · ${acc.branch}` : ''}</p>
                <div className="flex gap-3 mt-1">
                  {acc.paybill_number && <span className="text-xs text-slate-400">Paybill: {acc.paybill_number}</span>}
                  {acc.till_number && <span className="text-xs text-slate-400">Till: {acc.till_number}</span>}
                </div>
              </div>
            </div>
          </div>
        ))}
        {(data || []).length === 0 && <div className="text-center py-8 text-slate-400 text-sm">No bank accounts configured</div>}
      </div>
    </div>
  );
}

function UserManagement() {
  const { user: currentUser } = useAuth();
  const { data, refetch } = useQuery({ queryKey: ['users'], queryFn: () => authApi.getUsers().then(r => r.data.data as User[]) });
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'cashier', phone: '' });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try { await authApi.createUser(form); toast.success('User created!'); refetch(); setShowAdd(false); setForm({ name: '', email: '', password: '', role: 'cashier', phone: '' }); }
    catch (err: unknown) { toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to create user'); }
    finally { setSaving(false); }
  };

  const toggleActive = async (id: string, is_active: boolean) => {
    try { await authApi.updateUser(id, { is_active }); refetch(); toast.success(`User ${is_active ? 'activated' : 'deactivated'}`); }
    catch { toast.error('Failed to update user'); }
  };

  const ROLE_COLORS: Record<string, string> = { admin: 'bg-emerald-500/15 text-emerald-400', cashier: 'bg-blue-500/15 text-blue-400', accountant: 'bg-amber-500/15 text-amber-400' };

  return (
    <div className="space-y-4">
      {currentUser?.role === 'admin' && <div className="flex justify-end"><button onClick={() => setShowAdd(v => !v)}  import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Users, Building2, Bell, Key, Plus, X, Shield } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { settingsApi, authApi } from '../services/api';
import { BankAccount, User } from '../types';
import PageHeader from '../components/shared/PageHeader';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import { useAuth } from '../hooks/useAuth';

function GeneralSettings() {
  const { data, isLoading } = useQuery({ queryKey: ['settings'], queryFn: () => settingsApi.get().then(r => r.data.data as Record<string, string>) });
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (data) setForm(data); }, [data]);
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try { await settingsApi.update(form); toast.success('Settings saved!'); }
    catch { toast.error('Failed to save settings'); }
    finally { setSaving(false); }
  };

  if (isLoading) return <LoadingSpinner size="sm" />;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { key: 'business_name', label: 'Business Name', placeholder: 'Karibu Petrol Station' },
          { key: 'business_phone', label: 'Business Phone', placeholder: '0712345678' },
          { key: 'business_email', label: 'Business Email', placeholder: 'info@station.co.ke' },
          { key: 'business_address', label: 'Business Address', placeholder: 'Nairobi, Kenya' },
          { key: 'mpesa_paybill', label: 'M-Pesa Paybill Number', placeholder: '123456' },
          { key: 'credit_grace_days', label: 'Credit Grace Period (Days)', placeholder: '30' },
        ].map(f => (
          <div key={f.key}>
            <label className="label">{f.label}</label>
            <input value={form[f.key] || ''} onChange={e => set(f.key, e.target.value)} className="input-field" placeholder={f.placeholder} />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { key: 'sms_on_sale', label: 'SMS on Sale' },
          { key: 'sms_on_payment', label: 'SMS on Payment' },
          { key: 'low_stock_alerts', label: 'Low Stock Alerts' },
          { key: 'auto_reconcile', label: 'Auto Reconciliation' },
        ].map(f => (
          <div key={f.key} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-sm text-slate-600">{f.label}</span>
            <button onClick={() => set(f.key, form[f.key] === 'true' ? 'false' : 'true')}
              className={`w-10 h-5 rounded-full transition-all relative ${form[f.key] === 'true' ? 'bg-emerald-500' : 'bg-slate-300'}`}>
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${form[f.key] === 'true' ? 'left-5' : 'left-0.5'}`} />
            </button>
          </div>
        ))}
      </div>
      <button onClick={handleSave} disabled={saving} className="btn-primary py-2.5 px-6 flex items-center gap-2">
        {saving && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
        Save Settings
      </button>
    </div>
  );
}

function BankAccounts() {
  const { data, refetch } = useQuery({ queryKey: ['bank-accounts'], queryFn: () => settingsApi.getBankAccounts().then(r => r.data.data as BankAccount[]) });
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ bank_name: '', account_number: '', account_name: '', branch: '', paybill_number: '', till_number: '', account_ref_hint: '', is_primary: false });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try { await settingsApi.createBankAccount(form); toast.success('Bank account added!'); refetch(); setShowAdd(false); }
    catch { toast.error('Failed to add bank account'); } finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end"><button onClick={() => setShowAdd(v => !v)} className="btn-primary text-sm py-2 flex items-center gap-2"><Plus size={14} /> Add Account</button></div>
      {showAdd && (
        <motion.form initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleAdd} className="glass-card p-5 border border-emerald-500/20 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Bank Name *</label><input value={form.bank_name} onChange={e => set('bank_name', e.target.value)} className="input-field" placeholder="Equity Bank" required /></div>
            <div><label className="label">Account Number *</label><input value={form.account_number} onChange={e => set('account_number', e.target.value)} className="input-field" placeholder="1234567890" required /></div>
            <div><label className="label">Account Name *</label><input value={form.account_name} onChange={e => set('account_name', e.target.value)} className="input-field" placeholder="Karibu Petrol Station" required /></div>
            <div><label className="label">Branch</label><input value={form.branch} onChange={e => set('branch', e.target.value)} className="input-field" placeholder="Westlands" /></div>
            <div><label className="label">Paybill Number</label><input value={form.paybill_number} onChange={e => set('paybill_number', e.target.value)} className="input-field" placeholder="123456" /></div>
            <div><label className="label">Till Number</label><input value={form.till_number} onChange={e => set('till_number', e.target.value)} className="input-field" placeholder="789012" /></div>
            <div className="col-span-2"><label className="label">Account Ref Hint (for Paybill payments)</label><input value={form.account_ref_hint} onChange={e => set('account_ref_hint', e.target.value)} className="input-field" placeholder="e.g. Use customer code as account ref" /></div>
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" checked={form.is_primary} onChange={e => set('is_primary', e.target.checked)} id="primary" className="rounded" />
            <label htmlFor="primary" className="text-sm text-slate-600">Set as primary account</label>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary py-2 px-4 text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary py-2 px-6 text-sm flex items-center gap-2">
              {saving && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />} Add Account
            </button>
          </div>
        </motion.form>
      )}
      <div className="space-y-3">
        {(data || []).map(acc => (
          <div key={acc.id} className={`glass-card p-4 flex items-start justify-between ${acc.is_primary ? 'border-emerald-500/30' : ''}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center"><Building2 size={18} className="text-blue-400" /></div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-slate-800">{acc.bank_name}</p>
                  {acc.is_primary && <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">Primary</span>}
                </div>
                <p className="text-sm text-slate-500">{acc.account_name}</p>
                <p className="font-mono text-xs text-slate-400 mt-0.5">{acc.account_number}{acc.branch ? ` · ${acc.branch}` : ''}</p>
                <div className="flex gap-3 mt-1">
                  {acc.paybill_number && <span className="text-xs text-slate-400">Paybill: {acc.paybill_number}</span>}
                  {acc.till_number && <span className="text-xs text-slate-400">Till: {acc.till_number}</span>}
                </div>
              </div>
            </div>
          </div>
        ))}
        {(data || []).length === 0 && <div className="text-center py-8 text-slate-400 text-sm">No bank accounts configured</div>}
      </div>
    </div>
  );
}

function UserManagement() {
  const { user: currentUser } = useAuth();
  const { data, refetch } = useQuery({ queryKey: ['users'], queryFn: () => authApi.getUsers().then(r => r.data.data as User[]) });
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'cashier', phone: '' });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try { await authApi.createUser(form); toast.success('User created!'); refetch(); setShowAdd(false); setForm({ name: '', email: '', password: '', role: 'cashier', phone: '' }); }
    catch (err: unknown) { toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to create user'); }
    finally { setSaving(false); }
  };

  const toggleActive = async (id: string, is_active: boolean) => {
    try { await authApi.updateUser(id, { is_active }); refetch(); toast.success(`User ${is_active ? 'activated' : 'deactivated'}`); }
    catch { toast.error('Failed to update user'); }
  };

  const ROLE_COLORS: Record<string, string> = { admin: 'bg-emerald-500/15 text-emerald-400', cashier: 'bg-blue-500/15 text-blue-400', accountant: 'bg-amber-500/15 text-amber-400' };

  return (
    <div className="space-y-4">
      {currentUser?.role === 'admin' && <div className="flex justify-end"><button onClick={() => setShowAdd(v => !v)} className="btn-primary text-sm py-2 flex items-center gap-2"><Plus size={14} /> Add User</button></div>}
      {showAdd && (
        <motion.form initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleAdd} className="glass-card p-5 border border-emerald-500/20 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><label className="label">Full Name *</label><input value={form.name} onChange={e => set('name', e.target.value)} className="input-field" placeholder="Jane Wanjiku" required /></div>
            <div><label className="label">Email *</label><input type="email" value={form.email} onChange={e => set('email', e.target.value)} className="input-field" placeholder="jane@station.co.ke" required /></div>
            <div><label className="label">Phone</label><input value={form.phone} onChange={e => set('phone', e.target.value)} className="input-field" placeholder="0712345678" /></div>
            <div><label className="label">Password *</label><input type="password" value={form.password} onChange={e => set('password', e.target.value)} className="input-field" placeholder="••••••••" required /></div>
            <div><label className="label">Role *</label>
              <select value={form.role} onChange={e => set('role', e.target.value)} className="input-field">
                <option value="cashier">Cashier</option><option value="accountant">Accountant</option><option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary py-2 px-4 text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary py-2 px-6 text-sm flex items-center gap-2">
              {saving && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />} Create User
            </button>
          </div>
        </motion.form>
      )}
      <div className="space-y-3">
        {(data || []).map(u => (
          <div key={u.id} className="glass-card p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/30 to-emerald-700/30 flex items-center justify-center text-emerald-400 font-bold text-sm">
                {u.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-slate-800 text-sm">{u.name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${ROLE_COLORS[u.role] || ROLE_COLORS.cashier}`}>{u.role}</span>
                  {u.id === currentUser?.id && <span className="text-xs text-slate-400">(You)</span>}
                </div>
                <p className="text-xs text-slate-400">{u.email}{u.phone ? ` · ${u.phone}` : ''}</p>
              </div>
            </div>
            {currentUser?.role === 'admin' && u.id !== currentUser.id && (
              <button onClick={() => toggleActive(u.id, !u.is_active)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${u.is_active ? 'border-slate-400 text-slate-500 hover:border-red-500/50 hover:text-red-400' : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'}`}>
                {u.is_active ? 'Deactivate' : 'Activate'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Settings() {
  const [tab, setTab] = useState<'general' | 'banks' | 'users'>('general');
  const { user } = useAuth();
  useEffect(() => { document.title = 'Settings — FuelFlow Pro'; }, []);

  const TABS = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'banks', label: 'Bank Accounts', icon: Building2 },
    ...(user?.role === 'admin' ? [{ id: 'users', label: 'User Management', icon: Users }] : []),
  ] as const;

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle="System configuration and management" icon={SettingsIcon} />
      <div className="flex gap-1 p-1 bg-white/80 rounded-xl w-fit flex-wrap">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.id ? 'bg-emerald-500 text-white' : 'text-slate-500 hover:text-slate-900'}`}>
            <t.icon size={14} />{t.label}
          </button>
        ))}
      </div>
      <div className="glass-card p-6">
        {tab === 'general' && <GeneralSettings />}
        {tab === 'banks' && <BankAccounts />}
        {tab === 'users' && user?.role === 'admin' && <UserManagement />}
      </div>
    </div>
  );
}


.Value ><Plus size={14} /> Add User</button></div>}
      {showAdd && (
        <motion.form initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleAdd} className="glass-card p-5 border border-emerald-500/20 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><label className="label">Full Name *</label><input value={form.name} onChange={e => set('name', e.target.value)} className="input-field" placeholder="Jane Wanjiku" required /></div>
            <div><label className="label">Email *</label><input type="email" value={form.email} onChange={e => set('email', e.target.value)} className="input-field" placeholder="jane@station.co.ke" required /></div>
            <div><label className="label">Phone</label><input value={form.phone} onChange={e => set('phone', e.target.value)} className="input-field" placeholder="0712345678" /></div>
            <div><label className="label">Password *</label><input type="password" value={form.password} onChange={e => set('password', e.target.value)} className="input-field" placeholder="••••••••" required /></div>
            <div><label className="label">Role *</label>
              <select value={form.role} onChange={e => set('role', e.target.value)} className="input-field">
                <option value="cashier">Cashier</option><option value="accountant">Accountant</option><option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary py-2 px-4 text-sm">Cancel</button>
            <button type="submit" disabled={saving}  import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Users, Building2, Bell, Key, Plus, X, Shield } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { settingsApi, authApi } from '../services/api';
import { BankAccount, User } from '../types';
import PageHeader from '../components/shared/PageHeader';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import { useAuth } from '../hooks/useAuth';

function GeneralSettings() {
  const { data, isLoading } = useQuery({ queryKey: ['settings'], queryFn: () => settingsApi.get().then(r => r.data.data as Record<string, string>) });
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (data) setForm(data); }, [data]);
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try { await settingsApi.update(form); toast.success('Settings saved!'); }
    catch { toast.error('Failed to save settings'); }
    finally { setSaving(false); }
  };

  if (isLoading) return <LoadingSpinner size="sm" />;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { key: 'business_name', label: 'Business Name', placeholder: 'Karibu Petrol Station' },
          { key: 'business_phone', label: 'Business Phone', placeholder: '0712345678' },
          { key: 'business_email', label: 'Business Email', placeholder: 'info@station.co.ke' },
          { key: 'business_address', label: 'Business Address', placeholder: 'Nairobi, Kenya' },
          { key: 'mpesa_paybill', label: 'M-Pesa Paybill Number', placeholder: '123456' },
          { key: 'credit_grace_days', label: 'Credit Grace Period (Days)', placeholder: '30' },
        ].map(f => (
          <div key={f.key}>
            <label className="label">{f.label}</label>
            <input value={form[f.key] || ''} onChange={e => set(f.key, e.target.value)} className="input-field" placeholder={f.placeholder} />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { key: 'sms_on_sale', label: 'SMS on Sale' },
          { key: 'sms_on_payment', label: 'SMS on Payment' },
          { key: 'low_stock_alerts', label: 'Low Stock Alerts' },
          { key: 'auto_reconcile', label: 'Auto Reconciliation' },
        ].map(f => (
          <div key={f.key} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-sm text-slate-600">{f.label}</span>
            <button onClick={() => set(f.key, form[f.key] === 'true' ? 'false' : 'true')}
              className={`w-10 h-5 rounded-full transition-all relative ${form[f.key] === 'true' ? 'bg-emerald-500' : 'bg-slate-300'}`}>
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${form[f.key] === 'true' ? 'left-5' : 'left-0.5'}`} />
            </button>
          </div>
        ))}
      </div>
      <button onClick={handleSave} disabled={saving} className="btn-primary py-2.5 px-6 flex items-center gap-2">
        {saving && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
        Save Settings
      </button>
    </div>
  );
}

function BankAccounts() {
  const { data, refetch } = useQuery({ queryKey: ['bank-accounts'], queryFn: () => settingsApi.getBankAccounts().then(r => r.data.data as BankAccount[]) });
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ bank_name: '', account_number: '', account_name: '', branch: '', paybill_number: '', till_number: '', account_ref_hint: '', is_primary: false });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try { await settingsApi.createBankAccount(form); toast.success('Bank account added!'); refetch(); setShowAdd(false); }
    catch { toast.error('Failed to add bank account'); } finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end"><button onClick={() => setShowAdd(v => !v)} className="btn-primary text-sm py-2 flex items-center gap-2"><Plus size={14} /> Add Account</button></div>
      {showAdd && (
        <motion.form initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleAdd} className="glass-card p-5 border border-emerald-500/20 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Bank Name *</label><input value={form.bank_name} onChange={e => set('bank_name', e.target.value)} className="input-field" placeholder="Equity Bank" required /></div>
            <div><label className="label">Account Number *</label><input value={form.account_number} onChange={e => set('account_number', e.target.value)} className="input-field" placeholder="1234567890" required /></div>
            <div><label className="label">Account Name *</label><input value={form.account_name} onChange={e => set('account_name', e.target.value)} className="input-field" placeholder="Karibu Petrol Station" required /></div>
            <div><label className="label">Branch</label><input value={form.branch} onChange={e => set('branch', e.target.value)} className="input-field" placeholder="Westlands" /></div>
            <div><label className="label">Paybill Number</label><input value={form.paybill_number} onChange={e => set('paybill_number', e.target.value)} className="input-field" placeholder="123456" /></div>
            <div><label className="label">Till Number</label><input value={form.till_number} onChange={e => set('till_number', e.target.value)} className="input-field" placeholder="789012" /></div>
            <div className="col-span-2"><label className="label">Account Ref Hint (for Paybill payments)</label><input value={form.account_ref_hint} onChange={e => set('account_ref_hint', e.target.value)} className="input-field" placeholder="e.g. Use customer code as account ref" /></div>
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" checked={form.is_primary} onChange={e => set('is_primary', e.target.checked)} id="primary" className="rounded" />
            <label htmlFor="primary" className="text-sm text-slate-600">Set as primary account</label>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary py-2 px-4 text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary py-2 px-6 text-sm flex items-center gap-2">
              {saving && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />} Add Account
            </button>
          </div>
        </motion.form>
      )}
      <div className="space-y-3">
        {(data || []).map(acc => (
          <div key={acc.id} className={`glass-card p-4 flex items-start justify-between ${acc.is_primary ? 'border-emerald-500/30' : ''}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center"><Building2 size={18} className="text-blue-400" /></div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-slate-800">{acc.bank_name}</p>
                  {acc.is_primary && <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">Primary</span>}
                </div>
                <p className="text-sm text-slate-500">{acc.account_name}</p>
                <p className="font-mono text-xs text-slate-400 mt-0.5">{acc.account_number}{acc.branch ? ` · ${acc.branch}` : ''}</p>
                <div className="flex gap-3 mt-1">
                  {acc.paybill_number && <span className="text-xs text-slate-400">Paybill: {acc.paybill_number}</span>}
                  {acc.till_number && <span className="text-xs text-slate-400">Till: {acc.till_number}</span>}
                </div>
              </div>
            </div>
          </div>
        ))}
        {(data || []).length === 0 && <div className="text-center py-8 text-slate-400 text-sm">No bank accounts configured</div>}
      </div>
    </div>
  );
}

function UserManagement() {
  const { user: currentUser } = useAuth();
  const { data, refetch } = useQuery({ queryKey: ['users'], queryFn: () => authApi.getUsers().then(r => r.data.data as User[]) });
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'cashier', phone: '' });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try { await authApi.createUser(form); toast.success('User created!'); refetch(); setShowAdd(false); setForm({ name: '', email: '', password: '', role: 'cashier', phone: '' }); }
    catch (err: unknown) { toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to create user'); }
    finally { setSaving(false); }
  };

  const toggleActive = async (id: string, is_active: boolean) => {
    try { await authApi.updateUser(id, { is_active }); refetch(); toast.success(`User ${is_active ? 'activated' : 'deactivated'}`); }
    catch { toast.error('Failed to update user'); }
  };

  const ROLE_COLORS: Record<string, string> = { admin: 'bg-emerald-500/15 text-emerald-400', cashier: 'bg-blue-500/15 text-blue-400', accountant: 'bg-amber-500/15 text-amber-400' };

  return (
    <div className="space-y-4">
      {currentUser?.role === 'admin' && <div className="flex justify-end"><button onClick={() => setShowAdd(v => !v)} className="btn-primary text-sm py-2 flex items-center gap-2"><Plus size={14} /> Add User</button></div>}
      {showAdd && (
        <motion.form initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleAdd} className="glass-card p-5 border border-emerald-500/20 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><label className="label">Full Name *</label><input value={form.name} onChange={e => set('name', e.target.value)} className="input-field" placeholder="Jane Wanjiku" required /></div>
            <div><label className="label">Email *</label><input type="email" value={form.email} onChange={e => set('email', e.target.value)} className="input-field" placeholder="jane@station.co.ke" required /></div>
            <div><label className="label">Phone</label><input value={form.phone} onChange={e => set('phone', e.target.value)} className="input-field" placeholder="0712345678" /></div>
            <div><label className="label">Password *</label><input type="password" value={form.password} onChange={e => set('password', e.target.value)} className="input-field" placeholder="••••••••" required /></div>
            <div><label className="label">Role *</label>
              <select value={form.role} onChange={e => set('role', e.target.value)} className="input-field">
                <option value="cashier">Cashier</option><option value="accountant">Accountant</option><option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary py-2 px-4 text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary py-2 px-6 text-sm flex items-center gap-2">
              {saving && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />} Create User
            </button>
          </div>
        </motion.form>
      )}
      <div className="space-y-3">
        {(data || []).map(u => (
          <div key={u.id} className="glass-card p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/30 to-emerald-700/30 flex items-center justify-center text-emerald-400 font-bold text-sm">
                {u.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-slate-800 text-sm">{u.name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${ROLE_COLORS[u.role] || ROLE_COLORS.cashier}`}>{u.role}</span>
                  {u.id === currentUser?.id && <span className="text-xs text-slate-400">(You)</span>}
                </div>
                <p className="text-xs text-slate-400">{u.email}{u.phone ? ` · ${u.phone}` : ''}</p>
              </div>
            </div>
            {currentUser?.role === 'admin' && u.id !== currentUser.id && (
              <button onClick={() => toggleActive(u.id, !u.is_active)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${u.is_active ? 'border-slate-400 text-slate-500 hover:border-red-500/50 hover:text-red-400' : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'}`}>
                {u.is_active ? 'Deactivate' : 'Activate'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Settings() {
  const [tab, setTab] = useState<'general' | 'banks' | 'users'>('general');
  const { user } = useAuth();
  useEffect(() => { document.title = 'Settings — FuelFlow Pro'; }, []);

  const TABS = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'banks', label: 'Bank Accounts', icon: Building2 },
    ...(user?.role === 'admin' ? [{ id: 'users', label: 'User Management', icon: Users }] : []),
  ] as const;

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle="System configuration and management" icon={SettingsIcon} />
      <div className="flex gap-1 p-1 bg-white/80 rounded-xl w-fit flex-wrap">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.id ? 'bg-emerald-500 text-white' : 'text-slate-500 hover:text-slate-900'}`}>
            <t.icon size={14} />{t.label}
          </button>
        ))}
      </div>
      <div className="glass-card p-6">
        {tab === 'general' && <GeneralSettings />}
        {tab === 'banks' && <BankAccounts />}
        {tab === 'users' && user?.role === 'admin' && <UserManagement />}
      </div>
    </div>
  );
}


.Value >
              {saving && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />} Create User
            </button>
          </div>
        </motion.form>
      )}
      <div className="space-y-3">
        {(data || []).map(u => (
          <div key={u.id} className="glass-card p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/30 to-emerald-700/30 flex items-center justify-center text-emerald-400 font-bold text-sm">
                {u.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-slate-800 text-sm">{u.name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${ROLE_COLORS[u.role] || ROLE_COLORS.cashier}`}>{u.role}</span>
                  {u.id === currentUser?.id && <span className="text-xs text-slate-400">(You)</span>}
                </div>
                <p className="text-xs text-slate-400">{u.email}{u.phone ? ` · ${u.phone}` : ''}</p>
              </div>
            </div>
            {currentUser?.role === 'admin' && u.id !== currentUser.id && (
              <button onClick={() => toggleActive(u.id, !u.is_active)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${u.is_active ? 'border-slate-400 text-slate-500 hover:border-red-500/50 hover:text-red-400' : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'}`}>
                {u.is_active ? 'Deactivate' : 'Activate'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Settings() {
  const [tab, setTab] = useState<'general' | 'banks' | 'users'>('general');
  const { user } = useAuth();
  useEffect(() => { document.title = 'Settings — FuelFlow Pro'; }, []);

  const TABS = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'banks', label: 'Bank Accounts', icon: Building2 },
    ...(user?.role === 'admin' ? [{ id: 'users', label: 'User Management', icon: Users }] : []),
  ] as const;

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle="System configuration and management" icon={SettingsIcon} />
      <div className="flex gap-1 p-1 bg-white/80 rounded-xl w-fit flex-wrap">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.id ? 'bg-emerald-500 text-white' : 'text-slate-500 hover:text-slate-900'}`}>
            <t.icon size={14} />{t.label}
          </button>
        ))}
      </div>
      <div className="glass-card p-6">
        {tab === 'general' && <GeneralSettings />}
        {tab === 'banks' && <BankAccounts />}
        {tab === 'users' && user?.role === 'admin' && <UserManagement />}
      </div>
    </div>
  );
}



