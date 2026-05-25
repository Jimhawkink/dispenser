import { STATUS_COLORS, PaymentStatus, SaleStatus } from '../../types';

type Status = PaymentStatus | SaleStatus;

interface StatusBadgeProps {
  status: Status;
  size?: 'xs' | 'sm' | 'md';
}

const STATUS_LABELS: Record<string, string> = {
  paid: 'Paid', partial: 'Partial', credit: 'Credit', pending: 'Pending',
  void: 'Void', reconciled: 'Reconciled', confirmed: 'Confirmed',
  unmatched: 'Unmatched', failed: 'Failed',
};

export default function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const colors = STATUS_COLORS[status] || STATUS_COLORS.pending;
  const sizeClass = size === 'xs' ? 'text-[10px] px-1.5 py-0.5' : size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClass} ${colors.bg} ${colors.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${colors.dot}`} />
      {STATUS_LABELS[status] || status}
    </span>
  );
}
