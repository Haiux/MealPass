import { useState, useEffect } from 'react';
import api from '../../api/axios';
import Badge from '../../components/Badge';

export default function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/dashboard/stats').then(r => setData(r.data)).catch(() => {});
  }, []);

  if (!data) return <div className="p-8 text-gray-400 text-sm">Loading…</div>;

  const meals = ['breakfast', 'lunch', 'dinner'];

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-400 mt-0.5">Today — {data.date}</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 mb-8 max-w-sm">
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <div className="text-2xl font-bold text-green-600">{data.totalGranted}</div>
          <div className="text-xs text-gray-400 mt-0.5">Granted today</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <div className="text-2xl font-bold text-red-500">{data.totalDenied}</div>
          <div className="text-xs text-gray-400 mt-0.5">Denied today</div>
        </div>
      </div>

      {/* Per-meal breakdown */}
      <div className="mb-8">
        <h2 className="text-sm font-medium text-gray-700 mb-3">Today's Meal Breakdown</h2>
        <div className="grid grid-cols-3 gap-4 max-w-lg">
          {meals.map(meal => (
            <div key={meal} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wider capitalize mb-2">{meal}</div>
              <div className="flex items-end gap-2">
                <span className="text-xl font-bold text-green-600">{data.stats[meal]?.granted || 0}</span>
                <span className="text-sm text-gray-300 mb-0.5">/</span>
                <span className="text-xl font-bold text-red-400">{data.stats[meal]?.denied || 0}</span>
              </div>
              <div className="text-xs text-gray-400 mt-1">granted / denied</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent logs */}
      <div>
        <h2 className="text-sm font-medium text-gray-700 mb-3">Recent Activity</h2>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {data.recentLogs.length === 0 ? (
            <div className="px-4 py-6 text-center text-gray-400 text-sm">No scans today</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50 text-xs text-gray-400">
                  <th className="text-left px-4 py-2.5 font-medium">Time</th>
                  <th className="text-left px-4 py-2.5 font-medium">Card</th>
                  <th className="text-left px-4 py-2.5 font-medium">Holder</th>
                  <th className="text-left px-4 py-2.5 font-medium">Meal</th>
                  <th className="text-left px-4 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.recentLogs.map(log => (
                  <tr key={log.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-2.5 text-gray-500 tabular-nums">
                      {new Date(log.scanned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-gray-600">{log.card_number}</td>
                    <td className="px-4 py-2.5 text-gray-700">{log.holder_name || '—'}</td>
                    <td className="px-4 py-2.5">
                      {log.meal_type && <Badge type={log.meal_type} />}
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge type={log.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
