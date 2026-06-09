import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: '▦' },
  { to: '/admin/cards', label: 'Cards', icon: '◈' },
  { to: '/admin/groups', label: 'Groups', icon: '◉' },
  { to: '/admin/schedules', label: 'Schedules', icon: '◷' },
  { to: '/admin/logs', label: 'Scan Logs', icon: '☰' },
  { to: '/admin/users', label: 'Users', icon: '◎' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col">
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="text-sm font-semibold text-gray-800">MealPass</div>
          <div className="text-xs text-gray-400 mt-0.5">Admin Panel</div>
        </div>

        <nav className="flex-1 py-3 px-2">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-md text-sm mb-0.5 transition-colors
                ${isActive
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'}`
              }
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-3 border-t border-gray-100">
          <div className="text-xs text-gray-500 mb-2 truncate">{user?.name}</div>
          <button
            onClick={handleLogout}
            className="w-full text-left text-xs text-red-500 hover:text-red-700"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
