import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import Button from '../../components/Button';
import PageHeader from '../../components/PageHeader';

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const MEAL_CONFIG = {
  breakfast: { label: 'Breakfast', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', num: 'text-orange-600' },
  lunch:     { label: 'Lunch',     bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-700',  num: 'text-amber-600' },
  dinner:    { label: 'Dinner',    bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', num: 'text-indigo-600' },
  total:     { label: 'Total',     bg: 'bg-zinc-50',   border: 'border-zinc-200',   text: 'text-zinc-600',   num: 'text-zinc-900' },
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
        c.breakfast ? 'Yes' : 'No', c.lunch ? 'Yes' : 'No', c.dinner ? 'Yes' : 'No', total,
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
    });
    const sep = Array(7).fill('""').join(',');
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
      <PageHeader
        title="Finance Daily Report"
        subtitle="Meal headcount for reconciliation"
        action={<Button variant="secondary" size="sm" onClick={exportCSV} disabled={!data}>Export CSV</Button>}
      />

      {/* Date picker */}
      <div className="mb-6">
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          className="border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent" />
      </div>

      {loading && <div className="text-sm text-zinc-400">Loading…</div>}

      {data && !loading && (
        <div className="space-y-8">
          {/* Summary cards */}
          <div>
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Summary — {data.date}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {['breakfast', 'lunch', 'dinner'].map(m => {
                const c = MEAL_CONFIG[m];
                const s = data.summary[m];
                return (
                  <div key={m} className={`rounded-xl border p-4 ${c.bg} ${c.border}`}>
                    <div className={`text-xs font-semibold mb-2 uppercase tracking-wider ${c.text}`}>{c.label}</div>
                    <div className={`text-3xl font-bold ${c.num}`}>{s.granted}</div>
                    <div className="text-xs text-zinc-500 mt-0.5">granted</div>
                    {s.denied > 0 && <div className="text-xs text-red-500 mt-1">{s.denied} denied</div>}
                  </div>
                );
              })}
              <div className={`rounded-xl border p-4 ${MEAL_CONFIG.total.bg} ${MEAL_CONFIG.total.border}`}>
                <div className={`text-xs font-semibold mb-2 uppercase tracking-wider ${MEAL_CONFIG.total.text}`}>{MEAL_CONFIG.total.label}</div>
                <div className={`text-3xl font-bold ${MEAL_CONFIG.total.num}`}>{data.total_granted}</div>
                <div className="text-xs text-zinc-500 mt-0.5">total granted</div>
                {data.total_denied > 0 && <div className="text-xs text-red-500 mt-1">{data.total_denied} denied</div>}
              </div>
            </div>
          </div>

          {/* By-group breakdown */}
          {data.by_group.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">By Group</h2>
              <div className="bg-white rounded-xl border border-zinc-100 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-100 text-xs text-zinc-400">
                      <th className="text-left px-4 py-2 font-medium">Group</th>
                      <th className="text-center px-4 py-2 font-medium">Breakfast</th>
                      <th className="text-center px-4 py-2 font-medium">Lunch</th>
                      <th className="text-center px-4 py-2 font-medium">Dinner</th>
                      <th className="text-center px-4 py-2 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.by_group.map(g => (
                      <tr key={g.group_name} className="border-b border-zinc-50 last:border-0 hover:bg-zinc-50">
                        <td className="px-4 py-1.5 font-medium text-zinc-800">{g.group_name}</td>
                        <td className="px-4 py-1.5 text-center tabular-nums text-zinc-600">{g.breakfast || <span className="text-zinc-200">—</span>}</td>
                        <td className="px-4 py-1.5 text-center tabular-nums text-zinc-600">{g.lunch || <span className="text-zinc-200">—</span>}</td>
                        <td className="px-4 py-1.5 text-center tabular-nums text-zinc-600">{g.dinner || <span className="text-zinc-200">—</span>}</td>
                        <td className="px-4 py-1.5 text-center font-semibold text-zinc-900 tabular-nums">{g.total}</td>
                      </tr>
                    ))}
                    <tr className="bg-zinc-50 border-t border-zinc-200">
                      <td className="px-4 py-1.5 font-semibold text-zinc-600 text-xs uppercase tracking-wider">Total</td>
                      {['breakfast', 'lunch', 'dinner'].map(m => (
                        <td key={m} className="px-4 py-1.5 text-center font-semibold text-zinc-700 tabular-nums">
                          {data.summary[m].granted || <span className="text-zinc-300">0</span>}
                        </td>
                      ))}
                      <td className="px-4 py-1.5 text-center font-bold text-zinc-900 tabular-nums">{data.total_granted}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Card detail */}
          <div>
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
              Card Detail — {data.card_detail.length} card{data.card_detail.length !== 1 ? 's' : ''} with meals
            </h2>
            {data.card_detail.length === 0 ? (
              <div className="bg-white rounded-xl border border-zinc-100 px-4 py-8 text-center text-zinc-400 text-sm">
                No meals claimed on this date
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-zinc-100 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-100 text-xs text-zinc-400">
                      <th className="text-left px-4 py-2 font-medium">Card #</th>
                      <th className="text-left px-4 py-2 font-medium">Holder</th>
                      <th className="text-left px-4 py-2 font-medium">Group</th>
                      <th className="text-center px-4 py-2 font-medium">Breakfast</th>
                      <th className="text-center px-4 py-2 font-medium">Lunch</th>
                      <th className="text-center px-4 py-2 font-medium">Dinner</th>
                      <th className="text-center px-4 py-2 font-medium">Meals</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.card_detail.map(c => {
                      const total = [c.breakfast, c.lunch, c.dinner].filter(Boolean).length;
                      return (
                        <tr key={c.card_number} className="border-b border-zinc-50 last:border-0 hover:bg-zinc-50">
                          <td className="px-4 py-1.5 font-mono text-xs text-zinc-500">{c.card_number}</td>
                          <td className="px-4 py-1.5 text-zinc-800">{c.holder_name}</td>
                          <td className="px-4 py-1.5 text-zinc-500">{c.group_name}</td>
                          {['breakfast', 'lunch', 'dinner'].map(m => (
                            <td key={m} className="px-4 py-1.5 text-center">
                              {c[m]
                                ? <span className="text-emerald-500 font-bold">✓</span>
                                : <span className="text-zinc-200">—</span>}
                            </td>
                          ))}
                          <td className="px-4 py-1.5 text-center">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full
                              ${total === 3 ? 'bg-violet-100 text-violet-700' : total === 2 ? 'bg-sky-100 text-sky-700' : 'bg-zinc-100 text-zinc-600'}`}>
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
