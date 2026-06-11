import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';

const MEAL_CONFIG = {
  breakfast: { label: 'Breakfast', dot: 'bg-orange-400' },
  lunch:     { label: 'Lunch',     dot: 'bg-amber-400' },
  dinner:    { label: 'Dinner',    dot: 'bg-indigo-400' },
};

const inputCls = 'w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent';

export default function Schedules() {
  const [schedules, setSchedules] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const load = () => api.get('/schedules').then(r => setSchedules(r.data.schedules));
  useEffect(() => { load(); }, []);

  function startEdit(s) {
    setEditing(s.id);
    setForm({ start_time: s.start_time, end_time: s.end_time, active: !!s.active });
  }

  async function save(id) {
    setSaving(true);
    try {
      await api.put(`/schedules/${id}`, form);
      setEditing(null);
      toast.success('Schedule updated.');
      load();
    } catch {
      toast.error('Save failed.');
    } finally { setSaving(false); }
  }

  async function toggleActive(s) {
    try {
      await api.put(`/schedules/${s.id}`, { ...s, active: !s.active });
      load();
    } catch {
      toast.error('Failed to toggle schedule.');
    }
  }

  return (
    <div className="p-8">
      <PageHeader title="Meal Schedules" subtitle="Configure time windows for each meal period." />

      <div className="space-y-3 max-w-lg">
        {schedules.map(s => {
          const cfg = MEAL_CONFIG[s.meal_type] || { label: s.meal_type, dot: 'bg-zinc-400' };
          return (
            <div key={s.id} className="bg-white rounded-xl border border-zinc-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
                  <span className="font-medium text-zinc-800 text-sm">{cfg.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleActive(s)}
                    className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors
                      ${s.active
                        ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100'
                        : 'bg-zinc-100 text-zinc-500 ring-1 ring-zinc-200 hover:bg-zinc-200'}`}
                  >
                    {s.active ? 'Active' : 'Inactive'}
                  </button>
                  {editing !== s.id && (
                    <button onClick={() => startEdit(s)} className="text-xs text-zinc-500 hover:text-zinc-800 transition-colors">
                      Edit
                    </button>
                  )}
                </div>
              </div>

              {editing === s.id ? (
                <div className="space-y-3 pt-1">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-xs text-zinc-500 mb-1.5">Start Time</label>
                      <input type="time" value={form.start_time}
                        onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))}
                        className={inputCls} />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-zinc-500 mb-1.5">End Time</label>
                      <input type="time" value={form.end_time}
                        onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))}
                        className={inputCls} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id={`active-${s.id}`} checked={form.active}
                      onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
                      className="rounded border-zinc-300" />
                    <label htmlFor={`active-${s.id}`} className="text-sm text-zinc-600">Active</label>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" onClick={() => save(s.id)} disabled={saving}>
                      {saving ? 'Saving…' : 'Save'}
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-zinc-500 font-mono">
                  {s.start_time} – {s.end_time}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
