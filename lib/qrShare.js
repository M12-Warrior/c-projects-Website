'use strict';

const { siteBaseUrl } = require('./siteUrl');

const PRODUCTION_HOSTS = new Set(['mile12warrior.com', 'www.mile12warrior.com']);
const DEV_HOSTS = new Set(['localhost', '127.0.0.1']);

const BLOCKED_PATH_PREFIXES = [
  '/admin',
  '/login',
  '/register',
  '/reset-password',
  '/forgot-password',
  '/api',
  '/profile',
];

const SHARE_PRESETS = {
  'forum-lounge': {
    path: '/forum/category/general',
    label: 'Coffee Shop — Truckers Lounge',
    adminDescription: 'Share Coffee Shop — scan to join the conversation',
    publicTitle: 'Scan to join Mile 12 Warrior',
    publicCopy: 'Visit our Truckers Lounge — the Coffee Shop on the forum.',
  },
  homepage: {
    path: '/',
    label: 'Mile 12 Warrior website',
    adminDescription: 'Share website — scan to visit mile12warrior.com',
    publicTitle: 'Scan to visit Mile 12 Warrior',
    publicCopy: 'Safety, wellness, and community for commercial drivers.',
  },
};

function normalizeHost(hostname) {
  return String(hostname || '').toLowerCase().split(':')[0];
}

function isAllowedHost(hostname, isProduction) {
  const host = normalizeHost(hostname);
  if (PRODUCTION_HOSTS.has(host)) return true;
  if (!isProduction && DEV_HOSTS.has(host)) return true;
  return false;
}

function isBlockedPath(pathname) {
  const path = String(pathname || '/').split('?')[0].split('#')[0];
  const lower = path.toLowerCase();
  return BLOCKED_PATH_PREFIXES.some(function (prefix) {
    return lower === prefix || lower.startsWith(prefix + '/');
  });
}

/** Returns absolute URL if allowed, otherwise null. */
function resolveShareUrl(rawUrl, req) {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  let parsed;
  try {
    parsed = new URL(rawUrl.trim());
  } catch (_) {
    return null;
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;
  const isProduction = process.env.NODE_ENV === 'production';
  if (!isAllowedHost(parsed.hostname, isProduction)) return null;
  if (isBlockedPath(parsed.pathname)) return null;
  if (!parsed.pathname.startsWith('/forum/category/') &&
      parsed.pathname !== '/' &&
      parsed.pathname !== '/forum' &&
      parsed.pathname !== '/about' &&
      parsed.pathname !== '/contact' &&
      parsed.pathname !== '/blog' &&
      parsed.pathname !== '/shop' &&
      parsed.pathname !== '/services' &&
      parsed.pathname !== '/refresh') {
    return null;
  }
  return parsed.origin.replace(/\/+$/, '') + parsed.pathname;
}

function presetUrl(presetId, req) {
  const preset = SHARE_PRESETS[presetId];
  if (!preset) return null;
  return siteBaseUrl(req) + preset.path;
}

function getShareLinks(req) {
  const base = siteBaseUrl(req);
  return Object.keys(SHARE_PRESETS).map(function (id) {
    const preset = SHARE_PRESETS[id];
    const url = base + preset.path;
    return {
      id,
      label: preset.label,
      description: preset.adminDescription,
      url,
      qrPath: '/api/qr?preset=' + encodeURIComponent(id),
    };
  });
}

module.exports = {
  SHARE_PRESETS,
  isAllowedHost,
  isBlockedPath,
  resolveShareUrl,
  presetUrl,
  getShareLinks,
};
