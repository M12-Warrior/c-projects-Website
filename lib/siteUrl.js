'use strict';

/** Canonical site origin for links and QR codes (no trailing slash). */
function siteBaseUrl(req) {
  const fromEnv = process.env.BASE_URL && String(process.env.BASE_URL).trim();
  if (fromEnv) return fromEnv.replace(/\/+$/, '');
  const host = req && req.get && req.get('host');
  if (host) {
    const proto = req.protocol || 'http';
    return proto + '://' + host;
  }
  return 'http://localhost:3000';
}

module.exports = { siteBaseUrl };
