import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function ConfirmModal({ open, title, message, confirmLabel = 'Confirm', danger, onConfirm, onCancel, loading }: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <div className="modal-overlay">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
            className="glass-card p-6 w-full max-w-md">
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${danger ? 'bg-red-500/15' : 'bg-amber-500/15'}`}>
                <AlertTriangle size={20} className={danger ? 'text-red-400' : 'text-amber-400'} />
              </div>
              <div className="flex-1">
                <h3 className="font-heading font-semibold text-white mb-1">{title}</h3>
                <p className="text-gray-400 text-sm">{message}</p>
              </div>
              <button onClick={onCancel} className="text-gray-500 hover:text-gray-300"><X size={18} /></button>
            </div>
            <div className="flex gap-3 mt-6 justify-end">
              <button onClick={onCancel} className="btn-secondary text-sm py-2">Cancel</button>
              <button onClick={onConfirm} disabled={loading} className={`${danger ? 'btn-danger' : 'btn-primary'} text-sm py-2 flex items-center gap-2`}>
                {loading && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
