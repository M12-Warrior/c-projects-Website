// TOTP (Time-based One-Time Password) helpers for admin two-factor authentication.
//
// Uses otplib for RFC 6238 TOTP and bcrypt-hashed single-use backup codes. The
// verification window is widened by ±1 step (~30s each) so a slightly wrong clock
// on the user's phone or the server does not lock anyone out.
const { authenticator } = require('otplib');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Tolerate clock drift: accept the current code plus the one immediately before
// and after it (so up to ~90 seconds of skew in either direction is fine).
authenticator.options = { window: 1 };

const ISSUER = 'Mile 12 Warrior';
const BACKUP_CODE_COUNT = 10;

function generateSecret() {
  return authenticator.generateSecret();
}

// Build the otpauth:// URL that authenticator apps encode in the QR code.
function buildOtpAuthUrl(accountName, secret) {
  return authenticator.keyuri(accountName || 'admin', ISSUER, secret);
}

// Verify a 6-digit TOTP code against a secret. Returns true/false; never throws.
function verifyToken(token, secret) {
  if (!token || !secret) return false;
  const clean = String(token).replace(/\D/g, '');
  if (clean.length !== 6) return false;
  try {
    return authenticator.verify({ token: clean, secret });
  } catch (_) {
    return false;
  }
}

// Normalize a backup code for comparison: lowercase, strip any non-alphanumerics
// (so "ABCD-EFGH", "abcdefgh", and "abcd efgh" all match the stored hash).
function normalizeBackupCode(code) {
  return String(code || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Generate a fresh set of backup codes. Returns the human-readable codes to show
// the user ONCE (`plain`) and the value to persist in the DB (`stored`, a JSON
// string of bcrypt hashes that are never reversible back to the plaintext code).
function generateBackupCodes(count) {
  const n = count || BACKUP_CODE_COUNT;
  const plain = [];
  const records = [];
  for (let i = 0; i < n; i++) {
    const raw = crypto.randomBytes(4).toString('hex'); // 8 hex chars
    const display = raw.slice(0, 4) + '-' + raw.slice(4, 8);
    plain.push(display);
    records.push({ h: bcrypt.hashSync(normalizeBackupCode(display), 10), u: 0 });
  }
  return { plain, stored: JSON.stringify(records) };
}

// Check a candidate backup code against the stored JSON. On a match with an
// unused code, marks it used and returns the updated JSON to persist. Single-use:
// a second attempt with the same code fails.
function verifyAndConsumeBackupCode(storedJson, inputCode) {
  let arr;
  try {
    arr = JSON.parse(storedJson || '[]');
  } catch (_) {
    return { ok: false };
  }
  if (!Array.isArray(arr)) return { ok: false };
  const norm = normalizeBackupCode(inputCode);
  if (!norm) return { ok: false };
  for (const entry of arr) {
    if (entry && !entry.u && entry.h && bcrypt.compareSync(norm, entry.h)) {
      entry.u = 1;
      return { ok: true, updated: JSON.stringify(arr) };
    }
  }
  return { ok: false };
}

// Count how many backup codes are still unused (for status display).
function countUnusedBackupCodes(storedJson) {
  try {
    const arr = JSON.parse(storedJson || '[]');
    if (!Array.isArray(arr)) return 0;
    return arr.filter(function (e) { return e && !e.u; }).length;
  } catch (_) {
    return 0;
  }
}

module.exports = {
  ISSUER,
  BACKUP_CODE_COUNT,
  generateSecret,
  buildOtpAuthUrl,
  verifyToken,
  generateBackupCodes,
  verifyAndConsumeBackupCode,
  countUnusedBackupCodes,
  normalizeBackupCode
};
