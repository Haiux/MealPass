import { useState, useEffect, useCallback } from 'react';
import { ShieldCheck } from 'lucide-react';
import api from '../../api/axios';
import Button from '../../components/Button';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';

const ACTION_STYLES = {
  CREATE: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  UPDATE: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200',
  DELETE: 'bg-red-50 text-red-700 ring-1 ring-red-200',
};

const RESOURCE_LABELS = { card: 'Card', group: 'Group', user: 'User', schedule: 'Schedule' };

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function DiffView({ oldValues, newValues }) {
  const old = oldValues ? JSON.parse(oldValues) : null;
  const next = newValues ? JSON.parse(newValues) : null;
  const keys = [...new Set([...Object.keys(old || {}), ...Object.keys(next || {})])];

  return (
    <div className="mt-3 text-xs rounded-lg overflow-hidden border border-zinc-100">
      <div className="grid grid-cols-2">
        {old && (
          <div className="bg-red-50 px-3 py-2.5 border-r border-zinc-100">
            <div className="font-semibold text-red-600 mb-1.5 text-[10px] uppercase tracking-wider">Before</div>
            {keys.map(k => (
              <div key={k} className={`flex gap-1.5 py-0.5 ${next && String(old[k]) !== String(next[k]) ? 'text-red-700 font-medium' : 'text-zinc-400'}`}>
                <span className="shrink-0 text-zinc-400">{k}:</span>
                <span className="truncate">{String(old[k] ?? '—')}</span>
              </div>
            ))}
          </div>
        )}
        {next && (
          <div className={`bg-emerald-50 px-3 py-2.5 ${!old ? 'col-span-2' : ''}`}>
            <div className="font-semibold text-emerald-600 mb-1.5 text-[10px] uppercase tracking-wider">{old ? 'After' : 'Created'}</div>
            {keys.map(k => (
              <div key={k} className={`flex gap-1.5 py-0.5 ${old && String(old[k]) !== String(next[k]) ? 'text-emerald-700 font-medium' : 'text-zinc-400'}`}>
                <span className="shrink-0 text-zinc-400">{k}:</span>
                <span className="truncate">{String(next[k] ?? '—')}</span>
              </div>
            ))}
          </div>
        )}
        {old && !next && (
          <div className="bg-zinc-50 px-3 py-2.5 flex items-center text-zinc-400 text-xs italic">
            Record deactivated / deleted
          </div>
        )}
      </div>
    </div>
  );
}

const filterCls = 'border border-zinc-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent bg-white';

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 50;
  const [expanded, setExpanded] = useState(null);
  const [filters, setFilters] = useState({ date: todayStr(), resource_type: '', action: '' });

  const load = useCallback(async () => {
    const params = new URLSearchParams({ page, limit });
    if (filters.date) params.set('date', filters.date);
    if (filters.resource_type) params.set('resource_type', filters.resource_type);
    if (filters.action) params.set('action', filters.action);
    const res = await api.get(`/audit-logs?${params}`);
    setLogs(res.data.logs);
    setTotal(res.data.total);
  }, [filters, page]);

  useEffect(() => { load(); }, [load]);

  function setFilter(k, v) { setFilters(f => ({ ...f, [k]: v })); setPage(1); }
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-8">
      <PageHeader title="Audit Log" subtitle="All admin actions — cards, groups, users, schedules." />

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <input type="date" value={filters.date} onChange={e => setFilter('date', e.target.value)} className={filterCls} />
        <select value={filters.resource_type} onChange={e => setFilter('resource_type', e.target.value)} className={filterCls}>
          <option value="">All Resources</option>
          <option value="card">Card</option>
          <option value="group">Group</option>
          <option value="user">User</option>
          <option value="schedule">Schedule</option>
        </select>
        <select value={filters.action} onChange={e => setFilter('action', e.target.value)} className={filterCls}>
          <option value="">All Actions</option>
          <option value="CREATE">Create</option>
          <option value="UPDATE">Update</option>
          <option value="DELETE">Delete</option>
        </select>
        <button
          onClick={() => { setFilters({ date: '', resource_type: '', action: '' }); setPage(1); }}
          className="text-xs text-zinc-400 hover:text-zinc-600 px-2 transition-colors"
        >
          Clear
        </button>
      </div>

      <div className="text-xs text-zinc-400 mb-3">{total} record{total !== 1 ? 's' : ''}</div>

      {logs.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="No audit records found" description="Admin actions will appear here." />
      ) : (
        <div className="space-y-1.5">
          {logs.map(log => (
            <div key={log.id} className="bg-white rounded-xl border border-zinc-100 shadow-sm px-4 py-3">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-zinc-400 text-xs tabular-nums shrink-0 w-32">
                  {new Date(log.timestamp).toLocaleString([], { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </span>

                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${ACTION_STYLES[log.action] || 'bg-zinc-100 text-zinc-600'}`}>
                  {log.action}
                </span>

                <span className="text-xs text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full shrink-0">
                  {RESOURCE_LABELS[log.resource_type] || log.resource_type}
                </span>

                <span className="text-sm text-zinc-800 font-medium">{log.resource_label || `#${log.resource_id}`}</span>

                <span className="text-xs text-zinc-400 ml-auto shrink-0">by {log.performed_by_name || '—'}</span>

                {(log.old_values || log.new_values) && (
                  <button
                    onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                    className="text-xs text-zinc-500 hover:text-zinc-800 shrink-0 transition-colors"
                  >
                    {expanded === log.id ? 'Hide' : 'Details'}
                  </button>
                )}
              </div>

              {expanded === log.id && (
                <DiffView oldValues={log.old_values} newValues={log.new_values} />
              )}
            </div>
          ))}
        </div>
      )}

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
