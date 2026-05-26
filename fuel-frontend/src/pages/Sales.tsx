import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, ShoppingCart, Trash2, ChevronDown, X, Check, CreditCard, Banknote, Smartphone, Building2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { salesApi, productsApi, customersApi } from '../services/api';
import { Sale, Product, Customer, SaleItem, formatKES, PaymentChannel } from '../types';
import StatusBadge from '../components/shared/StatusBadge';
import PageHeader from '../components/shared/PageHeader';
import LoadingSpinner from '../components/shared/LoadingSpinner';

const PAYMENT_METHODS: { value: PaymentChannel; label: string; icon: React.ElementType }[] = [
  { value: 'cash', label: 'Cash', icon: Banknote },
  { value: 'mpesa_stk', label: 'M-Pesa', icon: Smartphone },
  { value: 'bank_deposit', label: 'Bank Deposit', icon: Building2 },
  { value: 'pesalink', label: 'PesaLink', icon: CreditCard },
  { value: 'bank_transfer', label: 'Bank Transfer', icon: Building2 },
];

interface CartItem extends SaleItem { productName: string; productCode: string; }

export default function Sales() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDrop, setShowCustomerDrop] = useState(false);
  const [paymentType, setPaymentType] = useState<'pay_now' | 'pay_later'>('pay_now');
  const [paymentChannel, setPaymentChannel] = useState<PaymentChannel>('cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [notes, setNotes] = useState('');
  const [creating, setCreating] = useState(false);
  const [saleFilter, setSaleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: products } = useQuery({ queryKey: ['products'], queryFn: () => productsApi.list().then(r => r.data.data as Product[]) });
  const { data: customersData } = useQuery({
    queryKey: ['customers-search', customerSearch],
    queryFn: () => customersApi.list({ search: customerSearch, limit: 10 }).then(r => r.data.data as Customer[]),
    enabled: customerSearch.length > 0,
  });
  const { data: salesData, refetch: refetchSales, isLoading: salesLoading } = useQuery({
    queryKey: ['sales', saleFilter, statusFilter],
    queryFn: () => salesApi.list({ search: saleFilter, payment_status: statusFilter || undefined, limit: 50 }).then(r => r.data.data as Sale[]),
  });

  const total = cartItems.reduce((s, i) => s + i.subtotal, 0);
  const balance = paymentType === 'pay_now' ? Math.max(0, total - parseFloat(amountPaid || '0')) : total;

  const addProduct = (product: Product) => {
    setCartItems(prev => {
      const ex = prev.find(i => i.product_id === product.id);
      if (ex) return prev.map(i => i.product_id === product.id ? { ...i, litres: i.litres + 1, subtotal: (i.litres + 1) * i.price_per_litre } : i);
      return [...prev, { product_id: product.id, productName: product.name, productCode: product.code, litres: 1, price_per_litre: product.selling_price_per_litre, subtotal: product.selling_price_per_litre }];
    });
  };

  const updateLitres = (productId: string, litres: number) => {
    if (litres <= 0) { setCartItems(prev => prev.filter(i => i.product_id !== productId)); return; }
    setCartItems(prev => prev.map(i => i.product_id === productId ? { ...i, litres, subtotal: litres * i.price_per_litre } : i));
  };

  const handleCreateSale = async () => {
    if (!selectedCustomer) { toast.error('Please select a customer'); return; }
    if (cartItems.length === 0) { toast.error('Add at least one fuel product'); return; }
    setCreating(true);
    try {
      await salesApi.create({
        customer_id: selectedCustomer.id,
        payment_type: paymentType,
        items: cartItems.map(i => ({ product_id: i.product_id, litres: i.litres, price_per_litre: i.price_per_litre })),
        amount_paid: paymentType === 'pay_now' ? parseFloat(amountPaid || total.toString()) : 0,
        payment_channel: paymentChannel,
        notes,
      });
      toast.success('Sale created successfully!');
      setCartItems([]); setSelectedCustomer(null); setCustomerSearch('');
      setAmountPaid(''); setNotes(''); setPaymentType('pay_now');
      refetchSales();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to create sale');
    } finally { setCreating(false); }
  };

  useEffect(() => { document.title = 'Sales — FuelFlow Pro'; }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Sales Point of Sale" subtitle="Create fuel sales and manage transactions" icon={ShoppingCart} />

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* LEFT: Product selector */}
        <div className="xl:col-span-3 space-y-4">
          {/* Customer picker */}
          <div className="glass-card p-4">
            <label className="label">Select Customer</label>
            <div className="relative">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={selectedCustomer ? selectedCustomer.name : customerSearch}
                  onChange={e => { setCustomerSearch(e.target.value); setSelectedCustomer(null); setShowCustomerDrop(true); }}
                  onFocus={() => setShowCustomerDrop(true)}
                  className="input-field pl-9" placeholder="Search by name, code or phone..." />
                {selectedCustomer && <button onClick={() => { setSelectedCustomer(null); setCustomerSearch(''); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-400"><X size={14} /></button>}
              </div>
              <AnimatePresence>
                {showCustomerDrop && !selectedCustomer && (customersData || []).length > 0 && (
                  <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                    className="absolute z-20 top-full mt-1 w-full glass-card border border-slate-200 py-1 max-h-52 overflow-y-auto">
                    {(customersData || []).map(c => (
                      <button key={c.id} onClick={() => { setSelectedCustomer(c); setShowCustomerDrop(false); setCustomerSearch(''); }}
                        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-200/40 transition-colors text-left">
                        <div>
                          <p className="text-sm font-medium text-slate-800">{c.name}</p>
                          <p className="text-xs text-slate-400">{c.customer_code} · {c.phone}</p>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs font-bold num ${c.current_balance > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{formatKES(c.current_balance)}</span>
                          <p className="text-[10px] text-slate-500">balance</p>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {selectedCustomer && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{selectedCustomer.name} <span className="text-xs text-emerald-400 font-mono ml-1">{selectedCustomer.customer_code}</span></p>
                  <p className="text-xs text-slate-500">{selectedCustomer.phone}{selectedCustomer.company_name ? ` · ${selectedCustomer.company_name}` : ''}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold num ${selectedCustomer.current_balance > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{formatKES(selectedCustomer.current_balance)}</p>
                  <p className="text-[10px] text-slate-400">outstanding</p>
                </div>
              </motion.div>
            )}
          </div>

          {/* Products */}
          <div className="glass-card p-4">
            <h3 className="section-title mb-3">Select Fuel Products</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(products || []).map(p => (
                <motion.button key={p.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => addProduct(p)}
                  className="p-4 rounded-xl border border-slate-200 hover:border-emerald-500/40 bg-slate-50 hover:bg-slate-200/40 transition-all text-left group">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: p.colour }} />
                    <span className="font-mono text-xs text-slate-500">{p.code}</span>
                  </div>
                  <p className="font-semibold text-slate-800 text-sm">{p.name}</p>
                  <p className="text-emerald-400 font-bold text-lg num mt-1">KES {p.selling_price_per_litre.toFixed(2)}<span className="text-xs text-slate-400 font-normal">/L</span></p>
                  <p className="text-xs text-slate-400 mt-1">Stock: {p.current_stock_litres.toLocaleString()}L</p>
                  <div className="mt-2 w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${Math.min(100, (p.current_stock_litres / (p.low_stock_alert_litres * 5)) * 100)}%`, background: p.colour }} />
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Cart items */}
          {cartItems.length > 0 && (
            <div className="glass-card p-4">
              <h3 className="section-title mb-3">Cart</h3>
              <div className="space-y-3">
                {cartItems.map(item => (
                  <div key={item.product_id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-800">{item.productName}</p>
                      <p className="text-xs text-slate-400">@ KES {item.price_per_litre.toFixed(2)}/L</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateLitres(item.product_id, item.litres - 10)} className="w-7 h-7 rounded-lg bg-slate-200 text-slate-600 hover:bg-slate-300 flex items-center justify-center text-xs font-bold">-10</button>
                      <input type="number" value={item.litres} onChange={e => updateLitres(item.product_id, parseFloat(e.target.value) || 0)}
                        className="w-20 bg-slate-100 border border-slate-400 rounded-lg text-center text-slate-800 text-sm py-1 px-2 num" />
                      <button onClick={() => updateLitres(item.product_id, item.litres + 10)} className="w-7 h-7 rounded-lg bg-slate-200 text-slate-600 hover:bg-slate-300 flex items-center justify-center text-xs font-bold">+10</button>
                    </div>
                    <p className="text-emerald-400 font-bold text-sm num w-24 text-right">{formatKES(item.subtotal)}</p>
                    <button onClick={() => setCartItems(prev => prev.filter(i => i.product_id !== item.product_id))} className="text-slate-400 hover:text-red-400"><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Sale summary */}
        <div className="xl:col-span-2 space-y-4">
          <div className="glass-card p-5 sticky top-4">
            <h3 className="section-title mb-4">Sale Summary</h3>

            {/* Pay now / later toggle */}
            <div className="flex rounded-xl overflow-hidden border border-slate-200 mb-4">
              {(['pay_now', 'pay_later'] as const).map(type => (
                <button key={type} onClick={() => setPaymentType(type)}
                  className={`flex-1 py-2.5 text-sm font-medium transition-all ${paymentType === type ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500 hover:text-slate-900'}`}>
                  {type === 'pay_now' ? '💳 Pay Now' : '📋 Pay Later (Credit)'}
                </button>
              ))}
            </div>

            {/* Amount breakdown */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm"><span className="text-slate-500">Subtotal</span><span className="text-slate-700 num">{formatKES(total)}</span></div>
              {paymentType === 'pay_now' && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Amount Paid</span>
                  <input type="number" value={amountPaid} onChange={e => setAmountPaid(e.target.value)}
                    placeholder={total.toFixed(2)} className="w-32 bg-slate-100 border border-slate-200 rounded-lg text-right text-slate-800 text-sm py-1 px-2 num" />
                </div>
              )}
              <div className="border-t border-slate-200 pt-2 flex justify-between font-semibold">
                <span className="text-slate-600">Total</span>
                <span className="font-heading text-2xl text-slate-800 num">{formatKES(total)}</span>
              </div>
              {paymentType === 'pay_now' && balance > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-amber-400">Balance Due</span>
                  <span className="text-amber-400 font-bold num">{formatKES(balance)}</span>
                </div>
              )}
              {paymentType === 'pay_later' && (
                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <p className="text-xs text-amber-400">This will be recorded as credit. The full amount will be added to the customer's outstanding balance.</p>
                </div>
              )}
            </div>

            {/* Payment method (pay now only) */}
            {paymentType === 'pay_now' && (
              <div className="mb-4">
                <label className="label">Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  {PAYMENT_METHODS.map(m => (
                    <button key={m.value} onClick={() => setPaymentChannel(m.value)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-sm transition-all ${paymentChannel === m.value ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400' : 'border-slate-300/40 text-slate-500 hover:border-slate-400'}`}>
                      <m.icon size={14} /> {m.label}
                      {paymentChannel === m.value && <Check size={12} className="ml-auto" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="mb-4">
              <label className="label">Notes (optional)</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="input-field resize-none" placeholder="Vehicle plate, delivery instructions..." />
            </div>

            {/* Create sale button */}
            <motion.button whileTap={{ scale: 0.98 }} onClick={handleCreateSale} disabled={creating || !selectedCustomer || cartItems.length === 0}
               import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, ShoppingCart, Trash2, ChevronDown, X, Check, CreditCard, Banknote, Smartphone, Building2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { salesApi, productsApi, customersApi } from '../services/api';
import { Sale, Product, Customer, SaleItem, formatKES, PaymentChannel } from '../types';
import StatusBadge from '../components/shared/StatusBadge';
import PageHeader from '../components/shared/PageHeader';
import LoadingSpinner from '../components/shared/LoadingSpinner';

const PAYMENT_METHODS: { value: PaymentChannel; label: string; icon: React.ElementType }[] = [
  { value: 'cash', label: 'Cash', icon: Banknote },
  { value: 'mpesa_stk', label: 'M-Pesa', icon: Smartphone },
  { value: 'bank_deposit', label: 'Bank Deposit', icon: Building2 },
  { value: 'pesalink', label: 'PesaLink', icon: CreditCard },
  { value: 'bank_transfer', label: 'Bank Transfer', icon: Building2 },
];

interface CartItem extends SaleItem { productName: string; productCode: string; }

export default function Sales() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDrop, setShowCustomerDrop] = useState(false);
  const [paymentType, setPaymentType] = useState<'pay_now' | 'pay_later'>('pay_now');
  const [paymentChannel, setPaymentChannel] = useState<PaymentChannel>('cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [notes, setNotes] = useState('');
  const [creating, setCreating] = useState(false);
  const [saleFilter, setSaleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: products } = useQuery({ queryKey: ['products'], queryFn: () => productsApi.list().then(r => r.data.data as Product[]) });
  const { data: customersData } = useQuery({
    queryKey: ['customers-search', customerSearch],
    queryFn: () => customersApi.list({ search: customerSearch, limit: 10 }).then(r => r.data.data as Customer[]),
    enabled: customerSearch.length > 0,
  });
  const { data: salesData, refetch: refetchSales, isLoading: salesLoading } = useQuery({
    queryKey: ['sales', saleFilter, statusFilter],
    queryFn: () => salesApi.list({ search: saleFilter, payment_status: statusFilter || undefined, limit: 50 }).then(r => r.data.data as Sale[]),
  });

  const total = cartItems.reduce((s, i) => s + i.subtotal, 0);
  const balance = paymentType === 'pay_now' ? Math.max(0, total - parseFloat(amountPaid || '0')) : total;

  const addProduct = (product: Product) => {
    setCartItems(prev => {
      const ex = prev.find(i => i.product_id === product.id);
      if (ex) return prev.map(i => i.product_id === product.id ? { ...i, litres: i.litres + 1, subtotal: (i.litres + 1) * i.price_per_litre } : i);
      return [...prev, { product_id: product.id, productName: product.name, productCode: product.code, litres: 1, price_per_litre: product.selling_price_per_litre, subtotal: product.selling_price_per_litre }];
    });
  };

  const updateLitres = (productId: string, litres: number) => {
    if (litres <= 0) { setCartItems(prev => prev.filter(i => i.product_id !== productId)); return; }
    setCartItems(prev => prev.map(i => i.product_id === productId ? { ...i, litres, subtotal: litres * i.price_per_litre } : i));
  };

  const handleCreateSale = async () => {
    if (!selectedCustomer) { toast.error('Please select a customer'); return; }
    if (cartItems.length === 0) { toast.error('Add at least one fuel product'); return; }
    setCreating(true);
    try {
      await salesApi.create({
        customer_id: selectedCustomer.id,
        payment_type: paymentType,
        items: cartItems.map(i => ({ product_id: i.product_id, litres: i.litres, price_per_litre: i.price_per_litre })),
        amount_paid: paymentType === 'pay_now' ? parseFloat(amountPaid || total.toString()) : 0,
        payment_channel: paymentChannel,
        notes,
      });
      toast.success('Sale created successfully!');
      setCartItems([]); setSelectedCustomer(null); setCustomerSearch('');
      setAmountPaid(''); setNotes(''); setPaymentType('pay_now');
      refetchSales();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to create sale');
    } finally { setCreating(false); }
  };

  useEffect(() => { document.title = 'Sales — FuelFlow Pro'; }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Sales Point of Sale" subtitle="Create fuel sales and manage transactions" icon={ShoppingCart} />

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* LEFT: Product selector */}
        <div className="xl:col-span-3 space-y-4">
          {/* Customer picker */}
          <div className="glass-card p-4">
            <label className="label">Select Customer</label>
            <div className="relative">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={selectedCustomer ? selectedCustomer.name : customerSearch}
                  onChange={e => { setCustomerSearch(e.target.value); setSelectedCustomer(null); setShowCustomerDrop(true); }}
                  onFocus={() => setShowCustomerDrop(true)}
                  className="input-field pl-9" placeholder="Search by name, code or phone..." />
                {selectedCustomer && <button onClick={() => { setSelectedCustomer(null); setCustomerSearch(''); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-400"><X size={14} /></button>}
              </div>
              <AnimatePresence>
                {showCustomerDrop && !selectedCustomer && (customersData || []).length > 0 && (
                  <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                    className="absolute z-20 top-full mt-1 w-full glass-card border border-slate-200 py-1 max-h-52 overflow-y-auto">
                    {(customersData || []).map(c => (
                      <button key={c.id} onClick={() => { setSelectedCustomer(c); setShowCustomerDrop(false); setCustomerSearch(''); }}
                        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-200/40 transition-colors text-left">
                        <div>
                          <p className="text-sm font-medium text-slate-800">{c.name}</p>
                          <p className="text-xs text-slate-400">{c.customer_code} · {c.phone}</p>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs font-bold num ${c.current_balance > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{formatKES(c.current_balance)}</span>
                          <p className="text-[10px] text-slate-500">balance</p>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {selectedCustomer && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{selectedCustomer.name} <span className="text-xs text-emerald-400 font-mono ml-1">{selectedCustomer.customer_code}</span></p>
                  <p className="text-xs text-slate-500">{selectedCustomer.phone}{selectedCustomer.company_name ? ` · ${selectedCustomer.company_name}` : ''}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold num ${selectedCustomer.current_balance > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{formatKES(selectedCustomer.current_balance)}</p>
                  <p className="text-[10px] text-slate-400">outstanding</p>
                </div>
              </motion.div>
            )}
          </div>

          {/* Products */}
          <div className="glass-card p-4">
            <h3 className="section-title mb-3">Select Fuel Products</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(products || []).map(p => (
                <motion.button key={p.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => addProduct(p)}
                  className="p-4 rounded-xl border border-slate-200 hover:border-emerald-500/40 bg-slate-50 hover:bg-slate-200/40 transition-all text-left group">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: p.colour }} />
                    <span className="font-mono text-xs text-slate-500">{p.code}</span>
                  </div>
                  <p className="font-semibold text-slate-800 text-sm">{p.name}</p>
                  <p className="text-emerald-400 font-bold text-lg num mt-1">KES {p.selling_price_per_litre.toFixed(2)}<span className="text-xs text-slate-400 font-normal">/L</span></p>
                  <p className="text-xs text-slate-400 mt-1">Stock: {p.current_stock_litres.toLocaleString()}L</p>
                  <div className="mt-2 w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${Math.min(100, (p.current_stock_litres / (p.low_stock_alert_litres * 5)) * 100)}%`, background: p.colour }} />
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Cart items */}
          {cartItems.length > 0 && (
            <div className="glass-card p-4">
              <h3 className="section-title mb-3">Cart</h3>
              <div className="space-y-3">
                {cartItems.map(item => (
                  <div key={item.product_id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-800">{item.productName}</p>
                      <p className="text-xs text-slate-400">@ KES {item.price_per_litre.toFixed(2)}/L</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateLitres(item.product_id, item.litres - 10)} className="w-7 h-7 rounded-lg bg-slate-200 text-slate-600 hover:bg-slate-300 flex items-center justify-center text-xs font-bold">-10</button>
                      <input type="number" value={item.litres} onChange={e => updateLitres(item.product_id, parseFloat(e.target.value) || 0)}
                        className="w-20 bg-slate-100 border border-slate-400 rounded-lg text-center text-slate-800 text-sm py-1 px-2 num" />
                      <button onClick={() => updateLitres(item.product_id, item.litres + 10)} className="w-7 h-7 rounded-lg bg-slate-200 text-slate-600 hover:bg-slate-300 flex items-center justify-center text-xs font-bold">+10</button>
                    </div>
                    <p className="text-emerald-400 font-bold text-sm num w-24 text-right">{formatKES(item.subtotal)}</p>
                    <button onClick={() => setCartItems(prev => prev.filter(i => i.product_id !== item.product_id))} className="text-slate-400 hover:text-red-400"><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Sale summary */}
        <div className="xl:col-span-2 space-y-4">
          <div className="glass-card p-5 sticky top-4">
            <h3 className="section-title mb-4">Sale Summary</h3>

            {/* Pay now / later toggle */}
            <div className="flex rounded-xl overflow-hidden border border-slate-200 mb-4">
              {(['pay_now', 'pay_later'] as const).map(type => (
                <button key={type} onClick={() => setPaymentType(type)}
                  className={`flex-1 py-2.5 text-sm font-medium transition-all ${paymentType === type ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500 hover:text-slate-900'}`}>
                  {type === 'pay_now' ? '💳 Pay Now' : '📋 Pay Later (Credit)'}
                </button>
              ))}
            </div>

            {/* Amount breakdown */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm"><span className="text-slate-500">Subtotal</span><span className="text-slate-700 num">{formatKES(total)}</span></div>
              {paymentType === 'pay_now' && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Amount Paid</span>
                  <input type="number" value={amountPaid} onChange={e => setAmountPaid(e.target.value)}
                    placeholder={total.toFixed(2)} className="w-32 bg-slate-100 border border-slate-200 rounded-lg text-right text-slate-800 text-sm py-1 px-2 num" />
                </div>
              )}
              <div className="border-t border-slate-200 pt-2 flex justify-between font-semibold">
                <span className="text-slate-600">Total</span>
                <span className="font-heading text-2xl text-slate-800 num">{formatKES(total)}</span>
              </div>
              {paymentType === 'pay_now' && balance > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-amber-400">Balance Due</span>
                  <span className="text-amber-400 font-bold num">{formatKES(balance)}</span>
                </div>
              )}
              {paymentType === 'pay_later' && (
                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <p className="text-xs text-amber-400">This will be recorded as credit. The full amount will be added to the customer's outstanding balance.</p>
                </div>
              )}
            </div>

            {/* Payment method (pay now only) */}
            {paymentType === 'pay_now' && (
              <div className="mb-4">
                <label className="label">Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  {PAYMENT_METHODS.map(m => (
                    <button key={m.value} onClick={() => setPaymentChannel(m.value)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-sm transition-all ${paymentChannel === m.value ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400' : 'border-slate-300/40 text-slate-500 hover:border-slate-400'}`}>
                      <m.icon size={14} /> {m.label}
                      {paymentChannel === m.value && <Check size={12} className="ml-auto" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="mb-4">
              <label className="label">Notes (optional)</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="input-field resize-none" placeholder="Vehicle plate, delivery instructions..." />
            </div>

            {/* Create sale button */}
            <motion.button whileTap={{ scale: 0.98 }} onClick={handleCreateSale} disabled={creating || !selectedCustomer || cartItems.length === 0}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-base">
              {creating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check size={18} />}
              {creating ? 'Creating Sale...' : 'Create Sale'}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Sales history table */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h3 className="section-title">Sales History</h3>
          <div className="flex items-center gap-2">
            <div className="relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={saleFilter} onChange={e => setSaleFilter(e.target.value)} placeholder="Search sale #..." className="input-field pl-8 py-2 text-xs w-40" />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-field py-2 text-xs w-36">
              <option value="">All Status</option>
              <option value="paid">Paid</option><option value="partial">Partial</option>
              <option value="credit">Credit</option><option value="pending">Pending</option>
            </select>
          </div>
        </div>
        {salesLoading ? <LoadingSpinner /> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-slate-100">
                <th className="table-header text-left">Sale #</th><th className="table-header text-left">Customer</th>
                <th className="table-header text-left hidden md:table-cell">Date</th><th className="table-header text-right">Amount</th>
                <th className="table-header text-right hidden sm:table-cell">Paid</th><th className="table-header text-right hidden sm:table-cell">Balance</th>
                <th className="table-header text-center">Status</th>
              </tr></thead>
              <tbody>
                {(salesData || []).map((s, i) => (
                  <motion.tr key={s.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="table-row">
                    <td className="table-cell"><span className="font-mono text-xs text-emerald-400">{s.sale_number}</span></td>
                    <td className="table-cell"><p className="text-sm text-slate-800">{s.customer?.name || '—'}</p><p className="text-xs text-slate-400">{s.customer?.customer_code}</p></td>
                    <td className="table-cell hidden md:table-cell text-xs text-slate-500">{format(new Date(s.sale_date), 'dd MMM yyyy HH:mm')}</td>
                    <td className="table-cell text-right font-bold text-sm num text-slate-800">{formatKES(s.total_amount)}</td>
                    <td className="table-cell text-right text-sm num text-emerald-400 hidden sm:table-cell">{formatKES(s.amount_paid)}</td>
                    <td className="table-cell text-right text-sm num hidden sm:table-cell"><span className={s.balance_due > 0 ? 'text-red-400' : 'text-slate-400'}>{formatKES(s.balance_due)}</span></td>
                    <td className="table-cell text-center"><StatusBadge status={s.payment_status} /></td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            {(salesData || []).length === 0 && <div className="text-center py-10 text-slate-400 text-sm">No sales found</div>}
          </div>
        )}
      </div>
    </div>
  );
}


.Value >
              {creating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check size={18} />}
              {creating ? 'Creating Sale...' : 'Create Sale'}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Sales history table */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h3 className="section-title">Sales History</h3>
          <div className="flex items-center gap-2">
            <div className="relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={saleFilter} onChange={e => setSaleFilter(e.target.value)} placeholder="Search sale #..." className="input-field pl-8 py-2 text-xs w-40" />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-field py-2 text-xs w-36">
              <option value="">All Status</option>
              <option value="paid">Paid</option><option value="partial">Partial</option>
              <option value="credit">Credit</option><option value="pending">Pending</option>
            </select>
          </div>
        </div>
        {salesLoading ? <LoadingSpinner /> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-slate-100">
                <th className="table-header text-left">Sale #</th><th className="table-header text-left">Customer</th>
                <th className="table-header text-left hidden md:table-cell">Date</th><th className="table-header text-right">Amount</th>
                <th className="table-header text-right hidden sm:table-cell">Paid</th><th className="table-header text-right hidden sm:table-cell">Balance</th>
                <th className="table-header text-center">Status</th>
              </tr></thead>
              <tbody>
                {(salesData || []).map((s, i) => (
                  <motion.tr key={s.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="table-row">
                    <td className="table-cell"><span className="font-mono text-xs text-emerald-400">{s.sale_number}</span></td>
                    <td className="table-cell"><p className="text-sm text-slate-800">{s.customer?.name || '—'}</p><p className="text-xs text-slate-400">{s.customer?.customer_code}</p></td>
                    <td className="table-cell hidden md:table-cell text-xs text-slate-500">{format(new Date(s.sale_date), 'dd MMM yyyy HH:mm')}</td>
                    <td className="table-cell text-right font-bold text-sm num text-slate-800">{formatKES(s.total_amount)}</td>
                    <td className="table-cell text-right text-sm num text-emerald-400 hidden sm:table-cell">{formatKES(s.amount_paid)}</td>
                    <td className="table-cell text-right text-sm num hidden sm:table-cell"><span className={s.balance_due > 0 ? 'text-red-400' : 'text-slate-400'}>{formatKES(s.balance_due)}</span></td>
                    <td className="table-cell text-center"><StatusBadge status={s.payment_status} /></td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            {(salesData || []).length === 0 && <div className="text-center py-10 text-slate-400 text-sm">No sales found</div>}
          </div>
        )}
      </div>
    </div>
  );
}



