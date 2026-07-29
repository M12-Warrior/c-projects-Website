/**
 * First-party traffic helpers: source/channel classification and country resolution.
 * Prefer CDN country headers; otherwise optional IP→country lookup (country only, never store IP).
 */

const SEARCH_HOSTS = ['google.', 'bing.com', 'yahoo.com', 'duckduckgo.com', 'baidu.com', 'yandex.'];
const SOCIAL_MAP = [
  { match: ['t.co', 'x.com', 'twitter.com'], source: 'x' },
  { match: ['facebook.com', 'fb.com', 'fb.me', 'm.facebook.com'], source: 'facebook' },
  { match: ['instagram.com'], source: 'instagram' },
  { match: ['linkedin.com', 'lnkd.in'], source: 'linkedin' },
  { match: ['tiktok.com'], source: 'tiktok' },
  { match: ['youtube.com', 'youtu.be'], source: 'youtube' },
  { match: ['reddit.com'], source: 'reddit' },
  { match: ['threads.net'], source: 'threads' },
];

const UTM_ALIASES = {
  twitter: 'x',
  'x.com': 'x',
  't.co': 'x',
  fb: 'facebook',
  ig: 'instagram',
  li: 'linkedin',
};

/** In-memory IP→country cache (IP never written to DB). */
const geoCache = new Map();
const GEO_CACHE_MAX = 5000;
const GEO_NEGATIVE_TTL_MS = 6 * 60 * 60 * 1000;
const GEO_POSITIVE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function hostFromReferrer(referrer) {
  if (!referrer) return '';
  try {
    const u = new URL(String(referrer));
    return (u.hostname || '').toLowerCase();
  } catch (_) {
    return String(referrer).toLowerCase();
  }
}

/**
 * @returns {{ source: string, channel: 'direct'|'search'|'social'|'referral'|'campaign' }}
 */
function classifyTraffic(referrer, utmSource, utmMedium) {
  const utm = (utmSource || '').trim().toLowerCase();
  const medium = (utmMedium || '').trim().toLowerCase();
  if (utm) {
    const source = UTM_ALIASES[utm] || utm;
    let channel = 'campaign';
    if (medium === 'social' || ['x', 'facebook', 'instagram', 'linkedin', 'tiktok', 'youtube', 'reddit', 'threads'].includes(source)) {
      channel = 'social';
    } else if (medium === 'organic' || medium === 'cpc' || medium === 'ppc' || medium === 'search') {
      channel = 'search';
    } else if (medium === 'referral') {
      channel = 'referral';
    } else if (medium === 'email') {
      channel = 'campaign';
    }
    if (source === 'x' || source === 'facebook' || source === 'instagram' || source === 'linkedin' || source === 'tiktok') {
      channel = 'social';
    }
    return { source, channel };
  }

  if (!referrer) return { source: 'direct', channel: 'direct' };

  const host = hostFromReferrer(referrer);
  const hay = host || String(referrer).toLowerCase();

  for (const row of SOCIAL_MAP) {
    if (row.match.some((m) => hay.includes(m))) {
      return { source: row.source, channel: 'social' };
    }
  }
  for (const m of SEARCH_HOSTS) {
    if (hay.includes(m)) {
      const source = m.startsWith('google') ? 'google' : m.startsWith('bing') ? 'bing' : m.startsWith('yahoo') ? 'yahoo' : m.startsWith('duck') ? 'duckduckgo' : 'search';
      return { source, channel: 'search' };
    }
  }

  if (hay.includes('mile12warrior.com') || hay.includes('localhost') || hay.includes('127.0.0.1')) {
    return { source: 'direct', channel: 'direct' };
  }

  return { source: 'referral', channel: 'referral' };
}

function normalizeTrafficSource(referrer, utmSource, utmMedium) {
  return classifyTraffic(referrer, utmSource, utmMedium).source;
}

function countryFromRequest(req) {
  if (!req || !req.get) return null;
  const candidates = [
    req.get('cf-ipcountry'),
    req.get('cloudfront-viewer-country'),
    req.get('x-vercel-ip-country'),
    req.get('x-country-code'),
    req.get('x-geo-country'),
    req.get('geoip-country-code'),
  ];
  for (const raw of candidates) {
    if (!raw) continue;
    const code = String(raw).trim().toUpperCase().slice(0, 2);
    if (/^[A-Z]{2}$/.test(code) && code !== 'XX' && code !== 'T1') return code;
  }
  return null;
}

function clientIpFromRequest(req) {
  if (!req) return null;
  const xff = req.get && req.get('x-forwarded-for');
  if (xff) {
    const first = String(xff).split(',')[0].trim();
    if (first) return first.replace(/^::ffff:/, '');
  }
  const real = req.get && (req.get('x-real-ip') || req.get('fastly-client-ip'));
  if (real) return String(real).trim().replace(/^::ffff:/, '');
  if (req.ip) return String(req.ip).replace(/^::ffff:/, '');
  return null;
}

function isPrivateOrLocalIp(ip) {
  if (!ip) return true;
  if (ip === '::1' || ip === '127.0.0.1') return true;
  if (ip.startsWith('10.') || ip.startsWith('192.168.') || ip.startsWith('127.')) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)) return true;
  if (ip.startsWith('fc') || ip.startsWith('fd') || ip.startsWith('fe80')) return true;
  return false;
}

function cacheGet(ip) {
  const hit = geoCache.get(ip);
  if (!hit) return undefined;
  if (Date.now() > hit.expires) {
    geoCache.delete(ip);
    return undefined;
  }
  return hit.code;
}

function cacheSet(ip, code) {
  if (geoCache.size >= GEO_CACHE_MAX) {
    const first = geoCache.keys().next().value;
    if (first) geoCache.delete(first);
  }
  geoCache.set(ip, {
    code: code || null,
    expires: Date.now() + (code ? GEO_POSITIVE_TTL_MS : GEO_NEGATIVE_TTL_MS),
  });
}

/**
 * Resolve country for a request. Prefer CDN headers; else lookup via free IP API.
 * Returns ISO country code or null. Never persists the IP.
 */
async function resolveCountryCode(req) {
  const fromHeader = countryFromRequest(req);
  if (fromHeader) return fromHeader;

  const ip = clientIpFromRequest(req);
  if (!ip || isPrivateOrLocalIp(ip)) return null;

  const cached = cacheGet(ip);
  if (cached !== undefined) return cached;

  try {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = controller ? setTimeout(function () { controller.abort(); }, 1200) : null;
    const url = 'https://ipapi.co/' + encodeURIComponent(ip) + '/country/';
    const res = await fetch(url, {
      headers: { Accept: 'text/plain', 'User-Agent': 'mile12warrior-traffic/1.0' },
      signal: controller ? controller.signal : undefined,
    });
    if (timer) clearTimeout(timer);
    if (!res.ok) {
      cacheSet(ip, null);
      return null;
    }
    const text = (await res.text()).trim().toUpperCase();
    const code = /^[A-Z]{2}$/.test(text) && text !== 'XX' ? text : null;
    cacheSet(ip, code);
    return code;
  } catch (_) {
    cacheSet(ip, null);
    return null;
  }
}

const COUNTRY_NAMES = {
  US: 'United States', CA: 'Canada', MX: 'Mexico', GB: 'United Kingdom', IE: 'Ireland',
  AU: 'Australia', NZ: 'New Zealand', DE: 'Germany', FR: 'France', ES: 'Spain',
  IT: 'Italy', NL: 'Netherlands', BE: 'Belgium', CH: 'Switzerland', AT: 'Austria',
  SE: 'Sweden', NO: 'Norway', DK: 'Denmark', FI: 'Finland', PL: 'Poland',
  PT: 'Portugal', BR: 'Brazil', AR: 'Argentina', CL: 'Chile', CO: 'Colombia',
  IN: 'India', PK: 'Pakistan', BD: 'Bangladesh', PH: 'Philippines', JP: 'Japan',
  KR: 'South Korea', CN: 'China', TW: 'Taiwan', HK: 'Hong Kong', SG: 'Singapore',
  MY: 'Malaysia', TH: 'Thailand', VN: 'Vietnam', ID: 'Indonesia', AE: 'United Arab Emirates',
  SA: 'Saudi Arabia', ZA: 'South Africa', NG: 'Nigeria', KE: 'Kenya', EG: 'Egypt',
  IL: 'Israel', TR: 'Turkey', RU: 'Russia', UA: 'Ukraine', CZ: 'Czechia',
  RO: 'Romania', HU: 'Hungary', GR: 'Greece', PR: 'Puerto Rico',
};

function countryDisplayName(code) {
  if (!code) return 'Unknown';
  const c = String(code).toUpperCase();
  return COUNTRY_NAMES[c] || c;
}

module.exports = {
  classifyTraffic,
  normalizeTrafficSource,
  countryFromRequest,
  resolveCountryCode,
  countryDisplayName,
  hostFromReferrer,
  clientIpFromRequest,
};
