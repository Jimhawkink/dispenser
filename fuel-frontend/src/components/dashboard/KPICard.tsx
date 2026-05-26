import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatKES } from '../../types';

interface KPICardProps {
  title: string;
  value: number;
  format?: 'currency' | 'number';
  trend?: number;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  delay?: number;
  alert?: boolean;
}

export default function KPICard({ title, value, format = 'currency', trend, icon: Icon, iconColor, iconBg, delay = 0, alert }: KPICardProps) {
  const displayValue = format === 'currency' ? formatKES(value) : value.toLocaleString();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={`glass-card-hover p-5 ${alert ? 'border-red-500/20' : ''}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
          <Icon size={18} className={iconColor} />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(trend).toFixed(1)}%
          </div>
        )}
      </div>
      <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">{title}</p>
      <motion.p
        key={value}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={`font-heading font-bold text-2xl num ${alert && value > 0 ? 'text-red-400' : 'text-slate-800'}`}
      >
        {displayValue}
      </motion.p>
    </motion.div>
  );
}


