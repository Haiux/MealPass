const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/index');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/login', (req, res) => {
  const { staff_id, pin } = req.body;
  if (!staff_id || !pin) {
    return res.status(400).json({ message: 'Staff ID and PIN are required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE staff_id = ? AND active = 1').get(staff_id);
  if (!user || !bcrypt.compareSync(String(pin), user.pin_hash)) {
    return res.status(401).json({ message: 'Invalid ID or PIN' });
  }

  const token = jwt.sign(
    { id: user.id, staff_id: user.staff_id, name: user.name, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '12h' }
  );

  res.json({ token, user: { id: user.id, staff_id: user.staff_id, name: user.name, role: user.role } });
});

router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT id, staff_id, name, role, active FROM users WHERE id = ?').get(req.user.id);
  if (!user || !user.active) {
    return res.status(401).json({ message: 'Account inactive' });
  }
  res.json({ user });
});

module.exports = router;
