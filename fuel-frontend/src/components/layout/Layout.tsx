import { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, ShoppingCart, CreditCard, Users, Fuel,
  BarChart3, Settings, LogOut, ChevronLeft, ChevronRight,
  Bell, Menu, X, Zap
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface NavItem { label: string; icon: React.ElementType; path: string; badge?: number }

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',  icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Sales',      icon: ShoppingCart,    path: '/sales' },
  { label: 'Payments',   icon: CreditCard,      path: '/payments' },
  { label: 'Customers',  icon: Users,           path: '/customers' },
  { label: 'Stock',      icon: Fuel,            path: '/stock' },
  { label: 'Reports',    icon: BarChart3,       path: '/reports' },
  { label: 'Settings',   icon: Settings,        path: '/settings' },
];

function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    admin: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    cashier: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
    accountant: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${colors[role] || colors.cashier}`}>
      {role}
    </span>
  );
}

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => { logout(); navigate('/login'); };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-gray-800/50 ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 0 15px rgba(16,185,129,0.4)' }}>
          <Fuel size={18} className="text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
              <span className="font-heading font-bold text-white text-sm leading-tight block">FuelFlow Pro</span>
              <span className="text-[10px] text-emerald-400/70 flex items-center gap-1">
                <span className="live-dot" /> Live
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={isActive ? `nav-item-active ${collapsed ? 'justify-center px-2' : ''}` : `nav-item ${collapsed ? 'justify-center px-2' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <item.icon size={18} className="flex-shrink-0" />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1">
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              {!collapsed && item.badge && item.badge > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User area */}
      <div className="border-t border-gray-800/50 p-3">
        <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {initials}
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                <RoleBadge role={user?.role || 'cashier'} />
              </motion.div>
            )}
          </AnimatePresence>
          {!collapsed && (
            <button onClick={handleLogout} className="text-gray-500 hover:text-red-400 transition-colors p-1" title="Logout">
              <LogOut size={16} />
            </button>
          )}
        </div>
        {collapsed && (
          <button onClick={handleLogout} className="w-full mt-2 flex justify-center text-gray-500 hover:text-red-400 transition-colors p-1" title="Logout">
            <LogOut size={16} />
          </button>
        )}
      </div>

      {/* Collapse button */}
      <button
        onClick={() => setCollapsed(v => !v)}
        className="absolute -right-3 top-20 bg-gray-800 border border-gray-700 rounded-full w-6 h-6 flex items-center justify-center text-gray-400 hover:text-white hover:border-emerald-500/50 transition-all hidden lg:flex"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 240 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="sidebar hidden lg:flex flex-col relative flex-shrink-0 overflow-hidden"
      >
        <SidebarContent />
      </motion.aside>

      {/* Mobile overlay sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
            <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: 'spring', damping: 25 }} className="fixed left-0 top-0 h-full w-64 sidebar z-50 lg:hidden">
              <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={18} /></button>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-14 bg-gray-950/80 backdrop-blur-sm border-b border-gray-800/50 flex items-center justify-between px-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden text-gray-400 hover:text-white"><Menu size={20} /></button>
            <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500">
              <Zap size={12} className="text-emerald-400" />
              <span>Powered by IntaSend · Daraja · Jenga</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative text-gray-400 hover:text-white transition-colors p-1">
              <Bell size={18} />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <div className="text-sm text-gray-400 hidden sm:block">
              {new Date().toLocaleDateString('en-KE', { weekday: 'short', day: 'numeric', month: 'short' })}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
