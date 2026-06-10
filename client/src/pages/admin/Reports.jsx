import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const MEAL_COLORS = {
  breakfast: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', label: '🌅 Breakfast' },
  lunch:     { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', label: '☀️ Lunch' },
  dinner:    { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', label: '🌙 Dinner' },
  total:     { bg: 'bg-gray-50',   border: 'border-gray-200',   text: 'text-gray-700',   label: '∑ Total' },
};

export default function Reports() {
  const [date, setDate] = useState(todayStr());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/reports/daily?date=${date}`);
      setData(res.data);
    } catch { setData(null); }
    finally { setLoading(false); }
  }, [date]);

  useEffect(() => { load(); }, [load]);

  function exportCSV() {
    if (!data) return;
    const header = 'Card Number,Holder Name,Group,Breakfast,Lunch,Dinner,Total Meals';
    const rows = data.card_detail.map(c => {
      const total = [c.breakfast, c.lunch, c.dinner].filter(Boolean).length;
      return [c.card_number, c.holder_name, c.group_name,
        c.breakfast ? 'Yes' : 'No',
        c.lunch ? 'Yes' : 'No',
        c.dinner ? 'Yes' : 'No',
        total,
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
    });

    // Append summary at the bottom
    const sep = ['','','','','','',''].map(() => '""').join(',');
    const summaryRows = [
      sep,
      `"Summary for ${data.date}","","","","","",""`,
      `"","","Breakfast Granted","Lunch Granted","Dinner Granted","Total Granted","Total Denied"`,
      `"TOTAL","","${data.summary.breakfast.granted}","${data.summary.lunch.granted}","${data.summary.dinner.granted}","${data.total_granted}","${data.total_denied}"`,
    ];

    const csv = [header, ...rows, ...summaryRows].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `meal-report-${data.date}.csv`;
    a.click();
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Finance Daily Report</h1>
          <p className="text-sm text-gray-400 mt-0.5">Meal headcount for finance reconciliation.</p>
        </div>
        <button onClick={exportCSV} disabled={!data}
          className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 disabled:opacity-40">
          Export CSV
        </button>
      </div>

      {/* Date picker */}
      <div className="mb-6">
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      {loading && <div className="text-sm text-gray-400">Loading…</div>}

      {data && !loading && (
        <div className="space-y-8">
          {/* Summary cards */}
          <div>
            <h2 className="text-sm font-medium text-gray-700 mb-3">Summary — {data.date}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['breakfast', 'lunch', 'dinner'].map(m => {
                const c = MEAL_COLORS[m];
                const s = data.summary[m];
                return (
                  <div key={m} className={`rounded-xl border p-4 ${c.bg} ${c.border}`}>
                    <div className={`text-xs font-semibold mb-2 ${c.text}`}>{c.label}</div>
                    <div className="text-3xl font-bold text-gray-900">{s.granted}</div>
                    <div className="text-xs text-gray-500 mt-0.5">granted</div>
                    {s.denied > 0 && <div className="text-xs text-red-500 mt-1">{s.denied} denied</div>}
                  </div>
                );
              })}
              <div className={`rounded-xl border p-4 ${MEAL_COLORS.total.bg} ${MEAL_COLORS.total.border}`}>
                <div className={`text-xs font-semibold mb-2 ${MEAL_COLORS.total.text}`}>{MEAL_COLORS.total.label}</div>
                <div className="text-3xl font-bold text-gray-900">{data.total_granted}</div>
                <div className="text-xs text-gray-500 mt-0.5">total granted</div>
                {data.total_denied > 0 && <div className="text-xs text-red-500 mt-1">{data.total_denied} denied</div>}
              </div>
            </div>
          </div>

          {/* By-group breakdown */}
          {data.by_group.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-gray-700 mb-3">By Group</h2>
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-xs text-gray-400">
                      <th className="text-left px-4 py-2.5 font-medium">Group</th>
                      <th className="text-center px-4 py-2.5 font-medium">Breakfast</th>
                      <th className="text-center px-4 py-2.5 font-medium">Lunch</th>
                      <th className="text-center px-4 py-2.5 font-medium">Dinner</th>
                      <th className="text-center px-4 py-2.5 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.by_group.map(g => (
                      <tr key={g.group_name} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                        <td className="px-4 py-2.5 font-medium text-gray-800">{g.group_name}</td>
                        <td className="px-4 py-2.5 text-center tabular-nums">{g.breakfast || <span className="text-gray-300">—</span>}</td>
                        <td className="px-4 py-2.5 text-center tabular-nums">{g.lunch || <span className="text-gray-300">—</span>}</td>
                        <td className="px-4 py-2.5 text-center tabular-nums">{g.dinner || <span className="text-gray-300">—</span>}</td>
                        <td className="px-4 py-2.5 text-center font-semibold text-gray-900 tabular-nums">{g.total}</td>
                      </tr>
                    ))}
                    {/* Totals row */}
                    <tr className="bg-gray-50 border-t border-gray-200">
                      <td className="px-4 py-2.5 font-semibold text-gray-700">Total</td>
                      {['breakfast', 'lunch', 'dinner'].map(m => (
                        <td key={m} className="px-4 py-2.5 text-center font-semibold text-gray-700 tabular-nums">
                          {data.summary[m].granted || <span className="text-gray-300">0</span>}
                        </td>
                      ))}
                      <td className="px-4 py-2.5 text-center font-bold text-gray-900 tabular-nums">{data.total_granted}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Card detail */}
          <div>
            <h2 className="text-sm font-medium text-gray-700 mb-3">
              Card Detail — {data.card_detail.length} card{data.card_detail.length !== 1 ? 's' : ''} claimed at least one meal
            </h2>
            {data.card_detail.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 px-4 py-8 text-center text-gray-400 text-sm">
                No meals claimed on this date
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-xs text-gray-400">
                      <th className="text-left px-4 py-2.5 font-medium">Card #</th>
                      <th className="text-left px-4 py-2.5 font-medium">Holder</th>
                      <th className="text-left px-4 py-2.5 font-medium">Group</th>
                      <th className="text-center px-4 py-2.5 font-medium">Breakfast</th>
                      <th className="text-center px-4 py-2.5 font-medium">Lunch</th>
                      <th className="text-center px-4 py-2.5 font-medium">Dinner</th>
                      <th className="text-center px-4 py-2.5 font-medium">Meals</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.card_detail.map(c => {
                      const total = [c.breakfast, c.lunch, c.dinner].filter(Boolean).length;
                      return (
                        <tr key={c.card_number} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                          <td className="px-4 py-2 font-mono text-xs text-gray-600">{c.card_number}</td>
                          <td className="px-4 py-2 text-gray-800">{c.holder_name}</td>
                          <td className="px-4 py-2 text-gray-500">{c.group_name}</td>
                          {['breakfast', 'lunch', 'dinner'].map(m => (
                            <td key={m} className="px-4 py-2 text-center">
                              {c[m]
                                ? <span className="text-green-500 font-bold">✓</span>
                                : <span className="text-gray-200">—</span>}
                            </td>
                          ))}
                          <td className="px-4 py-2 text-center">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${total === 3 ? 'bg-purple-100 text-purple-700' : total === 2 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                              {total}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
