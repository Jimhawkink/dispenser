import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Fuel, Zap, Shield, TrendingUp } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-toastify';

const FEATURES = [
  { icon: Zap,        text: 'Real-time M-Pesa & Bank payments' },
  { icon: Shield,     text: 'Auto-reconciliation engine' },
  { icon: TrendingUp, text: 'Live dashboard & reports' },
];

export default function Login() {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [featureIdx, setFeatureIdx] = useState(0);

  useEffect(() => { if (user) navigate('/dashboard'); }, [user, navigate]);
  useEffect(() => {
    const id = setInterval(() => setFeatureIdx(i => (i + 1) % FEATURES.length), 3000);
    return () => clearInterval(id);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Please enter email and password'); return; }
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Login failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #f1f5f9 100%)' }}>
      {/* Left panel - branding */}
      <div className="hidden lg:flex flex-col justify-between w-2/5 p-12 bg-gradient-to-br from-emerald-600 to-emerald-800 text-white relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-32 translate-x-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-24 -translate-x-24" />
        </div>

        <div className="relative">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <Fuel size={24} className="text-white" />
            </div>
            <div>
              <span className="font-heading font-bold text-xl block">FuelFlow Pro</span>
              <span className="text-emerald-200 text-xs">Fuel Management System</span>
            </div>
          </div>

          <h1 className="font-heading font-bold text-4xl leading-tight mb-4">
            Manage your fuel station smarter
          </h1>
          <p className="text-emerald-100 text-sm leading-relaxed">
            Complete solution for Kenyan fuel dealers — M-Pesa, bank reconciliation, credit management and real-time reporting.
          </p>
        </div>

        <div className="relative space-y-4">
          {FEATURES.map((f, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.15 }}
              className="flex items-center gap-3 bg-white/10 rounded-xl p-3">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                <f.icon size={16} className="text-white" />
              </div>
              <span className="text-sm text-emerald-50">{f.text}</span>
            </motion.div>
          ))}
          <p className="text-emerald-300 text-xs pt-2">© {new Date().getFullYear()} FuelFlow Pro · Kenya</p>
        </div>
      </div>

      {/* Right panel - login form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
              <Fuel size={20} className="text-white" />
            </div>
            <span className="font-heading font-bold text-slate-800 text-lg">FuelFlow Pro</span>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
            <div className="mb-6">
              <h2 className="font-heading font-bold text-slate-800 text-2xl">Sign in</h2>
              <p className="text-slate-500 text-sm mt-1">Enter your credentials to access the system</p>
            </div>

            {/* Rotating feature pill (mobile) */}
            <div className="mb-6 lg:hidden h-8 flex items-center">
              <AnimatePresence mode="wait">
                <motion.div key={featureIdx}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
                  {(() => { const F = FEATURES[featureIdx]; return <F.icon size={12} />; })()}
                  {FEATURES[featureIdx].text}
                </motion.div>
              </AnimatePresence>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Email Address</label>
                <input
                  id="email" type="email" value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input-field" placeholder="admin@fuelflow.co.ke"
                  autoComplete="email" required
                />
              </div>

              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <input
                    id="password" type={showPass ? 'text' : 'password'} value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="input-field pr-12" placeholder="••••••••"
                    autoComplete="current-password" required
                  />
                  <button type="button" onClick={() => setShowPass(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <motion.button
                id="login-submit" type="submit"
                whileTap={{ scale: 0.98 }} disabled={loading}
                className="btn-primary w-full py-3 mt-2 text-base"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : 'Sign In'}
              </motion.button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-100">
              <p className="text-xs text-slate-400 text-center mb-3">System Roles</p>
              <div className="flex gap-2 justify-center">
                {[
                  { role: 'Admin',      bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
                  { role: 'Cashier',    bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200' },
                  { role: 'Accountant', bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200' },
                ].map(({ role, bg, text, border }) => (
                  <span key={role} className={`text-xs px-3 py-1 rounded-full border ${bg} ${text} ${border}`}>{role}</span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
