const express = require('express');
const db = require('../db/index');
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roleCheck');
const { logAdminAction } = require('../db/auditLog');

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  const schedules = db.prepare('SELECT * FROM meal_schedules ORDER BY id ASC').all();
  res.json({ schedules });
});

router.put('/:id', requireAdmin, (req, res) => {
  const schedule = db.prepare('SELECT * FROM meal_schedules WHERE id = ?').get(req.params.id);
  if (!schedule) return res.status(404).json({ message: 'Schedule not found' });

  const { start_time, end_time, active } = req.body;

  db.prepare(`
    UPDATE meal_schedules SET start_time = ?, end_time = ?, active = ? WHERE id = ?
  `).run(
    start_time !== undefined ? start_time : schedule.start_time,
    end_time !== undefined ? end_time : schedule.end_time,
    active !== undefined ? (active ? 1 : 0) : schedule.active,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM meal_schedules WHERE id = ?').get(req.params.id);

  logAdminAction(req, {
    action: 'UPDATE', resourceType: 'schedule',
    resourceId: schedule.id, resourceLabel: schedule.meal_type,
    oldValues: { start_time: schedule.start_time, end_time: schedule.end_time, active: !!schedule.active },
    newValues: { start_time: updated.start_time, end_time: updated.end_time, active: !!updated.active },
  });

  res.json({ schedule: updated });
});

module.exports = router;
