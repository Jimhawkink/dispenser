import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Fuel, Plus, Truck, AlertTriangle, X, Package } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { productsApi, stockApi } from '../services/api';
import { Product } from '../types';
import PageHeader from '../components/shared/PageHeader';
import LoadingSpinner from '../components/shared/LoadingSpinner';

function DeliveryModal({ products, onClose }: { products: Product[]; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    product_id: products[0]?.id || '',
    litres_delivered: '',
    cost_per_litre: '',
    supplier_name: '',
    invoice_number: '',
    vehicle_number: '',
    delivery_date: new Date().toISOString().split('T')[0],
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const mutation = useMutation({
    mutationFn: () => stockApi.addDelivery({
      ...form,
      litres_delivered: Number(form.litres_delivered),
      cost_per_litre: Number(form.cost_per_litre),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['deliveries'] });
      toast.success('Stock delivery recorded!');
      onClose();
    },
    onError: () => toast.error('Failed to record delivery'),
  });

  const total = Number(form.litres_delivered) * Number(form.cost_per_litre);

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="font-heading font-bold text-slate-800">Record Stock Delivery</h2>
            <p className="text-xs text-slate-500 mt-0.5">Add incoming fuel delivery to stock</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={18} /></button>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
          <div>
            <label className="label">Fuel Product *</label>
            <select value={form.product_id} onChange={e => set('product_id', e.target.value)} className="input-field">
              {products.map(p => <option key={p.id} value={p.id}>{p.name} (Stock: {p.current_stock_litres.toLocaleString()}L)</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Litres Delivered *</label>
              <input type="number" value={form.litres_delivered} onChange={e => set('litres_delivered', e.target.value)} className="input-field" placeholder="5000" />
            </div>
            <div>
              <label className="label">Cost per Litre (KES) *</label>
              <input type="number" step="0.01" value={form.cost_per_litre} onChange={e => set('cost_per_litre', e.target.value)} className="input-field" placeholder="125.00" />
            </div>
          </div>

          {total > 0 && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm">
              <span className="text-emerald-700 font-medium">Total Cost: </span>
              <span className="font-bold text-emerald-800">KES {total.toLocaleString()}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Supplier Name</label>
              <input value={form.supplier_name} onChange={e => set('supplier_name', e.target.value)} className="input-field" placeholder="Total Kenya" />
            </div>
            <div>
              <label className="label">Invoice Number</label>
              <input value={form.invoice_number} onChange={e => set('invoice_number', e.target.value)} className="input-field" placeholder="INV-001" />
            </div>
            <div>
              <label className="label">Delivery Vehicle</label>
              <input value={form.vehicle_number} onChange={e => set('vehicle_number', e.target.value)} className="input-field" placeholder="KBZ 123A" />
            </div>
            <div>
              <label className="label">Delivery Date</label>
              <input type="date" value={form.delivery_date} onChange={e => set('delivery_date', e.target.value)} className="input-field" />
            </div>
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
          <button type="button" onClick={onClose} className="btn-secondary flex-1 py-2.5">Cancel</button>
          <button
            type="button"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !form.product_id || !form.litres_delivered || !form.cost_per_litre}
            className="btn-primary flex-1 py-2.5 flex items-center justify-center gap-2"
          >
            {mutation.isPending && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            Record Delivery
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function StockCard({ product }: { product: Product }) {
  const pct = product.current_stock_litres / Math.max(product.current_stock_litres + 2000, product.low_stock_alert_litres * 3) * 100;
  const isLow = product.current_stock_litres <= product.low_stock_alert_litres;
  const barColor = isLow ? '#ef4444' : pct < 40 ? '#f59e0b' : '#10b981';

  return (
    <motion.div whileHover={{ y: -2 }} className={`glass-card p-5 ${isLow ? 'border-red-200' : ''}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: product.colour + '20' }}>
            <Fuel size={20} style={{ color: product.colour }} />
          </div>
          <div>
            <p className="font-semibold text-slate-800 text-sm">{product.name}</p>
            <p className="text-xs text-slate-400">{product.code} · KES {product.selling_price_per_litre}/L</p>
          </div>
        </div>
        {isLow && (
          <div className="flex items-center gap-1 text-xs text-red-600 bg-red-50 border border-red-200 px-2 py-1 rounded-full">
            <AlertTriangle size={11} /> Low Stock
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-slate-500">Current Stock</span>
          <span className="font-bold text-slate-700">{product.current_stock_litres.toLocaleString()} L</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <motion.div className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${Math.min(pct, 100)}%` }} transition={{ duration: 0.8 }} style={{ background: barColor }} />
        </div>
        <div className="flex justify-between text-xs text-slate-400">
          <span>Alert at {product.low_stock_alert_litres.toLocaleString()}L</span>
          <span>Buy: KES {product.buying_price_per_litre}/L</span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
        <div className="bg-slate-50 rounded-lg p-2 text-center">
          <p className="text-slate-500">Margin</p>
          <p className="font-bold text-emerald-600">KES {(product.selling_price_per_litre - product.buying_price_per_litre).toFixed(2)}</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-2 text-center">
          <p className="text-slate-500">Stock Value</p>
          <p className="font-bold text-slate-700">KES {(product.current_stock_litres * product.buying_price_per_litre).toLocaleString()}</p>
        </div>
      </div>
    </motion.div>
  );
}

export default function Stock() {
  const [showDelivery, setShowDelivery] = useState(false);
  useEffect(() => { document.title = 'Stock — FuelFlow Pro'; }, []);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.list().then(r => r.data.data as Product[]),
  });

  const { data: deliveries = [] } = useQuery({
    queryKey: ['deliveries'],
    queryFn: () => stockApi.getDeliveries().then(r => r.data.data),
  });

  const lowStock = products.filter((p: Product) => p.current_stock_litres <= p.low_stock_alert_litres);
  const totalValue = products.reduce((sum: number, p: Product) => sum + p.current_stock_litres * p.buying_price_per_litre, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock Management"
        subtitle="Monitor fuel inventory and record deliveries"
        icon={Fuel}
        actions={
          <button onClick={() => setShowDelivery(true)} className="btn-primary text-sm py-2 flex items-center gap-2">
            <Plus size={14} /> Record Delivery
          </button>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Products', value: products.length, color: 'text-slate-700', bg: 'bg-slate-50' },
          { label: 'Low Stock Alerts', value: lowStock.length, color: lowStock.length > 0 ? 'text-red-600' : 'text-emerald-600', bg: lowStock.length > 0 ? 'bg-red-50' : 'bg-emerald-50' },
          { label: 'Total Deliveries', value: deliveries.length, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Stock Value', value: `KES ${(totalValue / 1000).toFixed(0)}K`, color: 'text-emerald-700', bg: 'bg-emerald-50' },
        ].map((s, i) => (
          <div key={i} className={`glass-card p-4 ${s.bg}`}>
            <p className="text-xs text-slate-500 mb-1">{s.label}</p>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {isLoading ? <LoadingSpinner /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {products.map((p: Product, i: number) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
              <StockCard product={p} />
            </motion.div>
          ))}
        </div>
      )}

      {/* Recent Deliveries */}
      {deliveries.length > 0 && (
        <div className="glass-card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <Truck size={16} className="text-slate-500" />
            <h3 className="font-semibold text-slate-700 text-sm">Recent Deliveries</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  {['Date', 'Product', 'Litres', 'Cost/L', 'Total', 'Supplier', 'Invoice'].map(h => (
                    <th key={h} className="table-header text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {deliveries.slice(0, 10).map((d: any) => (
                  <tr key={d.id} className="table-row">
                    <td className="table-cell text-slate-500 whitespace-nowrap">{format(new Date(d.delivery_date), 'dd MMM yyyy')}</td>
                    <td className="table-cell font-medium text-slate-700">{d.product?.name || d.product_id}</td>
                    <td className="table-cell text-slate-600">{Number(d.litres_delivered).toLocaleString()}L</td>
                    <td className="table-cell text-slate-600">KES {d.cost_per_litre}</td>
                    <td className="table-cell font-semibold text-slate-700">KES {Number(d.total_cost || d.litres_delivered * d.cost_per_litre).toLocaleString()}</td>
                    <td className="table-cell text-slate-500">{d.supplier_name || '—'}</td>
                    <td className="table-cell text-slate-400">{d.invoice_number || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showDelivery && <DeliveryModal products={products} onClose={() => setShowDelivery(false)} />}
    </div>
  );
}
