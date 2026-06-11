import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UtensilsCrossed } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [staffId, setStaffId] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const staffRef = useRef(null);

  useEffect(() => {
    if (user) navigate(user.role === 'admin' ? '/admin/dashboard' : '/scanner', { replace: true });
    else staffRef.current?.focus();
  }, [user]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const u = await login(staffId, pin);
      navigate(u.role === 'admin' ? '/admin/dashboard' : '/scanner', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid ID or PIN');
      setPin('');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
      <div className="w-full max-w-xs">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-zinc-900 rounded-2xl mb-4 shadow-lg">
            <UtensilsCrossed className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">MealPass</h1>
          <p className="text-xs text-zinc-400 mt-1">Hotel & Casino Meal Management</p>
        </div>

        {/* Card */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1.5">Staff ID</label>
            <input
              ref={staffRef}
              type="text"
              inputMode="numeric"
              maxLength={5}
              value={staffId}
              onChange={e => setStaffId(e.target.value.replace(/\D/g, ''))}
              placeholder="4–5 digit ID"
              className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-shadow"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1.5">PIN</label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={8}
              value={pin}
              onChange={e => setPin(e.target.value)}
              placeholder="Enter PIN"
              className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-shadow"
              required
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-xs bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-zinc-900 hover:bg-zinc-700 disabled:opacity-50 text-white font-medium text-sm py-2.5 rounded-lg transition-colors"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-xs text-zinc-300 mt-6">MealPass v1.0</p>
      </div>
    </div>
  );
}
