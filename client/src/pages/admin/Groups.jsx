import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Users2 } from 'lucide-react';
import api from '../../api/axios';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';

const EMPTY = { name: '', description: '', breakfast: true, lunch: true, dinner: true };

const inputCls = 'w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent';
const labelCls = 'block text-xs font-medium text-zinc-500 mb-1.5';

const MEAL_BADGES = {
  breakfast: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
  lunch: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  dinner: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200',
};

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
      setModal(null);
      toast.success(modal.mode === 'add' ? 'Group added.' : 'Group updated.');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  }

  async function del(id) {
    if (!confirm('Delete this group?')) return;
    try { await api.delete(`/groups/${id}`); toast.success('Group deleted.'); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
  }

  const MealCheck = ({ meal }) => (
    <label className="flex items-center gap-1.5 text-sm text-zinc-600 cursor-pointer">
      <input type="checkbox" checked={form[meal]} onChange={e => setForm(f => ({ ...f, [meal]: e.target.checked }))}
        className="rounded border-zinc-300" />
      <span className="capitalize">{meal}</span>
    </label>
  );

  return (
    <div className="p-8">
      <PageHeader
        title="Groups"
        subtitle="Meal eligibility per group"
        action={<Button onClick={openAdd}>+ Add Group</Button>}
      />

      <div className="bg-white rounded-xl border border-zinc-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 text-xs text-zinc-400">
              <th className="text-left px-4 py-2 font-medium">Name</th>
              <th className="text-left px-4 py-2 font-medium">Description</th>
              <th className="text-center px-4 py-2 font-medium">Breakfast</th>
              <th className="text-center px-4 py-2 font-medium">Lunch</th>
              <th className="text-center px-4 py-2 font-medium">Dinner</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {groups.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <EmptyState icon={Users2} title="No groups yet" description="Create a group to assign meal eligibility." />
                </td>
              </tr>
            ) : groups.map(g => (
              <tr key={g.id} className="border-b border-zinc-50 last:border-0 hover:bg-zinc-50">
                <td className="px-4 py-1.5 font-medium text-zinc-800">{g.name}</td>
                <td className="px-4 py-1.5 text-zinc-500 text-xs">{g.description || <span className="text-zinc-300">—</span>}</td>
                {['breakfast', 'lunch', 'dinner'].map(m => (
                  <td key={m} className="px-4 py-1.5 text-center">
                    {g[m]
                      ? <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${MEAL_BADGES[m]}`}>✓</span>
                      : <span className="text-zinc-200">—</span>}
                  </td>
                ))}
                <td className="px-4 py-1.5 text-right">
                  <button onClick={() => openEdit(g)} className="text-xs text-zinc-500 hover:text-zinc-800 mr-3 transition-colors">Edit</button>
                  <button onClick={() => del(g.id)} className="text-xs text-red-400 hover:text-red-600 transition-colors">Delete</button>
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
              <label className={labelCls}>Name</label>
              <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Description (optional)</label>
              <input type="text" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Meal Eligibility</label>
              <div className="flex gap-4">
                <MealCheck meal="breakfast" />
                <MealCheck meal="lunch" />
                <MealCheck meal="dinner" />
              </div>
            </div>
            {error && <div className="text-red-600 text-xs bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</div>}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
              <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
