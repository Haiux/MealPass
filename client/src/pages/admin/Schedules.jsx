import { useState, useEffect } from 'react';
import api from '../../api/axios';

const MEAL_LABELS = { breakfast: '🌅 Breakfast', lunch: '☀️ Lunch', dinner: '🌙 Dinner' };

export default function Schedules() {
  const [schedules, setSchedules] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const load = () => api.get('/schedules').then(r => setSchedules(r.data.schedules));
  useEffect(() => { load(); }, []);

  function startEdit(s) {
    setEditing(s.id);
    setForm({ start_time: s.start_time, end_time: s.end_time, active: !!s.active });
    setMsg('');
  }

  async function save(id) {
    setSaving(true);
    try {
      await api.put(`/schedules/${id}`, form);
      setEditing(null);
      setMsg('Schedule updated.');
      load();
    } catch { setMsg('Save failed.'); }
    finally { setSaving(false); }
  }

  async function toggleActive(s) {
    await api.put(`/schedules/${s.id}`, { active: !s.active });
    load();
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-gray-900">Meal Schedules</h1>
        <p className="text-sm text-gray-400 mt-0.5">Configure time windows for each meal period.</p>
      </div>

      {msg && <div className="mb-4 text-sm text-green-600 bg-green-50 rounded-lg px-3 py-2 w-fit">{msg}</div>}

      <div className="space-y-4 max-w-xl">
        {schedules.map(s => (
          <div key={s.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="font-medium text-gray-800">{MEAL_LABELS[s.meal_type] || s.meal_type}</div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleActive(s)}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors
                    ${s.active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                >
                  {s.active ? 'Active' : 'Inactive'}
                </button>
                <button onClick={() => startEdit(s)} className="text-xs text-blue-500 hover:text-blue-700">Edit</button>
              </div>
            </div>

            {editing === s.id ? (
              <div className="space-y-3">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-400 mb-1">Start Time</label>
                    <input type="time" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-400 mb-1">End Time</label>
                    <input type="time" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id={`active-${s.id}`} checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} className="rounded" />
                  <label htmlFor={`active-${s.id}`} className="text-sm text-gray-600">Active</label>
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={() => save(s.id)} disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1.5 rounded-lg disabled:opacity-50">
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                  <button onClick={() => setEditing(null)} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500">
                {s.start_time} – {s.end_time}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
