import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Users as UsersIcon } from 'lucide-react';
import api from '../../api/axios';
import Modal from '../../components/Modal';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';

const EMPTY = { staff_id: '', name: '', role: 'scanner', pin: '', active: true };

const inputCls = 'w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent';
const labelCls = 'block text-xs font-medium text-zinc-500 mb-1.5';

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
      setModal(null);
      toast.success(modal.mode === 'add' ? 'User added.' : 'User updated.');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  }

  async function deactivate(id) {
    if (!confirm('Deactivate this user?')) return;
    try {
      await api.delete(`/users/${id}`);
      toast.success('User deactivated.');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Deactivate failed');
    }
  }

  return (
    <div className="p-8">
      <PageHeader
        title="Users"
        subtitle="Staff and scanner accounts"
        action={<Button onClick={openAdd}>+ Add User</Button>}
      />

      <div className="bg-white rounded-xl border border-zinc-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 text-xs text-zinc-400">
              <th className="text-left px-4 py-2 font-medium">Staff ID</th>
              <th className="text-left px-4 py-2 font-medium">Name</th>
              <th className="text-left px-4 py-2 font-medium">Role</th>
              <th className="text-left px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <EmptyState icon={UsersIcon} title="No users" description="Add an admin or scanner account." />
                </td>
              </tr>
            ) : users.map(u => (
              <tr key={u.id} className="border-b border-zinc-50 last:border-0 hover:bg-zinc-50">
                <td className="px-4 py-1.5 font-mono text-xs text-zinc-600">{u.staff_id}</td>
                <td className="px-4 py-1.5 text-zinc-800">{u.name}</td>
                <td className="px-4 py-1.5"><Badge type={u.role} /></td>
                <td className="px-4 py-1.5"><Badge type={u.active ? 'active' : 'inactive'} label={u.active ? 'Active' : 'Inactive'} /></td>
                <td className="px-4 py-1.5 text-right">
                  <button onClick={() => openEdit(u)} className="text-xs text-zinc-500 hover:text-zinc-800 mr-3 transition-colors">Edit</button>
                  {u.active && (
                    <button onClick={() => deactivate(u.id)} className="text-xs text-red-400 hover:text-red-600 transition-colors">Deactivate</button>
                  )}
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
              <label className={labelCls}>Staff ID (4–5 digits)</label>
              <input type="text" inputMode="numeric" maxLength={5} value={form.staff_id}
                onChange={e => setForm(f => ({ ...f, staff_id: e.target.value.replace(/\D/g, '') }))}
                disabled={modal.mode === 'edit'}
                className={`${inputCls} disabled:bg-zinc-50 disabled:text-zinc-400`} />
            </div>
            <div>
              <label className={labelCls}>Name</label>
              <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Role</label>
              <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                className={inputCls}>
                <option value="scanner">Scanner</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>
                PIN {modal.mode === 'edit' && <span className="text-zinc-300 font-normal">(leave blank to keep current)</span>}
              </label>
              <input type="password" value={form.pin} onChange={e => setForm(f => ({ ...f, pin: e.target.value }))}
                placeholder={modal.mode === 'edit' ? 'New PIN (optional)' : 'Set PIN'}
                className={inputCls} />
            </div>
            {modal.mode === 'edit' && (
              <div className="flex items-center gap-2">
                <input type="checkbox" id="uactive" checked={form.active}
                  onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
                  className="rounded border-zinc-300" />
                <label htmlFor="uactive" className="text-sm text-zinc-600">Active</label>
              </div>
            )}
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
