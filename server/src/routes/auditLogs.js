const express = require('express');
const db = require('../db/index');
const { requireAdmin } = require('../middleware/roleCheck');

const router = express.Router();

router.get('/', requireAdmin, (req, res) => {
  const { date, resource_type, action, performed_by_id, page = 1, limit = 50 } = req.query;

  const conditions = [];
  const params = [];

  if (date) {
    conditions.push("substr(l.timestamp, 1, 10) = ?");
    params.push(date);
  }
  if (resource_type) {
    conditions.push("l.resource_type = ?");
    params.push(resource_type);
  }
  if (action) {
    conditions.push("l.action = ?");
    params.push(action);
  }
  if (performed_by_id) {
    conditions.push("l.performed_by_id = ?");
    params.push(performed_by_id);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (Number(page) - 1) * Number(limit);

  const total = db.prepare(`SELECT COUNT(*) as c FROM admin_logs l ${where}`).get(...params).c;

  const logs = db.prepare(`
    SELECT l.*
    FROM admin_logs l
    ${where}
    ORDER BY l.timestamp DESC
    LIMIT ? OFFSET ?
  `).all(...params, Number(limit), offset);

  res.json({ logs, total, page: Number(page), limit: Number(limit) });
});

module.exports = router;
