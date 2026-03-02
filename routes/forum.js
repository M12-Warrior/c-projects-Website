const express = require('express');
const db = require('../db/database');
const subscriptionRouter = require('./subscription');

const router = express.Router();

function subscriberTier(userId) {
  return subscriptionRouter.getSubscriberTierForUser(userId) || 0;
}

// Require session (return 401 JSON for API)
function requireSession(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

// Require admin role
function requireAdmin(req, res, next) {
  if (!req.session || !req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// Generate slug from title: lowercase, hyphens, remove special chars, append timestamp
function slugFromTitle(title) {
  const base = String(title)
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
  const slug = base || 'thread';
  return `${slug}-${Date.now()}`;
}

// 1. GET /api/forum/categories
router.get('/categories', (req, res) => {
  const rows = db.prepare(`
    SELECT
      c.id,
      c.name,
      c.slug,
      c.description,
      c.sort_order,
      (SELECT COUNT(*) FROM forum_threads WHERE category_id = c.id) AS thread_count,
      (SELECT title FROM forum_threads WHERE category_id = c.id ORDER BY updated_at DESC LIMIT 1) AS latest_thread_title,
      (SELECT updated_at FROM forum_threads WHERE category_id = c.id ORDER BY updated_at DESC LIMIT 1) AS latest_thread_updated_at
    FROM forum_categories c
    ORDER BY c.sort_order
  `).all();

  const categories = rows.map(row => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    sort_order: row.sort_order,
    thread_count: row.thread_count || 0,
    latest_thread: row.latest_thread_title
      ? { title: row.latest_thread_title, updated_at: row.latest_thread_updated_at }
      : null
  }));

  res.json({ categories });
});

// 2. GET /api/forum/categories/:slug
router.get('/categories/:slug', (req, res) => {
  const { slug } = req.params;
  const category = db.prepare('SELECT * FROM forum_categories WHERE slug = ?').get(slug);
  if (!category) {
    return res.status(404).json({ error: 'Category not found' });
  }

  const threads = db.prepare(`
    SELECT t.*, u.username,
      (SELECT COUNT(*) FROM forum_replies WHERE thread_id = t.id) AS reply_count
    FROM forum_threads t
    LEFT JOIN users u ON u.id = t.user_id
    WHERE t.category_id = ?
    ORDER BY t.pinned DESC, t.updated_at DESC
  `).all(category.id);

  const threadsWithUser = threads.map(t => ({
    id: t.id,
    category_id: t.category_id,
    user_id: t.user_id,
    username: t.username,
    subscriber_tier: subscriberTier(t.user_id),
    title: t.title,
    slug: t.slug,
    pinned: t.pinned,
    locked: t.locked,
    created_at: t.created_at,
    updated_at: t.updated_at,
    reply_count: t.reply_count || 0
  }));

  res.json({
    category: {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      sort_order: category.sort_order
    },
    threads: threadsWithUser
  });
});

// 3. GET /api/forum/threads/:slug
router.get('/threads/:slug', (req, res) => {
  const { slug } = req.params;
  const row = db.prepare(`
    SELECT t.*, u.username, c.slug AS category_slug, c.name AS category_name
    FROM forum_threads t
    LEFT JOIN users u ON u.id = t.user_id
    LEFT JOIN forum_categories c ON c.id = t.category_id
    WHERE t.slug = ?
  `).get(slug);

  if (!row) {
    return res.status(404).json({ error: 'Thread not found' });
  }

  const thread = {
    id: row.id,
    category_id: row.category_id,
    user_id: row.user_id,
    username: row.username,
    subscriber_tier: subscriberTier(row.user_id),
    title: row.title,
    slug: row.slug,
    pinned: row.pinned,
    locked: row.locked,
    created_at: row.created_at,
    updated_at: row.updated_at,
    category: row.category_slug ? { slug: row.category_slug, name: row.category_name } : null
  };

  const replies = db.prepare(`
    SELECT r.*, u.username
    FROM forum_replies r
    LEFT JOIN users u ON u.id = r.user_id
    WHERE r.thread_id = ?
    ORDER BY r.created_at ASC
  `).all(row.id);

  const repliesWithUser = replies.map(r => ({
    id: r.id,
    thread_id: r.thread_id,
    user_id: r.user_id,
    username: r.username,
    subscriber_tier: subscriberTier(r.user_id),
    content: r.content,
    created_at: r.created_at
  }));

  res.json({ thread, replies: repliesWithUser });
});

// 4. POST /api/forum/threads
router.post('/threads', requireSession, (req, res) => {
  const { category_id, title, content } = req.body;

  if (!category_id || !title || !content) {
    return res.status(400).json({ error: 'category_id, title, and content are required' });
  }

  const category = db.prepare('SELECT id FROM forum_categories WHERE id = ?').get(category_id);
  if (!category) {
    return res.status(404).json({ error: 'Category not found' });
  }

  const slug = slugFromTitle(title);

  const insertThread = db.prepare(`
    INSERT INTO forum_threads (category_id, user_id, title, slug)
    VALUES (?, ?, ?, ?)
  `);
  const result = insertThread.run(
    category_id,
    req.session.user.id,
    String(title).trim(),
    slug
  );
  const threadId = result.lastInsertRowid;

  const insertReply = db.prepare(`
    INSERT INTO forum_replies (thread_id, user_id, content)
    VALUES (?, ?, ?)
  `);
  insertReply.run(threadId, req.session.user.id, String(content).trim());

  const thread = db.prepare('SELECT * FROM forum_threads WHERE id = ?').get(threadId);
  res.status(201).json({
    success: true,
    thread: {
      id: thread.id,
      category_id: thread.category_id,
      user_id: thread.user_id,
      title: thread.title,
      slug: thread.slug,
      pinned: thread.pinned,
      locked: thread.locked,
      created_at: thread.created_at,
      updated_at: thread.updated_at
    }
  });
});

// 5. POST /api/forum/threads/:slug/replies
router.post('/threads/:slug/replies', requireSession, (req, res) => {
  const { slug } = req.params;
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ error: 'content is required' });
  }

  const thread = db.prepare('SELECT * FROM forum_threads WHERE slug = ?').get(slug);
  if (!thread) {
    return res.status(404).json({ error: 'Thread not found' });
  }
  if (thread.locked) {
    return res.status(403).json({ error: 'Thread is locked' });
  }

  const insertReply = db.prepare(`
    INSERT INTO forum_replies (thread_id, user_id, content)
    VALUES (?, ?, ?)
  `);
  const result = insertReply.run(thread.id, req.session.user.id, String(content).trim());
  const replyId = result.lastInsertRowid;

  const updateThread = db.prepare('UPDATE forum_threads SET updated_at = CURRENT_TIMESTAMP WHERE id = ?');
  updateThread.run(thread.id);

  const reply = db.prepare(`
    SELECT r.*, u.username
    FROM forum_replies r
    LEFT JOIN users u ON u.id = r.user_id
    WHERE r.id = ?
  `).get(replyId);

  res.status(201).json({
    success: true,
    reply: {
      id: reply.id,
      thread_id: reply.thread_id,
      user_id: reply.user_id,
      username: reply.username,
      subscriber_tier: subscriberTier(reply.user_id),
      content: reply.content,
      created_at: reply.created_at
    }
  });
});

// 6. PUT /api/forum/threads/:id — Admin only
router.put('/threads/:id', requireAdmin, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { pinned, locked } = req.body;

  const thread = db.prepare('SELECT id FROM forum_threads WHERE id = ?').get(id);
  if (!thread) {
    return res.status(404).json({ error: 'Thread not found' });
  }

  const updates = [];
  const values = [];
  if (typeof pinned === 'number' || typeof pinned === 'boolean') {
    updates.push('pinned = ?');
    values.push(pinned ? 1 : 0);
  }
  if (typeof locked === 'number' || typeof locked === 'boolean') {
    updates.push('locked = ?');
    values.push(locked ? 1 : 0);
  }

  if (updates.length > 0) {
    values.push(id);
    db.prepare(`UPDATE forum_threads SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  }

  res.json({ success: true });
});

// 7. DELETE /api/forum/threads/:id — Admin only
router.delete('/threads/:id', requireAdmin, (req, res) => {
  const id = parseInt(req.params.id, 10);

  const thread = db.prepare('SELECT id FROM forum_threads WHERE id = ?').get(id);
  if (!thread) {
    return res.status(404).json({ error: 'Thread not found' });
  }

  db.prepare('DELETE FROM forum_replies WHERE thread_id = ?').run(id);
  db.prepare('DELETE FROM forum_threads WHERE id = ?').run(id);

  res.json({ success: true });
});

// 8. DELETE /api/forum/replies/:id — Admin only
router.delete('/replies/:id', requireAdmin, (req, res) => {
  const id = parseInt(req.params.id, 10);

  const reply = db.prepare('SELECT id FROM forum_replies WHERE id = ?').get(id);
  if (!reply) {
    return res.status(404).json({ error: 'Reply not found' });
  }

  db.prepare('DELETE FROM forum_replies WHERE id = ?').run(id);

  res.json({ success: true });
});

module.exports = router;
