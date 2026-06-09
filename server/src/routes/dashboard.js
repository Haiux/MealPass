const express = require('express');
const db = require('../db/index');
const { requireAdmin } = require('../middleware/roleCheck');

const router = express.Router();

router.get('/stats', requireAdmin, (req, res) => {
  const today = (() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  })();

  const rows = db.prepare(`
    SELECT meal_type, status, COUNT(*) as count
    FROM scan_logs
    WHERE substr(scanned_at, 1, 10) = ?
    GROUP BY meal_type, status
  `).all(today);

  const meals = ['breakfast', 'lunch', 'dinner'];
  const stats = {};
  for (const meal of meals) {
    stats[meal] = { granted: 0, denied: 0 };
  }
  for (const row of rows) {
    if (row.meal_type && stats[row.meal_type]) {
      stats[row.meal_type][row.status] = row.count;
    }
  }

  const totalGranted = db.prepare(`
    SELECT COUNT(*) as c FROM scan_logs WHERE status = 'granted' AND substr(scanned_at, 1, 10) = ?
  `).get(today).c;

  const totalDenied = db.prepare(`
    SELECT COUNT(*) as c FROM scan_logs WHERE status = 'denied' AND substr(scanned_at, 1, 10) = ?
  `).get(today).c;

  const recentLogs = db.prepare(`
    SELECT l.*, u.name as scanned_by_name
    FROM scan_logs l
    LEFT JOIN users u ON l.scanned_by_id = u.id
    ORDER BY l.scanned_at DESC
    LIMIT 10
  `).all();

  res.json({ stats, totalGranted, totalDenied, recentLogs, date: today });
});

module.exports = router;
