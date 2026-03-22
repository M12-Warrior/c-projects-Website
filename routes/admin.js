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

function getPeriodBounds(period) {
  const now = new Date();
  const start = new Date(now);
  const dayMs = 24 * 60 * 60 * 1000;
  if (period === 'day') {
    start.setHours(0, 0, 0, 0);
  } else if (period === 'week') {
    start.setTime(now.getTime() - 7 * dayMs);
  } else if (period === 'month') {
    start.setTime(now.getTime() - 30 * dayMs);
  } else if (period === 'ytd') {
    start.setMonth(0, 1);
    start.setHours(0, 0, 0, 0);
  } else {
    start.setTime(now.getTime() - 365 * dayMs);
  }
  return { start, end: now };
}

function normalizeTrafficSource(referrer, utmSource) {
  const explicit = (utmSource || '').trim().toLowerCase();
  if (explicit) return explicit;
  if (!referrer) return 'direct';
  const r = String(referrer).toLowerCase();
  if (r.includes('google.')) return 'google';
  if (r.includes('facebook.com') || r.includes('fb.com')) return 'facebook';
  if (r.includes('linkedin.com')) return 'linkedin';
  if (r.includes('x.com') || r.includes('twitter.com')) return 'x';
  if (r.includes('instagram.com')) return 'instagram';
  if (r.includes('bing.com')) return 'bing';
  if (r.includes('yahoo.com')) return 'yahoo';
  return 'other';
}

function getFiscalWindow(fiscalYear) {
  const fy = Number(fiscalYear) || 2026;
  return {
    start: new Date(Date.UTC(fy - 1, 4, 1, 0, 0, 0)), // May 1 prior year
    end: new Date(Date.UTC(fy, 3, 30, 23, 59, 59, 999)), // Apr 30
    year: fy,
  };
}

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

const CUSTOMER_CATEGORIES = ['individual', 'fleet', 'school'];

// GET /api/admin/users
router.get('/users', (req, res) => {
  const users = db.prepare(`
    SELECT id, username, email, role, customer_category, created_at FROM users
  `).all();
  res.json({ users });
});

// PUT /api/admin/users/:id
router.put('/users/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid user ID' });

  const { role, customer_category } = req.body;
  const isSelf = id === req.session.user.id;

  if (!isSelf) {
    if (role !== 'admin' && role !== 'user') {
      return res.status(400).json({ error: 'Role must be admin or user' });
    }
  }

  const existing = db.prepare('SELECT id, role FROM users WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'User not found' });

  const cat = (customer_category != null && typeof customer_category === 'string' && customer_category.trim() !== '' && CUSTOMER_CATEGORIES.includes(customer_category.trim().toLowerCase()))
    ? customer_category.trim().toLowerCase()
    : null;

  if (isSelf) {
    db.prepare('UPDATE users SET customer_category = ? WHERE id = ?').run(cat, id);
  } else {
    db.prepare('UPDATE users SET role = ?, customer_category = ? WHERE id = ?').run(role, cat, id);
  }
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

// GET /api/admin/revenue-tax — Fiscal totals and monthly income chart
router.get('/revenue-tax', (req, res) => {
  const fiscalYear = Number(req.query.fiscal_year) || 2026;
  const taxRate = Math.max(0, Math.min(100, Number(req.query.tax_rate) || 30));
  const window = getFiscalWindow(fiscalYear);
  const startStr = window.start.toISOString();
  const endStr = window.end.toISOString();
  const months = db.prepare(`
    SELECT strftime('%Y-%m', created_at) AS month_key, COALESCE(SUM(total), 0) AS revenue
    FROM orders
    WHERE status != 'cancelled' AND created_at >= ? AND created_at <= ?
    GROUP BY strftime('%Y-%m', created_at)
    ORDER BY month_key ASC
  `).all(startStr, endStr);
  const totalRevenueRow = db.prepare(`
    SELECT COALESCE(SUM(total), 0) AS total
    FROM orders
    WHERE status != 'cancelled' AND created_at >= ? AND created_at <= ?
  `).get(startStr, endStr);
  const totalRevenue = Number(totalRevenueRow ? totalRevenueRow.total : 0);
  const taxSetAside = Math.round(totalRevenue * (taxRate / 100) * 100) / 100;
  res.json({
    fiscalYear,
    fiscalStart: startStr,
    fiscalEnd: endStr,
    taxRate,
    totalRevenue,
    taxSetAside,
    netAfterSetAside: Math.round((totalRevenue - taxSetAside) * 100) / 100,
    months,
    disclaimer: 'For planning only. Consult a qualified tax professional.',
  });
});

// GET /api/admin/downloads — Download/print telemetry by content type
router.get('/downloads', (req, res) => {
  const period = (req.query.period || 'month').toLowerCase();
  const bounds = getPeriodBounds(period);
  const startStr = bounds.start.toISOString();
  const endStr = bounds.end.toISOString();
  const rows = db.prepare(`
    SELECT content_type,
           SUM(CASE WHEN action = 'download' THEN 1 ELSE 0 END) AS downloads,
           SUM(CASE WHEN action = 'print' THEN 1 ELSE 0 END) AS prints,
           COUNT(*) AS total
    FROM download_events
    WHERE visited_at >= ? AND visited_at <= ?
    GROUP BY content_type
    ORDER BY total DESC, content_type ASC
  `).all(startStr, endStr);
  res.json({ period, start: startStr, end: endStr, rows });
});

// GET /api/admin/packets-renewals — Packet purchases, expiries, and certificate list
router.get('/packets-renewals', (req, res) => {
  const withinDays = Math.max(1, Math.min(365, Number(req.query.within_days) || 90));
  const now = new Date();
  const future = new Date(now.getTime() + withinDays * 24 * 60 * 60 * 1000).toISOString();
  const grants = db.prepare(`
    SELECT pag.id, pag.product_slug, pag.granted_at, pag.expires_at, pag.download_count, pag.max_downloads,
           u.id AS user_id, u.username, u.email,
           o.id AS order_id, o.created_at AS order_created_at
    FROM product_access_grants pag
    JOIN users u ON u.id = pag.user_id
    JOIN orders o ON o.id = pag.order_id
    WHERE pag.product_slug IN ('new-driver-packet','seasoned-packet','fleet-new-hire-packet','fleet-refresher-packet')
      AND (pag.expires_at IS NULL OR pag.expires_at <= ?)
    ORDER BY COALESCE(pag.expires_at, '9999-12-31') ASC, o.created_at DESC
  `).all(future);
  const completions = db.prepare(`
    SELECT c.id, c.certificate_number, c.student_name, c.completed_at,
           u.email, u.username
    FROM course_completions c
    JOIN users u ON u.id = c.user_id
    ORDER BY c.completed_at DESC
    LIMIT 200
  `).all();
  res.json({ withinDays, grants, completions });
});

// GET /api/admin/address-book — merged contacts (users + guest address_book)
router.get('/address-book', (req, res) => {
  const rows = db.prepare(`
    SELECT email, name, source, opt_out, created_at, updated_at FROM address_book
    UNION ALL
    SELECT u.email AS email, u.username AS name, 'user' AS source,
           COALESCE(u.opt_out_address_book, 0) AS opt_out,
           u.created_at AS created_at, u.created_at AS updated_at
    FROM users u
    WHERE NOT EXISTS (SELECT 1 FROM address_book a WHERE a.email = u.email)
    ORDER BY updated_at DESC, created_at DESC
  `).all();
  res.json({ contacts: rows });
});

// PUT /api/admin/address-book/opt-out
router.put('/address-book/opt-out', (req, res) => {
  const email = (req.body && req.body.email) ? String(req.body.email).trim().toLowerCase() : '';
  const optOut = !!(req.body && req.body.opt_out);
  if (!email) return res.status(400).json({ error: 'Email is required' });
  db.prepare(`
    INSERT INTO address_book (email, source, opt_out, updated_at)
    VALUES (?, 'admin', ?, datetime('now'))
    ON CONFLICT(email) DO UPDATE SET opt_out = excluded.opt_out, updated_at = datetime('now')
  `).run(email, optOut ? 1 : 0);
  db.prepare('UPDATE users SET opt_out_address_book = ? WHERE email = ?').run(optOut ? 1 : 0, email);
  res.json({ success: true });
});

// POST /api/admin/send-renewal-reminder — queue/record reminder action
router.post('/send-renewal-reminder', (req, res) => {
  const email = (req.body && req.body.email) ? String(req.body.email).trim().toLowerCase() : '';
  const context = (req.body && req.body.context) ? String(req.body.context).trim() : 'packet-renewal';
  if (!email) return res.status(400).json({ error: 'Email is required' });
  // Placeholder for email provider integration; for now record a contact message audit trail.
  db.prepare(`
    INSERT INTO contact_messages (name, email, subject, message, read)
    VALUES (?, ?, ?, ?, 1)
  `).run('Admin Reminder', email, 'Renewal reminder queued', 'Reminder context: ' + context, 1);
  res.json({ success: true, queued: true });
});

// GET /api/admin/traffic — Analytics with source breakdown and YoY/YTD support
router.get('/traffic', (req, res) => {
  const period = (req.query.period || 'week').toLowerCase();
  const compareYoy = req.query.compare === 'yoy' || req.query.compare === 'true';
  const bounds = getPeriodBounds(period);
  const start = bounds.start;
  const end = bounds.end;
  const dayMs = 24 * 60 * 60 * 1000;

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

  const sourceRows = db.prepare(`
    SELECT referrer, utm_source, visitor_key
    FROM traffic_visits
    WHERE visited_at >= ? AND visited_at <= ?
  `).all(startStr, endStr);
  const sourceMap = new Map();
  const sourceVisitorMap = new Map();
  for (const row of sourceRows) {
    const source = normalizeTrafficSource(row.referrer, row.utm_source);
    if (!sourceMap.has(source)) sourceMap.set(source, 0);
    sourceMap.set(source, sourceMap.get(source) + 1);
    if (!sourceVisitorMap.has(source)) sourceVisitorMap.set(source, new Set());
    sourceVisitorMap.get(source).add(row.visitor_key);
  }
  const sources = Array.from(sourceMap.entries())
    .map(([source, views]) => {
      const uniqueVisitors = sourceVisitorMap.get(source) ? sourceVisitorMap.get(source).size : 0;
      const percent = visitors > 0 ? Math.round((uniqueVisitors / visitors) * 1000) / 10 : 0;
      return { source, views, visitors: uniqueVisitors, percent };
    })
    .sort((a, b) => b.visitors - a.visitors);

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
    sources,
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
