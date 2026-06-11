import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { CreditCard } from 'lucide-react';
import api from '../../api/axios';
import Modal from '../../components/Modal';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';

const EMPTY = { card_number: '', holder_name: '', group_id: '', active: true, expires_at: '' };

const inputCls = 'w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent';
const labelCls = 'block text-xs font-medium text-zinc-500 mb-1.5';

export default function Cards() {
  const [cards, setCards] = useState([]);
  const [groups, setGroups] = useState([]);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const [cr, gr] = await Promise.all([
      api.get(`/cards${search ? `?search=${encodeURIComponent(search)}` : ''}`),
      api.get('/groups'),
    ]);
    setCards(cr.data.cards);
    setGroups(gr.data.groups);
  }, [search]);

  useEffect(() => { load(); }, [load]);

  function openAdd() {
    setForm({ ...EMPTY, group_id: groups[0]?.id || '' });
    setError('');
    setModal({ mode: 'add' });
  }

  function openEdit(card) {
    setForm({
      card_number: card.card_number,
      holder_name: card.holder_name,
      group_id: card.group_id,
      active: !!card.active,
      expires_at: card.expires_at ? card.expires_at.slice(0, 10) : '',
    });
    setError('');
    setModal({ mode: 'edit', card });
  }

  async function save() {
    setSaving(true);
    setError('');
    try {
      const payload = { ...form, expires_at: form.expires_at || null, group_id: Number(form.group_id) };
      if (modal.mode === 'add') await api.post('/cards', payload);
      else await api.put(`/cards/${modal.card.id}`, payload);
      setModal(null);
      toast.success(modal.mode === 'add' ? 'Card added.' : 'Card updated.');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function deactivate(id) {
    if (!confirm('Deactivate this card?')) return;
    try {
      await api.delete(`/cards/${id}`);
      toast.success('Card deactivated.');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Deactivate failed');
    }
  }

  return (
    <div className="p-8">
      <PageHeader
        title="Cards"
        subtitle={`${cards.length} card${cards.length !== 1 ? 's' : ''}`}
        action={<Button onClick={openAdd}>+ Add Card</Button>}
      />

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by card number or name…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-zinc-200 rounded-lg px-3 py-2 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
        />
      </div>

      <div className="bg-white rounded-xl border border-zinc-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 text-xs text-zinc-400">
              <th className="text-left px-4 py-2 font-medium">Card #</th>
              <th className="text-left px-4 py-2 font-medium">Holder</th>
              <th className="text-left px-4 py-2 font-medium">Group</th>
              <th className="text-left px-4 py-2 font-medium">Expires</th>
              <th className="text-left px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {cards.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <EmptyState icon={CreditCard} title="No cards found" description="Add a card to get started." />
                </td>
              </tr>
            ) : cards.map(card => (
              <tr key={card.id} className="border-b border-zinc-50 last:border-0 hover:bg-zinc-50">
                <td className="px-4 py-1.5 font-mono text-xs text-zinc-600">{card.card_number}</td>
                <td className="px-4 py-1.5 text-zinc-800">{card.holder_name}</td>
                <td className="px-4 py-1.5 text-zinc-500">{card.group_name}</td>
                <td className="px-4 py-1.5 text-zinc-500 text-xs">
                  {card.expires_at ? card.expires_at.slice(0, 10) : <span className="text-zinc-300">—</span>}
                </td>
                <td className="px-4 py-1.5">
                  <Badge type={card.active ? 'active' : 'inactive'} label={card.active ? 'Active' : 'Inactive'} />
                </td>
                <td className="px-4 py-1.5 text-right">
                  <button onClick={() => openEdit(card)} className="text-xs text-zinc-500 hover:text-zinc-800 mr-3 transition-colors">Edit</button>
                  {card.active && (
                    <button onClick={() => deactivate(card.id)} className="text-xs text-red-400 hover:text-red-600 transition-colors">Deactivate</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal title={modal.mode === 'add' ? 'Add Card' : 'Edit Card'} onClose={() => setModal(null)}>
          <div className="space-y-3">
            <div>
              <label className={labelCls}>Card Number</label>
              <input type="text" value={form.card_number}
                onChange={e => setForm(f => ({ ...f, card_number: e.target.value }))}
                className={inputCls} placeholder="e.g. 10001" />
            </div>
            <div>
              <label className={labelCls}>Holder Name</label>
              <input type="text" value={form.holder_name}
                onChange={e => setForm(f => ({ ...f, holder_name: e.target.value }))}
                className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Group</label>
              <select value={form.group_id} onChange={e => setForm(f => ({ ...f, group_id: e.target.value }))}
                className={inputCls}>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Expires At (optional)</label>
              <input type="date" value={form.expires_at}
                onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))}
                className={inputCls} />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="active" checked={form.active}
                onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
                className="rounded border-zinc-300" />
              <label htmlFor="active" className="text-sm text-zinc-600">Active</label>
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
