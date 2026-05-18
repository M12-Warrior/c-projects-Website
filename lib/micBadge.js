const db = require('../db/database');

/** Allowed mic_color values (users table). null = tier default on forum. */
const MIC_COLORS = Object.freeze([
  'gray',
  'black',
  'gold',
  'white',
  'pink',
  'navy',
  'orange',
  'red'
]);

function isValidMicColor(value) {
  if (value == null || value === '') return true;
  return typeof value === 'string' && MIC_COLORS.includes(value.trim().toLowerCase());
}

function normalizeMicColor(value) {
  if (value == null || value === '') return null;
  const v = String(value).trim().toLowerCase();
  return MIC_COLORS.includes(v) ? v : null;
}

/** True when user has any order with payment_status = paid. */
function hasPaidOrder(userId) {
  if (!userId) return false;
  const row = db.prepare(`
    SELECT 1 AS ok FROM orders
    WHERE user_id = ? AND COALESCE(payment_status, '') = 'paid'
    LIMIT 1
  `).get(userId);
  return !!row;
}

function micColorForUser(userId) {
  if (!userId) return null;
  const row = db.prepare('SELECT mic_color FROM users WHERE id = ?').get(userId);
  return normalizeMicColor(row && row.mic_color);
}

function micFieldsForUser(userId) {
  return {
    mic_color: micColorForUser(userId),
    mic_lit: hasPaidOrder(userId)
  };
}

/** Batch mic_color + mic_lit for forum thread lists. */
function micFieldsForUsers(userIds) {
  const unique = [...new Set((userIds || []).filter(Boolean))];
  const out = {};
  if (unique.length === 0) return out;

  const placeholders = unique.map(() => '?').join(',');
  const colorRows = db.prepare(`
    SELECT id, mic_color FROM users WHERE id IN (${placeholders})
  `).all(...unique);

  const paidRows = db.prepare(`
    SELECT DISTINCT user_id FROM orders
    WHERE user_id IN (${placeholders}) AND COALESCE(payment_status, '') = 'paid'
  `).all(...unique);

  const paidSet = new Set(paidRows.map((r) => r.user_id));
  for (const id of unique) {
    out[id] = { mic_color: null, mic_lit: paidSet.has(id) };
  }
  for (const row of colorRows) {
    if (!out[row.id]) out[row.id] = { mic_color: null, mic_lit: false };
    out[row.id].mic_color = normalizeMicColor(row.mic_color);
  }
  return out;
}

function attachMicFields(rows, userIdKey = 'user_id') {
  const ids = rows.map((r) => r[userIdKey]);
  const map = micFieldsForUsers(ids);
  return rows.map((r) => {
    const uid = r[userIdKey];
    const m = map[uid] || { mic_color: null, mic_lit: false };
    return { ...r, mic_color: m.mic_color, mic_lit: m.mic_lit };
  });
}

module.exports = {
  MIC_COLORS,
  isValidMicColor,
  normalizeMicColor,
  hasPaidOrder,
  micColorForUser,
  micFieldsForUser,
  micFieldsForUsers,
  attachMicFields
};
