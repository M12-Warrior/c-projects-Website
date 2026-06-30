const express = require('express');
const db = require('../db/database');
const wellnessAccess = require('../lib/wellnessAccess');
const { DateTime } = require('luxon');

const router = express.Router();
const LA_ZONE = 'America/Los_Angeles';

function requireSession(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

function requireWellnessSubscriber(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (wellnessAccess.userHasWellnessJournalAccess(req.session.user.id, req.session.user.role)) {
    return next();
  }
  return res.status(403).json({ error: 'Create a free account to save notes in My Journal online.' });
}

function normalizeEntryDate(raw) {
  const dateMatch = /^\d{4}-\d{2}-\d{2}$/.exec(String(raw || '').trim());
  return dateMatch ? dateMatch[0] : DateTime.now().setZone(LA_ZONE).toISODate();
}

function getEntryForUserDate(userId, entryDate) {
  return db.prepare(`
    SELECT id, entry_date, content, created_at, updated_at
    FROM subscriber_journal_entries
    WHERE user_id = ? AND entry_date = ?
    ORDER BY updated_at DESC, id DESC
    LIMIT 1
  `).get(userId, entryDate);
}

// GET /api/journal/entries — list current user's journal entries (optional ?from=YYYY-MM-DD&to=YYYY-MM-DD)
router.get('/entries', requireSession, requireWellnessSubscriber, (req, res) => {
  const userId = req.session.user.id;
  const from = req.query.from;
  const to = req.query.to;
  let sql = `
    SELECT id, entry_date, content, created_at, updated_at
    FROM subscriber_journal_entries
    WHERE user_id = ?
  `;
  const params = [userId];
  if (from) {
    params.push(from);
    sql += ` AND entry_date >= ?`;
  }
  if (to) {
    params.push(to);
    sql += ` AND entry_date <= ?`;
  }
  sql += ` ORDER BY entry_date DESC, updated_at DESC`;
  const rows = db.prepare(sql).all(...params);
  const seen = new Set();
  const entries = [];
  for (const row of rows) {
    if (seen.has(row.entry_date)) continue;
    seen.add(row.entry_date);
    entries.push(row);
  }
  res.json({ entries });
});

// POST /api/journal/entries — upsert one entry per calendar day { entry_date?: YYYY-MM-DD, content: string }
router.post('/entries', requireSession, requireWellnessSubscriber, (req, res) => {
  const userId = req.session.user.id;
  const content = typeof req.body.content === 'string' ? req.body.content.trim() : '';
  if (!content) {
    return res.status(400).json({ error: 'Content is required.' });
  }
  const date = normalizeEntryDate(req.body.entry_date);
  const existing = getEntryForUserDate(userId, date);

  if (existing) {
    db.prepare(`
      UPDATE subscriber_journal_entries
      SET content = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(content, existing.id);
    const row = db.prepare('SELECT id, entry_date, content, created_at, updated_at FROM subscriber_journal_entries WHERE id = ?').get(existing.id);
    return res.json({ entry: row, updated: true });
  }

  const result = db.prepare(`
    INSERT INTO subscriber_journal_entries (user_id, entry_date, content, updated_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
  `).run(userId, date, content);
  const row = db.prepare('SELECT id, entry_date, content, created_at, updated_at FROM subscriber_journal_entries WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ entry: row, updated: false });
});

// PUT /api/journal/entries/:id — update own entry { content?: string, entry_date?: YYYY-MM-DD }
router.put('/entries/:id', requireSession, requireWellnessSubscriber, (req, res) => {
  const userId = req.session.user.id;
  const id = parseInt(req.params.id, 10);
  if (!id) return res.status(400).json({ error: 'Invalid entry id.' });
  const existing = db.prepare('SELECT id, entry_date FROM subscriber_journal_entries WHERE id = ? AND user_id = ?').get(id, userId);
  if (!existing) return res.status(404).json({ error: 'Entry not found.' });

  const updates = [];
  const values = [];
  let targetDate = existing.entry_date;

  if (typeof req.body.content === 'string') {
    const content = req.body.content.trim();
    updates.push('content = ?');
    values.push(content);
  }
  if (req.body.entry_date && /^\d{4}-\d{2}-\d{2}$/.test(req.body.entry_date)) {
    targetDate = req.body.entry_date;
    const conflict = getEntryForUserDate(userId, targetDate);
    if (conflict && conflict.id !== id) {
      return res.status(409).json({ error: 'An entry already exists for that date. Edit that day instead.' });
    }
    updates.push('entry_date = ?');
    values.push(targetDate);
  }
  if (updates.length === 0) {
    const row = db.prepare('SELECT id, entry_date, content, created_at, updated_at FROM subscriber_journal_entries WHERE id = ?').get(id);
    return res.json({ entry: row });
  }
  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);
  db.prepare(`UPDATE subscriber_journal_entries SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  const row = db.prepare('SELECT id, entry_date, content, created_at, updated_at FROM subscriber_journal_entries WHERE id = ?').get(id);
  res.json({ entry: row });
});

// DELETE /api/journal/entries/:id
router.delete('/entries/:id', requireSession, requireWellnessSubscriber, (req, res) => {
  const userId = req.session.user.id;
  const id = parseInt(req.params.id, 10);
  if (!id) return res.status(400).json({ error: 'Invalid entry id.' });
  const result = db.prepare('DELETE FROM subscriber_journal_entries WHERE id = ? AND user_id = ?').run(id, userId);
  if (result.changes === 0) return res.status(404).json({ error: 'Entry not found.' });
  res.json({ success: true });
});

// POST /api/journal/fulfillment-log — Log journal download (guest or subscriber).
router.post('/fulfillment-log', (req, res) => {
  const userId = req.session && req.session.user ? req.session.user.id : null;
  const visitorKey = (req.session && req.sessionID) ? String(req.sessionID) : 'guest';
  if (!userId || wellnessAccess.userHasWellnessJournalAccess(userId, req.session.user && req.session.user.role)) {
    wellnessAccess.logJournalDownload(userId, visitorKey);
  }
  if (userId) {
  try {
    const row = db.prepare(`
      SELECT o.id FROM orders o
      JOIN order_items oi ON oi.order_id = o.id
      JOIN products p ON p.id = oi.product_id
      WHERE o.user_id = ?
        AND COALESCE(o.payment_status, '') = 'paid'
        AND o.status = 'processing'
        AND p.subscription_plan = 'wellness_journal'
      ORDER BY o.created_at DESC
      LIMIT 1
    `).get(userId);
    if (row) {
      db.prepare(`UPDATE orders SET status = 'completed' WHERE id = ?`).run(row.id);
    }
  } catch (e) {
    console.error('[journal fulfillment-log]', e && e.message);
  }
  }
  res.json({ success: true });
});

module.exports = router;
