const express = require('express');
const db = require('../db/index');
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roleCheck');
const { logAdminAction } = require('../db/auditLog');

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  const groups = db.prepare('SELECT * FROM groups ORDER BY name ASC').all();
  res.json({ groups });
});

router.post('/', requireAdmin, (req, res) => {
  const { name, description = '', breakfast = 1, lunch = 1, dinner = 1 } = req.body;
  if (!name) return res.status(400).json({ message: 'Group name is required' });

  try {
    const result = db.prepare(`
      INSERT INTO groups (name, description, breakfast, lunch, dinner) VALUES (?, ?, ?, ?, ?)
    `).run(name, description, breakfast ? 1 : 0, lunch ? 1 : 0, dinner ? 1 : 0);

    const group = db.prepare('SELECT * FROM groups WHERE id = ?').get(result.lastInsertRowid);

    logAdminAction(req, {
      action: 'CREATE', resourceType: 'group',
      resourceId: group.id, resourceLabel: group.name,
      newValues: { name: group.name, description: group.description, breakfast: !!group.breakfast, lunch: !!group.lunch, dinner: !!group.dinner },
    });

    res.status(201).json({ group });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ message: 'Group name already exists' });
    }
    throw err;
  }
});

router.put('/:id', requireAdmin, (req, res) => {
  const group = db.prepare('SELECT * FROM groups WHERE id = ?').get(req.params.id);
  if (!group) return res.status(404).json({ message: 'Group not found' });

  const { name, description, breakfast, lunch, dinner } = req.body;

  try {
    db.prepare(`
      UPDATE groups SET name = ?, description = ?, breakfast = ?, lunch = ?, dinner = ? WHERE id = ?
    `).run(
      name !== undefined ? name : group.name,
      description !== undefined ? description : group.description,
      breakfast !== undefined ? (breakfast ? 1 : 0) : group.breakfast,
      lunch !== undefined ? (lunch ? 1 : 0) : group.lunch,
      dinner !== undefined ? (dinner ? 1 : 0) : group.dinner,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM groups WHERE id = ?').get(req.params.id);

    logAdminAction(req, {
      action: 'UPDATE', resourceType: 'group',
      resourceId: group.id, resourceLabel: updated.name,
      oldValues: { name: group.name, description: group.description, breakfast: !!group.breakfast, lunch: !!group.lunch, dinner: !!group.dinner },
      newValues: { name: updated.name, description: updated.description, breakfast: !!updated.breakfast, lunch: !!updated.lunch, dinner: !!updated.dinner },
    });

    res.json({ group: updated });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ message: 'Group name already exists' });
    }
    throw err;
  }
});

router.delete('/:id', requireAdmin, (req, res) => {
  const group = db.prepare('SELECT * FROM groups WHERE id = ?').get(req.params.id);
  if (!group) return res.status(404).json({ message: 'Group not found' });

  const cardCount = db.prepare('SELECT COUNT(*) as c FROM cards WHERE group_id = ?').get(req.params.id).c;
  if (cardCount > 0) {
    return res.status(409).json({ message: `Cannot delete group — ${cardCount} card(s) are assigned to it` });
  }

  db.prepare('DELETE FROM groups WHERE id = ?').run(req.params.id);

  logAdminAction(req, {
    action: 'DELETE', resourceType: 'group',
    resourceId: group.id, resourceLabel: group.name,
    oldValues: { name: group.name, description: group.description, breakfast: !!group.breakfast, lunch: !!group.lunch, dinner: !!group.dinner },
  });

  res.json({ message: 'Group deleted' });
});

module.exports = router;
