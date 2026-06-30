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

function hasFreeContentDownload(userId) {
  if (!userId) return false;
  const row = db.prepare(`
    SELECT 1 AS ok FROM download_events
    WHERE user_id = ? AND action IN ('download', 'print')
    LIMIT 1
  `).get(userId);
  return !!row;
}

function hasCommunityParticipation(userId) {
  if (!userId) return false;
  const user = db.prepare('SELECT opt_in_forum FROM users WHERE id = ?').get(userId);
  if (user && user.opt_in_forum) return true;
  const thread = db.prepare('SELECT 1 AS ok FROM forum_threads WHERE user_id = ? LIMIT 1').get(userId);
  if (thread) return true;
  const reply = db.prepare('SELECT 1 AS ok FROM forum_replies WHERE user_id = ? LIMIT 1').get(userId);
  return !!reply;
}

/** Lit mic glow: paid purchase OR (free download + community engagement). */
function hasMicLit(userId) {
  if (!userId) return false;
  if (hasPaidOrder(userId)) return true;
  return hasFreeContentDownload(userId) && hasCommunityParticipation(userId);
}

function micColorForUser(userId) {
  if (!userId) return null;
  const row = db.prepare('SELECT mic_color FROM users WHERE id = ?').get(userId);
  return normalizeMicColor(row && row.mic_color);
}

function micFieldsForUser(userId) {
  return {
    mic_color: micColorForUser(userId),
    mic_lit: hasMicLit(userId)
  };
}

function buildMicLitSet(userIds) {
  const unique = [...new Set((userIds || []).filter(Boolean))];
  const litSet = new Set();
  if (unique.length === 0) return litSet;

  const placeholders = unique.map(() => '?').join(',');

  const paidRows = db.prepare(`
    SELECT DISTINCT user_id FROM orders
    WHERE user_id IN (${placeholders}) AND COALESCE(payment_status, '') = 'paid'
  `).all(...unique);
  for (const row of paidRows) litSet.add(row.user_id);

  const remaining = unique.filter((id) => !litSet.has(id));
  if (remaining.length === 0) return litSet;

  const remPh = remaining.map(() => '?').join(',');

  const downloadRows = db.prepare(`
    SELECT DISTINCT user_id FROM download_events
    WHERE user_id IN (${remPh}) AND action IN ('download', 'print')
  `).all(...remaining);
  const downloadSet = new Set(downloadRows.map((r) => r.user_id));
  if (downloadSet.size === 0) return litSet;

  const communityOptIn = db.prepare(`
    SELECT id FROM users
    WHERE id IN (${remPh}) AND opt_in_forum = 1
  `).all(...remaining);
  const communitySet = new Set(communityOptIn.map((r) => r.id));

  const threadRows = db.prepare(`
    SELECT DISTINCT user_id FROM forum_threads WHERE user_id IN (${remPh})
  `).all(...remaining);
  for (const row of threadRows) communitySet.add(row.user_id);

  const replyRows = db.prepare(`
    SELECT DISTINCT user_id FROM forum_replies WHERE user_id IN (${remPh})
  `).all(...remaining);
  for (const row of replyRows) communitySet.add(row.user_id);

  for (const id of remaining) {
    if (downloadSet.has(id) && communitySet.has(id)) litSet.add(id);
  }
  return litSet;
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

  const litSet = buildMicLitSet(unique);

  for (const id of unique) {
    out[id] = { mic_color: null, mic_lit: litSet.has(id) };
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
  hasFreeContentDownload,
  hasCommunityParticipation,
  hasMicLit,
  isMicLit: hasMicLit,
  micColorForUser,
  micFieldsForUser,
  micFieldsForUsers,
  attachMicFields
};
