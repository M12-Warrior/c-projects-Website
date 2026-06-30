'use strict';

const db = require('../db/database');

const MODULE_COUNT = 10;
const PASS_SCORE = 70;
const PERFECT_SCORE = 100;

function normalizeModuleProgress(mp) {
  const out = mp && typeof mp === 'object' ? { ...mp } : {};
  if (!Array.isArray(out.lessons)) out.lessons = [];
  if (out.quizScore === undefined) out.quizScore = null;
  if (out.quizAttempts == null) out.quizAttempts = 0;
  if (out.quizRetries == null) out.quizRetries = 0;
  if (out.moduleRedos == null) out.moduleRedos = 0;
  if (out.unlocked == null) out.unlocked = false;
  if (out.completed == null) out.completed = false;
  return out;
}

function normalizeProgress(raw) {
  const base = raw && typeof raw === 'object' ? { ...raw } : {};
  if (!base.modules || typeof base.modules !== 'object') base.modules = {};
  for (let i = 1; i <= MODULE_COUNT; i++) {
    base.modules[i] = normalizeModuleProgress(base.modules[i]);
  }
  if (base.studentName == null) base.studentName = '';
  if (base.purchased == null) base.purchased = false;
  return base;
}

function countCompletedModules(progress) {
  const p = normalizeProgress(progress);
  let count = 0;
  for (let i = 1; i <= MODULE_COUNT; i++) {
    if (p.modules[i] && p.modules[i].completed) count++;
  }
  return count;
}

function isCourseComplete(progress) {
  return countCompletedModules(progress) === MODULE_COUNT;
}

function totalQuizRetries(progress) {
  const p = normalizeProgress(progress);
  let total = 0;
  for (let i = 1; i <= MODULE_COUNT; i++) {
    const mp = p.modules[i];
    if (!mp) continue;
    total += mp.quizRetries || 0;
    const attempts = mp.quizAttempts || 0;
    if (attempts > 1) total += attempts - 1;
  }
  return total;
}

function totalModuleRedos(progress) {
  const p = normalizeProgress(progress);
  let total = 0;
  for (let i = 1; i <= MODULE_COUNT; i++) {
    total += (p.modules[i] && p.modules[i].moduleRedos) || 0;
  }
  return total;
}

function hasAnyRedos(progress) {
  return totalQuizRetries(progress) + totalModuleRedos(progress) > 0;
}

function isPerfectScore(progress) {
  const p = normalizeProgress(progress);
  if (hasAnyRedos(p)) return false;
  for (let i = 1; i <= MODULE_COUNT; i++) {
    const mp = p.modules[i];
    if (!mp || mp.quizScore !== PERFECT_SCORE) return false;
  }
  return true;
}

function qualifiesForDriversWall(progress) {
  const p = normalizeProgress(progress);
  if (!isCourseComplete(p)) return false;
  if (hasAnyRedos(p)) return false;
  for (let i = 1; i <= MODULE_COUNT; i++) {
    const mp = p.modules[i];
    if (!mp || mp.quizScore !== PERFECT_SCORE) return false;
  }
  return true;
}

function displayCbHandle(user) {
  if (!user) return 'Driver';
  const handle = user.cb_handle || user.username || user.email;
  return String(handle || 'Driver').trim();
}

function getStoredProgress(userId) {
  const row = db.prepare('SELECT progress_json FROM course_progress WHERE user_id = ?').get(userId);
  if (!row || !row.progress_json) return null;
  try {
    return normalizeProgress(JSON.parse(row.progress_json));
  } catch (_) {
    return null;
  }
}

function saveStoredProgress(userId, progress) {
  const normalized = normalizeProgress(progress);
  const json = JSON.stringify(normalized);
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO course_progress (user_id, progress_json, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET progress_json = excluded.progress_json, updated_at = excluded.updated_at
  `).run(userId, json, now);
  return normalized;
}

function upsertDriversWallEntry(userId, progress) {
  if (!qualifiesForDriversWall(progress)) return null;
  const user = db.prepare('SELECT id, username, email, cb_handle FROM users WHERE id = ?').get(userId);
  if (!user) return null;
  const cbHandle = displayCbHandle(user);
  const now = new Date().toISOString();
  const existing = db.prepare('SELECT id, status FROM drivers_wall WHERE user_id = ?').get(userId);
  if (existing) {
    if (existing.status === 'removed') return null;
    db.prepare(`
      UPDATE drivers_wall SET cb_handle = ?, completed_at = ?, perfect_score = 1, status = 'active'
      WHERE user_id = ?
    `).run(cbHandle, now, userId);
    return db.prepare('SELECT * FROM drivers_wall WHERE user_id = ?').get(userId);
  }
  db.prepare(`
    INSERT INTO drivers_wall (user_id, cb_handle, completed_at, perfect_score, status)
    VALUES (?, ?, ?, 1, 'active')
  `).run(userId, cbHandle, now);
  return db.prepare('SELECT * FROM drivers_wall WHERE user_id = ?').get(userId);
}

function listDriversWall(limit = 100) {
  return db.prepare(`
    SELECT id, cb_handle, completed_at
    FROM drivers_wall
    WHERE status = 'active'
    ORDER BY completed_at ASC, id ASC
    LIMIT ?
  `).all(limit);
}

module.exports = {
  MODULE_COUNT,
  PASS_SCORE,
  PERFECT_SCORE,
  normalizeProgress,
  normalizeModuleProgress,
  countCompletedModules,
  isCourseComplete,
  totalQuizRetries,
  totalModuleRedos,
  hasAnyRedos,
  isPerfectScore,
  qualifiesForDriversWall,
  displayCbHandle,
  getStoredProgress,
  saveStoredProgress,
  upsertDriversWallEntry,
  listDriversWall,
};
