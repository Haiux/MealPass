import { useState, useEffect } from 'react';
import api from '../../api/axios';
import Modal from '../../components/Modal';

const EMPTY = { name: '', description: '', breakfast: true, lunch: true, dinner: true };

export default function Groups() {
  const [groups, setGroups] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => api.get('/groups').then(r => setGroups(r.data.groups));

  useEffect(() => { load(); }, []);

  function openAdd() { setForm(EMPTY); setError(''); setModal({ mode: 'add' }); }
  function openEdit(g) {
    setForm({ name: g.name, description: g.description || '', breakfast: !!g.breakfast, lunch: !!g.lunch, dinner: !!g.dinner });
    setError('');
    setModal({ mode: 'edit', group: g });
  }

  async function save() {
    setSaving(true); setError('');
    try {
      const payload = { ...form, breakfast: form.breakfast ? 1 : 0, lunch: form.lunch ? 1 : 0, dinner: form.dinner ? 1 : 0 };
      if (modal.mode === 'add') await api.post('/groups', payload);
      else await api.put(`/groups/${modal.group.id}`, payload);
      setModal(null); load();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  }

  async function del(id) {
    if (!confirm('Delete this group?')) return;
    try { await api.delete(`/groups/${id}`); load(); }
    catch (err) { alert(err.response?.data?.message || 'Delete failed'); }
  }

  const MealCheck = ({ meal }) => (
    <label className="flex items-center gap-1.5 text-sm">
      <input type="checkbox" checked={form[meal]} onChange={e => setForm(f => ({ ...f, [meal]: e.target.checked }))} className="rounded" />
      <span className="capitalize">{meal}</span>
    </label>
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold text-gray-900">Groups</h1>
        <button onClick={openAdd} className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1.5 rounded-lg">+ Add Group</button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-xs text-gray-400">
              <th className="text-left px-4 py-2.5 font-medium">Name</th>
              <th className="text-left px-4 py-2.5 font-medium">Description</th>
              <th className="text-center px-4 py-2.5 font-medium">Breakfast</th>
              <th className="text-center px-4 py-2.5 font-medium">Lunch</th>
              <th className="text-center px-4 py-2.5 font-medium">Dinner</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {groups.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No groups yet</td></tr>
            )}
            {groups.map(g => (
              <tr key={g.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                <td className="px-4 py-2.5 font-medium text-gray-800">{g.name}</td>
                <td className="px-4 py-2.5 text-gray-500">{g.description || <span className="text-gray-300">—</span>}</td>
                {['breakfast', 'lunch', 'dinner'].map(m => (
                  <td key={m} className="px-4 py-2.5 text-center">
                    {g[m] ? <span className="text-green-500">✓</span> : <span className="text-gray-300">—</span>}
                  </td>
                ))}
                <td className="px-4 py-2.5 text-right">
                  <button onClick={() => openEdit(g)} className="text-xs text-blue-500 hover:text-blue-700 mr-3">Edit</button>
                  <button onClick={() => del(g.id)} className="text-xs text-red-400 hover:text-red-600">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal title={modal.mode === 'add' ? 'Add Group' : 'Edit Group'} onClose={() => setModal(null)}>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Name</label>
              <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Description (optional)</label>
              <input type="text" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-2">Meal Eligibility</label>
              <div className="flex gap-4">
                <MealCheck meal="breakfast" />
                <MealCheck meal="lunch" />
                <MealCheck meal="dinner" />
              </div>
            </div>
            {error && <div className="text-red-500 text-xs bg-red-50 rounded px-3 py-2">{error}</div>}
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setModal(null)} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5">Cancel</button>
              <button onClick={save} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-1.5 rounded-lg disabled:opacity-50">
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
