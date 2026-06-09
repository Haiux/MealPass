import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import Badge from '../../components/Badge';

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 50;

  const [filters, setFilters] = useState({ date: todayStr(), status: '', meal_type: '', card_number: '' });

  const load = useCallback(async () => {
    const params = new URLSearchParams({ page, limit });
    if (filters.date) params.set('date', filters.date);
    if (filters.status) params.set('status', filters.status);
    if (filters.meal_type) params.set('meal_type', filters.meal_type);
    if (filters.card_number) params.set('card_number', filters.card_number);
    const res = await api.get(`/logs?${params}`);
    setLogs(res.data.logs);
    setTotal(res.data.total);
  }, [filters, page]);

  useEffect(() => { load(); }, [load]);

  function setFilter(k, v) { setFilters(f => ({ ...f, [k]: v })); setPage(1); }

  function exportCSV() {
    const header = 'Time,Card,Holder,Group,Meal,Status,Reason,Scanned By';
    const rows = logs.map(l => [
      new Date(l.scanned_at).toLocaleString(),
      l.card_number, l.holder_name || '', l.group_name || '',
      l.meal_type || '', l.status, l.reason || '', l.scanned_by_name || '',
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
    const csv = [header, ...rows].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `scan-logs-${filters.date || 'all'}.csv`;
    a.click();
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-lg font-semibold text-gray-900">Scan Logs</h1>
        <button onClick={exportCSV} className="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5">
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <input type="date" value={filters.date} onChange={e => setFilter('date', e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <select value={filters.status} onChange={e => setFilter('status', e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Status</option>
          <option value="granted">Granted</option>
          <option value="denied">Denied</option>
        </select>
        <select value={filters.meal_type} onChange={e => setFilter('meal_type', e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Meals</option>
          <option value="breakfast">Breakfast</option>
          <option value="lunch">Lunch</option>
          <option value="dinner">Dinner</option>
        </select>
        <input type="text" placeholder="Card number…" value={filters.card_number} onChange={e => setFilter('card_number', e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm w-36 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <button onClick={() => { setFilters({ date: '', status: '', meal_type: '', card_number: '' }); setPage(1); }}
          className="text-xs text-gray-400 hover:text-gray-600 px-2">Clear</button>
      </div>

      <div className="text-xs text-gray-400 mb-3">{total} record{total !== 1 ? 's' : ''}</div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-xs text-gray-400">
              <th className="text-left px-4 py-2.5 font-medium">Time</th>
              <th className="text-left px-4 py-2.5 font-medium">Card #</th>
              <th className="text-left px-4 py-2.5 font-medium">Holder</th>
              <th className="text-left px-4 py-2.5 font-medium">Group</th>
              <th className="text-left px-4 py-2.5 font-medium">Meal</th>
              <th className="text-left px-4 py-2.5 font-medium">Status</th>
              <th className="text-left px-4 py-2.5 font-medium">Reason</th>
              <th className="text-left px-4 py-2.5 font-medium">By</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No logs found</td></tr>
            )}
            {logs.map(log => (
              <tr key={log.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                <td className="px-4 py-2 text-gray-500 tabular-nums whitespace-nowrap">
                  {new Date(log.scanned_at).toLocaleString([], { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </td>
                <td className="px-4 py-2 font-mono text-xs text-gray-600">{log.card_number}</td>
                <td className="px-4 py-2 text-gray-700">{log.holder_name || '—'}</td>
                <td className="px-4 py-2 text-gray-500">{log.group_name || '—'}</td>
                <td className="px-4 py-2">{log.meal_type ? <Badge type={log.meal_type} /> : '—'}</td>
                <td className="px-4 py-2"><Badge type={log.status} /></td>
                <td className="px-4 py-2 text-gray-400 text-xs">{log.reason || '—'}</td>
                <td className="px-4 py-2 text-gray-400 text-xs">{log.scanned_by_name || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-2 mt-4">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
            className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">
            Previous
          </button>
          <span className="text-xs text-gray-500">Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
            className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">
            Next
          </button>
        </div>
      )}
    </div>
  );
}
