const express = require('express');
const db = require('../db/index');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function getCurrentTimeHHMM() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

function getLocalDateString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

router.post('/', requireAuth, (req, res) => {
  const { card_number } = req.body;
  if (!card_number || !String(card_number).trim()) {
    return res.status(400).json({ message: 'card_number is required' });
  }

  const cardNum = String(card_number).trim();
  const scannedAt = new Date().toISOString();
  const scannedById = req.user.id;

  function deny(reason, mealType, holderName, groupName) {
    db.prepare(`
      INSERT INTO scan_logs (card_number, holder_name, group_name, meal_type, status, reason, scanned_at, scanned_by_id)
      VALUES (?, ?, ?, ?, 'denied', ?, ?, ?)
    `).run(cardNum, holderName || null, groupName || null, mealType || null, reason, scannedAt, scannedById);
    return res.json({ status: 'denied', reason });
  }

  // Step 1: find card with group
  const card = db.prepare(`
    SELECT c.*, g.name as group_name, g.breakfast, g.lunch, g.dinner
    FROM cards c
    JOIN groups g ON c.group_id = g.id
    WHERE c.card_number = ?
  `).get(cardNum);

  if (!card) return deny('Card not found');

  // Step 2: active check
  if (!card.active) return deny('Card inactive', null, card.holder_name, card.group_name);

  // Step 3: expiry check
  if (card.expires_at && new Date(card.expires_at) < new Date()) {
    return deny('Card expired', null, card.holder_name, card.group_name);
  }

  // Step 4: find active meal window
  const currentTime = getCurrentTimeHHMM();
  const schedules = db.prepare('SELECT * FROM meal_schedules WHERE active = 1').all();
  const activeMeal = schedules.find(s => currentTime >= s.start_time && currentTime <= s.end_time);

  if (!activeMeal) return deny('No active meal period', null, card.holder_name, card.group_name);

  const mealType = activeMeal.meal_type;

  // Step 5: group eligibility
  if (!card[mealType]) {
    return deny(`Not eligible for ${mealType}`, mealType, card.holder_name, card.group_name);
  }

  // Step 6: already claimed today
  const today = getLocalDateString();
  const existing = db.prepare(`
    SELECT id FROM scan_logs
    WHERE card_number = ? AND meal_type = ? AND status = 'granted'
    AND substr(scanned_at, 1, 10) = ?
  `).get(cardNum, mealType, today);

  if (existing) {
    return deny(`Already claimed ${mealType} today`, mealType, card.holder_name, card.group_name);
  }

  // Step 7: grant
  db.prepare(`
    INSERT INTO scan_logs (card_number, holder_name, group_name, meal_type, status, reason, scanned_at, scanned_by_id)
    VALUES (?, ?, ?, ?, 'granted', NULL, ?, ?)
  `).run(cardNum, card.holder_name, card.group_name, mealType, scannedAt, scannedById);

  res.json({
    status: 'granted',
    meal_type: mealType,
    holder_name: card.holder_name,
    group_name: card.group_name,
  });
});

module.exports = router;
