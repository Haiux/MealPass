import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const MEAL_COLORS = {
  breakfast: 'text-orange-600',
  lunch: 'text-yellow-600',
  dinner: 'text-indigo-600',
};

const MEAL_BG = {
  breakfast: 'bg-orange-50 border-orange-200',
  lunch: 'bg-yellow-50 border-yellow-200',
  dinner: 'bg-indigo-50 border-indigo-200',
};

function formatTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function Scanner() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const [inputValue, setInputValue] = useState('');
  const [activeMeal, setActiveMeal] = useState(null);
  const [result, setResult] = useState(null);
  const [recentScans, setRecentScans] = useState([]);
  const [now, setNow] = useState(new Date());
  const resultTimer = useRef(null);

  // Keep clock updated
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 10000);
    return () => clearInterval(id);
  }, []);

  // Fetch active meal schedule, refresh every 30s
  const fetchSchedules = useCallback(async () => {
    try {
      const res = await api.get('/schedules');
      const current = res.data.schedules.find(s => {
        if (!s.active) return false;
        const hh = String(new Date().getHours()).padStart(2, '0');
        const mm = String(new Date().getMinutes()).padStart(2, '0');
        const t = `${hh}:${mm}`;
        return t >= s.start_time && t <= s.end_time;
      });
      setActiveMeal(current || null);
    } catch { /* network error — keep previous state */ }
  }, []);

  useEffect(() => {
    fetchSchedules();
    const id = setInterval(fetchSchedules, 30000);
    return () => clearInterval(id);
  }, [fetchSchedules]);

  // Keep input always focused
  useEffect(() => {
    const refocus = () => inputRef.current?.focus();
    refocus();
    document.addEventListener('click', refocus);
    return () => document.removeEventListener('click', refocus);
  }, []);

  async function submitScan() {
    const val = inputValue.trim();
    if (!val) return;
    setInputValue('');

    clearTimeout(resultTimer.current);

    try {
      const res = await api.post('/scan', { card_number: val });
      const data = res.data;
      setResult(data);
      setRecentScans(prev => [
        { ...data, card_number: val, scanned_at: new Date().toISOString() },
        ...prev.slice(0, 9),
      ]);
    } catch (err) {
      setResult({ status: 'denied', reason: err.response?.data?.message || 'Connection error' });
    }

    resultTimer.current = setTimeout(() => setResult(null), 4000);
    inputRef.current?.focus();
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') submitScan();
  }

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-gray-800 border-b border-gray-700">
        <div className="text-sm font-semibold text-gray-200">MealPass</div>
        <div className="text-sm text-gray-400">
          {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          {' — '}
          {now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-500">{user?.name}</span>
          {user?.role === 'admin' && (
            <button onClick={() => navigate('/admin/dashboard')} className="text-xs text-blue-400 hover:text-blue-300">
              Admin
            </button>
          )}
          <button onClick={handleLogout} className="text-xs text-gray-500 hover:text-gray-300">
            Sign out
          </button>
        </div>
      </div>

      {/* Main scan area */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 gap-6">
        {/* Current meal badge */}
        <div className="text-center">
          {activeMeal ? (
            <>
              <div className="text-xs text-gray-400 uppercase tracking-widest mb-1">Active Meal Period</div>
              <div className={`text-4xl font-bold capitalize ${MEAL_COLORS[activeMeal.meal_type] || 'text-white'}`}>
                {activeMeal.meal_type}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {activeMeal.start_time} – {activeMeal.end_time}
              </div>
            </>
          ) : (
            <>
              <div className="text-xs text-gray-400 uppercase tracking-widest mb-1">No Active Meal Period</div>
              <div className="text-2xl font-semibold text-gray-500">Outside Schedule</div>
            </>
          )}
        </div>

        {/* Scan input */}
        <div className="w-full max-w-md">
          <div className="text-xs text-gray-500 text-center mb-2 uppercase tracking-widest">
            Scan Card or Enter Number
          </div>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={e => e.target.focus()}
              placeholder="Card number…"
              autoFocus
              className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-lg text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-center tracking-widest"
            />
            <button
              onClick={submitScan}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium text-sm transition-colors"
            >
              Submit
            </button>
          </div>
        </div>

        {/* Result flash */}
        {result && (
          <div className={`w-full max-w-md rounded-xl px-5 py-4 border text-center transition-all
            ${result.status === 'granted'
              ? 'bg-green-900/40 border-green-600 text-green-300'
              : 'bg-red-900/40 border-red-600 text-red-300'
            }`}
          >
            <div className="text-2xl font-bold mb-1">
              {result.status === 'granted' ? '✓ GRANTED' : '✗ DENIED'}
            </div>
            {result.status === 'granted' ? (
              <div className="text-sm text-gray-300">
                <span className="font-medium text-white">{result.holder_name}</span>
                {' · '}
                <span className="capitalize">{result.meal_type}</span>
                {result.group_name && <span className="text-gray-400"> ({result.group_name})</span>}
              </div>
            ) : (
              <div className="text-sm">{result.reason}</div>
            )}
          </div>
        )}
      </div>

      {/* Recent scans */}
      {recentScans.length > 0 && (
        <div className="border-t border-gray-800 px-6 py-4">
          <div className="text-xs text-gray-500 uppercase tracking-widest mb-3">Recent Scans</div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {recentScans.map((s, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className="text-gray-500 w-14 shrink-0">{formatTime(s.scanned_at)}</span>
                <span className={`w-16 shrink-0 font-medium ${s.status === 'granted' ? 'text-green-400' : 'text-red-400'}`}>
                  {s.status === 'granted' ? 'GRANTED' : 'DENIED'}
                </span>
                <span className="text-gray-300 truncate">
                  {s.holder_name || s.card_number}
                </span>
                {s.status === 'granted' && (
                  <span className="text-gray-500 capitalize shrink-0">{s.meal_type}</span>
                )}
                {s.status === 'denied' && (
                  <span className="text-gray-600 truncate text-xs">{s.reason}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
