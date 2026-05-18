/**
 * Module 1 free preview is restricted to internal test accounts only.
 * Matches by user id, role, username, or email (case-insensitive; spacing/hyphens ignored for names).
 */

const MODULE1_PREVIEW_USER_IDS = new Set([1, 3, 4]);

const MODULE1_PREVIEW_EMAILS = new Set([
  'joyce@mile12warrior.com',
  'admin@mile12warrior.com',
  'ltl.unicorn.j@gmail.com'
]);

function normalizeKey(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[\s_-]+/g, '');
}

const MODULE1_PREVIEW_USERNAME_KEYS = new Set([
  'admin',
  'm12',
  'butterflywarrior'
]);

/**
 * @param {{ id?: number, username?: string, email?: string, role?: string } | null | undefined} user
 * @returns {boolean}
 */
function hasModule1PreviewAccess(user) {
  if (!user || user.id == null) return false;
  if (user.role === 'admin') return true;
  if (MODULE1_PREVIEW_USER_IDS.has(Number(user.id))) return true;

  const email = String(user.email || '').toLowerCase().trim();
  if (email && MODULE1_PREVIEW_EMAILS.has(email)) return true;

  const usernameKey = normalizeKey(user.username);
  if (usernameKey && MODULE1_PREVIEW_USERNAME_KEYS.has(usernameKey)) return true;

  return false;
}

module.exports = { hasModule1PreviewAccess, normalizeKey };