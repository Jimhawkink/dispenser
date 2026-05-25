import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Fuel, Zap, Shield, TrendingUp } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-toastify';

const FEATURES = [
  { icon: Zap, text: 'Real-time M-Pesa & Bank payments' },
  { icon: Shield, text: 'Auto-reconciliation engine' },
  { icon: TrendingUp, text: 'Live dashboard & reports' },
];

function FloatingParticle({ x, y, delay, size }: { x: number; y: number; delay: number; size: number }) {
  return (
    <motion.div
      className="absolute rounded-full bg-emerald-500/20"
      style={{ left: `${x}%`, top: `${y}%`, width: size, height: size }}
      animate={{ y: [0, -30, 0], opacity: [0.2, 0.6, 0.2] }}
      transition={{ duration: 4 + delay, repeat: Infinity, delay, ease: 'easeInOut' }}
    />
  );
}

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

  const particles = [
    { x: 10, y: 20, delay: 0, size: 80 }, { x: 80, y: 10, delay: 1, size: 60 },
    { x: 20, y: 70, delay: 2, size: 100 }, { x: 70, y: 60, delay: 0.5, size: 50 },
    { x: 50, y: 80, delay: 1.5, size: 70 }, { x: 90, y: 40, delay: 2.5, size: 90 },
    { x: 35, y: 15, delay: 3, size: 40 }, { x: 60, y: 35, delay: 1.2, size: 55 },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #030712 0%, #0a1628 40%, #030f1e 70%, #030712 100%)' }}>
      {/* Animated background particles */}
      {particles.map((p, i) => <FloatingParticle key={i} {...p} />)}

      {/* Radial glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)' }} />
      </div>

      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'linear-gradient(rgba(16,185,129,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.3) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo & Brand */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4"
            style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 0 40px rgba(16,185,129,0.4)' }}
          >
            <Fuel size={36} className="text-white" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="font-heading text-4xl font-extrabold bg-gradient-to-r from-white via-emerald-200 to-emerald-400 bg-clip-text text-transparent"
          >
            FuelFlow Pro
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-gray-400 text-sm mt-2">
            Intelligent Fuel Management for Kenya
          </motion.p>

          {/* Rotating feature pill */}
          <div className="mt-4 h-8 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={featureIdx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
                className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full"
              >
                {(() => { const F = FEATURES[featureIdx]; return <F.icon size={12} />; })()}
                {FEATURES[featureIdx].text}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="glass-card p-8"
        >
          <h2 className="font-heading text-xl font-semibold text-white mb-6">Sign in to your account</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="label">Email address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input-field"
                placeholder="admin@fuelflow.co.ke"
                autoComplete="email"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-field pr-12"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <motion.button
              id="login-submit"
              type="submit"
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </motion.button>
          </form>

          {/* Role guide */}
          <div className="mt-6 pt-5 border-t border-gray-800/60">
            <p className="text-xs text-gray-500 text-center mb-3">System Roles</p>
            <div className="flex gap-2 justify-center flex-wrap">
              {[
                { role: 'Admin', color: 'emerald' },
                { role: 'Cashier', color: 'blue' },
                { role: 'Accountant', color: 'amber' },
              ].map(({ role, color }) => (
                <span key={role} className={`text-xs px-2.5 py-1 rounded-full bg-${color}-500/10 text-${color}-400 border border-${color}-500/20`}>
                  {role}
                </span>
              ))}
            </div>
          </div>
        </motion.div>

        <p className="text-center text-xs text-gray-600 mt-6">
          © {new Date().getFullYear()} FuelFlow Pro · Kenya · Powered by Supabase
        </p>
      </motion.div>
    </div>
  );
}
