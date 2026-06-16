const express = require('express');
const rateLimit = require('express-rate-limit');
const qrcode = require('qrcode');
const db = require('../db/database');
const totp = require('../lib/totp');

const router = express.Router();

// All enrollment/management endpoints require an active ADMIN session. Regular
// users have no 2FA UI; this keeps the feature scoped to the owner's admin login.
function requireAdmin(req, res, next) {
  if (!req.session || !req.session.user || req.session.user.role !== 'admin') {
    return res.status(401).json({ error: 'Admin session required.' });
  }
  next();
}

// Limit verification attempts (enable/disable/regenerate) to slow brute force of
// a pending or active secret while logged in.
const verifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Wait a few minutes and try again.' }
});

function getUserRow(id) {
  return db.prepare('SELECT id, username, email, role, totp_secret, totp_enabled, totp_backup_codes FROM users WHERE id = ?').get(id);
}

// GET /api/auth/2fa/status — current 2FA state for the admin UI.
router.get('/status', requireAdmin, (req, res) => {
  const row = getUserRow(req.session.user.id);
  if (!row) return res.status(404).json({ error: 'User not found.' });
  res.json({
    enabled: !!row.totp_enabled,
    pendingSetup: !!(req.session.pendingTotpSecret),
    backupCodesRemaining: row.totp_enabled ? totp.countUnusedBackupCodes(row.totp_backup_codes) : 0
  });
});

// POST /api/auth/2fa/setup — start enrollment. Generates a fresh secret, stores it
// as PENDING in the session only (not yet written to the DB / not enabled), and
// returns the otpauth URL, a QR code data URL, and the manual entry secret.
router.post('/setup', requireAdmin, async (req, res) => {
  const row = getUserRow(req.session.user.id);
  if (!row) return res.status(404).json({ error: 'User not found.' });
  if (row.totp_enabled) {
    return res.status(400).json({ error: 'Two-factor authentication is already on. Disable it first to re-enroll.' });
  }
  try {
    const secret = totp.generateSecret();
    const account = row.email || row.username || 'admin';
    const otpauthUrl = totp.buildOtpAuthUrl(account, secret);
    const qrDataUrl = await qrcode.toDataURL(otpauthUrl, { margin: 1, width: 240 });
    // Keep the pending secret in the session until confirmed.
    req.session.pendingTotpSecret = secret;
    res.json({
      success: true,
      otpauthUrl,
      qrDataUrl,
      secret,
      issuer: totp.ISSUER,
      account
    });
  } catch (err) {
    res.status(500).json({ error: 'Could not start 2FA setup. Please try again.' });
  }
});

// POST /api/auth/2fa/enable — confirm enrollment with a code from the app. On
// success: enable 2FA, persist the secret, generate backup codes, and return the
// plaintext backup codes ONCE (only bcrypt hashes are stored).
router.post('/enable', requireAdmin, verifyLimiter, (req, res) => {
  const row = getUserRow(req.session.user.id);
  if (!row) return res.status(404).json({ error: 'User not found.' });
  if (row.totp_enabled) {
    return res.status(400).json({ error: 'Two-factor authentication is already on.' });
  }
  const pendingSecret = req.session.pendingTotpSecret;
  if (!pendingSecret) {
    return res.status(400).json({ error: 'No setup in progress. Start setup again.' });
  }
  const code = (req.body && req.body.code) ? req.body.code : '';
  if (!totp.verifyToken(code, pendingSecret)) {
    return res.status(400).json({ error: 'That code is not valid. Check the 6 digits in your app and try again (codes change every 30 seconds).' });
  }
  const backup = totp.generateBackupCodes();
  db.prepare('UPDATE users SET totp_secret = ?, totp_enabled = 1, totp_backup_codes = ? WHERE id = ?')
    .run(pendingSecret, backup.stored, row.id);
  delete req.session.pendingTotpSecret;
  res.json({
    success: true,
    message: 'Two-factor authentication is now ON.',
    backupCodes: backup.plain
  });
});

// POST /api/auth/2fa/disable — turn off 2FA. Requires a valid current TOTP code OR
// an unused backup code, plus the active admin session.
router.post('/disable', requireAdmin, verifyLimiter, (req, res) => {
  const row = getUserRow(req.session.user.id);
  if (!row) return res.status(404).json({ error: 'User not found.' });
  if (!row.totp_enabled) {
    // Nothing to do; also clear any abandoned pending setup.
    delete req.session.pendingTotpSecret;
    return res.json({ success: true, message: 'Two-factor authentication is already off.' });
  }
  const code = (req.body && req.body.code) ? req.body.code : '';
  let verified = totp.verifyToken(code, row.totp_secret);
  if (!verified) {
    const result = totp.verifyAndConsumeBackupCode(row.totp_backup_codes, code);
    if (result.ok) verified = true;
  }
  if (!verified) {
    return res.status(400).json({ error: 'That code is not valid. Enter a current 6-digit code from your app, or one of your backup codes.' });
  }
  db.prepare('UPDATE users SET totp_enabled = 0, totp_secret = NULL, totp_backup_codes = NULL WHERE id = ?').run(row.id);
  delete req.session.pendingTotpSecret;
  res.json({ success: true, message: 'Two-factor authentication is now OFF.' });
});

// POST /api/auth/2fa/backup-codes/regenerate — issue a fresh set of backup codes
// (invalidating the old ones). Requires a valid current TOTP or backup code.
router.post('/backup-codes/regenerate', requireAdmin, verifyLimiter, (req, res) => {
  const row = getUserRow(req.session.user.id);
  if (!row) return res.status(404).json({ error: 'User not found.' });
  if (!row.totp_enabled) {
    return res.status(400).json({ error: 'Turn on two-factor authentication first.' });
  }
  const code = (req.body && req.body.code) ? req.body.code : '';
  let verified = totp.verifyToken(code, row.totp_secret);
  let updatedBackup = null;
  if (!verified) {
    const result = totp.verifyAndConsumeBackupCode(row.totp_backup_codes, code);
    if (result.ok) {
      verified = true;
      updatedBackup = result.updated; // consume the used code before replacing
    }
  }
  if (!verified) {
    return res.status(400).json({ error: 'That code is not valid. Enter a current 6-digit code from your app, or one of your backup codes.' });
  }
  const backup = totp.generateBackupCodes();
  db.prepare('UPDATE users SET totp_backup_codes = ? WHERE id = ?').run(backup.stored, row.id);
  res.json({
    success: true,
    message: 'New backup codes generated. Your old backup codes no longer work.',
    backupCodes: backup.plain
  });
});

module.exports = router;
