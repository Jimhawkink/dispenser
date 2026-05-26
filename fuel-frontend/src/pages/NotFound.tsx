import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Fuel } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8">
      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring' }}>
        <div className="w-24 h-24 rounded-3xl bg-slate-100 flex items-center justify-center mx-auto mb-6">
          <Fuel size={40} className="text-slate-500" />
        </div>
        <h1 className="font-heading font-bold text-6xl text-gray-700 mb-2">404</h1>
        <p className="text-xl font-semibold text-slate-500 mb-2">Page Not Found</p>
        <p className="text-slate-500 text-sm mb-8">The page you're looking for doesn't exist or has been moved.</p>
        <button onClick={() => navigate('/dashboard')}  import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Fuel } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8">
      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring' }}>
        <div className="w-24 h-24 rounded-3xl bg-slate-100 flex items-center justify-center mx-auto mb-6">
          <Fuel size={40} className="text-slate-500" />
        </div>
        <h1 className="font-heading font-bold text-6xl text-gray-700 mb-2">404</h1>
        <p className="text-xl font-semibold text-slate-500 mb-2">Page Not Found</p>
        <p className="text-slate-500 text-sm mb-8">The page you're looking for doesn't exist or has been moved.</p>
        <button onClick={() => navigate('/dashboard')} className="btn-primary flex items-center gap-2 mx-auto">
          <Home size={16} /> Back to Dashboard
        </button>
      </motion.div>
    </div>
  );
}

.Value >
          <Home size={16} /> Back to Dashboard
        </button>
      </motion.div>
    </div>
  );
}


