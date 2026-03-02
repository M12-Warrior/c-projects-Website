const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('../db/database');

const router = express.Router();

const RESET_TOKEN_EXPIRY_HOURS = 1;

function sendPasswordResetEmail(toEmail, resetLink, callback) {
  try {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    if (host && user && pass) {
      const nodemailer = require('nodemailer');
      const port = parseInt(process.env.SMTP_PORT, 10) || 587;
      const from = process.env.FROM_EMAIL || process.env.SMTP_USER || 'noreply@mile12warrior.com';
      const transport = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
      transport.sendMail({
        from,
        to: toEmail,
        subject: 'Mile 12 Warrior — Reset your password',
        text: 'You requested a password reset. Use this link within ' + RESET_TOKEN_EXPIRY_HOURS + ' hour(s):\n\n' + resetLink + '\n\nIf you did not request this, ignore this email.',
        html: '<p>You requested a password reset. Use this link within ' + RESET_TOKEN_EXPIRY_HOURS + ' hour(s):</p><p><a href="' + resetLink + '">' + resetLink + '</a></p><p>If you did not request this, ignore this email.</p>'
      }, function (err) {
        if (err) console.error('Password reset email error:', err);
        if (callback) callback(!err);
      });
      return;
    }
  } catch (e) {
    // nodemailer not installed or config missing
  }
  console.log('[Password reset] No SMTP configured. Reset link for', toEmail, ':', resetLink);
  if (callback) callback(true);
}

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Helper: build session user object (include subscription preferences and created_at)
function toSessionUser(row) {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    role: row.role || 'user',
    avatar: row.avatar ?? null,
    bio: row.bio ?? '',
    created_at: row.created_at ?? null,
    opt_in_newsletter: row.opt_in_newsletter ? 1 : 0,
    opt_in_blog: row.opt_in_blog ? 1 : 0,
    opt_in_product_updates: row.opt_in_product_updates ? 1 : 0,
    opt_in_forum: row.opt_in_forum ? 1 : 0
  };
}

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { username, email, password, opt_in_newsletter, opt_in_blog, opt_in_product_updates, opt_in_forum } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email, and password are required' });
  }

  const trimmedUsername = username.trim();
  if (trimmedUsername.length < 3 || trimmedUsername.length > 20) {
    return res.status(400).json({ error: 'Username must be 3-20 characters' });
  }

  if (!EMAIL_REGEX.test(email.trim())) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const existingByUsername = db.prepare('SELECT id FROM users WHERE username = ?').get(trimmedUsername);
  if (existingByUsername) {
    return res.status(409).json({ error: 'Username already exists' });
  }

  const trimmedEmail = email.trim();
  const existingByEmail = db.prepare('SELECT id FROM users WHERE email = ?').get(trimmedEmail);
  if (existingByEmail) {
    return res.status(409).json({ error: 'Email already exists' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const n = v => (v === true || v === 1 || v === '1' || v === 'true') ? 1 : 0;
  const insert = db.prepare(`
    INSERT INTO users (username, email, password, opt_in_newsletter, opt_in_blog, opt_in_product_updates, opt_in_forum)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const result = insert.run(
    trimmedUsername,
    trimmedEmail,
    hashedPassword,
    n(opt_in_newsletter),
    n(opt_in_blog),
    n(opt_in_product_updates),
    n(opt_in_forum)
  );
  const user = db.prepare('SELECT id, username, email, role, avatar, bio, created_at, opt_in_newsletter, opt_in_blog, opt_in_product_updates, opt_in_forum FROM users WHERE id = ?').get(result.lastInsertRowid);
  const sessionUser = toSessionUser(user);
  req.session.user = sessionUser;

  res.status(201).json({
    success: true,
    user: { id: sessionUser.id, username: sessionUser.username, email: sessionUser.email, role: sessionUser.role }
  });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const user = db.prepare('SELECT id, username, email, password, role, avatar, bio, created_at, opt_in_newsletter, opt_in_blog, opt_in_product_updates, opt_in_forum FROM users WHERE username = ?').get(username.trim());
  if (!user) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const matches = bcrypt.compareSync(password, user.password);
  if (!matches) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const sessionUser = toSessionUser(user);
  req.session.user = sessionUser;

  res.json({
    success: true,
    user: sessionUser
  });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to logout' });
    }
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
});

// GET /api/auth/me — return session user with latest preferences from DB
router.get('/me', (req, res) => {
  if (!req.session || !req.session.user) {
    return res.json({ user: null });
  }
  const row = db.prepare('SELECT id, username, email, role, avatar, bio, created_at, opt_in_newsletter, opt_in_blog, opt_in_product_updates, opt_in_forum FROM users WHERE id = ?').get(req.session.user.id);
  if (!row) return res.json({ user: null });
  res.json({ user: toSessionUser(row) });
});

// PUT /api/auth/profile
router.put('/profile', (req, res) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { bio } = req.body;
  const bioValue = typeof bio === 'string' ? bio : '';

  const update = db.prepare('UPDATE users SET bio = ? WHERE id = ?');
  update.run(bioValue, req.session.user.id);

  req.session.user = { ...req.session.user, bio: bioValue };

  res.json({ success: true });
});

// PUT /api/auth/preferences — update subscription preferences (newsletter, blog, product updates, forum)
router.put('/preferences', (req, res) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const userId = req.session.user.id;
  const { newsletter, blog, product_updates, forum } = req.body || {};
  const n = v => (v === true || v === 1 || v === '1' || v === 'true') ? 1 : 0;
  db.prepare(`
    UPDATE users SET opt_in_newsletter = ?, opt_in_blog = ?, opt_in_product_updates = ?, opt_in_forum = ?
    WHERE id = ?
  `).run(n(newsletter), n(blog), n(product_updates), n(forum), userId);
  const row = db.prepare('SELECT id, username, email, role, avatar, bio, created_at, opt_in_newsletter, opt_in_blog, opt_in_product_updates, opt_in_forum FROM users WHERE id = ?').get(userId);
  req.session.user = toSessionUser(row);
  res.json({ success: true, preferences: { newsletter: !!row.opt_in_newsletter, blog: !!row.opt_in_blog, product_updates: !!row.opt_in_product_updates, forum: !!row.opt_in_forum } });
});

// POST /api/auth/forgot-password — request password reset by email (always return same message to avoid leaking accounts)
router.post('/forgot-password', (req, res) => {
  const email = (req.body && req.body.email) ? req.body.email.trim() : '';
  if (!email || !EMAIL_REGEX.test(email)) {
    return res.status(400).json({ error: 'Valid email is required' });
  }
  const user = db.prepare('SELECT id, email FROM users WHERE email = ?').get(email);
  if (user) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000).toISOString();
    db.prepare('DELETE FROM password_reset_tokens WHERE user_id = ?').run(user.id);
    db.prepare('INSERT INTO password_reset_tokens (token, user_id, expires_at) VALUES (?, ?, ?)').run(token, user.id, expiresAt);
    const baseUrl = process.env.BASE_URL || (req.protocol + '://' + (req.get('host') || 'localhost:3000'));
    const resetLink = baseUrl + '/reset-password?token=' + token;
    sendPasswordResetEmail(user.email, resetLink, function () {
      res.json({ success: true, message: 'If an account exists with that email, we sent a reset link. Check your inbox and spam.' });
    });
  } else {
    res.json({ success: true, message: 'If an account exists with that email, we sent a reset link. Check your inbox and spam.' });
  }
});

// POST /api/auth/reset-password — set new password using token
router.post('/reset-password', (req, res) => {
  const { token, newPassword } = req.body || {};
  if (!token || typeof token !== 'string' || !token.trim()) {
    return res.status(400).json({ error: 'Reset token is required' });
  }
  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  }
  const row = db.prepare('SELECT token, user_id, expires_at FROM password_reset_tokens WHERE token = ?').get(token.trim());
  if (!row) {
    return res.status(400).json({ error: 'Invalid or expired reset link. Request a new one from the sign-in page.' });
  }
  const now = new Date().toISOString();
  if (row.expires_at < now) {
    db.prepare('DELETE FROM password_reset_tokens WHERE token = ?').run(token.trim());
    return res.status(400).json({ error: 'This reset link has expired. Request a new one from the sign-in page.' });
  }
  const hashed = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashed, row.user_id);
  db.prepare('DELETE FROM password_reset_tokens WHERE token = ?').run(token.trim());
  res.json({ success: true, message: 'Password updated. You can sign in with your new password.' });
});

module.exports = router;
