import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Search, User, Fuel, Plus, Minus, Trash2, Receipt, CreditCard, Banknote, Smartphone, Landmark, Package } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { salesApi, customersApi, productsApi } from '../services/api';
import { Customer, Product, Sale } from '../types';
import PageHeader from '../components/shared/PageHeader';
import LoadingSpinner from '../components/shared/LoadingSpinner';

const PAYMENT_CHANNELS = [
  { id: 'cash',          label: 'Cash',         icon: Banknote  },
  { id: 'mpesa_stk',     label: 'M-Pesa',       icon: Smartphone },
  { id: 'bank_deposit',  label: 'Bank Deposit', icon: Landmark  },
  { id: 'pesalink',      label: 'PesaLink',     icon: CreditCard },
  { id: 'bank_transfer', label: 'Bank Transfer',icon: Landmark  },
];

interface CartItem { product: Product; litres: number; }

function SalesPOS() {
  const qc = useQueryClient();
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerList, setShowCustomerList] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentType, setPaymentType] = useState<'pay_now' | 'pay_later'>('pay_now');
  const [paymentChannel, setPaymentChannel] = useState('cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [notes, setNotes] = useState('');

  const { data: customers = [] } = useQuery({
    queryKey: ['customers', customerSearch],
    queryFn: () => customersApi.list({ search: customerSearch }).then(r => r.data.data as Customer[]),
    enabled: customerSearch.length > 1,
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.list().then(r => r.data.data as Product[]),
  });

  const subtotal = cart.reduce((s, item) => s + item.litres * item.product.selling_price_per_litre, 0);
  const paid = Number(amountPaid) || 0;
  const balance = paymentType === 'pay_later' ? subtotal : Math.max(0, subtotal - paid);

  const addToCart = (product: Product) => {
    setCart(c => {
      const existing = c.find(i => i.product.id === product.id);
      if (existing) return c.map(i => i.product.id === product.id ? { ...i, litres: i.litres + 10 } : i);
      return [...c, { product, litres: 10 }];
    });
  };

  const updateLitres = (productId: string, litres: number) => {
    if (litres <= 0) { setCart(c => c.filter(i => i.product.id !== productId)); return; }
    setCart(c => c.map(i => i.product.id === productId ? { ...i, litres } : i));
  };

  const mutation = useMutation({
    mutationFn: () => salesApi.create({
      customer_id: selectedCustomer?.id,
      payment_type: paymentType,
      payment_channel: paymentType === 'pay_now' ? paymentChannel : undefined,
      amount_paid: paymentType === 'pay_now' ? paid : 0,
      notes,
      items: cart.map(i => ({
        product_id: i.product.id,
        litres: i.litres,
        price_per_litre: i.product.selling_price_per_litre,
      })),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      toast.success('Sale recorded successfully!');
      setCart([]); setSelectedCustomer(null); setCustomerSearch('');
      setAmountPaid(''); setNotes(''); setPaymentType('pay_now');
    },
    onError: () => toast.error('Failed to record sale'),
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Left — Customer + Products */}
      <div className="lg:col-span-3 space-y-5">
        {/* Customer picker */}
        <div className="glass-card p-5">
          <label className="label">Select Customer</label>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={customerSearch}
              onChange={e => { setCustomerSearch(e.target.value); setShowCustomerList(true); setSelectedCustomer(null); }}
              className="input-field pl-9"
              placeholder="Search by name, code or phone..."
            />
          </div>
          {selectedCustomer && (
            <div className="mt-3 flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-white font-bold text-sm">
                {selectedCustomer.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-800 text-sm">{selectedCustomer.name}</p>
                <p className="text-xs text-slate-500">{selectedCustomer.customer_code} · Bal: KES {selectedCustomer.current_balance?.toLocaleString()}</p>
              </div>
              <button onClick={() => { setSelectedCustomer(null); setCustomerSearch(''); }} className="text-slate-400 hover:text-red-500 transition-colors">✕</button>
            </div>
          )}
          {showCustomerList && !selectedCustomer && customers.length > 0 && (
            <div className="mt-2 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden max-h-48 overflow-y-auto">
              {customers.map((c: Customer) => (
                <button key={c.id} onClick={() => { setSelectedCustomer(c); setCustomerSearch(c.name); setShowCustomerList(false); }}
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-colors">
                  <p className="text-sm font-medium text-slate-800">{c.name} <span className="text-slate-400 text-xs">({c.customer_code})</span></p>
                  <p className="text-xs text-slate-500">{c.phone}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Products */}
        <div className="glass-card p-5">
          <p className="section-title mb-3">Select Fuel Products</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {products.filter((p: Product) => p.is_active).map((p: Product) => {
              const inCart = cart.find(i => i.product.id === p.id);
              const isLow = p.current_stock_litres <= p.low_stock_alert_litres;
              return (
                <motion.button key={p.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => addToCart(p)}
                  className={`p-4 rounded-xl border-2 text-left transition-all relative ${inCart ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-slate-50'}`}>
                  <div className="w-8 h-8 rounded-lg mb-2 flex items-center justify-center" style={{ background: p.colour + '25' }}>
                    <Fuel size={16} style={{ color: p.colour }} />
                  </div>
                  <p className="font-semibold text-slate-800 text-sm">{p.name}</p>
                  <p className="text-emerald-600 font-bold text-sm mt-0.5">KES {p.selling_price_per_litre}<span className="text-xs font-normal text-slate-400">/L</span></p>
                  <p className="text-xs text-slate-400 mt-1">Stock: {p.current_stock_litres.toLocaleString()}L</p>
                  {isLow && <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500" title="Low stock" />}
                  {inCart && <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold">{inCart.litres}</div>}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Cart */}
        {cart.length > 0 && (
          <div className="glass-card p-5">
            <p className="section-title mb-3">Cart Items</p>
            <div className="space-y-3">
              {cart.map(item => (
                <div key={item.product.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: item.product.colour + '25' }}>
                    <Fuel size={15} style={{ color: item.product.colour }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 text-sm truncate">{item.product.name}</p>
                    <p className="text-xs text-slate-500">@ KES {item.product.selling_price_per_litre}/L</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateLitres(item.product.id, item.litres - 5)} className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100"><Minus size={12} /></button>
                    <div className="text-center">
                      <input type="number" value={item.litres} onChange={e => updateLitres(item.product.id, Number(e.target.value))}
                        className="w-16 text-center text-sm font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg py-1 outline-none" />
                      <p className="text-xs text-slate-400">litres</p>
                    </div>
                    <button onClick={() => updateLitres(item.product.id, item.litres + 5)} className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100"><Plus size={12} /></button>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-800 text-sm">KES {(item.litres * item.product.selling_price_per_litre).toLocaleString()}</p>
                    <button onClick={() => updateLitres(item.product.id, 0)} className="text-red-400 hover:text-red-600 mt-1"><Trash2 size={12} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right — Summary & Payment */}
      <div className="lg:col-span-2 space-y-4">
        <div className="glass-card p-5 sticky top-4">
          <p className="section-title mb-4">Sale Summary</p>

          {/* Pay type */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button onClick={() => setPaymentType('pay_now')}
              className={`py-2.5 rounded-xl text-sm font-semibold transition-all ${paymentType === 'pay_now' ? 'bg-emerald-500 text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
              💵 Pay Now
            </button>
            <button onClick={() => setPaymentType('pay_later')}
              disabled={!selectedCustomer}
              className={`py-2.5 rounded-xl text-sm font-semibold transition-all ${paymentType === 'pay_later' ? 'bg-amber-500 text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed'}`}>
              📋 Pay Later (Credit)
            </button>
          </div>

          {/* Totals */}
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Subtotal</span>
              <span className="text-slate-700">KES {subtotal.toLocaleString()}</span>
            </div>
            {paymentType === 'pay_now' && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Amount Paid</span>
                <input type="number" value={amountPaid} onChange={e => setAmountPaid(e.target.value)}
                  className="text-right w-28 border border-slate-200 rounded-lg px-2 py-1 text-sm text-slate-700 outline-none focus:border-emerald-400"
                  placeholder="0.00" />
              </div>
            )}
            <div className="flex justify-between font-bold text-base pt-2 border-t border-slate-200">
              <span className="text-slate-700">Total</span>
              <span className="text-slate-800">KES {subtotal.toLocaleString()}</span>
            </div>
            {balance > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-amber-600 font-medium">Balance Due</span>
                <span className="text-amber-600 font-bold">KES {balance.toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* Payment Method */}
          {paymentType === 'pay_now' && (
            <div className="mb-4">
              <p className="label">Payment Method</p>
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_CHANNELS.map(ch => (
                  <button key={ch.id} onClick={() => setPaymentChannel(ch.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all ${paymentChannel === ch.id ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'}`}>
                    <ch.icon size={14} /> {ch.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="mb-4">
            <label className="label">Notes (Optional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} className="input-field resize-none text-sm" rows={2} placeholder="Vehicle plate, delivery instructions..." />
          </div>

          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || cart.length === 0}
            className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-base"
          >
            {mutation.isPending ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing...</>
            ) : (
              <><Receipt size={16} /> Complete Sale · KES {subtotal.toLocaleString()}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function SalesList() {
  const { data: sales = [], isLoading } = useQuery({
    queryKey: ['sales'],
    queryFn: () => salesApi.list({}).then(r => r.data.data as Sale[]),
  });

  const statusColors: Record<string, string> = {
    paid: 'badge-green', partial: 'badge-yellow', credit: 'badge-orange',
    pending: 'badge-yellow', void: 'badge-red',
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="glass-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              {['Sale #', 'Date', 'Customer', 'Items', 'Total', 'Paid', 'Balance', 'Status'].map(h => (
                <th key={h} className="table-header text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sales.map((s: Sale, i: number) => (
              <motion.tr key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="table-row">
                <td className="table-cell text-xs font-medium text-emerald-600">{s.sale_number}</td>
                <td className="table-cell text-xs text-slate-500 whitespace-nowrap">{format(new Date(s.sale_date || s.created_at), 'dd MMM, HH:mm')}</td>
                <td className="table-cell text-slate-700 font-medium text-xs">{s.customer?.name || 'Walk-in'}</td>
                <td className="table-cell text-slate-500 text-xs">{s.items?.length || 0} item(s)</td>
                <td className="table-cell font-bold text-slate-800">KES {Number(s.total_amount).toLocaleString()}</td>
                <td className="table-cell text-emerald-600 font-medium">KES {Number(s.amount_paid).toLocaleString()}</td>
                <td className="table-cell text-amber-600 font-medium">{Number(s.balance_due) > 0 ? `KES ${Number(s.balance_due).toLocaleString()}` : '—'}</td>
                <td className="table-cell"><span className={`badge ${statusColors[s.payment_status] || 'badge-gray'} capitalize`}>{s.payment_status}</span></td>
              </motion.tr>
            ))}
            {sales.length === 0 && (
              <tr><td colSpan={8} className="text-center py-12 text-slate-400 text-sm">No sales recorded yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Sales() {
  const [tab, setTab] = useState<'pos' | 'list'>('pos');
  useEffect(() => { document.title = 'Sales — FuelFlow Pro'; }, []);

  return (
    <div className="space-y-5">
      <PageHeader
        title={tab === 'pos' ? 'Sales Point of Sale' : 'Sales History'}
        subtitle={tab === 'pos' ? 'Create fuel sales and manage transactions' : 'View and manage all sales records'}
        icon={ShoppingCart}
        actions={
          <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
            <button onClick={() => setTab('pos')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'pos' ? 'bg-emerald-500 text-white' : 'text-slate-500 hover:text-slate-700'}`}>
              POS
            </button>
            <button onClick={() => setTab('list')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'list' ? 'bg-emerald-500 text-white' : 'text-slate-500 hover:text-slate-700'}`}>
              History
            </button>
          </div>
        }
      />
      {tab === 'pos' ? <SalesPOS /> : <SalesList />}
    </div>
  );
}
