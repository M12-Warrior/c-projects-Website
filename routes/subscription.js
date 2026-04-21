const express = require('express');
const db = require('../db/database');
const { laNow, wellnessFirstPeriodEnd, wellnessRenewPeriodEnd } = require('../lib/laTime');

const router = express.Router();
const PLAN_WELLNESS = 'wellness_journal';
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function requireSession(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

// Tier from tenure months: 1 = 1-2mo, 2 = 3-5mo, 3 = 6-11mo, 4 = 12+
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

// GET /api/subscription/me — current user's subscription and mic prefs
router.get('/me', requireSession, (req, res) => {
  const userId = req.session.user.id;
  const user = db.prepare('SELECT mic_visible FROM users WHERE id = ?').get(userId);
  const row = db.prepare(`
    SELECT id, plan, status, started_at, current_period_end, cancelled_at, previous_tier
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
      const months = monthsBetween(row.started_at, now);
      tier = tierFromMonths(months);
    }
  }

  res.json({
    subscription: {
      active,
      plan: PLAN_WELLNESS,
      tier,
      started_at,
      current_period_end
    },
    mic_visible: user && user.mic_visible !== undefined ? !!user.mic_visible : true
  });
});

// PUT /api/subscription/mic-visible — set show mic preference (default true)
router.put('/mic-visible', requireSession, (req, res) => {
  const visible = req.body && req.body.visible !== undefined ? !!req.body.visible : true;
  db.prepare('UPDATE users SET mic_visible = ? WHERE id = ?').run(visible ? 1 : 0, req.session.user.id);
  res.json({ success: true, mic_visible: visible });
});

// Get subscriber tier for a user (for forum/blog display). Returns 0 if not active subscriber.
function getSubscriberTierForUser(userId) {
  if (!userId) return 0;
  const row = db.prepare(`
    SELECT status, started_at, current_period_end
    FROM subscriptions
    WHERE user_id = ? AND plan = ?
    ORDER BY created_at DESC
    LIMIT 1
  `).get(userId, PLAN_WELLNESS);
  if (!row || row.status !== 'active') return 0;
  const end = new Date(row.current_period_end);
  if (end <= new Date()) return 0;
  const months = monthsBetween(row.started_at, new Date());
  return tierFromMonths(months);
}

// Create or renew subscription when user purchases wellness journal monthly.
// Period boundaries use America/Los_Angeles; renewals align to calendar months (1st).
function activateWellnessSubscription(userId) {
  const nowDt = laNow();
  const nowJs = nowDt.toJSDate();
  const firstPeriodEnd = wellnessFirstPeriodEnd();

  const active = db.prepare(`
    SELECT id, started_at, current_period_end
    FROM subscriptions
    WHERE user_id = ? AND plan = ? AND status = 'active'
    ORDER BY current_period_end DESC
    LIMIT 1
  `).get(userId, PLAN_WELLNESS);

  if (active) {
    const end = new Date(active.current_period_end);
    if (end > nowJs) {
      const nextEnd = wellnessRenewPeriodEnd(active.current_period_end);
      db.prepare('UPDATE subscriptions SET current_period_end = ? WHERE id = ?').run(nextEnd.toISO(), active.id);
      return { started_at: active.started_at, current_period_end: nextEnd.toJSDate() };
    }
  }

  const cancelled = db.prepare(`
    SELECT id, started_at, cancelled_at
    FROM subscriptions
    WHERE user_id = ? AND plan = ? AND status IN ('cancelled', 'expired')
    ORDER BY cancelled_at DESC
    LIMIT 1
  `).get(userId, PLAN_WELLNESS);

  let startedAt = nowJs;
  if (cancelled && cancelled.cancelled_at) {
    const cancelledAt = new Date(cancelled.cancelled_at);
    if (nowJs - cancelledAt < THIRTY_DAYS_MS && cancelled.started_at) {
      startedAt = new Date(cancelled.started_at);
    }
  }

  db.prepare(`
    INSERT INTO subscriptions (user_id, plan, status, started_at, current_period_end)
    VALUES (?, ?, 'active', ?, ?)
  `).run(userId, PLAN_WELLNESS, startedAt.toISOString(), firstPeriodEnd.toISO());

  return { started_at: startedAt, current_period_end: firstPeriodEnd.toJSDate() };
}

// POST /api/subscription/cancel — cancel wellness subscription (stores previous_tier for 30-day restore)
router.post('/cancel', requireSession, (req, res) => {
  const userId = req.session.user.id;
  const row = db.prepare(`
    SELECT id, started_at, current_period_end
    FROM subscriptions
    WHERE user_id = ? AND plan = ? AND status = 'active'
    ORDER BY created_at DESC
    LIMIT 1
  `).get(userId, PLAN_WELLNESS);
  if (!row) {
    return res.status(404).json({ error: 'No active subscription found' });
  }
  const now = new Date();
  const months = monthsBetween(row.started_at, now);
  const previousTier = tierFromMonths(months);
  db.prepare(`
    UPDATE subscriptions SET status = 'cancelled', cancelled_at = ?, previous_tier = ? WHERE id = ?
  `).run(now.toISOString(), previousTier, row.id);
  res.json({ success: true, message: 'Subscription cancelled. Resubscribe within 30 days to keep your CB mic tier.' });
});

router.getSubscriberTierForUser = getSubscriberTierForUser;
router.activateWellnessSubscription = activateWellnessSubscription;
router.PLAN_WELLNESS = PLAN_WELLNESS;

module.exports = router;
