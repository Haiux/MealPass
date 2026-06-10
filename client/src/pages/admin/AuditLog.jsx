import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';

const ACTION_COLORS = {
  CREATE: 'bg-green-100 text-green-700',
  UPDATE: 'bg-blue-100 text-blue-700',
  DELETE: 'bg-red-100 text-red-700',
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
    <div className="mt-2 text-xs rounded-lg overflow-hidden border border-gray-100">
      <div className="grid grid-cols-2">
        {old && (
          <div className="bg-red-50 px-3 py-2 border-r border-gray-100">
            <div className="font-medium text-red-600 mb-1">Before</div>
            {keys.map(k => (
              <div key={k} className={`flex gap-1 ${next && String(old[k]) !== String(next[k]) ? 'text-red-700 font-medium' : 'text-gray-500'}`}>
                <span className="shrink-0">{k}:</span>
                <span className="truncate">{String(old[k] ?? '—')}</span>
              </div>
            ))}
          </div>
        )}
        {next && (
          <div className={`bg-green-50 px-3 py-2 ${!old ? 'col-span-2' : ''}`}>
            <div className="font-medium text-green-600 mb-1">{old ? 'After' : 'Created'}</div>
            {keys.map(k => (
              <div key={k} className={`flex gap-1 ${old && String(old[k]) !== String(next[k]) ? 'text-green-700 font-medium' : 'text-gray-500'}`}>
                <span className="shrink-0">{k}:</span>
                <span className="truncate">{String(next[k] ?? '—')}</span>
              </div>
            ))}
          </div>
        )}
        {old && !next && (
          <div className="bg-gray-50 px-3 py-2 col-span-1 flex items-center text-gray-400 text-xs italic">
            Record deactivated / deleted
          </div>
        )}
      </div>
    </div>
  );
}

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
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-gray-900">Audit Log</h1>
        <p className="text-sm text-gray-400 mt-0.5">All admin actions — card, group, user, and schedule changes.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <input type="date" value={filters.date} onChange={e => setFilter('date', e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <select value={filters.resource_type} onChange={e => setFilter('resource_type', e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Resources</option>
          <option value="card">Card</option>
          <option value="group">Group</option>
          <option value="user">User</option>
          <option value="schedule">Schedule</option>
        </select>
        <select value={filters.action} onChange={e => setFilter('action', e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Actions</option>
          <option value="CREATE">Create</option>
          <option value="UPDATE">Update</option>
          <option value="DELETE">Delete</option>
        </select>
        <button onClick={() => { setFilters({ date: '', resource_type: '', action: '' }); setPage(1); }}
          className="text-xs text-gray-400 hover:text-gray-600 px-2">Clear</button>
      </div>

      <div className="text-xs text-gray-400 mb-3">{total} record{total !== 1 ? 's' : ''}</div>

      <div className="space-y-1">
        {logs.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-100 px-4 py-8 text-center text-gray-400 text-sm">
            No audit records found
          </div>
        )}
        {logs.map(log => (
          <div key={log.id} className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Timestamp */}
              <span className="text-gray-400 text-xs tabular-nums w-36 shrink-0">
                {new Date(log.timestamp).toLocaleString([], { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
              </span>

              {/* Action badge */}
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-600'}`}>
                {log.action}
              </span>

              {/* Resource type */}
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                {RESOURCE_LABELS[log.resource_type] || log.resource_type}
              </span>

              {/* Label */}
              <span className="text-sm text-gray-800 font-medium">{log.resource_label || `#${log.resource_id}`}</span>

              {/* By */}
              <span className="text-xs text-gray-400 ml-auto">by {log.performed_by_name || '—'}</span>

              {/* Expand */}
              {(log.old_values || log.new_values) && (
                <button
                  onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                  className="text-xs text-blue-500 hover:text-blue-700 shrink-0"
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

      {totalPages > 1 && (
        <div className="flex items-center gap-2 mt-4">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
            className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Previous</button>
          <span className="text-xs text-gray-500">Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
            className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Next</button>
        </div>
      )}
    </div>
  );
}
