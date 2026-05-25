import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { Zap, Wifi, WifiOff } from 'lucide-react';
import { Payment, CHANNEL_LABELS, PaymentChannel, formatKES } from '../../types';
import { useRealtimePayments } from '../../hooks/useRealtime';
import { paymentsApi } from '../../services/api';
import StatusBadge from '../shared/StatusBadge';

function ChannelIcon({ channel }: { channel: PaymentChannel }) {
  const icons: Record<string, { label: string; bg: string; text: string; char: string }> = {
    mpesa_stk:     { label: 'M', bg: 'bg-emerald-500/20', text: 'text-emerald-400', char: 'M' },
    mpesa_c2b:     { label: 'M', bg: 'bg-emerald-500/20', text: 'text-emerald-400', char: 'M' },
    pesalink:      { label: 'P', bg: 'bg-purple-500/20',  text: 'text-purple-400',  char: 'P' },
    bank_transfer: { label: 'B', bg: 'bg-blue-500/20',    text: 'text-blue-400',    char: 'B' },
    bank_deposit:  { label: 'D', bg: 'bg-red-500/20',     text: 'text-red-400',     char: 'D' },
    cash:          { label: 'C', bg: 'bg-amber-500/20',   text: 'text-amber-400',   char: '$' },
    intasend:      { label: 'I', bg: 'bg-cyan-500/20',    text: 'text-cyan-400',    char: 'I' },
  };
  const cfg = icons[channel] || icons.cash;
  return (
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${cfg.bg} ${cfg.text} flex-shrink-0`}>
      {cfg.char}
    </div>
  );
}

export default function LivePaymentFeed() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const [isLive, setIsLive] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    paymentsApi.list({ limit: 20 }).then(res => {
      setPayments(res.data.data || []);
    }).catch(console.error);
  }, []);

  useRealtimePayments((payment) => {
    setIsLive(true);
    setPayments(prev => [payment, ...prev.slice(0, 19)]);
    setNewIds(prev => new Set([...prev, payment.id]));
    setTimeout(() => setNewIds(prev => { const s = new Set(prev); s.delete(payment.id); return s; }), 2000);
    if (listRef.current) listRef.current.scrollTop = 0;
  });

  return (
    <div className="glass-card p-5 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap size={16} className="text-emerald-400" />
          <h3 className="section-title">Live Payment Feed</h3>
        </div>
        <div className="flex items-center gap-2">
          {isLive ? (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400">
              <span className="live-dot" /> Live
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <WifiOff size={10} /> Polling
            </span>
          )}
        </div>
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto space-y-2 pr-1">
        <AnimatePresence initial={false}>
          {payments.length === 0 && (
            <div className="text-center py-10 text-gray-500 text-sm">No payments yet today</div>
          )}
          {payments.map((p) => (
            <motion.div
              key={p.id}
              layout
              initial={{ opacity: 0, y: -20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-300 ${newIds.has(p.id) ? 'border-emerald-500/40 bg-emerald-500/10 payment-new' : 'border-gray-800/40 bg-gray-800/20 hover:bg-gray-800/40'}`}
            >
              <ChannelIcon channel={p.payment_channel} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-white truncate">
                    {p.customer?.name || p.payer_name || 'Unknown'}
                  </p>
                  <p className="text-sm font-bold text-emerald-400 num flex-shrink-0">{formatKES(p.amount)}</p>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-xs text-gray-500 truncate">
                    {CHANNEL_LABELS[p.payment_channel]} · {p.transaction_reference || '—'}
                  </span>
                  <StatusBadge status={p.status} size="xs" />
                </div>
                <p className="text-[10px] text-gray-600 mt-0.5">
                  {formatDistanceToNow(new Date(p.payment_date), { addSuffix: true })}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
