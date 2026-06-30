'use strict';

const db = require('../db/database');
const paymentConfig = require('./paymentConfig');

const PLAN_WELLNESS = 'wellness_journal';

function tierFromMonths(months) {
  if (months < 3) return 1;
  if (months < 6) return 2;
  if (months < 12) return 3;
  return 4;
}

function monthsBetween(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.max(0, Math.floor((end - start) / (30.44 * 24 * 60 * 60 * 1000)));
}

function hasActiveWellnessSubscription(userId) {
  if (!userId) return false;
  const row = db.prepare(`
    SELECT status, current_period_end
    FROM subscriptions
    WHERE user_id = ? AND plan = ?
    ORDER BY created_at DESC
    LIMIT 1
  `).get(userId, PLAN_WELLNESS);
  if (!row || row.status !== 'active') return false;
  return new Date(row.current_period_end) > new Date();
}

function getPaidWellnessTier(userId) {
  if (!userId) return 0;
  const row = db.prepare(`
    SELECT status, started_at, current_period_end
    FROM subscriptions
    WHERE user_id = ? AND plan = ?
    ORDER BY created_at DESC
    LIMIT 1
  `).get(userId, PLAN_WELLNESS);
  if (!row || row.status !== 'active') return 0;
  if (new Date(row.current_period_end) <= new Date()) return 0;
  return tierFromMonths(monthsBetween(row.started_at, new Date()));
}

function userHasWellnessJournalAccess(userId, role) {
  if (!userId) return false;
  let userRole = role;
  if (userRole == null) {
    const row = db.prepare('SELECT role FROM users WHERE id = ?').get(userId);
    userRole = row && row.role;
  }
  if (userRole === 'admin') return true;
  if (hasActiveWellnessSubscription(userId)) return true;
  if (paymentConfig.isFreeAccessMode()) return true;
  return false;
}

function logJournalDownload(userId, visitorKey) {
  try {
    db.prepare(`
      INSERT INTO download_events (visited_at, visitor_key, user_id, content_type, action, product_slug, path)
      VALUES (datetime('now'), ?, ?, 'wellness_journal', 'download', 'trucker-wellness-journal-monthly', '/journal/print')
    `).run(visitorKey || String(userId || 'guest'), userId || null);
  } catch (_) {}
}

function guestCanAccessJournalPrint() {
  return true;
}

module.exports = {
  PLAN_WELLNESS,
  hasActiveWellnessSubscription,
  getPaidWellnessTier,
  userHasWellnessJournalAccess,
  logJournalDownload,
  guestCanAccessJournalPrint
};