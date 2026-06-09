require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const db = require('./index');
const bcrypt = require('bcryptjs');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    staff_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin','scanner')),
    pin_hash TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    breakfast INTEGER NOT NULL DEFAULT 1,
    lunch INTEGER NOT NULL DEFAULT 1,
    dinner INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    card_number TEXT NOT NULL UNIQUE,
    holder_name TEXT NOT NULL,
    group_id INTEGER NOT NULL REFERENCES groups(id),
    active INTEGER NOT NULL DEFAULT 1,
    expires_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS meal_schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    meal_type TEXT NOT NULL UNIQUE CHECK(meal_type IN ('breakfast','lunch','dinner')),
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS scan_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    card_number TEXT NOT NULL,
    holder_name TEXT,
    group_name TEXT,
    meal_type TEXT,
    status TEXT NOT NULL CHECK(status IN ('granted','denied')),
    reason TEXT,
    scanned_at TEXT NOT NULL,
    scanned_by_id INTEGER REFERENCES users(id)
  );
`);

const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
if (userCount === 0) {
  const adminHash = bcrypt.hashSync('1234', 10);
  const scannerHash = bcrypt.hashSync('1234', 10);

  db.transaction(() => {
    db.prepare(`INSERT INTO users (staff_id, name, role, pin_hash) VALUES (?, ?, ?, ?)`)
      .run('10001', 'Admin User', 'admin', adminHash);
    db.prepare(`INSERT INTO users (staff_id, name, role, pin_hash) VALUES (?, ?, ?, ?)`)
      .run('10002', 'Scanner 1', 'scanner', scannerHash);

    const groupId = db.prepare(`INSERT INTO groups (name, description, breakfast, lunch, dinner) VALUES (?, ?, 1, 1, 1)`)
      .run('Staff', 'Default staff group').lastInsertRowid;

    db.prepare(`INSERT INTO groups (name, description, breakfast, lunch, dinner) VALUES (?, ?, 1, 1, 1)`)
      .run('VIP', 'VIP guests');

    db.prepare(`INSERT INTO meal_schedules (meal_type, start_time, end_time, active) VALUES (?, ?, ?, 1)`)
      .run('breakfast', '06:00', '10:00');
    db.prepare(`INSERT INTO meal_schedules (meal_type, start_time, end_time, active) VALUES (?, ?, ?, 1)`)
      .run('lunch', '11:00', '14:00');
    db.prepare(`INSERT INTO meal_schedules (meal_type, start_time, end_time, active) VALUES (?, ?, ?, 1)`)
      .run('dinner', '17:00', '21:00');

    db.prepare(`INSERT INTO cards (card_number, holder_name, group_id, active) VALUES (?, ?, ?, 1)`)
      .run('10001', 'Admin User', groupId);
  })();

  console.log('Database seeded with default data.');
  console.log('  Admin:   staff_id=10001 pin=1234');
  console.log('  Scanner: staff_id=10002 pin=1234');
} else {
  console.log('Database already seeded, skipping.');
}

console.log('Migration complete.');
