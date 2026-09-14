'use strict';

/**
 * IndexNow helper for Bing (and other participating engines).
 * Key file must stay at: https://mile12warrior.com/{INDEXNOW_KEY}.txt
 */
const INDEXNOW_KEY = process.env.INDEXNOW_KEY || '2a8bbb3789f09316f312901df94d010e';
const KEY_LOCATION = 'https://mile12warrior.com/' + INDEXNOW_KEY + '.txt';

async function submitUrls(urlList) {
  const list = (urlList || []).filter(Boolean).slice(0, 100);
  if (!list.length) return { ok: false, skipped: true };
  if (typeof fetch !== 'function') return { ok: false, error: 'fetch unavailable' };

  const body = {
    host: 'mile12warrior.com',
    key: INDEXNOW_KEY,
    keyLocation: KEY_LOCATION,
    urlList: list,
  };

  try {
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(body),
    });
    return { ok: res.status === 200 || res.status === 202, status: res.status };
  } catch (err) {
    return { ok: false, error: err && err.message ? err.message : String(err) };
  }
}

module.exports = { INDEXNOW_KEY, KEY_LOCATION, submitUrls };
