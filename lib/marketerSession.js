/**
 * Stricter session policy for marketing partner (marketer) accounts:
 * - Must sign in at least once every 24 hours (absolute session lifetime)
 * - Idle timeout after inactivity (default 2 hours)
 * - Session fixation protection via regenerate on login
 *
 * Admin sessions are unchanged.
 */

const DAY_MS = 24 * 60 * 60 * 1000;
const IDLE_MS = 2 * 60 * 60 * 1000;

function isMarketer(user) {
  return !!(user && user.role === 'marketer');
}

function stampMarketerAuth(req) {
  const now = Date.now();
  req.session.marketerAuth = { loginAt: now, lastSeen: now };
  if (req.session.cookie) {
    req.session.cookie.maxAge = DAY_MS;
  }
}

/**
 * Establish a marketer session after password (or 2FA) success.
 * Regenerates the session id to reduce fixation risk.
 */
function establishMarketerSession(req, sessionUser, done) {
  req.session.regenerate(function (err) {
    if (err) return done(err);
    req.session.user = sessionUser;
    stampMarketerAuth(req);
    done(null);
  });
}

function clearMarketerSession(req, res, done) {
  req.session.destroy(function () {
    try {
      res.clearCookie('connect.sid');
    } catch (_) {}
    if (typeof done === 'function') done();
  });
}

/**
 * Express middleware: enforce daily login + idle timeout for marketer role.
 * Admins and other roles pass through unchanged.
 */
function enforceMarketerSession(req, res, next) {
  const user = req.session && req.session.user;
  if (!isMarketer(user)) return next();

  const now = Date.now();
  let auth = req.session.marketerAuth;

  // Legacy sessions created before this policy — force a fresh login.
  if (!auth || !auth.loginAt) {
    return expireAndRespond(req, res, next, 'Please sign in again. Marketing partner sessions require a fresh daily login.');
  }

  if (now - auth.loginAt > DAY_MS) {
    return expireAndRespond(req, res, next, 'Your marketing session expired (daily sign-in required). Please sign in again.');
  }

  if (auth.lastSeen && now - auth.lastSeen > IDLE_MS) {
    return expireAndRespond(req, res, next, 'Your marketing session timed out due to inactivity. Please sign in again.');
  }

  auth.lastSeen = now;
  req.session.marketerAuth = auth;
  if (req.session.cookie) {
    // Keep cookie lifetime capped at remaining time until daily expiry.
    const remaining = Math.max(60 * 1000, DAY_MS - (now - auth.loginAt));
    req.session.cookie.maxAge = Math.min(remaining, IDLE_MS);
  }
  return next();
}

function expireAndRespond(req, res, next, message) {
  const wantsJson = (req.originalUrl || req.url || '').startsWith('/api/') ||
    (req.get('accept') || '').includes('application/json') ||
    req.xhr;

  clearMarketerSession(req, res, function () {
    if (wantsJson) {
      return res.status(401).json({ error: message, code: 'MARKETER_SESSION_EXPIRED' });
    }
    const redirect = '/login?redirect=/marketing&reason=daily';
    return res.redirect(redirect);
  });
}

module.exports = {
  DAY_MS,
  IDLE_MS,
  isMarketer,
  stampMarketerAuth,
  establishMarketerSession,
  enforceMarketerSession
};
