const express = require('express');
const db = require('../db/index');
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roleCheck');

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  const search = req.query.search ? `%${req.query.search}%` : '%';
  const cards = db.prepare(`
    SELECT c.id, c.card_number, c.holder_name, c.active, c.expires_at, c.created_at,
           g.id as group_id, g.name as group_name
    FROM cards c
    JOIN groups g ON c.group_id = g.id
    WHERE c.card_number LIKE ? OR c.holder_name LIKE ?
    ORDER BY c.holder_name ASC
  `).all(search, search);
  res.json({ cards });
});

router.post('/', requireAdmin, (req, res) => {
  const { card_number, holder_name, group_id, active = 1, expires_at = null } = req.body;
  if (!card_number || !holder_name || !group_id) {
    return res.status(400).json({ message: 'card_number, holder_name, and group_id are required' });
  }

  try {
    const result = db.prepare(`
      INSERT INTO cards (card_number, holder_name, group_id, active, expires_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(String(card_number).trim(), holder_name, group_id, active ? 1 : 0, expires_at || null);

    const card = db.prepare(`
      SELECT c.*, g.name as group_name FROM cards c JOIN groups g ON c.group_id = g.id WHERE c.id = ?
    `).get(result.lastInsertRowid);
    res.status(201).json({ card });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ message: 'Card number already exists' });
    }
    throw err;
  }
});

router.put('/:id', requireAdmin, (req, res) => {
  const { card_number, holder_name, group_id, active, expires_at } = req.body;
  const card = db.prepare('SELECT * FROM cards WHERE id = ?').get(req.params.id);
  if (!card) return res.status(404).json({ message: 'Card not found' });

  try {
    db.prepare(`
      UPDATE cards SET card_number = ?, holder_name = ?, group_id = ?, active = ?, expires_at = ?
      WHERE id = ?
    `).run(
      card_number !== undefined ? String(card_number).trim() : card.card_number,
      holder_name !== undefined ? holder_name : card.holder_name,
      group_id !== undefined ? group_id : card.group_id,
      active !== undefined ? (active ? 1 : 0) : card.active,
      expires_at !== undefined ? (expires_at || null) : card.expires_at,
      req.params.id
    );

    const updated = db.prepare(`
      SELECT c.*, g.name as group_name FROM cards c JOIN groups g ON c.group_id = g.id WHERE c.id = ?
    `).get(req.params.id);
    res.json({ card: updated });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ message: 'Card number already exists' });
    }
    throw err;
  }
});

router.delete('/:id', requireAdmin, (req, res) => {
  const card = db.prepare('SELECT * FROM cards WHERE id = ?').get(req.params.id);
  if (!card) return res.status(404).json({ message: 'Card not found' });
  db.prepare('UPDATE cards SET active = 0 WHERE id = ?').run(req.params.id);
  res.json({ message: 'Card deactivated' });
});

module.exports = router;
