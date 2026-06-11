import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { UtensilsCrossed } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const MEAL_COLORS = {
  breakfast: 'text-orange-400',
  lunch: 'text-amber-400',
  dinner: 'text-indigo-400',
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

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 10000);
    return () => clearInterval(id);
  }, []);

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
    } catch { /* keep previous state */ }
  }, []);

  useEffect(() => {
    fetchSchedules();
    const id = setInterval(fetchSchedules, 30000);
    return () => clearInterval(id);
  }, [fetchSchedules]);

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

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-zinc-800 border-b border-zinc-700/60">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-white rounded-md flex items-center justify-center">
            <UtensilsCrossed className="w-3.5 h-3.5 text-zinc-900" />
          </div>
          <span className="text-sm font-semibold text-zinc-100">MealPass</span>
        </div>
        <div className="text-sm font-mono text-zinc-400">
          {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          <span className="mx-2 text-zinc-600">·</span>
          {now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-zinc-500">{user?.name}</span>
          {user?.role === 'admin' && (
            <button onClick={() => navigate('/admin/dashboard')} className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors">
              Admin
            </button>
          )}
          <button onClick={handleLogout} className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
            Sign out
          </button>
        </div>
      </div>

      {/* Main scan area */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 gap-8">
        {/* Active meal indicator */}
        <div className="text-center">
          {activeMeal ? (
            <>
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2">Active Meal Period</div>
              <div className={`text-5xl font-bold capitalize tracking-tight ${MEAL_COLORS[activeMeal.meal_type] || 'text-white'}`}>
                {activeMeal.meal_type}
              </div>
              <div className="text-xs text-zinc-500 mt-2 font-mono">
                {activeMeal.start_time} – {activeMeal.end_time}
              </div>
            </>
          ) : (
            <>
              <div className="text-[10px] text-zinc-600 uppercase tracking-widest mb-2">No Active Meal Period</div>
              <div className="text-3xl font-semibold text-zinc-600">Outside Schedule</div>
            </>
          )}
        </div>

        {/* Scan input */}
        <div className="w-full max-w-sm">
          <div className="text-[10px] text-zinc-600 text-center mb-2 uppercase tracking-widest">
            Scan Card or Enter Number
          </div>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitScan()}
              onBlur={e => e.target.focus()}
              placeholder="Card number…"
              autoFocus
              className="flex-1 bg-zinc-800 border border-zinc-600 rounded-lg px-4 py-3 text-lg text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 text-center tracking-widest font-mono"
            />
            <button
              onClick={submitScan}
              className="bg-zinc-700 hover:bg-zinc-600 text-white px-4 py-3 rounded-lg font-medium text-sm transition-colors"
            >
              Submit
            </button>
          </div>
        </div>

        {/* Result flash */}
        {result && (
          <div className={`w-full max-w-sm rounded-xl px-5 py-4 border text-center transition-all
            ${result.status === 'granted'
              ? 'bg-emerald-900/30 border-emerald-600/50 text-emerald-300'
              : 'bg-red-900/30 border-red-600/50 text-red-300'}`}
          >
            <div className="text-2xl font-bold tracking-tight mb-1">
              {result.status === 'granted' ? '✓ GRANTED' : '✗ DENIED'}
            </div>
            {result.status === 'granted' ? (
              <div className="text-sm text-zinc-300">
                <span className="font-semibold text-white">{result.holder_name}</span>
                <span className="text-zinc-500 mx-1.5">·</span>
                <span className="capitalize">{result.meal_type}</span>
                {result.group_name && <span className="text-zinc-500"> ({result.group_name})</span>}
              </div>
            ) : (
              <div className="text-sm">{result.reason}</div>
            )}
          </div>
        )}
      </div>

      {/* Recent scans */}
      {recentScans.length > 0 && (
        <div className="border-t border-zinc-800 px-6 py-4">
          <div className="text-[10px] text-zinc-600 uppercase tracking-widest mb-2.5">Recent Scans</div>
          <div className="space-y-1 max-h-44 overflow-y-auto">
            {recentScans.map((s, i) => (
              <div key={i} className="flex items-center gap-3 text-xs">
                <span className="text-zinc-600 w-12 shrink-0 font-mono">{formatTime(s.scanned_at)}</span>
                <span className={`w-14 shrink-0 font-semibold ${s.status === 'granted' ? 'text-emerald-500' : 'text-red-500'}`}>
                  {s.status === 'granted' ? 'GRANT' : 'DENY'}
                </span>
                <span className="text-zinc-300 truncate">{s.holder_name || s.card_number}</span>
                {s.status === 'granted' && (
                  <span className="text-zinc-600 capitalize shrink-0">{s.meal_type}</span>
                )}
                {s.status === 'denied' && (
                  <span className="text-zinc-700 truncate">{s.reason}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
