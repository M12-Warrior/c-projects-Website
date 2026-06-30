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

function totalRedoCount(progress) {
  const p = normalizeProgress(progress);
  let quizRetries = 0;
  let moduleRedos = 0;
  for (let i = 1; i <= MODULE_COUNT; i++) {
    const mp = p.modules[i];
    if (!mp) continue;
    moduleRedos += mp.moduleRedos || 0;
    quizRetries += mp.quizRetries || 0;
    const attempts = mp.quizAttempts || 0;
    if (attempts > 1) quizRetries += attempts - 1;
  }
  return { quizRetries, moduleRedos, total: quizRetries + moduleRedos };
}

function isPerfectWallEligible(progress) {
  const p = normalizeProgress(progress);
  if (!isCourseComplete(p)) return false;
  const redos = totalRedoCount(p);
  if (redos.total > 0) return false;
  for (let i = 1; i <= MODULE_COUNT; i++) {
    const mp = p.modules[i];
    if (!mp || mp.quizScore !== PERFECT_SCORE) return false;
  }
  return true;
}

function isPerfectScore(progress) {
  const p = normalizeProgress(progress);
  if (totalRedoCount(p).total > 0) return false;
  for (let i = 1; i <= MODULE_COUNT; i++) {
    const mp = p.modules[i];
    if (!mp || mp.quizScore !== PERFECT_SCORE) return false;
  }
  return true;
}

function qualifiesForDriversWall(progress) {
  return isPerfectWallEligible(progress);
}

function getStoredProgress(userId) {
  const row = db.prepare('SELECT progress_json FROM course_user_progress WHERE user_id = ?').get(userId);
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
    INSERT INTO course_user_progress (user_id, progress_json, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET progress_json = excluded.progress_json, updated_at = excluded.updated_at
  `).run(userId, json, now);
  return normalized;
}

function resolveCbHandle(user) {
  if (!user) return 'Driver';
  return (user.username || user.email || 'Driver').trim();
}

function upsertDriversWallEntry(userId, progress) {
  if (!isPerfectWallEligible(progress)) return null;
  const user = db.prepare('SELECT id, username, email FROM users WHERE id = ?').get(userId);
  if (!user) return null;
  const cbHandle = resolveCbHandle(user);
  const now = new Date().toISOString();
  const existing = db.prepare('SELECT id, removed FROM drivers_wall WHERE user_id = ?').get(userId);
  if (existing) {
    if (existing.removed) return null;
    db.prepare(`
      UPDATE drivers_wall
      SET cb_handle = ?, display_name = ?, completed_at = ?, perfect_score = 1, zero_redos = 1
      WHERE user_id = ?
    `).run(cbHandle, cbHandle, now, userId);
    return db.prepare('SELECT * FROM drivers_wall WHERE user_id = ?').get(userId);
  }
  const insert = db.prepare(`
    INSERT INTO drivers_wall (user_id, cb_handle, display_name, completed_at, perfect_score, zero_redos, removed)
    VALUES (?, ?, ?, ?, 1, 1, 0)
  `);
  insert.run(userId, cbHandle, cbHandle, now);
  return db.prepare('SELECT * FROM drivers_wall WHERE user_id = ?').get(userId);
}

function listDriversWall(limit = 100) {
  return db.prepare(`
    SELECT id, cb_handle, display_name, completed_at
    FROM drivers_wall
    WHERE removed = 0
    ORDER BY completed_at DESC
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
  totalRedoCount,
  isPerfectWallEligible,
  qualifiesForDriversWall,
  isPerfectScore,
  getStoredProgress,
  saveStoredProgress,
  resolveCbHandle,
  upsertDriversWallEntry,
  listDriversWall,
};
