'use strict';

/** Canonical production origin (no trailing slash). www redirects here. */
const PRODUCTION_APEX = 'https://mile12warrior.com';

/**
 * Normalize a site origin: strip trailing slash; force apex for mile12warrior.com.
 * Keeps sitemap/canonicals consistent even if BASE_URL still has www.
 */
function normalizeSiteOrigin(raw) {
  if (!raw) return '';
  let s = String(raw).trim().replace(/\/+$/, '');
  if (/^https?:\/\/(www\.)?mile12warrior\.com$/i.test(s)) {
    return PRODUCTION_APEX;
  }
  return s;
}

/** Canonical site origin for links, sitemap, and QR codes (no trailing slash). */
function siteBaseUrl(req) {
  const fromEnv = process.env.BASE_URL && String(process.env.BASE_URL).trim();
  if (fromEnv) {
    const normalized = normalizeSiteOrigin(fromEnv);
    if (normalized) return normalized;
  }
  const host = req && req.get && req.get('host');
  if (host) {
    const hostname = String(host).toLowerCase().split(':')[0];
    if (hostname === 'mile12warrior.com' || hostname === 'www.mile12warrior.com') {
      return PRODUCTION_APEX;
    }
    const proto = req.protocol || 'http';
    return proto + '://' + host;
  }
  return 'http://localhost:3000';
}

module.exports = { siteBaseUrl, normalizeSiteOrigin, PRODUCTION_APEX };
