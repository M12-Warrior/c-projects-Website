const express = require('express');
const db = require('../db/database');

const router = express.Router();
const PLAN_WELLNESS = 'wellness_journal';

function requireSession(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

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

function subscriptionPayload(userId) {
  const user = db.prepare('SELECT mic_visible FROM users WHERE id = ?').get(userId);
  const row = db.prepare(`
    SELECT id, plan, status, started_at, current_period_end, cancelled_at
    FROM subscriptions
    WHERE user_id = ? AND plan = ?
    ORDER BY created_at DESC
    LIMIT 1
  `).get(userId, PLAN_WELLNESS);

  let active = false;
  let tier = 0;
  let current_period_end = null;
  let started_at = null;

  if (row && row.status === 'active') {
    const now = new Date();
    const end = new Date(row.current_period_end);
    if (end > now) {
      active = true;
      current_period_end = row.current_period_end;
      started_at = row.started_at;
      tier = tierFromMonths(monthsBetween(row.started_at, now));
    }
  }

  return {
    subscription: { active, plan: PLAN_WELLNESS, tier, started_at, current_period_end },
    mic_visible: user && user.mic_visible !== undefined ? !!user.mic_visible : true
  };
}

function hasCourseAccess(userId) {
  const now = new Date().toISOString();
  const grantRow = db.prepare(`
    SELECT 1 FROM product_access_grants
    WHERE user_id = ? AND product_slug = 'course-90day'
      AND (expires_at IS NULL OR expires_at > ?)
    LIMIT 1
  `).get(userId, now);
  if (grantRow) return true;
  const orderRow = db.prepare(`
    SELECT 1
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    JOIN products p ON p.id = oi.product_id
    WHERE o.user_id = ? AND o.status != 'cancelled'
      AND p.slug IN ('course-90day', 'complete-bundle')
    LIMIT 1
  `).get(userId);
  return !!orderRow;
}

function tierLabel(t) {
  if (t === 1) return 'Bronze';
  if (t === 2) return 'Silver';
  if (t === 3) return 'Gold';
  if (t === 4) return 'Blue';
  return '';
}

function ctaForGrantSlug(slug) {
  if (slug === 'course-90day') {
    return { href: '/course', label: 'Open the class' };
  }
  if (slug && slug.endsWith('-packet')) {
    return { href: '/services', label: 'Downloads & tools' };
  }
  return { href: `/shop/product/${encodeURIComponent(slug)}`, label: 'Shop listing' };
}

// GET /api/account/summary — dashboard payload (access, handle, mic, counts)
router.get('/summary', requireSession, (req, res) => {
  const userId = req.session.user.id;
  const now = new Date().toISOString();

  const user = db.prepare(`
    SELECT id, username, email, role, avatar, bio, home_base, customer_category, created_at,
           opt_in_newsletter, opt_in_blog, opt_in_product_updates, opt_in_forum
    FROM users WHERE id = ?
  `).get(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const sub = subscriptionPayload(userId);
  const courseAccess = hasCourseAccess(userId);

  const grantRows = db.prepare(`
    SELECT g.product_slug, g.expires_at, g.download_count, g.max_downloads, p.name AS product_name
    FROM product_access_grants g
    LEFT JOIN products p ON p.slug = g.product_slug
    WHERE g.user_id = ? AND (g.expires_at IS NULL OR g.expires_at > ?)
  `).all(userId, now);

  const merged = {};
  for (const g of grantRows) {
    const rem = g.max_downloads == null ? null : Math.max(0, g.max_downloads - (g.download_count || 0));
    if (g.max_downloads != null && rem <= 0) continue;
    const slug = g.product_slug;
    if (!merged[slug]) {
      merged[slug] = {
        product_slug: slug,
        product_name: g.product_name || slug,
        expires_at: g.expires_at || null,
        downloads_remaining: rem,
        max_downloads: g.max_downloads
      };
      const cta = ctaForGrantSlug(slug);
      merged[slug].cta_href = cta.href;
      merged[slug].cta_label = cta.label;
    } else {
      const m = merged[slug];
      if (rem == null || m.downloads_remaining == null) {
        m.downloads_remaining = null;
      } else {
        m.downloads_remaining += rem;
      }
      if (g.expires_at && (!m.expires_at || g.expires_at > m.expires_at)) {
        m.expires_at = g.expires_at;
      }
    }
  }

  const digitalAccess = Object.values(merged);

  const cert = db.prepare(`
    SELECT certificate_number, completed_at FROM course_completions
    WHERE user_id = ? ORDER BY id DESC LIMIT 1
  `).get(userId);

  let journalCount = 0;
  try {
    const j = db.prepare('SELECT COUNT(*) AS c FROM subscriber_journal_entries WHERE user_id = ?').get(userId);
    journalCount = j && j.c != null ? j.c : 0;
  } catch (_) {}

  const access = [];

  if (courseAccess) {
    access.push({
      kind: 'course',
      title: '90-Day Onboarding Course',
      blurb: 'Your lane to confidence — modules, checks, and certificate when you finish the run.',
      href: '/course',
      cta_label: 'Open the class'
    });
  }

  if (sub.subscription.active) {
    access.push({
      kind: 'journal',
      title: 'My Journal',
      blurb: 'Private logbook online — sleep, meals, miles, and headspace.',
      href: '/journal',
      cta_label: 'Write an entry'
    });
    access.push({
      kind: 'journal_print',
      title: 'Journal PDF / print',
      blurb: 'Offline copy for the binder in your cab.',
      href: '/journal/print',
      cta_label: 'Download / print'
    });
    access.push({
      kind: 'forum',
      title: 'Forum & CB mic',
      blurb: 'Key up with the community — your handle shows with tiered mic on posts.',
      href: '/forum',
      cta_label: 'Roll into the forum'
    });
    access.push({
      kind: 'blog',
      title: 'Blog (full access)',
      blurb: 'Road-tested reads while you’re parked.',
      href: '/blog',
      cta_label: 'Read the blog'
    });
  }

  for (const d of digitalAccess) {
    if (d.product_slug === 'course-90day' && courseAccess) continue;
    access.push({
      kind: 'grant',
      title: d.product_name,
      product_slug: d.product_slug,
      blurb: d.expires_at
        ? `License good through ${new Date(d.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}.`
        : d.downloads_remaining != null
          ? `${d.downloads_remaining} download${d.downloads_remaining === 1 ? '' : 's'} left on this packet.`
          : 'Digital access on file.',
      href: d.cta_href,
      cta_label: d.cta_label,
      expires_at: d.expires_at,
      downloads_remaining: d.downloads_remaining
    });
  }

  const mic = {
    has_mic_privilege: sub.subscription.active,
    mic_visible: sub.mic_visible,
    tier: sub.subscription.active ? sub.subscription.tier : 0,
    tier_label: sub.subscription.active ? tierLabel(sub.subscription.tier) : ''
  };

  res.json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role || 'user',
      bio: user.bio ?? '',
      home_base: user.home_base ?? '',
      customer_category: user.customer_category ?? null,
      created_at: user.created_at ?? null,
      opt_in_newsletter: user.opt_in_newsletter ? 1 : 0,
      opt_in_blog: user.opt_in_blog ? 1 : 0,
      opt_in_product_updates: user.opt_in_product_updates ? 1 : 0,
      opt_in_forum: user.opt_in_forum ? 1 : 0
    },
    cb_handle: user.username,
    mic,
    subscription: sub.subscription,
    course_access: courseAccess,
    course_certificate: cert
      ? { certificate_number: cert.certificate_number, completed_at: cert.completed_at }
      : null,
    journal_entry_count: journalCount,
    digital_access: digitalAccess,
    access
  });
});

module.exports = router;
