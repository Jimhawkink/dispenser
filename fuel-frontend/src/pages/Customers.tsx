import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Plus, Search, Phone, Building2, CreditCard,
  ChevronRight, CheckCircle2, Smartphone, Landmark, Banknote, Wallet
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { customersApi } from '../services/api';
import { Customer } from '../types';
import PageHeader from '../components/shared/PageHeader';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import ConfirmModal from '../components/shared/ConfirmModal';

// ── Payment method config ─────────────────────────────────────────────────────
const PAYMENT_METHODS = [
  {
    id: 'mpesa',
    label: 'M-Pesa (STK / Paybill)',
    icon: Smartphone,
    desc: 'STK Push or Paybill payments. Auto-matched by phone number or customer code.',
    autoSync: true,
    bgClass: 'bg-emerald-50 border-emerald-200',
    activeClass: 'ring-2 ring-emerald-500 bg-emerald-50 border-emerald-400',
    iconClass: 'text-emerald-600 bg-emerald-100',
  },
  {
    id: 'pesalink',
    label: 'PesaLink / IntaSend',
    icon: CreditCard,
    desc: 'Inter-bank transfers via PesaLink. Auto-matched by account reference.',
    autoSync: true,
    bgClass: 'bg-blue-50 border-blue-200',
    activeClass: 'ring-2 ring-blue-500 bg-blue-50 border-blue-400',
    iconClass: 'text-blue-600 bg-blue-100',
  },
  {
    id: 'bank_transfer',
    label: 'Bank Transfer / Equity Jenga',
    icon: Landmark,
    desc: 'Direct bank transfers & Equity Jenga IPN. Matched by account reference.',
    autoSync: true,
    bgClass: 'bg-indigo-50 border-indigo-200',
    activeClass: 'ring-2 ring-indigo-500 bg-indigo-50 border-indigo-400',
    iconClass: 'text-indigo-600 bg-indigo-100',
  },
  {
    id: 'bank_deposit',
    label: 'Cash Deposit to Bank / Agent',
    icon: Banknote,
    desc: 'Customer deposits cash at bank branch or M-Pesa agent. Cashier confirms on receipt of bank slip.',
    autoSync: false,
    bgClass: 'bg-orange-50 border-orange-200',
    activeClass: 'ring-2 ring-orange-500 bg-orange-50 border-orange-400',
    iconClass: 'text-orange-600 bg-orange-100',
  },
  {
    id: 'cash',
    label: 'Cash (On-Site)',
    icon: Wallet,
    desc: 'Physical cash paid at station. Cashier enters manually. Instant reconciliation.',
    autoSync: false,
    bgClass: 'bg-amber-50 border-amber-200',
    activeClass: 'ring-2 ring-amber-500 bg-amber-50 border-amber-400',
    iconClass: 'text-amber-600 bg-amber-100',
  },
];

// ── Blank form ────────────────────────────────────────────────────────────────
const BLANK = {
  name: '', phone: '', alt_phone: '', email: '',
  company_name: '', vehicle_plates: '',
  credit_limit: 50000, payment_preference: 'mpesa',
  address: '', notes: '', is_active: true,
};

// ── Customer card ─────────────────────────────────────────────────────────────
function CustomerCard({ c, onClick }: { c: Customer; onClick: () => void }) {
  const balance = c.current_balance ?? 0;
  const pct = c.credit_limit > 0 ? Math.min((balance / c.credit_limit) * 100, 100) : 0;
  const barColor = pct > 80 ? '#ef4444' : pct > 50 ? '#f59e0b' : '#10b981';
  const method = PAYMENT_METHODS.find(m => m.id === c.payment_preference) || PAYMENT_METHODS[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      onClick={onClick}
      className="glass-card p-5 cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {c.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-slate-800 text-sm">{c.name}</p>
            <p className="text-xs text-slate-400">{c.customer_code}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${method.bgClass}`}>
            <method.icon size={10} className={method.iconClass.split(' ')[0]} />
            <span className="text-slate-600">{method.label.split(' ')[0]}</span>
          </div>
          <ChevronRight size={14} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
        </div>
      </div>

      {c.company_name && (
        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
          <Building2 size={11} /><span>{c.company_name}</span>
        </div>
      )}
      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
        <Phone size={11} /><span>{c.phone}</span>
      </div>

      {balance > 0 && (
        <div className="mt-2 space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Credit Used</span>
            <span className={`font-semibold num ${pct > 80 ? 'text-red-500' : 'text-slate-700'}`}>
              KES {balance.toLocaleString()} / {c.credit_limit.toLocaleString()}
            </span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: barColor }} />
          </div>
        </div>
      )}

      {!c.is_active && (
        <div className="mt-2 text-xs text-slate-400 italic">Inactive account</div>
      )}
    </motion.div>
  );
}

// ── Add/Edit Customer Modal ───────────────────────────────────────────────────
function CustomerModal({ customer, onClose }: { customer?: Customer; onClose: () => void }) {
  const qc = useQueryClient();
  const isEdit = !!customer;
  const [form, setForm] = useState(
    isEdit ? {
      name: customer.name, phone: customer.phone, alt_phone: customer.alt_phone || '',
      email: customer.email || '', company_name: customer.company_name || '',
      vehicle_plates: (customer.vehicle_plates || []).join(', '),
      credit_limit: customer.credit_limit, payment_preference: customer.payment_preference,
      address: customer.address || '', notes: customer.notes || '', is_active: customer.is_active,
    } : BLANK
  );
  const [step, setStep] = useState(0);

  const set = (k: string, v: string | number | boolean) => setForm(f => ({ ...f, [k]: v }));

  const mutation = useMutation({
    mutationFn: (data: typeof form) => {
      const payload = {
        ...data,
        vehicle_plates: data.vehicle_plates ? data.vehicle_plates.split(',').map(s => s.trim()).filter(Boolean) : [],
      };
      return isEdit ? customersApi.update(customer.id, payload) : customersApi.create(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      toast.success(isEdit ? 'Customer updated!' : 'Customer created!');
      onClose();
    },
    onError: (err: unknown) => toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to save customer'),
  });

  const selectedMethod = PAYMENT_METHODS.find(m => m.id === form.payment_preference)!;

  const steps = [
    { label: 'Basic Info', icon: Users },
    { label: 'Payment Method', icon: CreditCard },
    { label: 'Credit & Notes', icon: Wallet },
  ];

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100">
          <h2 className="font-heading font-bold text-slate-800 text-lg">{isEdit ? 'Edit Customer' : 'Add New Customer'}</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {isEdit ? `Editing ${customer.name}` : 'Fill in customer details and preferred payment channel'}
          </p>
          {/* Step indicator */}
          <div className="flex items-center gap-2 mt-4">
            {steps.map((s, i) => (
              <button key={i} onClick={() => setStep(i)} className="flex items-center gap-1.5">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${i === step ? 'bg-emerald-500 text-white' : i < step ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                  {i < step ? <CheckCircle2 size={14} /> : i + 1}
                </div>
                <span className={`text-xs hidden sm:block ${i === step ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>{s.label}</span>
                {i < steps.length - 1 && <div className={`h-px w-8 ${i < step ? 'bg-emerald-300' : 'bg-slate-200'}`} />}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
          <AnimatePresence mode="wait">
            {/* ── Step 0: Basic Info ── */}
            {step === 0 && (
              <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="label">Full Name *</label>
                    <input value={form.name} onChange={e => set('name', e.target.value)} className="input-field" placeholder="John Kamau" />
                  </div>
                  <div>
                    <label className="label">Phone Number *</label>
                    <input value={form.phone} onChange={e => set('phone', e.target.value)} className="input-field" placeholder="0712345678" />
                    <p className="text-xs text-slate-400 mt-1">Used for M-Pesa auto-match</p>
                  </div>
                  <div>
                    <label className="label">Alt. Phone</label>
                    <input value={form.alt_phone} onChange={e => set('alt_phone', e.target.value)} className="input-field" placeholder="0700000000" />
                  </div>
                  <div>
                    <label className="label">Email</label>
                    <input type="email" value={form.email} onChange={e => set('email', e.target.value)} className="input-field" placeholder="john@company.co.ke" />
                  </div>
                  <div>
                    <label className="label">Company Name</label>
                    <input value={form.company_name} onChange={e => set('company_name', e.target.value)} className="input-field" placeholder="ABC Transport Ltd" />
                  </div>
                  <div className="col-span-2">
                    <label className="label">Vehicle Plates (comma-separated)</label>
                    <input value={form.vehicle_plates} onChange={e => set('vehicle_plates', e.target.value)} className="input-field" placeholder="KBZ 123A, KCA 456B" />
                    <p className="text-xs text-slate-400 mt-1">Used for vehicle-based credit tracking</p>
                  </div>
                  <div className="col-span-2">
                    <label className="label">Address</label>
                    <input value={form.address} onChange={e => set('address', e.target.value)} className="input-field" placeholder="Nairobi, Westlands" />
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Step 1: Payment Method ── */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
                <p className="text-sm text-slate-600 mb-4">
                  Select how this customer usually pays. This is used for <strong>auto-reconciliation</strong> — incoming payments are automatically matched to this customer.
                </p>
                <div className="space-y-3">
                  {PAYMENT_METHODS.map(method => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => set('payment_preference', method.id)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${form.payment_preference === method.id ? method.activeClass : 'border-slate-200 hover:border-slate-300 bg-white'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${method.iconClass}`}>
                          <method.icon size={20} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-800 text-sm">{method.label}</span>
                            {method.autoSync && (
                              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Auto-sync ✓</span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{method.desc}</p>
                        </div>
                        {form.payment_preference === method.id && (
                          <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Auto-sync explainer */}
                <div className="mt-4 p-4 rounded-xl bg-blue-50 border border-blue-200">
                  <p className="text-xs font-semibold text-blue-700 mb-1">🔄 How Auto-Sync Works</p>
                  <p className="text-xs text-blue-600">
                    When a payment arrives via webhook (M-Pesa, PesaLink, Equity), the system matches it to this customer using their <strong>phone number</strong> or <strong>customer code</strong> as the Paybill reference. Matched payments are auto-posted to their credit ledger and the oldest outstanding sale is settled automatically.
                  </p>
                </div>
              </motion.div>
            )}

            {/* ── Step 2: Credit & Notes ── */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
                <div>
                  <label className="label">Credit Limit (KES)</label>
                  <input type="number" value={form.credit_limit} onChange={e => set('credit_limit', Number(e.target.value))} className="input-field" placeholder="50000" />
                  <p className="text-xs text-slate-400 mt-1">Maximum outstanding balance allowed. Set 0 to disable credit.</p>
                </div>

                <div>
                  <label className="label">Internal Notes</label>
                  <textarea value={form.notes} onChange={e => set('notes', e.target.value)} className="input-field resize-none" rows={3} placeholder="Any special instructions, delivery preferences, etc." />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <p className="text-sm font-medium text-slate-700">Active Account</p>
                    <p className="text-xs text-slate-400">Inactive customers cannot make sales or payments</p>
                  </div>
                  <button onClick={() => set('is_active', !form.is_active)}
                    className={`w-11 h-6 rounded-full transition-all relative ${form.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${form.is_active ? 'left-5' : 'left-0.5'}`} />
                  </button>
                </div>

                {/* Summary */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Summary</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                    <span className="text-slate-500">Name</span><span className="font-medium text-slate-700">{form.name || '—'}</span>
                    <span className="text-slate-500">Phone</span><span className="font-medium text-slate-700">{form.phone || '—'}</span>
                    <span className="text-slate-500">Payment</span>
                    <span className="font-medium text-slate-700">
                      {PAYMENT_METHODS.find(m => m.id === form.payment_preference)?.label}
                    </span>
                    <span className="text-slate-500">Credit Limit</span><span className="font-medium text-slate-700">KES {form.credit_limit.toLocaleString()}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
          <button onClick={step === 0 ? onClose : () => setStep(s => s - 1)} className="btn-secondary py-2 px-5 text-sm">
            {step === 0 ? 'Cancel' : '← Back'}
          </button>
          {step < 2 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={step === 0 && !form.name}
               import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Plus, Search, Phone, Building2, CreditCard,
  ChevronRight, CheckCircle2, Smartphone, Landmark, Banknote, Wallet
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { customersApi } from '../services/api';
import { Customer } from '../types';
import PageHeader from '../components/shared/PageHeader';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import ConfirmModal from '../components/shared/ConfirmModal';

// ── Payment method config ─────────────────────────────────────────────────────
const PAYMENT_METHODS = [
  {
    id: 'mpesa',
    label: 'M-Pesa (STK / Paybill)',
    icon: Smartphone,
    desc: 'STK Push or Paybill payments. Auto-matched by phone number or customer code.',
    autoSync: true,
    bgClass: 'bg-emerald-50 border-emerald-200',
    activeClass: 'ring-2 ring-emerald-500 bg-emerald-50 border-emerald-400',
    iconClass: 'text-emerald-600 bg-emerald-100',
  },
  {
    id: 'pesalink',
    label: 'PesaLink / IntaSend',
    icon: CreditCard,
    desc: 'Inter-bank transfers via PesaLink. Auto-matched by account reference.',
    autoSync: true,
    bgClass: 'bg-blue-50 border-blue-200',
    activeClass: 'ring-2 ring-blue-500 bg-blue-50 border-blue-400',
    iconClass: 'text-blue-600 bg-blue-100',
  },
  {
    id: 'bank_transfer',
    label: 'Bank Transfer / Equity Jenga',
    icon: Landmark,
    desc: 'Direct bank transfers & Equity Jenga IPN. Matched by account reference.',
    autoSync: true,
    bgClass: 'bg-indigo-50 border-indigo-200',
    activeClass: 'ring-2 ring-indigo-500 bg-indigo-50 border-indigo-400',
    iconClass: 'text-indigo-600 bg-indigo-100',
  },
  {
    id: 'bank_deposit',
    label: 'Cash Deposit to Bank / Agent',
    icon: Banknote,
    desc: 'Customer deposits cash at bank branch or M-Pesa agent. Cashier confirms on receipt of bank slip.',
    autoSync: false,
    bgClass: 'bg-orange-50 border-orange-200',
    activeClass: 'ring-2 ring-orange-500 bg-orange-50 border-orange-400',
    iconClass: 'text-orange-600 bg-orange-100',
  },
  {
    id: 'cash',
    label: 'Cash (On-Site)',
    icon: Wallet,
    desc: 'Physical cash paid at station. Cashier enters manually. Instant reconciliation.',
    autoSync: false,
    bgClass: 'bg-amber-50 border-amber-200',
    activeClass: 'ring-2 ring-amber-500 bg-amber-50 border-amber-400',
    iconClass: 'text-amber-600 bg-amber-100',
  },
];

// ── Blank form ────────────────────────────────────────────────────────────────
const BLANK = {
  name: '', phone: '', alt_phone: '', email: '',
  company_name: '', vehicle_plates: '',
  credit_limit: 50000, payment_preference: 'mpesa',
  address: '', notes: '', is_active: true,
};

// ── Customer card ─────────────────────────────────────────────────────────────
function CustomerCard({ c, onClick }: { c: Customer; onClick: () => void }) {
  const balance = c.current_balance ?? 0;
  const pct = c.credit_limit > 0 ? Math.min((balance / c.credit_limit) * 100, 100) : 0;
  const barColor = pct > 80 ? '#ef4444' : pct > 50 ? '#f59e0b' : '#10b981';
  const method = PAYMENT_METHODS.find(m => m.id === c.payment_preference) || PAYMENT_METHODS[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      onClick={onClick}
      className="glass-card p-5 cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {c.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-slate-800 text-sm">{c.name}</p>
            <p className="text-xs text-slate-400">{c.customer_code}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${method.bgClass}`}>
            <method.icon size={10} className={method.iconClass.split(' ')[0]} />
            <span className="text-slate-600">{method.label.split(' ')[0]}</span>
          </div>
          <ChevronRight size={14} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
        </div>
      </div>

      {c.company_name && (
        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
          <Building2 size={11} /><span>{c.company_name}</span>
        </div>
      )}
      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
        <Phone size={11} /><span>{c.phone}</span>
      </div>

      {balance > 0 && (
        <div className="mt-2 space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Credit Used</span>
            <span className={`font-semibold num ${pct > 80 ? 'text-red-500' : 'text-slate-700'}`}>
              KES {balance.toLocaleString()} / {c.credit_limit.toLocaleString()}
            </span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: barColor }} />
          </div>
        </div>
      )}

      {!c.is_active && (
        <div className="mt-2 text-xs text-slate-400 italic">Inactive account</div>
      )}
    </motion.div>
  );
}

// ── Add/Edit Customer Modal ───────────────────────────────────────────────────
function CustomerModal({ customer, onClose }: { customer?: Customer; onClose: () => void }) {
  const qc = useQueryClient();
  const isEdit = !!customer;
  const [form, setForm] = useState(
    isEdit ? {
      name: customer.name, phone: customer.phone, alt_phone: customer.alt_phone || '',
      email: customer.email || '', company_name: customer.company_name || '',
      vehicle_plates: (customer.vehicle_plates || []).join(', '),
      credit_limit: customer.credit_limit, payment_preference: customer.payment_preference,
      address: customer.address || '', notes: customer.notes || '', is_active: customer.is_active,
    } : BLANK
  );
  const [step, setStep] = useState(0);

  const set = (k: string, v: string | number | boolean) => setForm(f => ({ ...f, [k]: v }));

  const mutation = useMutation({
    mutationFn: (data: typeof form) => {
      const payload = {
        ...data,
        vehicle_plates: data.vehicle_plates ? data.vehicle_plates.split(',').map(s => s.trim()).filter(Boolean) : [],
      };
      return isEdit ? customersApi.update(customer.id, payload) : customersApi.create(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      toast.success(isEdit ? 'Customer updated!' : 'Customer created!');
      onClose();
    },
    onError: (err: unknown) => toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to save customer'),
  });

  const selectedMethod = PAYMENT_METHODS.find(m => m.id === form.payment_preference)!;

  const steps = [
    { label: 'Basic Info', icon: Users },
    { label: 'Payment Method', icon: CreditCard },
    { label: 'Credit & Notes', icon: Wallet },
  ];

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100">
          <h2 className="font-heading font-bold text-slate-800 text-lg">{isEdit ? 'Edit Customer' : 'Add New Customer'}</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {isEdit ? `Editing ${customer.name}` : 'Fill in customer details and preferred payment channel'}
          </p>
          {/* Step indicator */}
          <div className="flex items-center gap-2 mt-4">
            {steps.map((s, i) => (
              <button key={i} onClick={() => setStep(i)} className="flex items-center gap-1.5">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${i === step ? 'bg-emerald-500 text-white' : i < step ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                  {i < step ? <CheckCircle2 size={14} /> : i + 1}
                </div>
                <span className={`text-xs hidden sm:block ${i === step ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>{s.label}</span>
                {i < steps.length - 1 && <div className={`h-px w-8 ${i < step ? 'bg-emerald-300' : 'bg-slate-200'}`} />}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
          <AnimatePresence mode="wait">
            {/* ── Step 0: Basic Info ── */}
            {step === 0 && (
              <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="label">Full Name *</label>
                    <input value={form.name} onChange={e => set('name', e.target.value)} className="input-field" placeholder="John Kamau" />
                  </div>
                  <div>
                    <label className="label">Phone Number *</label>
                    <input value={form.phone} onChange={e => set('phone', e.target.value)} className="input-field" placeholder="0712345678" />
                    <p className="text-xs text-slate-400 mt-1">Used for M-Pesa auto-match</p>
                  </div>
                  <div>
                    <label className="label">Alt. Phone</label>
                    <input value={form.alt_phone} onChange={e => set('alt_phone', e.target.value)} className="input-field" placeholder="0700000000" />
                  </div>
                  <div>
                    <label className="label">Email</label>
                    <input type="email" value={form.email} onChange={e => set('email', e.target.value)} className="input-field" placeholder="john@company.co.ke" />
                  </div>
                  <div>
                    <label className="label">Company Name</label>
                    <input value={form.company_name} onChange={e => set('company_name', e.target.value)} className="input-field" placeholder="ABC Transport Ltd" />
                  </div>
                  <div className="col-span-2">
                    <label className="label">Vehicle Plates (comma-separated)</label>
                    <input value={form.vehicle_plates} onChange={e => set('vehicle_plates', e.target.value)} className="input-field" placeholder="KBZ 123A, KCA 456B" />
                    <p className="text-xs text-slate-400 mt-1">Used for vehicle-based credit tracking</p>
                  </div>
                  <div className="col-span-2">
                    <label className="label">Address</label>
                    <input value={form.address} onChange={e => set('address', e.target.value)} className="input-field" placeholder="Nairobi, Westlands" />
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Step 1: Payment Method ── */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
                <p className="text-sm text-slate-600 mb-4">
                  Select how this customer usually pays. This is used for <strong>auto-reconciliation</strong> — incoming payments are automatically matched to this customer.
                </p>
                <div className="space-y-3">
                  {PAYMENT_METHODS.map(method => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => set('payment_preference', method.id)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${form.payment_preference === method.id ? method.activeClass : 'border-slate-200 hover:border-slate-300 bg-white'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${method.iconClass}`}>
                          <method.icon size={20} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-800 text-sm">{method.label}</span>
                            {method.autoSync && (
                              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Auto-sync ✓</span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{method.desc}</p>
                        </div>
                        {form.payment_preference === method.id && (
                          <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Auto-sync explainer */}
                <div className="mt-4 p-4 rounded-xl bg-blue-50 border border-blue-200">
                  <p className="text-xs font-semibold text-blue-700 mb-1">🔄 How Auto-Sync Works</p>
                  <p className="text-xs text-blue-600">
                    When a payment arrives via webhook (M-Pesa, PesaLink, Equity), the system matches it to this customer using their <strong>phone number</strong> or <strong>customer code</strong> as the Paybill reference. Matched payments are auto-posted to their credit ledger and the oldest outstanding sale is settled automatically.
                  </p>
                </div>
              </motion.div>
            )}

            {/* ── Step 2: Credit & Notes ── */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
                <div>
                  <label className="label">Credit Limit (KES)</label>
                  <input type="number" value={form.credit_limit} onChange={e => set('credit_limit', Number(e.target.value))} className="input-field" placeholder="50000" />
                  <p className="text-xs text-slate-400 mt-1">Maximum outstanding balance allowed. Set 0 to disable credit.</p>
                </div>

                <div>
                  <label className="label">Internal Notes</label>
                  <textarea value={form.notes} onChange={e => set('notes', e.target.value)} className="input-field resize-none" rows={3} placeholder="Any special instructions, delivery preferences, etc." />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <p className="text-sm font-medium text-slate-700">Active Account</p>
                    <p className="text-xs text-slate-400">Inactive customers cannot make sales or payments</p>
                  </div>
                  <button onClick={() => set('is_active', !form.is_active)}
                    className={`w-11 h-6 rounded-full transition-all relative ${form.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${form.is_active ? 'left-5' : 'left-0.5'}`} />
                  </button>
                </div>

                {/* Summary */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Summary</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                    <span className="text-slate-500">Name</span><span className="font-medium text-slate-700">{form.name || '—'}</span>
                    <span className="text-slate-500">Phone</span><span className="font-medium text-slate-700">{form.phone || '—'}</span>
                    <span className="text-slate-500">Payment</span>
                    <span className="font-medium text-slate-700">
                      {PAYMENT_METHODS.find(m => m.id === form.payment_preference)?.label}
                    </span>
                    <span className="text-slate-500">Credit Limit</span><span className="font-medium text-slate-700">KES {form.credit_limit.toLocaleString()}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
          <button onClick={step === 0 ? onClose : () => setStep(s => s - 1)} className="btn-secondary py-2 px-5 text-sm">
            {step === 0 ? 'Cancel' : '← Back'}
          </button>
          {step < 2 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={step === 0 && !form.name}
              className="btn-primary py-2 px-5 text-sm"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={() => mutation.mutate(form)}
              disabled={mutation.isPending || !form.name || !form.phone}
              className="btn-primary py-2 px-5 text-sm flex items-center gap-2"
            >
              {mutation.isPending && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {isEdit ? 'Save Changes' : 'Create Customer'}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Customers() {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<Customer | undefined>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => { document.title = 'Customers — FuelFlow Pro'; }, []);

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers', search],
    queryFn: () => customersApi.list({ search }).then(r => r.data.data as Customer[]),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => customersApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['customers'] }); toast.success('Customer removed'); setDeleteTarget(undefined); },
    onError: () => toast.error('Cannot delete — customer has existing transactions'),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        subtitle={`${customers.length} registered customers`}
        icon={Users}
        actions={
          <button onClick={() => { setEditCustomer(undefined); setShowModal(true); }} className="btn-primary text-sm py-2 flex items-center gap-2">
            <Plus size={14} /> Add Customer
          </button>
        }
      />

      {/* Search */}
      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 max-w-sm shadow-sm">
        <Search size={16} className="text-slate-400" />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          className="bg-transparent text-slate-700 text-sm outline-none flex-1 placeholder:text-slate-400"
          placeholder="Search name, phone, company..."
        />
      </div>

      {/* Payment method filter pills */}
      <div className="flex gap-2 flex-wrap">
        {PAYMENT_METHODS.map(m => {
          const count = customers.filter(c => c.payment_preference === m.id).length;
          return count > 0 ? (
            <div key={m.id} className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border ${m.bgClass}`}>
              <m.icon size={11} /><span className="font-medium">{m.label.split(' ')[0]}</span>
              <span className="bg-white rounded-full px-1.5 py-0.5 text-slate-600 font-bold">{count}</span>
            </div>
          ) : null;
        })}
      </div>

      {isLoading ? <LoadingSpinner /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {customers.map((c, i) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <CustomerCard
                c={c}
                onClick={() => navigate(`/customers/${c.id}`)}
              />
            </motion.div>
          ))}
          {customers.length === 0 && (
            <div className="col-span-3 text-center py-16 text-slate-400">
              <Users size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No customers found. Add your first customer!</p>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <CustomerModal customer={editCustomer} onClose={() => setShowModal(false)} />
        )}
      </AnimatePresence>

      {/* Delete confirm */}
      {deleteTarget && (
        <ConfirmModal
          title="Remove Customer"
          message={`Remove ${deleteTarget.name}? This cannot be undone if they have no transactions.`}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          onCancel={() => setDeleteTarget(undefined)}
          isLoading={deleteMutation.isPending}
          confirmLabel="Remove"
          isDanger
        />
      )}
    </div>
  );
}

.Value 
            >
              Next →
            </button>
          ) : (
            <button
              onClick={() => mutation.mutate(form)}
              disabled={mutation.isPending || !form.name || !form.phone}
               import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Plus, Search, Phone, Building2, CreditCard,
  ChevronRight, CheckCircle2, Smartphone, Landmark, Banknote, Wallet
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { customersApi } from '../services/api';
import { Customer } from '../types';
import PageHeader from '../components/shared/PageHeader';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import ConfirmModal from '../components/shared/ConfirmModal';

// ── Payment method config ─────────────────────────────────────────────────────
const PAYMENT_METHODS = [
  {
    id: 'mpesa',
    label: 'M-Pesa (STK / Paybill)',
    icon: Smartphone,
    desc: 'STK Push or Paybill payments. Auto-matched by phone number or customer code.',
    autoSync: true,
    bgClass: 'bg-emerald-50 border-emerald-200',
    activeClass: 'ring-2 ring-emerald-500 bg-emerald-50 border-emerald-400',
    iconClass: 'text-emerald-600 bg-emerald-100',
  },
  {
    id: 'pesalink',
    label: 'PesaLink / IntaSend',
    icon: CreditCard,
    desc: 'Inter-bank transfers via PesaLink. Auto-matched by account reference.',
    autoSync: true,
    bgClass: 'bg-blue-50 border-blue-200',
    activeClass: 'ring-2 ring-blue-500 bg-blue-50 border-blue-400',
    iconClass: 'text-blue-600 bg-blue-100',
  },
  {
    id: 'bank_transfer',
    label: 'Bank Transfer / Equity Jenga',
    icon: Landmark,
    desc: 'Direct bank transfers & Equity Jenga IPN. Matched by account reference.',
    autoSync: true,
    bgClass: 'bg-indigo-50 border-indigo-200',
    activeClass: 'ring-2 ring-indigo-500 bg-indigo-50 border-indigo-400',
    iconClass: 'text-indigo-600 bg-indigo-100',
  },
  {
    id: 'bank_deposit',
    label: 'Cash Deposit to Bank / Agent',
    icon: Banknote,
    desc: 'Customer deposits cash at bank branch or M-Pesa agent. Cashier confirms on receipt of bank slip.',
    autoSync: false,
    bgClass: 'bg-orange-50 border-orange-200',
    activeClass: 'ring-2 ring-orange-500 bg-orange-50 border-orange-400',
    iconClass: 'text-orange-600 bg-orange-100',
  },
  {
    id: 'cash',
    label: 'Cash (On-Site)',
    icon: Wallet,
    desc: 'Physical cash paid at station. Cashier enters manually. Instant reconciliation.',
    autoSync: false,
    bgClass: 'bg-amber-50 border-amber-200',
    activeClass: 'ring-2 ring-amber-500 bg-amber-50 border-amber-400',
    iconClass: 'text-amber-600 bg-amber-100',
  },
];

// ── Blank form ────────────────────────────────────────────────────────────────
const BLANK = {
  name: '', phone: '', alt_phone: '', email: '',
  company_name: '', vehicle_plates: '',
  credit_limit: 50000, payment_preference: 'mpesa',
  address: '', notes: '', is_active: true,
};

// ── Customer card ─────────────────────────────────────────────────────────────
function CustomerCard({ c, onClick }: { c: Customer; onClick: () => void }) {
  const balance = c.current_balance ?? 0;
  const pct = c.credit_limit > 0 ? Math.min((balance / c.credit_limit) * 100, 100) : 0;
  const barColor = pct > 80 ? '#ef4444' : pct > 50 ? '#f59e0b' : '#10b981';
  const method = PAYMENT_METHODS.find(m => m.id === c.payment_preference) || PAYMENT_METHODS[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      onClick={onClick}
      className="glass-card p-5 cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {c.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-slate-800 text-sm">{c.name}</p>
            <p className="text-xs text-slate-400">{c.customer_code}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${method.bgClass}`}>
            <method.icon size={10} className={method.iconClass.split(' ')[0]} />
            <span className="text-slate-600">{method.label.split(' ')[0]}</span>
          </div>
          <ChevronRight size={14} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
        </div>
      </div>

      {c.company_name && (
        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
          <Building2 size={11} /><span>{c.company_name}</span>
        </div>
      )}
      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
        <Phone size={11} /><span>{c.phone}</span>
      </div>

      {balance > 0 && (
        <div className="mt-2 space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Credit Used</span>
            <span className={`font-semibold num ${pct > 80 ? 'text-red-500' : 'text-slate-700'}`}>
              KES {balance.toLocaleString()} / {c.credit_limit.toLocaleString()}
            </span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: barColor }} />
          </div>
        </div>
      )}

      {!c.is_active && (
        <div className="mt-2 text-xs text-slate-400 italic">Inactive account</div>
      )}
    </motion.div>
  );
}

// ── Add/Edit Customer Modal ───────────────────────────────────────────────────
function CustomerModal({ customer, onClose }: { customer?: Customer; onClose: () => void }) {
  const qc = useQueryClient();
  const isEdit = !!customer;
  const [form, setForm] = useState(
    isEdit ? {
      name: customer.name, phone: customer.phone, alt_phone: customer.alt_phone || '',
      email: customer.email || '', company_name: customer.company_name || '',
      vehicle_plates: (customer.vehicle_plates || []).join(', '),
      credit_limit: customer.credit_limit, payment_preference: customer.payment_preference,
      address: customer.address || '', notes: customer.notes || '', is_active: customer.is_active,
    } : BLANK
  );
  const [step, setStep] = useState(0);

  const set = (k: string, v: string | number | boolean) => setForm(f => ({ ...f, [k]: v }));

  const mutation = useMutation({
    mutationFn: (data: typeof form) => {
      const payload = {
        ...data,
        vehicle_plates: data.vehicle_plates ? data.vehicle_plates.split(',').map(s => s.trim()).filter(Boolean) : [],
      };
      return isEdit ? customersApi.update(customer.id, payload) : customersApi.create(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      toast.success(isEdit ? 'Customer updated!' : 'Customer created!');
      onClose();
    },
    onError: (err: unknown) => toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to save customer'),
  });

  const selectedMethod = PAYMENT_METHODS.find(m => m.id === form.payment_preference)!;

  const steps = [
    { label: 'Basic Info', icon: Users },
    { label: 'Payment Method', icon: CreditCard },
    { label: 'Credit & Notes', icon: Wallet },
  ];

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100">
          <h2 className="font-heading font-bold text-slate-800 text-lg">{isEdit ? 'Edit Customer' : 'Add New Customer'}</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {isEdit ? `Editing ${customer.name}` : 'Fill in customer details and preferred payment channel'}
          </p>
          {/* Step indicator */}
          <div className="flex items-center gap-2 mt-4">
            {steps.map((s, i) => (
              <button key={i} onClick={() => setStep(i)} className="flex items-center gap-1.5">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${i === step ? 'bg-emerald-500 text-white' : i < step ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                  {i < step ? <CheckCircle2 size={14} /> : i + 1}
                </div>
                <span className={`text-xs hidden sm:block ${i === step ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>{s.label}</span>
                {i < steps.length - 1 && <div className={`h-px w-8 ${i < step ? 'bg-emerald-300' : 'bg-slate-200'}`} />}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
          <AnimatePresence mode="wait">
            {/* ── Step 0: Basic Info ── */}
            {step === 0 && (
              <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="label">Full Name *</label>
                    <input value={form.name} onChange={e => set('name', e.target.value)} className="input-field" placeholder="John Kamau" />
                  </div>
                  <div>
                    <label className="label">Phone Number *</label>
                    <input value={form.phone} onChange={e => set('phone', e.target.value)} className="input-field" placeholder="0712345678" />
                    <p className="text-xs text-slate-400 mt-1">Used for M-Pesa auto-match</p>
                  </div>
                  <div>
                    <label className="label">Alt. Phone</label>
                    <input value={form.alt_phone} onChange={e => set('alt_phone', e.target.value)} className="input-field" placeholder="0700000000" />
                  </div>
                  <div>
                    <label className="label">Email</label>
                    <input type="email" value={form.email} onChange={e => set('email', e.target.value)} className="input-field" placeholder="john@company.co.ke" />
                  </div>
                  <div>
                    <label className="label">Company Name</label>
                    <input value={form.company_name} onChange={e => set('company_name', e.target.value)} className="input-field" placeholder="ABC Transport Ltd" />
                  </div>
                  <div className="col-span-2">
                    <label className="label">Vehicle Plates (comma-separated)</label>
                    <input value={form.vehicle_plates} onChange={e => set('vehicle_plates', e.target.value)} className="input-field" placeholder="KBZ 123A, KCA 456B" />
                    <p className="text-xs text-slate-400 mt-1">Used for vehicle-based credit tracking</p>
                  </div>
                  <div className="col-span-2">
                    <label className="label">Address</label>
                    <input value={form.address} onChange={e => set('address', e.target.value)} className="input-field" placeholder="Nairobi, Westlands" />
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Step 1: Payment Method ── */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
                <p className="text-sm text-slate-600 mb-4">
                  Select how this customer usually pays. This is used for <strong>auto-reconciliation</strong> — incoming payments are automatically matched to this customer.
                </p>
                <div className="space-y-3">
                  {PAYMENT_METHODS.map(method => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => set('payment_preference', method.id)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${form.payment_preference === method.id ? method.activeClass : 'border-slate-200 hover:border-slate-300 bg-white'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${method.iconClass}`}>
                          <method.icon size={20} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-800 text-sm">{method.label}</span>
                            {method.autoSync && (
                              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Auto-sync ✓</span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{method.desc}</p>
                        </div>
                        {form.payment_preference === method.id && (
                          <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Auto-sync explainer */}
                <div className="mt-4 p-4 rounded-xl bg-blue-50 border border-blue-200">
                  <p className="text-xs font-semibold text-blue-700 mb-1">🔄 How Auto-Sync Works</p>
                  <p className="text-xs text-blue-600">
                    When a payment arrives via webhook (M-Pesa, PesaLink, Equity), the system matches it to this customer using their <strong>phone number</strong> or <strong>customer code</strong> as the Paybill reference. Matched payments are auto-posted to their credit ledger and the oldest outstanding sale is settled automatically.
                  </p>
                </div>
              </motion.div>
            )}

            {/* ── Step 2: Credit & Notes ── */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
                <div>
                  <label className="label">Credit Limit (KES)</label>
                  <input type="number" value={form.credit_limit} onChange={e => set('credit_limit', Number(e.target.value))} className="input-field" placeholder="50000" />
                  <p className="text-xs text-slate-400 mt-1">Maximum outstanding balance allowed. Set 0 to disable credit.</p>
                </div>

                <div>
                  <label className="label">Internal Notes</label>
                  <textarea value={form.notes} onChange={e => set('notes', e.target.value)} className="input-field resize-none" rows={3} placeholder="Any special instructions, delivery preferences, etc." />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <p className="text-sm font-medium text-slate-700">Active Account</p>
                    <p className="text-xs text-slate-400">Inactive customers cannot make sales or payments</p>
                  </div>
                  <button onClick={() => set('is_active', !form.is_active)}
                    className={`w-11 h-6 rounded-full transition-all relative ${form.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${form.is_active ? 'left-5' : 'left-0.5'}`} />
                  </button>
                </div>

                {/* Summary */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Summary</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                    <span className="text-slate-500">Name</span><span className="font-medium text-slate-700">{form.name || '—'}</span>
                    <span className="text-slate-500">Phone</span><span className="font-medium text-slate-700">{form.phone || '—'}</span>
                    <span className="text-slate-500">Payment</span>
                    <span className="font-medium text-slate-700">
                      {PAYMENT_METHODS.find(m => m.id === form.payment_preference)?.label}
                    </span>
                    <span className="text-slate-500">Credit Limit</span><span className="font-medium text-slate-700">KES {form.credit_limit.toLocaleString()}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
          <button onClick={step === 0 ? onClose : () => setStep(s => s - 1)} className="btn-secondary py-2 px-5 text-sm">
            {step === 0 ? 'Cancel' : '← Back'}
          </button>
          {step < 2 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={step === 0 && !form.name}
              className="btn-primary py-2 px-5 text-sm"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={() => mutation.mutate(form)}
              disabled={mutation.isPending || !form.name || !form.phone}
              className="btn-primary py-2 px-5 text-sm flex items-center gap-2"
            >
              {mutation.isPending && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {isEdit ? 'Save Changes' : 'Create Customer'}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Customers() {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<Customer | undefined>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => { document.title = 'Customers — FuelFlow Pro'; }, []);

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers', search],
    queryFn: () => customersApi.list({ search }).then(r => r.data.data as Customer[]),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => customersApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['customers'] }); toast.success('Customer removed'); setDeleteTarget(undefined); },
    onError: () => toast.error('Cannot delete — customer has existing transactions'),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        subtitle={`${customers.length} registered customers`}
        icon={Users}
        actions={
          <button onClick={() => { setEditCustomer(undefined); setShowModal(true); }} className="btn-primary text-sm py-2 flex items-center gap-2">
            <Plus size={14} /> Add Customer
          </button>
        }
      />

      {/* Search */}
      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 max-w-sm shadow-sm">
        <Search size={16} className="text-slate-400" />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          className="bg-transparent text-slate-700 text-sm outline-none flex-1 placeholder:text-slate-400"
          placeholder="Search name, phone, company..."
        />
      </div>

      {/* Payment method filter pills */}
      <div className="flex gap-2 flex-wrap">
        {PAYMENT_METHODS.map(m => {
          const count = customers.filter(c => c.payment_preference === m.id).length;
          return count > 0 ? (
            <div key={m.id} className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border ${m.bgClass}`}>
              <m.icon size={11} /><span className="font-medium">{m.label.split(' ')[0]}</span>
              <span className="bg-white rounded-full px-1.5 py-0.5 text-slate-600 font-bold">{count}</span>
            </div>
          ) : null;
        })}
      </div>

      {isLoading ? <LoadingSpinner /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {customers.map((c, i) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <CustomerCard
                c={c}
                onClick={() => navigate(`/customers/${c.id}`)}
              />
            </motion.div>
          ))}
          {customers.length === 0 && (
            <div className="col-span-3 text-center py-16 text-slate-400">
              <Users size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No customers found. Add your first customer!</p>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <CustomerModal customer={editCustomer} onClose={() => setShowModal(false)} />
        )}
      </AnimatePresence>

      {/* Delete confirm */}
      {deleteTarget && (
        <ConfirmModal
          title="Remove Customer"
          message={`Remove ${deleteTarget.name}? This cannot be undone if they have no transactions.`}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          onCancel={() => setDeleteTarget(undefined)}
          isLoading={deleteMutation.isPending}
          confirmLabel="Remove"
          isDanger
        />
      )}
    </div>
  );
}

.Value 
            >
              {mutation.isPending && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {isEdit ? 'Save Changes' : 'Create Customer'}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Customers() {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<Customer | undefined>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => { document.title = 'Customers — FuelFlow Pro'; }, []);

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers', search],
    queryFn: () => customersApi.list({ search }).then(r => r.data.data as Customer[]),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => customersApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['customers'] }); toast.success('Customer removed'); setDeleteTarget(undefined); },
    onError: () => toast.error('Cannot delete — customer has existing transactions'),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        subtitle={`${customers.length} registered customers`}
        icon={Users}
        actions={
          <button onClick={() => { setEditCustomer(undefined); setShowModal(true); }}  import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Plus, Search, Phone, Building2, CreditCard,
  ChevronRight, CheckCircle2, Smartphone, Landmark, Banknote, Wallet
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { customersApi } from '../services/api';
import { Customer } from '../types';
import PageHeader from '../components/shared/PageHeader';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import ConfirmModal from '../components/shared/ConfirmModal';

// ── Payment method config ─────────────────────────────────────────────────────
const PAYMENT_METHODS = [
  {
    id: 'mpesa',
    label: 'M-Pesa (STK / Paybill)',
    icon: Smartphone,
    desc: 'STK Push or Paybill payments. Auto-matched by phone number or customer code.',
    autoSync: true,
    bgClass: 'bg-emerald-50 border-emerald-200',
    activeClass: 'ring-2 ring-emerald-500 bg-emerald-50 border-emerald-400',
    iconClass: 'text-emerald-600 bg-emerald-100',
  },
  {
    id: 'pesalink',
    label: 'PesaLink / IntaSend',
    icon: CreditCard,
    desc: 'Inter-bank transfers via PesaLink. Auto-matched by account reference.',
    autoSync: true,
    bgClass: 'bg-blue-50 border-blue-200',
    activeClass: 'ring-2 ring-blue-500 bg-blue-50 border-blue-400',
    iconClass: 'text-blue-600 bg-blue-100',
  },
  {
    id: 'bank_transfer',
    label: 'Bank Transfer / Equity Jenga',
    icon: Landmark,
    desc: 'Direct bank transfers & Equity Jenga IPN. Matched by account reference.',
    autoSync: true,
    bgClass: 'bg-indigo-50 border-indigo-200',
    activeClass: 'ring-2 ring-indigo-500 bg-indigo-50 border-indigo-400',
    iconClass: 'text-indigo-600 bg-indigo-100',
  },
  {
    id: 'bank_deposit',
    label: 'Cash Deposit to Bank / Agent',
    icon: Banknote,
    desc: 'Customer deposits cash at bank branch or M-Pesa agent. Cashier confirms on receipt of bank slip.',
    autoSync: false,
    bgClass: 'bg-orange-50 border-orange-200',
    activeClass: 'ring-2 ring-orange-500 bg-orange-50 border-orange-400',
    iconClass: 'text-orange-600 bg-orange-100',
  },
  {
    id: 'cash',
    label: 'Cash (On-Site)',
    icon: Wallet,
    desc: 'Physical cash paid at station. Cashier enters manually. Instant reconciliation.',
    autoSync: false,
    bgClass: 'bg-amber-50 border-amber-200',
    activeClass: 'ring-2 ring-amber-500 bg-amber-50 border-amber-400',
    iconClass: 'text-amber-600 bg-amber-100',
  },
];

// ── Blank form ────────────────────────────────────────────────────────────────
const BLANK = {
  name: '', phone: '', alt_phone: '', email: '',
  company_name: '', vehicle_plates: '',
  credit_limit: 50000, payment_preference: 'mpesa',
  address: '', notes: '', is_active: true,
};

// ── Customer card ─────────────────────────────────────────────────────────────
function CustomerCard({ c, onClick }: { c: Customer; onClick: () => void }) {
  const balance = c.current_balance ?? 0;
  const pct = c.credit_limit > 0 ? Math.min((balance / c.credit_limit) * 100, 100) : 0;
  const barColor = pct > 80 ? '#ef4444' : pct > 50 ? '#f59e0b' : '#10b981';
  const method = PAYMENT_METHODS.find(m => m.id === c.payment_preference) || PAYMENT_METHODS[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      onClick={onClick}
      className="glass-card p-5 cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {c.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-slate-800 text-sm">{c.name}</p>
            <p className="text-xs text-slate-400">{c.customer_code}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${method.bgClass}`}>
            <method.icon size={10} className={method.iconClass.split(' ')[0]} />
            <span className="text-slate-600">{method.label.split(' ')[0]}</span>
          </div>
          <ChevronRight size={14} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
        </div>
      </div>

      {c.company_name && (
        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
          <Building2 size={11} /><span>{c.company_name}</span>
        </div>
      )}
      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
        <Phone size={11} /><span>{c.phone}</span>
      </div>

      {balance > 0 && (
        <div className="mt-2 space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Credit Used</span>
            <span className={`font-semibold num ${pct > 80 ? 'text-red-500' : 'text-slate-700'}`}>
              KES {balance.toLocaleString()} / {c.credit_limit.toLocaleString()}
            </span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: barColor }} />
          </div>
        </div>
      )}

      {!c.is_active && (
        <div className="mt-2 text-xs text-slate-400 italic">Inactive account</div>
      )}
    </motion.div>
  );
}

// ── Add/Edit Customer Modal ───────────────────────────────────────────────────
function CustomerModal({ customer, onClose }: { customer?: Customer; onClose: () => void }) {
  const qc = useQueryClient();
  const isEdit = !!customer;
  const [form, setForm] = useState(
    isEdit ? {
      name: customer.name, phone: customer.phone, alt_phone: customer.alt_phone || '',
      email: customer.email || '', company_name: customer.company_name || '',
      vehicle_plates: (customer.vehicle_plates || []).join(', '),
      credit_limit: customer.credit_limit, payment_preference: customer.payment_preference,
      address: customer.address || '', notes: customer.notes || '', is_active: customer.is_active,
    } : BLANK
  );
  const [step, setStep] = useState(0);

  const set = (k: string, v: string | number | boolean) => setForm(f => ({ ...f, [k]: v }));

  const mutation = useMutation({
    mutationFn: (data: typeof form) => {
      const payload = {
        ...data,
        vehicle_plates: data.vehicle_plates ? data.vehicle_plates.split(',').map(s => s.trim()).filter(Boolean) : [],
      };
      return isEdit ? customersApi.update(customer.id, payload) : customersApi.create(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      toast.success(isEdit ? 'Customer updated!' : 'Customer created!');
      onClose();
    },
    onError: (err: unknown) => toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to save customer'),
  });

  const selectedMethod = PAYMENT_METHODS.find(m => m.id === form.payment_preference)!;

  const steps = [
    { label: 'Basic Info', icon: Users },
    { label: 'Payment Method', icon: CreditCard },
    { label: 'Credit & Notes', icon: Wallet },
  ];

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100">
          <h2 className="font-heading font-bold text-slate-800 text-lg">{isEdit ? 'Edit Customer' : 'Add New Customer'}</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {isEdit ? `Editing ${customer.name}` : 'Fill in customer details and preferred payment channel'}
          </p>
          {/* Step indicator */}
          <div className="flex items-center gap-2 mt-4">
            {steps.map((s, i) => (
              <button key={i} onClick={() => setStep(i)} className="flex items-center gap-1.5">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${i === step ? 'bg-emerald-500 text-white' : i < step ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                  {i < step ? <CheckCircle2 size={14} /> : i + 1}
                </div>
                <span className={`text-xs hidden sm:block ${i === step ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>{s.label}</span>
                {i < steps.length - 1 && <div className={`h-px w-8 ${i < step ? 'bg-emerald-300' : 'bg-slate-200'}`} />}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
          <AnimatePresence mode="wait">
            {/* ── Step 0: Basic Info ── */}
            {step === 0 && (
              <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="label">Full Name *</label>
                    <input value={form.name} onChange={e => set('name', e.target.value)} className="input-field" placeholder="John Kamau" />
                  </div>
                  <div>
                    <label className="label">Phone Number *</label>
                    <input value={form.phone} onChange={e => set('phone', e.target.value)} className="input-field" placeholder="0712345678" />
                    <p className="text-xs text-slate-400 mt-1">Used for M-Pesa auto-match</p>
                  </div>
                  <div>
                    <label className="label">Alt. Phone</label>
                    <input value={form.alt_phone} onChange={e => set('alt_phone', e.target.value)} className="input-field" placeholder="0700000000" />
                  </div>
                  <div>
                    <label className="label">Email</label>
                    <input type="email" value={form.email} onChange={e => set('email', e.target.value)} className="input-field" placeholder="john@company.co.ke" />
                  </div>
                  <div>
                    <label className="label">Company Name</label>
                    <input value={form.company_name} onChange={e => set('company_name', e.target.value)} className="input-field" placeholder="ABC Transport Ltd" />
                  </div>
                  <div className="col-span-2">
                    <label className="label">Vehicle Plates (comma-separated)</label>
                    <input value={form.vehicle_plates} onChange={e => set('vehicle_plates', e.target.value)} className="input-field" placeholder="KBZ 123A, KCA 456B" />
                    <p className="text-xs text-slate-400 mt-1">Used for vehicle-based credit tracking</p>
                  </div>
                  <div className="col-span-2">
                    <label className="label">Address</label>
                    <input value={form.address} onChange={e => set('address', e.target.value)} className="input-field" placeholder="Nairobi, Westlands" />
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Step 1: Payment Method ── */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
                <p className="text-sm text-slate-600 mb-4">
                  Select how this customer usually pays. This is used for <strong>auto-reconciliation</strong> — incoming payments are automatically matched to this customer.
                </p>
                <div className="space-y-3">
                  {PAYMENT_METHODS.map(method => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => set('payment_preference', method.id)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${form.payment_preference === method.id ? method.activeClass : 'border-slate-200 hover:border-slate-300 bg-white'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${method.iconClass}`}>
                          <method.icon size={20} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-800 text-sm">{method.label}</span>
                            {method.autoSync && (
                              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Auto-sync ✓</span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{method.desc}</p>
                        </div>
                        {form.payment_preference === method.id && (
                          <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Auto-sync explainer */}
                <div className="mt-4 p-4 rounded-xl bg-blue-50 border border-blue-200">
                  <p className="text-xs font-semibold text-blue-700 mb-1">🔄 How Auto-Sync Works</p>
                  <p className="text-xs text-blue-600">
                    When a payment arrives via webhook (M-Pesa, PesaLink, Equity), the system matches it to this customer using their <strong>phone number</strong> or <strong>customer code</strong> as the Paybill reference. Matched payments are auto-posted to their credit ledger and the oldest outstanding sale is settled automatically.
                  </p>
                </div>
              </motion.div>
            )}

            {/* ── Step 2: Credit & Notes ── */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
                <div>
                  <label className="label">Credit Limit (KES)</label>
                  <input type="number" value={form.credit_limit} onChange={e => set('credit_limit', Number(e.target.value))} className="input-field" placeholder="50000" />
                  <p className="text-xs text-slate-400 mt-1">Maximum outstanding balance allowed. Set 0 to disable credit.</p>
                </div>

                <div>
                  <label className="label">Internal Notes</label>
                  <textarea value={form.notes} onChange={e => set('notes', e.target.value)} className="input-field resize-none" rows={3} placeholder="Any special instructions, delivery preferences, etc." />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <p className="text-sm font-medium text-slate-700">Active Account</p>
                    <p className="text-xs text-slate-400">Inactive customers cannot make sales or payments</p>
                  </div>
                  <button onClick={() => set('is_active', !form.is_active)}
                    className={`w-11 h-6 rounded-full transition-all relative ${form.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${form.is_active ? 'left-5' : 'left-0.5'}`} />
                  </button>
                </div>

                {/* Summary */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Summary</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                    <span className="text-slate-500">Name</span><span className="font-medium text-slate-700">{form.name || '—'}</span>
                    <span className="text-slate-500">Phone</span><span className="font-medium text-slate-700">{form.phone || '—'}</span>
                    <span className="text-slate-500">Payment</span>
                    <span className="font-medium text-slate-700">
                      {PAYMENT_METHODS.find(m => m.id === form.payment_preference)?.label}
                    </span>
                    <span className="text-slate-500">Credit Limit</span><span className="font-medium text-slate-700">KES {form.credit_limit.toLocaleString()}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
          <button onClick={step === 0 ? onClose : () => setStep(s => s - 1)} className="btn-secondary py-2 px-5 text-sm">
            {step === 0 ? 'Cancel' : '← Back'}
          </button>
          {step < 2 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={step === 0 && !form.name}
              className="btn-primary py-2 px-5 text-sm"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={() => mutation.mutate(form)}
              disabled={mutation.isPending || !form.name || !form.phone}
              className="btn-primary py-2 px-5 text-sm flex items-center gap-2"
            >
              {mutation.isPending && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {isEdit ? 'Save Changes' : 'Create Customer'}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Customers() {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<Customer | undefined>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => { document.title = 'Customers — FuelFlow Pro'; }, []);

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers', search],
    queryFn: () => customersApi.list({ search }).then(r => r.data.data as Customer[]),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => customersApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['customers'] }); toast.success('Customer removed'); setDeleteTarget(undefined); },
    onError: () => toast.error('Cannot delete — customer has existing transactions'),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        subtitle={`${customers.length} registered customers`}
        icon={Users}
        actions={
          <button onClick={() => { setEditCustomer(undefined); setShowModal(true); }} className="btn-primary text-sm py-2 flex items-center gap-2">
            <Plus size={14} /> Add Customer
          </button>
        }
      />

      {/* Search */}
      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 max-w-sm shadow-sm">
        <Search size={16} className="text-slate-400" />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          className="bg-transparent text-slate-700 text-sm outline-none flex-1 placeholder:text-slate-400"
          placeholder="Search name, phone, company..."
        />
      </div>

      {/* Payment method filter pills */}
      <div className="flex gap-2 flex-wrap">
        {PAYMENT_METHODS.map(m => {
          const count = customers.filter(c => c.payment_preference === m.id).length;
          return count > 0 ? (
            <div key={m.id} className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border ${m.bgClass}`}>
              <m.icon size={11} /><span className="font-medium">{m.label.split(' ')[0]}</span>
              <span className="bg-white rounded-full px-1.5 py-0.5 text-slate-600 font-bold">{count}</span>
            </div>
          ) : null;
        })}
      </div>

      {isLoading ? <LoadingSpinner /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {customers.map((c, i) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <CustomerCard
                c={c}
                onClick={() => navigate(`/customers/${c.id}`)}
              />
            </motion.div>
          ))}
          {customers.length === 0 && (
            <div className="col-span-3 text-center py-16 text-slate-400">
              <Users size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No customers found. Add your first customer!</p>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <CustomerModal customer={editCustomer} onClose={() => setShowModal(false)} />
        )}
      </AnimatePresence>

      {/* Delete confirm */}
      {deleteTarget && (
        <ConfirmModal
          title="Remove Customer"
          message={`Remove ${deleteTarget.name}? This cannot be undone if they have no transactions.`}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          onCancel={() => setDeleteTarget(undefined)}
          isLoading={deleteMutation.isPending}
          confirmLabel="Remove"
          isDanger
        />
      )}
    </div>
  );
}

.Value >
            <Plus size={14} /> Add Customer
          </button>
        }
      />

      {/* Search */}
      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 max-w-sm shadow-sm">
        <Search size={16} className="text-slate-400" />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          className="bg-transparent text-slate-700 text-sm outline-none flex-1 placeholder:text-slate-400"
          placeholder="Search name, phone, company..."
        />
      </div>

      {/* Payment method filter pills */}
      <div className="flex gap-2 flex-wrap">
        {PAYMENT_METHODS.map(m => {
          const count = customers.filter(c => c.payment_preference === m.id).length;
          return count > 0 ? (
            <div key={m.id} className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border ${m.bgClass}`}>
              <m.icon size={11} /><span className="font-medium">{m.label.split(' ')[0]}</span>
              <span className="bg-white rounded-full px-1.5 py-0.5 text-slate-600 font-bold">{count}</span>
            </div>
          ) : null;
        })}
      </div>

      {isLoading ? <LoadingSpinner /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {customers.map((c, i) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <CustomerCard
                c={c}
                onClick={() => navigate(`/customers/${c.id}`)}
              />
            </motion.div>
          ))}
          {customers.length === 0 && (
            <div className="col-span-3 text-center py-16 text-slate-400">
              <Users size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No customers found. Add your first customer!</p>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <CustomerModal customer={editCustomer} onClose={() => setShowModal(false)} />
        )}
      </AnimatePresence>

      {/* Delete confirm */}
      {deleteTarget && (
        <ConfirmModal
          title="Remove Customer"
          message={`Remove ${deleteTarget.name}? This cannot be undone if they have no transactions.`}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          onCancel={() => setDeleteTarget(undefined)}
          isLoading={deleteMutation.isPending}
          confirmLabel="Remove"
          isDanger
        />
      )}
    </div>
  );
}


