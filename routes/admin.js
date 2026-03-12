const express = require('express');
const db = require('../db/database');

const router = express.Router();

function requireAdmin(req, res, next) {
  if (!req.session?.user || req.session.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

router.use(requireAdmin);

// GET /api/admin/stats
router.get('/stats', (req, res) => {
  const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  const totalPosts = db.prepare('SELECT COUNT(*) as count FROM blog_posts').get().count;
  const totalThreads = db.prepare('SELECT COUNT(*) as count FROM forum_threads').get().count;
  const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;
  const revenueRow = db.prepare("SELECT COALESCE(SUM(total), 0) as total FROM orders WHERE status != 'cancelled'").get();
  const totalRevenue = revenueRow.total;
  const totalProducts = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
  const recentUsers = db.prepare(`
    SELECT id, username, email, role, created_at FROM users
    ORDER BY created_at DESC LIMIT 5
  `).all();
  const recentOrders = db.prepare(`
    SELECT o.id, o.user_id, o.total, o.status, o.created_at,
           u.username, u.email
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    ORDER BY o.created_at DESC LIMIT 5
  `).all();

  res.json({
    stats: {
      total_users: totalUsers,
      total_posts: totalPosts,
      total_threads: totalThreads,
      total_orders: totalOrders,
      total_revenue: totalRevenue,
      total_products: totalProducts,
      recent_users: recentUsers,
      recent_orders: recentOrders,
    },
  });
});

// GET /api/admin/users
router.get('/users', (req, res) => {
  const users = db.prepare(`
    SELECT id, username, email, role, created_at FROM users
  `).all();
  res.json({ users });
});

// PUT /api/admin/users/:id
router.put('/users/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid user ID' });
  if (id === req.session.user.id) return res.status(403).json({ error: 'Cannot change your own role' });

  const { role } = req.body;
  if (role !== 'admin' && role !== 'user') {
    return res.status(400).json({ error: 'Role must be admin or user' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'User not found' });

  db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, id);
  res.json({ success: true });
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid user ID' });
  if (id === req.session.user.id) return res.status(403).json({ error: 'Cannot delete your own account' });

  const existing = db.prepare('SELECT id FROM users WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'User not found' });

  db.prepare('DELETE FROM users WHERE id = ?').run(id);
  res.json({ success: true });
});

// GET /api/admin/content
router.get('/content', (req, res) => {
  const unpublishedPosts = db.prepare('SELECT COUNT(*) as count FROM blog_posts WHERE published = 0').get().count;
  const totalComments = db.prepare('SELECT COUNT(*) as count FROM blog_comments').get().count;
  const totalReplies = db.prepare('SELECT COUNT(*) as count FROM forum_replies').get().count;
  const totalMessages = db.prepare('SELECT COUNT(*) as count FROM contact_messages').get().count;
  const unreadMessages = db.prepare('SELECT COUNT(*) as count FROM contact_messages WHERE read = 0').get().count;

  res.json({
    content: {
      unpublished_posts: unpublishedPosts,
      total_comments: totalComments,
      total_replies: totalReplies,
      total_messages: totalMessages,
      unread_messages: unreadMessages,
    },
  });
});

// GET /api/admin/messages
router.get('/messages', (req, res) => {
  const messages = db.prepare(`
    SELECT * FROM contact_messages
    ORDER BY created_at DESC
  `).all();
  res.json({ messages });
});

// PUT /api/admin/messages/:id
router.put('/messages/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid message ID' });

  const existing = db.prepare('SELECT id FROM contact_messages WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Message not found' });

  db.prepare('UPDATE contact_messages SET read = 1 WHERE id = ?').run(id);
  res.json({ success: true });
});

// DELETE /api/admin/messages/:id
router.delete('/messages/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid message ID' });

  const existing = db.prepare('SELECT id FROM contact_messages WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Message not found' });

  db.prepare('DELETE FROM contact_messages WHERE id = ?').run(id);
  res.json({ success: true });
});

// GET /api/admin/completions — Course completions (certificates) for mailing and copy requests
router.get('/completions', (req, res) => {
  const rows = db.prepare(`
    SELECT c.id, c.certificate_number, c.student_name, c.completed_at,
           c.mailing_name, c.mailing_address, c.mailing_city, c.mailing_state, c.mailing_zip,
           c.copy_to_insurance_email, c.copy_to_safety_email,
           c.insurance_copy_sent_at, c.safety_copy_sent_at, c.created_at,
           u.username, u.email
    FROM course_completions c
    JOIN users u ON u.id = c.user_id
    ORDER BY c.id DESC
  `).all();
  res.json({ completions: rows });
});

// GET /api/admin/export/newsletter — CSV of users who opted in to newsletter (honor opt-out)
router.get('/export/newsletter', (req, res) => {
  const rows = db.prepare(`
    SELECT email, username, created_at FROM users WHERE COALESCE(opt_in_newsletter, 0) = 1 ORDER BY created_at ASC
  `).all();
  const header = 'email,username,created_at';
  const lines = [header].concat(rows.map(r => {
    const email = (r.email || '').replace(/"/g, '""');
    const username = (r.username || '').replace(/"/g, '""');
    return `"${email}","${username}","${r.created_at || ''}"`;
  }));
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename=newsletter-contacts.csv');
  res.send(lines.join('\n'));
});

// GET /api/admin/traffic — Analytics: visitors, return users, page views, optional YoY; period=day|week|month|year, compare=yoy
router.get('/traffic', (req, res) => {
  const period = (req.query.period || 'week').toLowerCase();
  const compareYoy = req.query.compare === 'yoy' || req.query.compare === 'true';

  const now = new Date();
  let start = new Date(now);
  let end = new Date(now);
  const dayMs = 24 * 60 * 60 * 1000;

  if (period === 'day') {
    start.setHours(0, 0, 0, 0);
  } else if (period === 'week') {
    start.setTime(now.getTime() - 7 * dayMs);
  } else if (period === 'month') {
    start.setTime(now.getTime() - 30 * dayMs);
  } else if (period === 'year') {
    start.setTime(now.getTime() - 365 * dayMs);
  } else {
    start.setTime(now.getTime() - 7 * dayMs);
  }

  const startStr = start.toISOString();
  const endStr = end.toISOString();

  const visitorsRow = db.prepare(`
    SELECT COUNT(DISTINCT visitor_key) AS c FROM traffic_visits
    WHERE visited_at >= ? AND visited_at <= ?
  `).get(startStr, endStr);
  const visitors = visitorsRow ? visitorsRow.c : 0;

  const returnUsersRow = db.prepare(`
    SELECT COUNT(*) AS c FROM (
      SELECT user_id FROM traffic_visits
      WHERE user_id IS NOT NULL AND visited_at >= ? AND visited_at <= ?
      GROUP BY user_id
      HAVING COUNT(DISTINCT date(visited_at)) > 1
    )
  `).get(startStr, endStr);
  const returnUsers = returnUsersRow ? returnUsersRow.c : 0;

  const pageViewsRow = db.prepare(`
    SELECT COUNT(*) AS c FROM traffic_visits
    WHERE visited_at >= ? AND visited_at <= ?
  `).get(startStr, endStr);
  const pageViews = pageViewsRow ? pageViewsRow.c : 0;

  const loggedInVisitorsRow = db.prepare(`
    SELECT COUNT(DISTINCT user_id) AS c FROM traffic_visits
    WHERE user_id IS NOT NULL AND visited_at >= ? AND visited_at <= ?
  `).get(startStr, endStr);
  const loggedInVisitors = loggedInVisitorsRow ? loggedInVisitorsRow.c : 0;

  // Likely business: users who have purchased a fleet product and visited in this period
  const fleetSlugs = ['fleet-new-hire-packet', 'fleet-refresher-packet', 'fleet-bundle'];
  const placeholders = fleetSlugs.map(() => '?').join(',');
  const likelyBusinessRow = db.prepare(`
    SELECT COUNT(DISTINCT t.user_id) AS c
    FROM traffic_visits t
    WHERE t.user_id IS NOT NULL AND t.visited_at >= ? AND t.visited_at <= ?
      AND EXISTS (
        SELECT 1 FROM orders o
        JOIN order_items oi ON oi.order_id = o.id
        JOIN products p ON p.id = oi.product_id
        WHERE o.user_id = t.user_id AND o.status != 'cancelled'
          AND p.slug IN (${placeholders})
      )
  `).get(startStr, endStr, ...fleetSlugs);
  const likelyBusiness = likelyBusinessRow ? likelyBusinessRow.c : 0;

  let yoyGrowth = null;
  let previousVisitors = null;
  if (compareYoy) {
    const yearMs = 365 * dayMs;
    const startPrev = new Date(start.getTime() - yearMs);
    const endPrev = new Date(end.getTime() - yearMs);
    const startPrevStr = startPrev.toISOString();
    const endPrevStr = endPrev.toISOString();
    const prevRow = db.prepare(`
      SELECT COUNT(DISTINCT visitor_key) AS c FROM traffic_visits
      WHERE visited_at >= ? AND visited_at <= ?
    `).get(startPrevStr, endPrevStr);
    previousVisitors = prevRow ? prevRow.c : 0;
    if (previousVisitors > 0 && visitors > 0) {
      yoyGrowth = Math.round(((visitors - previousVisitors) / previousVisitors) * 100);
    } else if (previousVisitors === 0 && visitors > 0) {
      yoyGrowth = 100;
    } else if (previousVisitors > 0 && visitors === 0) {
      yoyGrowth = -100;
    }
  }

  res.json({
    period,
    start: startStr,
    end: endStr,
    visitors,
    returnUsers,
    loggedInVisitors,
    pageViews,
    likelyBusiness,
    yoyGrowth,
    previousVisitors: previousVisitors ?? undefined,
  });
});

// GET /api/admin/export/preferences — CSV of all users with subscription preferences (self-updating list per channel)
router.get('/export/preferences', (req, res) => {
  const rows = db.prepare(`
    SELECT email, username, created_at,
           COALESCE(opt_in_newsletter, 0) AS newsletter,
           COALESCE(opt_in_blog, 0) AS blog,
           COALESCE(opt_in_product_updates, 0) AS product_updates,
           COALESCE(opt_in_forum, 0) AS forum
    FROM users ORDER BY created_at ASC
  `).all();
  const header = 'email,username,newsletter,blog,product_updates,forum,created_at';
  const lines = [header].concat(rows.map(r => {
    const email = (r.email || '').replace(/"/g, '""');
    const username = (r.username || '').replace(/"/g, '""');
    return `"${email}","${username}",${r.newsletter || 0},${r.blog || 0},${r.product_updates || 0},${r.forum || 0},"${r.created_at || ''}"`;
  }));
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename=subscription-preferences.csv');
  res.send(lines.join('\n'));
});

module.exports = router;
