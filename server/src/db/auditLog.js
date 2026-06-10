const db = require('./index');

function logAdminAction(req, { action, resourceType, resourceId, resourceLabel, oldValues, newValues }) {
  db.prepare(`
    INSERT INTO admin_logs
      (action, resource_type, resource_id, resource_label, old_values, new_values, performed_by_id, performed_by_name, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    action,
    resourceType,
    resourceId ?? null,
    resourceLabel ?? null,
    oldValues ? JSON.stringify(oldValues) : null,
    newValues ? JSON.stringify(newValues) : null,
    req.user?.id ?? null,
    req.user?.name ?? null,
    new Date().toISOString()
  );
}

module.exports = { logAdminAction };
