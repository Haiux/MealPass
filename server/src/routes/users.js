const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db/index');
const { requireAdmin } = require('../middleware/roleCheck');

const router = express.Router();

router.get('/', requireAdmin, (req, res) => {
  const users = db.prepare('SELECT id, staff_id, name, role, active FROM users ORDER BY name ASC').all();
  res.json({ users });
});

router.post('/', requireAdmin, (req, res) => {
  const { staff_id, name, role, pin } = req.body;
  if (!staff_id || !name || !role || !pin) {
    return res.status(400).json({ message: 'staff_id, name, role, and pin are required' });
  }
  if (!['admin', 'scanner'].includes(role)) {
    return res.status(400).json({ message: 'role must be admin or scanner' });
  }

  try {
    const pin_hash = bcrypt.hashSync(String(pin), 10);
    const result = db.prepare(`
      INSERT INTO users (staff_id, name, role, pin_hash) VALUES (?, ?, ?, ?)
    `).run(String(staff_id).trim(), name, role, pin_hash);

    const user = db.prepare('SELECT id, staff_id, name, role, active FROM users WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ user });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ message: 'Staff ID already exists' });
    }
    throw err;
  }
});

router.put('/:id', requireAdmin, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const { name, role, active, pin } = req.body;

  const pin_hash = pin ? bcrypt.hashSync(String(pin), 10) : user.pin_hash;

  try {
    db.prepare(`
      UPDATE users SET name = ?, role = ?, active = ?, pin_hash = ? WHERE id = ?
    `).run(
      name !== undefined ? name : user.name,
      role !== undefined ? role : user.role,
      active !== undefined ? (active ? 1 : 0) : user.active,
      pin_hash,
      req.params.id
    );

    const updated = db.prepare('SELECT id, staff_id, name, role, active FROM users WHERE id = ?').get(req.params.id);
    res.json({ user: updated });
  } catch (err) {
    throw err;
  }
});

router.delete('/:id', requireAdmin, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  db.prepare('UPDATE users SET active = 0 WHERE id = ?').run(req.params.id);
  res.json({ message: 'User deactivated' });
});

module.exports = router;
