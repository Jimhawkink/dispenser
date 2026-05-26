import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Fuel, Plus, Truck, AlertTriangle, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { stockApi, productsApi } from '../services/api';
import { Product, StockDelivery, formatKES, formatLitres } from '../types';
import PageHeader from '../components/shared/PageHeader';
import LoadingSpinner from '../components/shared/LoadingSpinner';

function DeliveryModal({ products, onClose, onSuccess }: { products: Product[]; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ product_id: '', litres_delivered: '', cost_per_litre: '', supplier_name: '', invoice_number: '', vehicle_number: '', delivery_date: new Date().toISOString().slice(0, 10), notes: '' });
  const [loading, setLoading] = useState(false);
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const selectedProduct = products.find(p => p.id === form.product_id);
  const totalCost = parseFloat(form.litres_delivered || '0') * parseFloat(form.cost_per_litre || '0');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.product_id || !form.litres_delivered || !form.cost_per_litre) { toast.error('Product, litres and cost are required'); return; }
    setLoading(true);
    try {
      await stockApi.recordDelivery({ ...form, litres_delivered: parseFloat(form.litres_delivered), cost_per_litre: parseFloat(form.cost_per_litre) });
      toast.success(`Delivery of ${formatLitres(parseFloat(form.litres_delivered))} recorded!`);
      onSuccess(); onClose();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to record delivery');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h3 className="font-heading font-semibold text-slate-800 flex items-center gap-2"><Truck size={16} className="text-emerald-400" /> Record Delivery</h3>
          <button onClick={onClose}><X size={18} className="text-slate-500 hover:text-slate-900" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="label">Fuel Product *</label>
            <select value={form.product_id} onChange={e => set('product_id', e.target.value)} className="input-field" required>
              <option value="">Select product...</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name} (Current: {formatLitres(p.current_stock_litres)})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Litres Delivered *</label><input type="number" value={form.litres_delivered} onChange={e => set('litres_delivered', e.target.value)} className="input-field num" placeholder="5000" required /></div>
            <div><label className="label">Cost per Litre *</label><input type="number" value={form.cost_per_litre} onChange={e => set('cost_per_litre', e.target.value)} className="input-field num" placeholder="140.50" required /></div>
          </div>
          {totalCost > 0 && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <div className="flex justify-between text-sm"><span className="text-slate-500">Total Cost</span><span className="text-emerald-400 font-bold num">{formatKES(totalCost)}</span></div>
              {selectedProduct && <div className="flex justify-between text-xs mt-1"><span className="text-slate-400">New Stock</span><span className="text-slate-600 num">{formatLitres(selectedProduct.current_stock_litres + parseFloat(form.litres_delivered || '0'))}</span></div>}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Supplier Name</label><input value={form.supplier_name} onChange={e => set('supplier_name', e.target.value)} className="input-field" placeholder="Kenol Kobil" /></div>
            <div><label className="label">Invoice #</label><input value={form.invoice_number} onChange={e => set('invoice_number', e.target.value)} className="input-field" placeholder="INV-001" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Delivery Vehicle</label><input value={form.vehicle_number} onChange={e => set('vehicle_number', e.target.value)} className="input-field" placeholder="KBZ 123A" /></div>
            <div><label className="label">Delivery Date</label><input type="date" value={form.delivery_date} onChange={e => set('delivery_date', e.target.value)} className="input-field" /></div>
          </div>
          <div><label className="label">Notes</label><textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} className="input-field resize-none" placeholder="Additional details..." /></div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 py-2.5">Cancel</button>
            <button type="submit" disabled={loading}  import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Fuel, Plus, Truck, AlertTriangle, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { stockApi, productsApi } from '../services/api';
import { Product, StockDelivery, formatKES, formatLitres } from '../types';
import PageHeader from '../components/shared/PageHeader';
import LoadingSpinner from '../components/shared/LoadingSpinner';

function DeliveryModal({ products, onClose, onSuccess }: { products: Product[]; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ product_id: '', litres_delivered: '', cost_per_litre: '', supplier_name: '', invoice_number: '', vehicle_number: '', delivery_date: new Date().toISOString().slice(0, 10), notes: '' });
  const [loading, setLoading] = useState(false);
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const selectedProduct = products.find(p => p.id === form.product_id);
  const totalCost = parseFloat(form.litres_delivered || '0') * parseFloat(form.cost_per_litre || '0');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.product_id || !form.litres_delivered || !form.cost_per_litre) { toast.error('Product, litres and cost are required'); return; }
    setLoading(true);
    try {
      await stockApi.recordDelivery({ ...form, litres_delivered: parseFloat(form.litres_delivered), cost_per_litre: parseFloat(form.cost_per_litre) });
      toast.success(`Delivery of ${formatLitres(parseFloat(form.litres_delivered))} recorded!`);
      onSuccess(); onClose();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to record delivery');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h3 className="font-heading font-semibold text-slate-800 flex items-center gap-2"><Truck size={16} className="text-emerald-400" /> Record Delivery</h3>
          <button onClick={onClose}><X size={18} className="text-slate-500 hover:text-slate-900" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="label">Fuel Product *</label>
            <select value={form.product_id} onChange={e => set('product_id', e.target.value)} className="input-field" required>
              <option value="">Select product...</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name} (Current: {formatLitres(p.current_stock_litres)})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Litres Delivered *</label><input type="number" value={form.litres_delivered} onChange={e => set('litres_delivered', e.target.value)} className="input-field num" placeholder="5000" required /></div>
            <div><label className="label">Cost per Litre *</label><input type="number" value={form.cost_per_litre} onChange={e => set('cost_per_litre', e.target.value)} className="input-field num" placeholder="140.50" required /></div>
          </div>
          {totalCost > 0 && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <div className="flex justify-between text-sm"><span className="text-slate-500">Total Cost</span><span className="text-emerald-400 font-bold num">{formatKES(totalCost)}</span></div>
              {selectedProduct && <div className="flex justify-between text-xs mt-1"><span className="text-slate-400">New Stock</span><span className="text-slate-600 num">{formatLitres(selectedProduct.current_stock_litres + parseFloat(form.litres_delivered || '0'))}</span></div>}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Supplier Name</label><input value={form.supplier_name} onChange={e => set('supplier_name', e.target.value)} className="input-field" placeholder="Kenol Kobil" /></div>
            <div><label className="label">Invoice #</label><input value={form.invoice_number} onChange={e => set('invoice_number', e.target.value)} className="input-field" placeholder="INV-001" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Delivery Vehicle</label><input value={form.vehicle_number} onChange={e => set('vehicle_number', e.target.value)} className="input-field" placeholder="KBZ 123A" /></div>
            <div><label className="label">Delivery Date</label><input type="date" value={form.delivery_date} onChange={e => set('delivery_date', e.target.value)} className="input-field" /></div>
          </div>
          <div><label className="label">Notes</label><textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} className="input-field resize-none" placeholder="Additional details..." /></div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 py-2.5">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 py-2.5 flex items-center justify-center gap-2">
              {loading && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              Record Delivery
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function Stock() {
  const [showDelivery, setShowDelivery] = useState(false);
  useEffect(() => { document.title = 'Stock — FuelFlow Pro'; }, []);

  const { data: products, isLoading: prodLoading, refetch: refetchProducts } = useQuery({
    queryKey: ['products-stock'], queryFn: () => productsApi.list().then(r => r.data.data as Product[]),
  });
  const { data: deliveries, isLoading: delLoading, refetch: refetchDel } = useQuery({
    queryKey: ['deliveries'], queryFn: () => stockApi.getDeliveries({ limit: 50 }).then(r => r.data.data as StockDelivery[]),
  });

  const lowStock = (products || []).filter(p => p.current_stock_litres <= p.low_stock_alert_litres);

  return (
    <div className="space-y-6">
      <PageHeader title="Fuel Stock" subtitle="Inventory levels and delivery records" icon={Fuel}
        actions={<button onClick={() => setShowDelivery(true)} className="btn-primary text-sm py-2 flex items-center gap-2"><Plus size={14} /> Record Delivery</button>}
      />

      {/* Low stock alert */}
      {lowStock.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3">
          <AlertTriangle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-400 font-semibold text-sm">Low Stock Alert: {lowStock.map(p => p.name).join(', ')}</p>
            <p className="text-slate-500 text-xs mt-0.5">These products are at or below their alert thresholds. Schedule a delivery immediately.</p>
          </div>
        </motion.div>
      )}

      {/* Stock cards */}
      {prodLoading ? <LoadingSpinner /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(products || []).map((p, i) => {
            const pct = Math.min(100, (p.current_stock_litres / Math.max(p.low_stock_alert_litres * 5, 1)) * 100);
            const isLow = p.current_stock_litres <= p.low_stock_alert_litres;
            const isCritical = p.current_stock_litres <= p.low_stock_alert_litres * 0.5;
            return (
              <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className={`glass-card p-5 ${isCritical ? 'border-red-500/30' : isLow ? 'border-amber-500/25' : ''}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: p.colour }} />
                    <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{p.code}</span>
                  </div>
                  {(isLow || isCritical) && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isCritical ? 'bg-red-500/15 text-red-400' : 'bg-amber-500/15 text-amber-400'}`}>
                      {isCritical ? '🔴 Critical' : '🟡 Low'}
                    </span>
                  )}
                </div>
                <h3 className="font-heading font-semibold text-slate-800 text-lg mb-1">{p.name}</h3>
                <p className="font-heading font-bold text-3xl num" style={{ color: p.colour }}>{formatLitres(p.current_stock_litres)}</p>
                <div className="mt-3 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, delay: i * 0.1 }}
                    className="h-full rounded-full" style={{ background: isCritical ? '#ef4444' : isLow ? '#f59e0b' : p.colour }} />
                </div>
                <div className="flex justify-between mt-2 text-xs text-slate-400">
                  <span>Alert: {formatLitres(p.low_stock_alert_litres)}</span>
                  <span>{pct.toFixed(0)}% of capacity</span>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-slate-400 text-xs">Buying Price</p><p className="text-slate-700 font-medium num">KES {p.buying_price_per_litre.toFixed(2)}</p></div>
                  <div><p className="text-slate-400 text-xs">Selling Price</p><p className="text-emerald-400 font-bold num">KES {p.selling_price_per_litre.toFixed(2)}</p></div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Delivery history */}
      <div className="glass-card p-5">
        <h3 className="section-title mb-4 flex items-center gap-2"><Truck size={16} className="text-blue-400" /> Delivery History</h3>
        {delLoading ? <LoadingSpinner size="sm" /> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-slate-100">
                <th className="table-header text-left">Date</th><th className="table-header text-left">Product</th>
                <th className="table-header text-right">Litres</th><th className="table-header text-right">Cost/L</th>
                <th className="table-header text-right">Total Cost</th><th className="table-header text-left hidden md:table-cell">Supplier</th>
                <th className="table-header text-left hidden lg:table-cell">Invoice</th>
              </tr></thead>
              <tbody>
                {(deliveries || []).map((d, i) => (
                  <motion.tr key={d.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="table-row">
                    <td className="table-cell text-xs text-slate-500 whitespace-nowrap">{format(new Date(d.delivery_date), 'dd MMM yyyy')}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: (d.product as Product)?.colour || '#10b981' }} />
                        <span className="text-sm text-slate-800">{(d.product as Product)?.name || '—'}</span>
                      </div>
                    </td>
                    <td className="table-cell text-right font-bold text-emerald-400 num">{formatLitres(d.litres_delivered)}</td>
                    <td className="table-cell text-right text-sm num text-slate-600">KES {d.cost_per_litre.toFixed(2)}</td>
                    <td className="table-cell text-right font-bold text-sm num text-slate-800">{formatKES(d.total_cost)}</td>
                    <td className="table-cell hidden md:table-cell text-xs text-slate-500">{d.supplier_name || '—'}</td>
                    <td className="table-cell hidden lg:table-cell text-xs font-mono text-slate-400">{d.invoice_number || '—'}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            {(deliveries || []).length === 0 && <div className="text-center py-10 text-slate-400 text-sm">No deliveries recorded yet</div>}
          </div>
        )}
      </div>

      {showDelivery && <DeliveryModal products={products || []} onClose={() => setShowDelivery(false)} onSuccess={() => { refetchProducts(); refetchDel(); }} />}
    </div>
  );
}


.Value >
              {loading && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              Record Delivery
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function Stock() {
  const [showDelivery, setShowDelivery] = useState(false);
  useEffect(() => { document.title = 'Stock — FuelFlow Pro'; }, []);

  const { data: products, isLoading: prodLoading, refetch: refetchProducts } = useQuery({
    queryKey: ['products-stock'], queryFn: () => productsApi.list().then(r => r.data.data as Product[]),
  });
  const { data: deliveries, isLoading: delLoading, refetch: refetchDel } = useQuery({
    queryKey: ['deliveries'], queryFn: () => stockApi.getDeliveries({ limit: 50 }).then(r => r.data.data as StockDelivery[]),
  });

  const lowStock = (products || []).filter(p => p.current_stock_litres <= p.low_stock_alert_litres);

  return (
    <div className="space-y-6">
      <PageHeader title="Fuel Stock" subtitle="Inventory levels and delivery records" icon={Fuel}
        actions={<button onClick={() => setShowDelivery(true)}  import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Fuel, Plus, Truck, AlertTriangle, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { stockApi, productsApi } from '../services/api';
import { Product, StockDelivery, formatKES, formatLitres } from '../types';
import PageHeader from '../components/shared/PageHeader';
import LoadingSpinner from '../components/shared/LoadingSpinner';

function DeliveryModal({ products, onClose, onSuccess }: { products: Product[]; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ product_id: '', litres_delivered: '', cost_per_litre: '', supplier_name: '', invoice_number: '', vehicle_number: '', delivery_date: new Date().toISOString().slice(0, 10), notes: '' });
  const [loading, setLoading] = useState(false);
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const selectedProduct = products.find(p => p.id === form.product_id);
  const totalCost = parseFloat(form.litres_delivered || '0') * parseFloat(form.cost_per_litre || '0');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.product_id || !form.litres_delivered || !form.cost_per_litre) { toast.error('Product, litres and cost are required'); return; }
    setLoading(true);
    try {
      await stockApi.recordDelivery({ ...form, litres_delivered: parseFloat(form.litres_delivered), cost_per_litre: parseFloat(form.cost_per_litre) });
      toast.success(`Delivery of ${formatLitres(parseFloat(form.litres_delivered))} recorded!`);
      onSuccess(); onClose();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to record delivery');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h3 className="font-heading font-semibold text-slate-800 flex items-center gap-2"><Truck size={16} className="text-emerald-400" /> Record Delivery</h3>
          <button onClick={onClose}><X size={18} className="text-slate-500 hover:text-slate-900" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="label">Fuel Product *</label>
            <select value={form.product_id} onChange={e => set('product_id', e.target.value)} className="input-field" required>
              <option value="">Select product...</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name} (Current: {formatLitres(p.current_stock_litres)})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Litres Delivered *</label><input type="number" value={form.litres_delivered} onChange={e => set('litres_delivered', e.target.value)} className="input-field num" placeholder="5000" required /></div>
            <div><label className="label">Cost per Litre *</label><input type="number" value={form.cost_per_litre} onChange={e => set('cost_per_litre', e.target.value)} className="input-field num" placeholder="140.50" required /></div>
          </div>
          {totalCost > 0 && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <div className="flex justify-between text-sm"><span className="text-slate-500">Total Cost</span><span className="text-emerald-400 font-bold num">{formatKES(totalCost)}</span></div>
              {selectedProduct && <div className="flex justify-between text-xs mt-1"><span className="text-slate-400">New Stock</span><span className="text-slate-600 num">{formatLitres(selectedProduct.current_stock_litres + parseFloat(form.litres_delivered || '0'))}</span></div>}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Supplier Name</label><input value={form.supplier_name} onChange={e => set('supplier_name', e.target.value)} className="input-field" placeholder="Kenol Kobil" /></div>
            <div><label className="label">Invoice #</label><input value={form.invoice_number} onChange={e => set('invoice_number', e.target.value)} className="input-field" placeholder="INV-001" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Delivery Vehicle</label><input value={form.vehicle_number} onChange={e => set('vehicle_number', e.target.value)} className="input-field" placeholder="KBZ 123A" /></div>
            <div><label className="label">Delivery Date</label><input type="date" value={form.delivery_date} onChange={e => set('delivery_date', e.target.value)} className="input-field" /></div>
          </div>
          <div><label className="label">Notes</label><textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} className="input-field resize-none" placeholder="Additional details..." /></div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 py-2.5">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 py-2.5 flex items-center justify-center gap-2">
              {loading && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              Record Delivery
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function Stock() {
  const [showDelivery, setShowDelivery] = useState(false);
  useEffect(() => { document.title = 'Stock — FuelFlow Pro'; }, []);

  const { data: products, isLoading: prodLoading, refetch: refetchProducts } = useQuery({
    queryKey: ['products-stock'], queryFn: () => productsApi.list().then(r => r.data.data as Product[]),
  });
  const { data: deliveries, isLoading: delLoading, refetch: refetchDel } = useQuery({
    queryKey: ['deliveries'], queryFn: () => stockApi.getDeliveries({ limit: 50 }).then(r => r.data.data as StockDelivery[]),
  });

  const lowStock = (products || []).filter(p => p.current_stock_litres <= p.low_stock_alert_litres);

  return (
    <div className="space-y-6">
      <PageHeader title="Fuel Stock" subtitle="Inventory levels and delivery records" icon={Fuel}
        actions={<button onClick={() => setShowDelivery(true)} className="btn-primary text-sm py-2 flex items-center gap-2"><Plus size={14} /> Record Delivery</button>}
      />

      {/* Low stock alert */}
      {lowStock.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3">
          <AlertTriangle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-400 font-semibold text-sm">Low Stock Alert: {lowStock.map(p => p.name).join(', ')}</p>
            <p className="text-slate-500 text-xs mt-0.5">These products are at or below their alert thresholds. Schedule a delivery immediately.</p>
          </div>
        </motion.div>
      )}

      {/* Stock cards */}
      {prodLoading ? <LoadingSpinner /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(products || []).map((p, i) => {
            const pct = Math.min(100, (p.current_stock_litres / Math.max(p.low_stock_alert_litres * 5, 1)) * 100);
            const isLow = p.current_stock_litres <= p.low_stock_alert_litres;
            const isCritical = p.current_stock_litres <= p.low_stock_alert_litres * 0.5;
            return (
              <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className={`glass-card p-5 ${isCritical ? 'border-red-500/30' : isLow ? 'border-amber-500/25' : ''}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: p.colour }} />
                    <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{p.code}</span>
                  </div>
                  {(isLow || isCritical) && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isCritical ? 'bg-red-500/15 text-red-400' : 'bg-amber-500/15 text-amber-400'}`}>
                      {isCritical ? '🔴 Critical' : '🟡 Low'}
                    </span>
                  )}
                </div>
                <h3 className="font-heading font-semibold text-slate-800 text-lg mb-1">{p.name}</h3>
                <p className="font-heading font-bold text-3xl num" style={{ color: p.colour }}>{formatLitres(p.current_stock_litres)}</p>
                <div className="mt-3 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, delay: i * 0.1 }}
                    className="h-full rounded-full" style={{ background: isCritical ? '#ef4444' : isLow ? '#f59e0b' : p.colour }} />
                </div>
                <div className="flex justify-between mt-2 text-xs text-slate-400">
                  <span>Alert: {formatLitres(p.low_stock_alert_litres)}</span>
                  <span>{pct.toFixed(0)}% of capacity</span>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-slate-400 text-xs">Buying Price</p><p className="text-slate-700 font-medium num">KES {p.buying_price_per_litre.toFixed(2)}</p></div>
                  <div><p className="text-slate-400 text-xs">Selling Price</p><p className="text-emerald-400 font-bold num">KES {p.selling_price_per_litre.toFixed(2)}</p></div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Delivery history */}
      <div className="glass-card p-5">
        <h3 className="section-title mb-4 flex items-center gap-2"><Truck size={16} className="text-blue-400" /> Delivery History</h3>
        {delLoading ? <LoadingSpinner size="sm" /> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-slate-100">
                <th className="table-header text-left">Date</th><th className="table-header text-left">Product</th>
                <th className="table-header text-right">Litres</th><th className="table-header text-right">Cost/L</th>
                <th className="table-header text-right">Total Cost</th><th className="table-header text-left hidden md:table-cell">Supplier</th>
                <th className="table-header text-left hidden lg:table-cell">Invoice</th>
              </tr></thead>
              <tbody>
                {(deliveries || []).map((d, i) => (
                  <motion.tr key={d.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="table-row">
                    <td className="table-cell text-xs text-slate-500 whitespace-nowrap">{format(new Date(d.delivery_date), 'dd MMM yyyy')}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: (d.product as Product)?.colour || '#10b981' }} />
                        <span className="text-sm text-slate-800">{(d.product as Product)?.name || '—'}</span>
                      </div>
                    </td>
                    <td className="table-cell text-right font-bold text-emerald-400 num">{formatLitres(d.litres_delivered)}</td>
                    <td className="table-cell text-right text-sm num text-slate-600">KES {d.cost_per_litre.toFixed(2)}</td>
                    <td className="table-cell text-right font-bold text-sm num text-slate-800">{formatKES(d.total_cost)}</td>
                    <td className="table-cell hidden md:table-cell text-xs text-slate-500">{d.supplier_name || '—'}</td>
                    <td className="table-cell hidden lg:table-cell text-xs font-mono text-slate-400">{d.invoice_number || '—'}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            {(deliveries || []).length === 0 && <div className="text-center py-10 text-slate-400 text-sm">No deliveries recorded yet</div>}
          </div>
        )}
      </div>

      {showDelivery && <DeliveryModal products={products || []} onClose={() => setShowDelivery(false)} onSuccess={() => { refetchProducts(); refetchDel(); }} />}
    </div>
  );
}


.Value ><Plus size={14} /> Record Delivery</button>}
      />

      {/* Low stock alert */}
      {lowStock.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3">
          <AlertTriangle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-400 font-semibold text-sm">Low Stock Alert: {lowStock.map(p => p.name).join(', ')}</p>
            <p className="text-slate-500 text-xs mt-0.5">These products are at or below their alert thresholds. Schedule a delivery immediately.</p>
          </div>
        </motion.div>
      )}

      {/* Stock cards */}
      {prodLoading ? <LoadingSpinner /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(products || []).map((p, i) => {
            const pct = Math.min(100, (p.current_stock_litres / Math.max(p.low_stock_alert_litres * 5, 1)) * 100);
            const isLow = p.current_stock_litres <= p.low_stock_alert_litres;
            const isCritical = p.current_stock_litres <= p.low_stock_alert_litres * 0.5;
            return (
              <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className={`glass-card p-5 ${isCritical ? 'border-red-500/30' : isLow ? 'border-amber-500/25' : ''}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: p.colour }} />
                    <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{p.code}</span>
                  </div>
                  {(isLow || isCritical) && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isCritical ? 'bg-red-500/15 text-red-400' : 'bg-amber-500/15 text-amber-400'}`}>
                      {isCritical ? '🔴 Critical' : '🟡 Low'}
                    </span>
                  )}
                </div>
                <h3 className="font-heading font-semibold text-slate-800 text-lg mb-1">{p.name}</h3>
                <p className="font-heading font-bold text-3xl num" style={{ color: p.colour }}>{formatLitres(p.current_stock_litres)}</p>
                <div className="mt-3 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, delay: i * 0.1 }}
                    className="h-full rounded-full" style={{ background: isCritical ? '#ef4444' : isLow ? '#f59e0b' : p.colour }} />
                </div>
                <div className="flex justify-between mt-2 text-xs text-slate-400">
                  <span>Alert: {formatLitres(p.low_stock_alert_litres)}</span>
                  <span>{pct.toFixed(0)}% of capacity</span>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-slate-400 text-xs">Buying Price</p><p className="text-slate-700 font-medium num">KES {p.buying_price_per_litre.toFixed(2)}</p></div>
                  <div><p className="text-slate-400 text-xs">Selling Price</p><p className="text-emerald-400 font-bold num">KES {p.selling_price_per_litre.toFixed(2)}</p></div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Delivery history */}
      <div className="glass-card p-5">
        <h3 className="section-title mb-4 flex items-center gap-2"><Truck size={16} className="text-blue-400" /> Delivery History</h3>
        {delLoading ? <LoadingSpinner size="sm" /> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-slate-100">
                <th className="table-header text-left">Date</th><th className="table-header text-left">Product</th>
                <th className="table-header text-right">Litres</th><th className="table-header text-right">Cost/L</th>
                <th className="table-header text-right">Total Cost</th><th className="table-header text-left hidden md:table-cell">Supplier</th>
                <th className="table-header text-left hidden lg:table-cell">Invoice</th>
              </tr></thead>
              <tbody>
                {(deliveries || []).map((d, i) => (
                  <motion.tr key={d.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="table-row">
                    <td className="table-cell text-xs text-slate-500 whitespace-nowrap">{format(new Date(d.delivery_date), 'dd MMM yyyy')}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: (d.product as Product)?.colour || '#10b981' }} />
                        <span className="text-sm text-slate-800">{(d.product as Product)?.name || '—'}</span>
                      </div>
                    </td>
                    <td className="table-cell text-right font-bold text-emerald-400 num">{formatLitres(d.litres_delivered)}</td>
                    <td className="table-cell text-right text-sm num text-slate-600">KES {d.cost_per_litre.toFixed(2)}</td>
                    <td className="table-cell text-right font-bold text-sm num text-slate-800">{formatKES(d.total_cost)}</td>
                    <td className="table-cell hidden md:table-cell text-xs text-slate-500">{d.supplier_name || '—'}</td>
                    <td className="table-cell hidden lg:table-cell text-xs font-mono text-slate-400">{d.invoice_number || '—'}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            {(deliveries || []).length === 0 && <div className="text-center py-10 text-slate-400 text-sm">No deliveries recorded yet</div>}
          </div>
        )}
      </div>

      {showDelivery && <DeliveryModal products={products || []} onClose={() => setShowDelivery(false)} onSuccess={() => { refetchProducts(); refetchDel(); }} />}
    </div>
  );
}



