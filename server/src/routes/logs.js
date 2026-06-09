const express = require('express');
const db = require('../db/index');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  const { date, status, meal_type, card_number, page = 1, limit = 50 } = req.query;

  const conditions = [];
  const params = [];

  if (date) {
    conditions.push("substr(l.scanned_at, 1, 10) = ?");
    params.push(date);
  }
  if (status) {
    conditions.push("l.status = ?");
    params.push(status);
  }
  if (meal_type) {
    conditions.push("l.meal_type = ?");
    params.push(meal_type);
  }
  if (card_number) {
    conditions.push("l.card_number LIKE ?");
    params.push(`%${card_number}%`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (Number(page) - 1) * Number(limit);

  const total = db.prepare(`SELECT COUNT(*) as c FROM scan_logs l ${where}`).get(...params).c;

  const logs = db.prepare(`
    SELECT l.*, u.name as scanned_by_name
    FROM scan_logs l
    LEFT JOIN users u ON l.scanned_by_id = u.id
    ${where}
    ORDER BY l.scanned_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, Number(limit), offset);

  res.json({ logs, total, page: Number(page), limit: Number(limit) });
});

module.exports = router;
