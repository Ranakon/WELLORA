import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Stethoscope, 
  MapPin, 
  Wallet, 
  ClipboardList, 
  Users,
  User, 
  Settings,
  LogOut,
  Sparkles,
  ChevronUp
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/', roles: ['user', 'doctor', 'advisor'] },
    { icon: Stethoscope, label: 'Doctors', path: '/doctors', roles: ['user'] },
    { icon: MapPin, label: 'Clinic Map', path: '/map', roles: ['user'] },
    { icon: Wallet, label: 'Finance Help', path: '/finance', roles: ['user'] },
    { icon: ClipboardList, label: 'Procedure', path: '/procedure', roles: ['user'] },
    { icon: Users, label: 'Friends', path: '/friends', roles: ['user'] },
    { icon: User, label: 'Profile', path: '/profile', roles: ['user', 'doctor', 'advisor'] },
  ];

  const filteredNavItems = navItems.filter(item => !item.roles || (user && item.roles.includes(user.role)));
  const activeNavItem = filteredNavItems.find((item) => item.path === location.pathname) || filteredNavItems[0];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [location.pathname]);

  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-72 flex-col overflow-y-auto overflow-x-hidden border-r border-white/60 bg-[linear-gradient(180deg,#f8fdf9_0%,#f5f7f6_48%,#eef3f1_100%)] shadow-[18px_0_45px_-38px_rgba(15,23,42,0.35)] no-scrollbar lg:flex">
        <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.16),transparent_58%)]" />
        <div className="absolute -left-8 top-28 h-32 w-32 rounded-full bg-brand-100/70 blur-3xl" />
        <div className="absolute bottom-24 left-10 h-28 w-28 rounded-full bg-emerald-100/60 blur-3xl" />

        <div className="relative p-6 pb-5">
          <div className="rounded-[28px] border border-white/70 bg-white/75 p-4 shadow-[0_18px_45px_-35px_rgba(15,23,42,0.5)] backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#22c55e_0%,#15803d_100%)] text-white shadow-lg shadow-brand-200/70">
                <Sparkles size={24} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-brand-600">Wellness Hub</p>
                <span className="text-xl font-display font-bold tracking-tight text-slate-900">WELLORA</span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative px-6 pb-5">
          <div className="rounded-[30px] border border-white/70 bg-white/70 p-4 shadow-[0_20px_45px_-38px_rgba(15,23,42,0.45)] backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl border border-brand-100 bg-brand-100 shadow-sm">
                {user?.avatar ? (
                  <img src={user.avatar} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-brand-600">
                    <User size={18} />
                  </div>
                )}
                <div className="absolute bottom-1 right-1 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">{user?.name || 'User'}</p>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">{user?.role || 'member'}</p>
              </div>
            </div>
            <div className="mt-4 rounded-2xl bg-[linear-gradient(135deg,rgba(240,253,244,0.9),rgba(255,255,255,0.9))] px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Daily Focus</p>
              <p className="mt-1 text-sm font-semibold text-slate-700">Small healthy actions, repeated consistently.</p>
            </div>
          </div>
        </div>

        <nav className="relative flex-1 px-4 pb-4">
          <div className="mb-3 px-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-slate-400">Navigation</p>
          </div>
          <div className="space-y-2">
          {filteredNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "relative flex items-center gap-3 overflow-hidden rounded-2xl px-4 py-3.5 transition-all duration-300 group",
                  isActive 
                    ? "bg-white text-slate-900 shadow-[0_20px_35px_-28px_rgba(34,197,94,0.7)]"
                    : "text-slate-500 hover:bg-white/75 hover:text-slate-900"
                )}
              >
                {isActive && (
                  <>
                    <motion.div
                      layoutId="active-nav"
                      className="absolute inset-0 rounded-2xl border border-brand-100/80 bg-[linear-gradient(135deg,rgba(240,253,244,0.95),rgba(255,255,255,0.92))]"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                    <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-brand-600" />
                  </>
                )}
                <div className={cn(
                  "relative z-10 flex h-10 w-10 items-center justify-center rounded-2xl border transition-all",
                  isActive
                    ? "border-brand-100 bg-brand-50 text-brand-700 shadow-sm"
                    : "border-transparent bg-white/70 text-slate-500 group-hover:border-slate-200 group-hover:text-slate-700"
                )}>
                  <item.icon size={19} className={cn(!isActive && "group-hover:scale-110 transition-transform")} />
                </div>
                <div className="relative z-10 min-w-0">
                  <span className={cn("block text-sm", isActive ? "font-semibold" : "font-medium")}>{item.label}</span>
                  <span className={cn(
                    "block text-[10px] uppercase tracking-[0.18em]",
                    isActive ? "text-brand-600/80" : "text-slate-400"
                  )}>
                    {item.label === 'Dashboard' ? 'Overview' :
                     item.label === 'Doctors' ? 'Book care' :
                     item.label === 'Clinic Map' ? 'Nearby' :
                     item.label === 'Finance Help' ? 'Savings' :
                     item.label === 'Procedure' ? 'Steps' :
                     item.label === 'Friends' ? 'Community' : 'Account'}
                  </span>
                </div>
              </Link>
            );
          })}
          </div>
        </nav>

        <div className="relative p-4 pt-3">
          <div className="mb-4 h-px bg-[linear-gradient(90deg,transparent,rgba(148,163,184,0.35),transparent)]" />
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 rounded-2xl border border-transparent px-4 py-3 text-slate-500 transition-all hover:border-rose-100 hover:bg-white hover:text-rose-600"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/80 text-inherit shadow-sm">
              <LogOut size={18} />
            </div>
            <div className="text-left">
              <span className="block text-sm font-semibold">Sign Out</span>
              <span className="block text-[10px] uppercase tracking-[0.18em] text-slate-400">Secure Exit</span>
            </div>
          </button>
        </div>
      </aside>

      <div className="fixed inset-x-0 bottom-3 z-50 px-3 lg:hidden">
        {isMobileNavOpen && (
          <button
            aria-label="Close navigation"
            className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_bottom,rgba(15,23,42,0.18),rgba(15,23,42,0.06)_42%,transparent_72%)] backdrop-blur-[2px]"
            onClick={() => setIsMobileNavOpen(false)}
          />
        )}

        {!isMobileNavOpen ? (
          <div className="flex justify-center">
            <button
              onClick={() => setIsMobileNavOpen(true)}
              className="group relative flex items-center gap-3 overflow-hidden rounded-full border border-brand-100/80 bg-[linear-gradient(135deg,rgba(240,253,244,0.96),rgba(255,255,255,0.98))] px-3 py-2.5 shadow-[0_16px_40px_-24px_rgba(15,23,42,0.45)] backdrop-blur-lg transition-all hover:-translate-y-0.5"
            >
              <div className="absolute inset-y-1 left-2 w-20 rounded-full bg-brand-100/40 blur-2xl" />
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white text-brand-700 shadow-sm ring-1 ring-brand-100/70">
                {activeNavItem && <activeNavItem.icon size={18} />}
              </div>
              <div className="relative text-left">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-600/75">Quick Nav</p>
                <p className="text-xs font-semibold text-slate-700">{activeNavItem?.label || 'Menu'}</p>
              </div>
              <div className="relative flex h-7 w-7 items-center justify-center rounded-full bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-100">
                <ChevronUp size={16} />
              </div>
            </button>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="relative overflow-hidden rounded-[30px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,252,250,0.96))] p-3 shadow-[0_28px_60px_-28px_rgba(15,23,42,0.45)] backdrop-blur-xl"
          >
            <div className="absolute inset-x-10 top-0 h-20 rounded-full bg-brand-100/40 blur-3xl" />
            <div className="absolute -right-8 top-10 h-24 w-24 rounded-full bg-emerald-100/50 blur-3xl" />
            <div className="mb-3 flex justify-center">
              <button
                onClick={() => setIsMobileNavOpen(false)}
                className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm ring-1 ring-slate-200"
                aria-label="Collapse navigation"
              >
                <ChevronUp size={16} />
              </button>
            </div>

            <div className="relative mb-3 flex items-center justify-between rounded-[24px] border border-white/70 bg-white/80 px-4 py-3 shadow-sm">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 ring-1 ring-brand-100/80">
                  {activeNavItem && <activeNavItem.icon size={18} />}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Current Page</p>
                  <p className="truncate text-sm font-semibold text-slate-800">{activeNavItem?.label || 'Menu'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-slate-50 px-2.5 py-1">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Mobile</span>
              </div>
            </div>

            <div className="relative grid grid-cols-4 gap-2.5">
              {filteredNavItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex min-w-0 flex-col items-center gap-1.5 rounded-[22px] border px-2 py-2.5 text-[11px] font-semibold transition-all",
                      isActive
                        ? "border-brand-100 bg-[linear-gradient(135deg,rgba(236,253,245,0.95),rgba(255,255,255,0.98))] text-brand-700 shadow-[0_14px_28px_-22px_rgba(34,197,94,0.85)]"
                        : "border-transparent bg-white/72 text-slate-500 hover:border-slate-200"
                    )}
                  >
                    <div className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-2xl transition-all",
                      isActive ? "bg-white text-brand-700 shadow-sm" : "bg-slate-100 text-slate-500"
                    )}>
                      <item.icon size={18} />
                    </div>
                    <span className="truncate text-center leading-tight">{item.label}</span>
                  </Link>
                );
              })}
              <button
                onClick={handleLogout}
                className="flex min-w-0 flex-col items-center gap-1.5 rounded-[22px] border border-transparent bg-white/72 px-2 py-2.5 text-[11px] font-semibold text-rose-600"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-50">
                  <LogOut size={18} />
                </div>
                <span className="truncate text-center leading-tight">Logout</span>
              </button>
            </div>

            <p className="relative mt-3 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
              Tap anywhere outside to close
            </p>
          </motion.div>
        )}
      </div>
    </>
  );
};
