const express = require('express');
const db = require('../db/database');
const subscriptionRouter = require('./subscription');

const router = express.Router();

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
  const tier = subscriptionRouter.getSubscriberTierForUser(req.session.user.id);
  if (tier < 1) {
    return res.status(403).json({ error: 'Active Trucker Wellness Journal subscription required to use the journal.' });
  }
  next();
}

// GET /api/journal/entries — list current user's journal entries (optional ?from=YYYY-MM-DD&to=YYYY-MM-DD, default recent first)
router.get('/entries', requireSession, requireWellnessSubscriber, (req, res) => {
  const userId = req.session.user.id;
  const from = req.query.from; // optional
  const to = req.query.to;     // optional
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
  const entries = db.prepare(sql).all(...params);
  res.json({ entries });
});

// POST /api/journal/entries — create entry { entry_date?: YYYY-MM-DD (default today), content: string }
router.post('/entries', requireSession, requireWellnessSubscriber, (req, res) => {
  const userId = req.session.user.id;
  const content = typeof req.body.content === 'string' ? req.body.content.trim() : '';
  if (!content) {
    return res.status(400).json({ error: 'Content is required.' });
  }
  const entryDate = req.body.entry_date || new Date().toISOString().slice(0, 10);
  const dateMatch = /^\d{4}-\d{2}-\d{2}$/.exec(entryDate);
  const date = dateMatch ? dateMatch[0] : new Date().toISOString().slice(0, 10);

  const stmt = db.prepare(`
    INSERT INTO subscriber_journal_entries (user_id, entry_date, content, updated_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
  `);
  const result = stmt.run(userId, date, content);
  const row = db.prepare('SELECT id, entry_date, content, created_at, updated_at FROM subscriber_journal_entries WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ entry: row });
});

// PUT /api/journal/entries/:id — update own entry { content?: string, entry_date?: YYYY-MM-DD }
router.put('/entries/:id', requireSession, requireWellnessSubscriber, (req, res) => {
  const userId = req.session.user.id;
  const id = parseInt(req.params.id, 10);
  if (!id) return res.status(400).json({ error: 'Invalid entry id.' });
  const existing = db.prepare('SELECT id FROM subscriber_journal_entries WHERE id = ? AND user_id = ?').get(id, userId);
  if (!existing) return res.status(404).json({ error: 'Entry not found.' });

  const updates = [];
  const values = [];
  if (typeof req.body.content === 'string') {
    const content = req.body.content.trim();
    updates.push('content = ?');
    values.push(content);
  }
  if (req.body.entry_date && /^\d{4}-\d{2}-\d{2}$/.test(req.body.entry_date)) {
    updates.push('entry_date = ?');
    values.push(req.body.entry_date);
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

// POST /api/journal/fulfillment-log — After subscriber uses print/download flow, mark paid wellness orders complete (v1).
router.post('/fulfillment-log', requireSession, (req, res) => {
  const userId = req.session.user.id;
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
  res.json({ success: true });
});

module.exports = router;
