import { useState, useEffect } from 'react';
import api from '../../api/axios';
import Modal from '../../components/Modal';
import Badge from '../../components/Badge';

const EMPTY = { staff_id: '', name: '', role: 'scanner', pin: '', active: true };

export default function Users() {
  const [users, setUsers] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => api.get('/users').then(r => setUsers(r.data.users));
  useEffect(() => { load(); }, []);

  function openAdd() { setForm(EMPTY); setError(''); setModal({ mode: 'add' }); }
  function openEdit(u) {
    setForm({ staff_id: u.staff_id, name: u.name, role: u.role, pin: '', active: !!u.active });
    setError(''); setModal({ mode: 'edit', user: u });
  }

  async function save() {
    setSaving(true); setError('');
    try {
      const payload = { ...form };
      if (modal.mode === 'edit' && !payload.pin) delete payload.pin;
      if (modal.mode === 'add') await api.post('/users', payload);
      else await api.put(`/users/${modal.user.id}`, payload);
      setModal(null); load();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  }

  async function deactivate(id) {
    if (!confirm('Deactivate this user?')) return;
    await api.delete(`/users/${id}`); load();
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold text-gray-900">Users</h1>
        <button onClick={openAdd} className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1.5 rounded-lg">+ Add User</button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-xs text-gray-400">
              <th className="text-left px-4 py-2.5 font-medium">Staff ID</th>
              <th className="text-left px-4 py-2.5 font-medium">Name</th>
              <th className="text-left px-4 py-2.5 font-medium">Role</th>
              <th className="text-left px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No users</td></tr>
            )}
            {users.map(u => (
              <tr key={u.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                <td className="px-4 py-2.5 font-mono text-xs text-gray-700">{u.staff_id}</td>
                <td className="px-4 py-2.5 text-gray-800">{u.name}</td>
                <td className="px-4 py-2.5"><Badge type={u.role} /></td>
                <td className="px-4 py-2.5"><Badge type={u.active ? 'active' : 'inactive'} label={u.active ? 'Active' : 'Inactive'} /></td>
                <td className="px-4 py-2.5 text-right">
                  <button onClick={() => openEdit(u)} className="text-xs text-blue-500 hover:text-blue-700 mr-3">Edit</button>
                  {u.active && <button onClick={() => deactivate(u.id)} className="text-xs text-red-400 hover:text-red-600">Deactivate</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal title={modal.mode === 'add' ? 'Add User' : 'Edit User'} onClose={() => setModal(null)}>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Staff ID (4–5 digits)</label>
              <input type="text" inputMode="numeric" maxLength={5} value={form.staff_id}
                onChange={e => setForm(f => ({ ...f, staff_id: e.target.value.replace(/\D/g, '') }))}
                disabled={modal.mode === 'edit'}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Name</label>
              <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Role</label>
              <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="scanner">Scanner</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                PIN {modal.mode === 'edit' && <span className="text-gray-400">(leave blank to keep current)</span>}
              </label>
              <input type="password" value={form.pin} onChange={e => setForm(f => ({ ...f, pin: e.target.value }))}
                placeholder={modal.mode === 'edit' ? 'New PIN (optional)' : 'Set PIN'}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            {modal.mode === 'edit' && (
              <div className="flex items-center gap-2">
                <input type="checkbox" id="uactive" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} className="rounded" />
                <label htmlFor="uactive" className="text-sm text-gray-600">Active</label>
              </div>
            )}
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
