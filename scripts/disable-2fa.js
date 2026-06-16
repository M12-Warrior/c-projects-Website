#!/usr/bin/env node
// Emergency two-factor (2FA / TOTP) disable script.
//
// Use this if the admin loses access to her authenticator app AND her backup
// codes. It turns 2FA back off so she can sign in with just her password, then
// re-enroll from the admin Security panel.
//
// Usage (from the project root):
//   node scripts/disable-2fa.js                 # disables 2FA for ALL admins
//   node scripts/disable-2fa.js admin           # disables 2FA for username "admin"
//   node scripts/disable-2fa.js joyce@mile12warrior.com   # by email
//
// On Railway (live site), run it through the Railway shell/SSH for the
// honest-ambition project so it uses the same /data volume database, e.g.:
//   railway run node scripts/disable-2fa.js
//
// This NEVER deletes the account or changes the password — it only clears the
// TOTP secret, the enabled flag, and the backup codes.
const db = require('../db/database');

const target = (process.argv[2] || '').trim();

function disableFor(rows) {
  const stmt = db.prepare(
    'UPDATE users SET totp_enabled = 0, totp_secret = NULL, totp_backup_codes = NULL WHERE id = ?'
  );
  let count = 0;
  for (const row of rows) {
    stmt.run(row.id);
    count++;
    console.log('  - Disabled 2FA for: ' + row.username + ' <' + row.email + '> (role: ' + row.role + ')');
  }
  return count;
}

try {
  let rows;
  if (target) {
    const isEmail = target.includes('@');
    const row = isEmail
      ? db.prepare('SELECT id, username, email, role FROM users WHERE email = ?').get(target)
      : db.prepare('SELECT id, username, email, role FROM users WHERE username = ?').get(target);
    if (!row) {
      console.error('No user found matching "' + target + '".');
      process.exit(1);
    }
    rows = [row];
  } else {
    rows = db.prepare("SELECT id, username, email, role FROM users WHERE role = 'admin'").all();
    if (!rows.length) {
      console.error('No admin users found.');
      process.exit(1);
    }
  }

  const count = disableFor(rows);
  console.log('\nDone. Two-factor authentication disabled for ' + count + ' account(s).');
  console.log('They can now sign in with their password alone, then re-enable 2FA from the admin Security panel.');
  process.exit(0);
} catch (err) {
  console.error('Failed to disable 2FA:', err && err.message ? err.message : err);
  process.exit(1);
}
