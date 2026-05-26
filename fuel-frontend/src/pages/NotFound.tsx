import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Fuel, Home } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mx-auto mb-6 shadow-lg">
          <Fuel size={36} className="text-white" />
        </div>
        <h1 className="font-heading font-bold text-6xl text-slate-800 mb-2">404</h1>
        <p className="text-xl font-semibold text-slate-700 mb-2">Page Not Found</p>
        <p className="text-slate-500 text-sm mb-8">The page you're looking for doesn't exist or has been moved.</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="btn-primary inline-flex items-center gap-2 px-6 py-3"
        >
          <Home size={16} /> Back to Dashboard
        </button>
      </motion.div>
    </div>
  );
}
