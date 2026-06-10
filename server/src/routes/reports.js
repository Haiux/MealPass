const express = require('express');
const db = require('../db/index');
const { requireAdmin } = require('../middleware/roleCheck');

const router = express.Router();

function todayLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

router.get('/daily', requireAdmin, (req, res) => {
  const date = req.query.date || todayLocal();

  // 1. Summary: counts per meal_type × status
  const summaryRows = db.prepare(`
    SELECT meal_type, status, COUNT(*) as count
    FROM scan_logs
    WHERE substr(scanned_at, 1, 10) = ? AND meal_type IS NOT NULL
    GROUP BY meal_type, status
  `).all(date);

  const meals = ['breakfast', 'lunch', 'dinner'];
  const summary = {};
  for (const m of meals) summary[m] = { granted: 0, denied: 0 };
  for (const r of summaryRows) {
    if (summary[r.meal_type]) summary[r.meal_type][r.status] = r.count;
  }
  const total_granted = meals.reduce((s, m) => s + summary[m].granted, 0);
  const total_denied  = meals.reduce((s, m) => s + summary[m].denied, 0);

  // 2. By-group breakdown (granted only)
  const groupRows = db.prepare(`
    SELECT group_name, meal_type, COUNT(*) as count
    FROM scan_logs
    WHERE substr(scanned_at, 1, 10) = ? AND status = 'granted' AND meal_type IS NOT NULL AND group_name IS NOT NULL
    GROUP BY group_name, meal_type
    ORDER BY group_name ASC
  `).all(date);

  const groupMap = {};
  for (const r of groupRows) {
    if (!groupMap[r.group_name]) groupMap[r.group_name] = { group_name: r.group_name, breakfast: 0, lunch: 0, dinner: 0 };
    groupMap[r.group_name][r.meal_type] = r.count;
  }
  const by_group = Object.values(groupMap).map(g => ({
    ...g,
    total: g.breakfast + g.lunch + g.dinner,
  }));

  // 3. Card-level detail: one row per card with boolean per meal (granted only)
  const cardRows = db.prepare(`
    SELECT card_number, holder_name, group_name, meal_type
    FROM scan_logs
    WHERE substr(scanned_at, 1, 10) = ? AND status = 'granted' AND meal_type IS NOT NULL
    ORDER BY holder_name ASC
  `).all(date);

  const cardMap = {};
  for (const r of cardRows) {
    if (!cardMap[r.card_number]) {
      cardMap[r.card_number] = {
        card_number: r.card_number,
        holder_name: r.holder_name || r.card_number,
        group_name: r.group_name || '—',
        breakfast: false,
        lunch: false,
        dinner: false,
      };
    }
    cardMap[r.card_number][r.meal_type] = true;
  }
  const card_detail = Object.values(cardMap);

  res.json({ date, summary, total_granted, total_denied, by_group, card_detail });
});

module.exports = router;
