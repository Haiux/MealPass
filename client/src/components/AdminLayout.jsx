import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, CreditCard, Users2, Clock, ScrollText,
  Users, BarChart2, ShieldCheck, LogOut, UtensilsCrossed,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/admin/dashboard', label: 'Dashboard',  icon: LayoutDashboard },
  { to: '/admin/cards',     label: 'Cards',       icon: CreditCard },
  { to: '/admin/groups',    label: 'Groups',      icon: Users2 },
  { to: '/admin/schedules', label: 'Schedules',   icon: Clock },
  { to: '/admin/logs',      label: 'Scan Logs',   icon: ScrollText },
  { to: '/admin/users',     label: 'Users',       icon: Users },
  { to: '/admin/reports',   label: 'Reports',     icon: BarChart2 },
  { to: '/admin/audit-log', label: 'Audit Log',   icon: ShieldCheck },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="flex min-h-screen bg-zinc-50">
      {/* Sidebar */}
      <aside className="w-56 bg-zinc-900 flex flex-col shrink-0">
        {/* Logo */}
        <div className="px-4 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center shrink-0">
              <UtensilsCrossed className="w-4 h-4 text-zinc-900" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white leading-none">MealPass</div>
              <div className="text-[10px] text-zinc-500 mt-0.5 leading-none">Admin Console</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors
                ${isActive
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'}`
              }
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-3 py-3 border-t border-zinc-800">
          <div className="px-3 mb-2">
            <div className="text-xs font-medium text-zinc-200 truncate">{user?.name}</div>
            <div className="text-[10px] text-zinc-500 capitalize">{user?.role}</div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded-md transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
