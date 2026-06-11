import { useState, useEffect, useCallback } from 'react';
import { ScrollText } from 'lucide-react';
import api from '../../api/axios';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const filterCls = 'border border-zinc-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent bg-white';

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
      <PageHeader
        title="Scan Logs"
        action={<Button variant="secondary" size="sm" onClick={exportCSV}>Export CSV</Button>}
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <input type="date" value={filters.date} onChange={e => setFilter('date', e.target.value)} className={filterCls} />
        <select value={filters.status} onChange={e => setFilter('status', e.target.value)} className={filterCls}>
          <option value="">All Status</option>
          <option value="granted">Granted</option>
          <option value="denied">Denied</option>
        </select>
        <select value={filters.meal_type} onChange={e => setFilter('meal_type', e.target.value)} className={filterCls}>
          <option value="">All Meals</option>
          <option value="breakfast">Breakfast</option>
          <option value="lunch">Lunch</option>
          <option value="dinner">Dinner</option>
        </select>
        <input type="text" placeholder="Card number…" value={filters.card_number}
          onChange={e => setFilter('card_number', e.target.value)}
          className={`${filterCls} w-32`} />
        <button
          onClick={() => { setFilters({ date: '', status: '', meal_type: '', card_number: '' }); setPage(1); }}
          className="text-xs text-zinc-400 hover:text-zinc-600 px-2 transition-colors"
        >
          Clear
        </button>
      </div>

      <div className="text-xs text-zinc-400 mb-3">{total} record{total !== 1 ? 's' : ''}</div>

      <div className="bg-white rounded-xl border border-zinc-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 text-xs text-zinc-400">
              <th className="text-left px-4 py-2 font-medium">Time</th>
              <th className="text-left px-4 py-2 font-medium">Card #</th>
              <th className="text-left px-4 py-2 font-medium">Holder</th>
              <th className="text-left px-4 py-2 font-medium">Group</th>
              <th className="text-left px-4 py-2 font-medium">Meal</th>
              <th className="text-left px-4 py-2 font-medium">Status</th>
              <th className="text-left px-4 py-2 font-medium">Reason</th>
              <th className="text-left px-4 py-2 font-medium">By</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <EmptyState icon={ScrollText} title="No logs found" description="Try adjusting the filters." />
                </td>
              </tr>
            ) : logs.map(log => (
              <tr key={log.id} className="border-b border-zinc-50 last:border-0 hover:bg-zinc-50">
                <td className="px-4 py-1.5 text-zinc-400 tabular-nums text-xs whitespace-nowrap">
                  {new Date(log.scanned_at).toLocaleString([], { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </td>
                <td className="px-4 py-1.5 font-mono text-xs text-zinc-500">{log.card_number}</td>
                <td className="px-4 py-1.5 text-zinc-700">{log.holder_name || '—'}</td>
                <td className="px-4 py-1.5 text-zinc-500">{log.group_name || '—'}</td>
                <td className="px-4 py-1.5">{log.meal_type ? <Badge type={log.meal_type} /> : '—'}</td>
                <td className="px-4 py-1.5"><Badge type={log.status} /></td>
                <td className="px-4 py-1.5 text-zinc-400 text-xs">{log.reason || '—'}</td>
                <td className="px-4 py-1.5 text-zinc-400 text-xs">{log.scanned_by_name || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-2 mt-4">
          <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <span className="text-xs text-zinc-500">Page {page} of {totalPages}</span>
          <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}
