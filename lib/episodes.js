'use strict';

const fs = require('fs');
const path = require('path');
const db = require('../db/database');
const seo = require('./seo');
const { VIDEOS_DIR } = require('./paths');

function publishedVideoExists(videoPath) {
  const base = path.basename(String(videoPath || ''));
  if (!base || base === '.' || base === '..') return false;
  const onVolume = path.join(VIDEOS_DIR, base);
  const inRepo = path.join(__dirname, '..', 'public', 'videos', base);
  return fs.existsSync(onVolume) || fs.existsSync(inRepo);
}

function slugify(value) {
  const slug = String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return slug || 'episode';
}

function formatClock(seconds) {
  const total = Math.max(0, Math.round(Number(seconds) || 0));
  const minutes = Math.floor(total / 60);
  const remain = total % 60;
  return minutes + ':' + String(remain).padStart(2, '0');
}

function listEpisodes(includeDrafts) {
  const sql = includeDrafts
    ? 'SELECT * FROM episodes ORDER BY episode_number ASC, id ASC'
    : 'SELECT * FROM episodes WHERE published = 1 ORDER BY episode_number ASC, id ASC';
  return db.prepare(sql).all();
}

function getEpisode(id) {
  const num = parseInt(id, 10);
  if (!num) return null;
  return db.prepare('SELECT * FROM episodes WHERE id = ?').get(num) || null;
}

function getPublishedBySlug(slug) {
  const safe = String(slug || '').trim().toLowerCase();
  if (!safe) return null;
  return db.prepare('SELECT * FROM episodes WHERE slug = ? AND published = 1').get(safe) || null;
}

function uniqueSlug(base, exceptId) {
  let slug = slugify(base);
  let n = 2;
  while (true) {
    const row = db.prepare('SELECT id FROM episodes WHERE slug = ?').get(slug);
    if (!row || (exceptId && row.id === exceptId)) return slug;
    slug = slugify(base).slice(0, 70) + '-' + n;
    n += 1;
  }
}

function cleanVideoPath(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^\/videos\/[a-zA-Z0-9._-]+$/.test(raw)) return raw;
  return '';
}

function saveEpisode(input, id) {
  const title = String(input.title || '').trim().slice(0, 140);
  const summary = String(input.summary || '').trim().slice(0, 2000);
  const episodeNumber = parseInt(input.episode_number, 10);
  const duration = parseInt(input.duration_seconds, 10);
  const published = input.published ? 1 : 0;
  const videoPath = cleanVideoPath(input.video_path);
  if (!title) return { error: 'Title is required.' };
  if (!episodeNumber || episodeNumber < 1 || episodeNumber > 999) return { error: 'Episode number must be from 1 to 999.' };
  if (!videoPath) return { error: 'Add an MP4 before saving. The video needs to live in the site video folder.' };
  const existing = id ? getEpisode(id) : null;
  if (id && !existing) return { error: 'Episode not found.' };
  const slug = uniqueSlug(input.slug || title, existing ? existing.id : null);
  const durationSeconds = Number.isFinite(duration) && duration > 0 && duration < 3600 ? duration : (existing && existing.duration_seconds) || null;
  if (existing) {
    db.prepare(`
      UPDATE episodes
      SET episode_number = ?, title = ?, slug = ?, summary = ?, video_path = ?, duration_seconds = ?, published = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(episodeNumber, title, slug, summary, videoPath, durationSeconds, published, existing.id);
    return { episode: getEpisode(existing.id) };
  }
  const info = db.prepare(`
    INSERT INTO episodes (episode_number, title, slug, summary, video_path, duration_seconds, published)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(episodeNumber, title, slug, summary, videoPath, durationSeconds, published);
  return { episode: getEpisode(info.lastInsertRowid) };
}

function deleteEpisode(id) {
  const existing = getEpisode(id);
  if (!existing) return false;
  db.prepare('DELETE FROM episode_watches WHERE episode_id = ?').run(existing.id);
  db.prepare('DELETE FROM episodes WHERE id = ?').run(existing.id);
  return true;
}

function visitorKeyFromReq(req, crypto) {
  if (req.session && req.sessionID) return String(req.sessionID).slice(0, 128);
  return crypto.createHash('sha256').update((req.get('x-forwarded-for') || req.ip || '') + (req.get('user-agent') || '')).digest('hex').slice(0, 32);
}

function recordWatch(req, body, crypto) {
  const episodeId = parseInt(body && body.episodeId, 10);
  const episode = getEpisode(episodeId);
  if (!episode || !episode.published) return { error: 'Episode not found.', status: 404 };
  const token = String(body.sessionToken || '').trim();
  if (!/^[a-zA-Z0-9_-]{8,80}$/.test(token)) return { error: 'Invalid session.', status: 400 };
  let current = Number(body.currentTime);
  let duration = Number(body.duration);
  if (!Number.isFinite(current) || current < 0) current = 0;
  if (current > 1800) current = 1800;
  if (!Number.isFinite(duration) || duration <= 0 || duration > 1800) {
    duration = episode.duration_seconds || 0;
  }
  if (duration > 0 && current > duration + 1.5) current = duration;
  const event = String(body.event || 'progress');
  const completedNow = event === 'ended' || (duration > 0 && current >= duration * 0.95) ? 1 : 0;
  const sentAt = Number(body.sentAt);
  const eventMs = Number.isFinite(sentAt) && sentAt > 0 ? sentAt : Date.now();
  const visitorKey = visitorKeyFromReq(req, crypto);
  const userId = req.session && req.session.user && req.session.user.id ? req.session.user.id : null;
  const apply = db.transaction(function () {
    const existing = db.prepare('SELECT id, visitor_key, max_seconds, exit_seconds, completed, last_event_ms FROM episode_watches WHERE session_token = ?').get(token);
    if (existing && existing.visitor_key !== visitorKey) return { error: 'Invalid session.', status: 403 };
    if (existing) {
      const newer = eventMs >= (Number(existing.last_event_ms) || 0);
      const maxSeconds = Math.max(Number(existing.max_seconds) || 0, current);
      const exitSeconds = newer ? current : Number(existing.exit_seconds) || 0;
      db.prepare(`
        UPDATE episode_watches
        SET updated_at = datetime('now'), duration_seconds = ?, max_seconds = ?, exit_seconds = ?, completed = ?, last_event_ms = ?, user_id = COALESCE(user_id, ?)
        WHERE id = ?
      `).run(duration || null, maxSeconds, exitSeconds, existing.completed || (newer ? completedNow : 0), Math.max(Number(existing.last_event_ms) || 0, eventMs), userId, existing.id);
      return { ok: true };
    }
    db.prepare(`
      INSERT INTO episode_watches (episode_id, visitor_key, user_id, session_token, duration_seconds, max_seconds, exit_seconds, completed, last_event_ms)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(episode.id, visitorKey, userId, token, duration || null, current, current, completedNow, eventMs);
    return { ok: true };
  });
  return apply();
}

function median(values) {
  const nums = values.map(Number).filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
  if (!nums.length) return null;
  const mid = Math.floor(nums.length / 2);
  return nums.length % 2 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
}

function episodeStats(id) {
  const episode = getEpisode(id);
  if (!episode) return null;
  const watches = db.prepare(`
    SELECT w.max_seconds, w.exit_seconds, w.completed, w.started_at, w.updated_at, w.user_id, u.username
    FROM episode_watches w
    LEFT JOIN users u ON u.id = w.user_id
    WHERE w.episode_id = ?
    ORDER BY w.updated_at DESC
  `).all(episode.id);
  const plays = watches.filter((w) => Number(w.max_seconds) > 0.5 || w.completed).length;
  const distinctKeys = db.prepare('SELECT COUNT(DISTINCT visitor_key) AS c FROM episode_watches WHERE episode_id = ?').get(episode.id).c;
  const finished = watches.filter((w) => w.completed).length;
  const knownDuration = Number(episode.duration_seconds) || Math.max.apply(null, watches.map((w) => Number(w.max_seconds) || 0).concat([0]));
  const length = knownDuration > 0 ? knownDuration : 90;
  const bucketSize = length > 180 ? 10 : 5;
  const buckets = [];
  for (let start = 0; start < length; start += bucketSize) {
    const end = Math.min(length, start + bucketSize);
    buckets.push({
      start: start,
      end: Math.round(end),
      label: formatClock(start),
      reached: watches.filter((w) => Number(w.max_seconds) >= start + 0.2).length,
      exited: watches.filter((w) => !w.completed && Number(w.exit_seconds) >= start && Number(w.exit_seconds) < end).length,
    });
  }
  const exitBuckets = buckets.filter((b) => b.exited > 0);
  exitBuckets.sort((a, b) => b.exited - a.exited);
  const unfinishedExits = watches.filter((w) => !w.completed && Number(w.exit_seconds) > 0).map((w) => Number(w.exit_seconds));
  const episodePath = '/episodes/' + episode.slug;
  const pageViews = db.prepare('SELECT COUNT(*) AS c FROM traffic_visits WHERE path = ? OR path = ?').get('/episodes', episodePath).c;
  const episodeViews = db.prepare('SELECT COUNT(*) AS c FROM traffic_visits WHERE path = ?').get(episodePath).c;
  const seriesViews = db.prepare('SELECT COUNT(*) AS c FROM traffic_visits WHERE path = ?').get('/episodes').c;
  return {
    episode: {
      id: episode.id,
      title: episode.title,
      slug: episode.slug,
      duration_seconds: episode.duration_seconds,
      published: episode.published,
    },
    plays: plays,
    viewers: distinctKeys,
    finished: finished,
    medianExitSeconds: median(unfinishedExits),
    medianExitLabel: unfinishedExits.length ? formatClock(median(unfinishedExits)) : null,
    biggestExit: exitBuckets[0] || null,
    pageViews: pageViews,
    episodeViews: episodeViews,
    seriesViews: seriesViews,
    buckets: buckets,
    recent: watches.slice(0, 20).map((w) => ({
      started_at: w.started_at,
      exit_seconds: Math.round(Number(w.exit_seconds) || 0),
      exit_label: formatClock(w.exit_seconds),
      max_label: formatClock(w.max_seconds),
      completed: !!w.completed,
      viewer: w.username || 'Guest',
    })),
  };
}

function renderPublic(selectedSlug) {
  const episodes = listEpisodes(false);
  const newest = episodes.length ? episodes[episodes.length - 1] : null;
  const selected = selectedSlug ? getPublishedBySlug(selectedSlug) : newest;
  const title = selected
    ? selected.title + ' — Episode ' + selected.episode_number + ' | Mile 12 Warrior'
    : 'Episodes — Short Animated Stories | Mile 12 Warrior';
  const description = selected
    ? seo.truncate(selected.summary || (selected.title + ' is a short animated story about fatigue behind the wheel.'), 180)
    : 'Short animated stories from Mile 12 Warrior about fatigue behind the wheel.';
  const thumbnailUrl = selected && selected.slug === 'mile-marker-71'
    ? 'https://mile12warrior.com/images/mile-marker-71.jpg'
    : 'https://mile12warrior.com/images/logo.png';
  const jsonLd = selected ? {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: selected.title,
    description: seo.truncate(selected.summary || description, 300),
    thumbnailUrl: thumbnailUrl,
    uploadDate: String(selected.created_at || '').slice(0, 10) || '2026-11-16',
    duration: selected.duration_seconds ? 'PT' + selected.duration_seconds + 'S' : undefined,
    contentUrl: 'https://mile12warrior.com' + selected.video_path,
    embedUrl: 'https://mile12warrior.com/episodes/' + selected.slug,
  } : null;
  if (jsonLd && !jsonLd.duration) delete jsonLd.duration;
  const listItems = episodes.map((ep) => {
    const current = selected && ep.id === selected.id;
    const href = '/episodes/' + seo.escapeAttr(ep.slug);
    const length = ep.duration_seconds ? ' · ' + formatClock(ep.duration_seconds) : '';
    return '<li>'
      + '<a href="' + href + '"' + (current ? ' aria-current="page"' : '') + '>' + seo.escapeHtml(ep.title) + '</a>'
      + '<span>Episode ' + seo.escapeHtml(ep.episode_number) + (current ? ' · Now playing' : '') + length + '</span>'
      + '</li>';
  }).join('');
  const missing = selectedSlug && !selected;
  const fileReady = selected && publishedVideoExists(selected.video_path);
  const stage = fileReady
    ? '<div class="episode-stage">'
      + '<video controls playsinline preload="metadata" width="1920" height="1080" poster="' + seo.escapeAttr(thumbnailUrl.replace('https://mile12warrior.com', '')) + '" data-episode-id="' + selected.id + '" aria-label="' + seo.escapeAttr(selected.title) + ', animated story about fatigue driving">'
      + '<source src="' + seo.escapeAttr(selected.video_path) + '" type="video/mp4">'
      + 'Your browser cannot play this video.'
      + '</video></div>'
    : '<div class="episode-stage"><p class="episode-note">The video for this episode is not on the site right now. It will play here once the file is saved again.</p></div>';
  const player = selected
    ? '<article class="glass-card episode-card">'
      + '<p class="episode-kicker">EPISODE ' + String(selected.episode_number).padStart(2, '0')
      + (selected.duration_seconds ? ' · ' + formatClock(selected.duration_seconds) : '') + '</p>'
      + '<h2 class="section-header-about">' + seo.escapeHtml(selected.title) + '</h2>'
      + stage
      + (selected.summary ? '<p>' + seo.escapeHtml(selected.summary) + '</p>' : '')
      + '<p class="episode-note">A separate caption track is not on this episode yet. This is an educational story — not a news report, and not legal, medical, or regulatory advice. Hours of Service are the legal floor, not a target. Verify the current rule at <a href="https://www.fmcsa.dot.gov" target="_blank" rel="noopener">fmcsa.dot.gov</a> and <a href="https://dot.ca.gov" target="_blank" rel="noopener">dot.ca.gov</a>, and read the <a href="/disclaimer">site disclaimer</a>.</p>'
      + '</article>'
    : '<article class="glass-card episode-card"><h2 class="section-header-about">' + (missing ? 'Episode not found' : 'Episodes are on the way') + '</h2><p>' + (missing ? 'That episode is not published. The series list is on this page.' : 'The next story will show up here when it is published.') + '</p></article>';
  const html = player
    + '<aside class="episode-side">'
    + '<section class="glass-card"><h2 class="section-header-about">In the series</h2>'
    + (listItems ? '<ol class="episode-list">' + listItems + '</ol>' : '<p class="episode-note">No episodes are published yet.</p>')
    + '<p class="episode-note">New episodes are added here as they are finished.</p></section>'
    + '<section class="glass-card"><h2 class="section-header-about">Keep going</h2>'
    + '<p>The series stays free. The practical reading on rest and fatigue is already on the site. Those pages describe the legal floor, not a personal limit.</p>'
    + '<ul class="episode-links">'
    + '<li><a href="/blog/hours-of-service-rest-for-truck-drivers">Hours of Service rest</a></li>'
    + '<li><a href="/blog/sleep-management-commercial-drivers">Sleep in the sleeper</a></li>'
    + '<li><a href="/packets/new-driver">New Driver Packet</a></li>'
    + '</ul></section></aside>';
  return {
    title: title,
    description: description,
    canonicalPath: selected ? '/episodes/' + selected.slug : '/episodes',
    image: thumbnailUrl,
    jsonLd: jsonLd,
    mount: html,
    found: !selectedSlug || !!getPublishedBySlug(selectedSlug),
  };
}

module.exports = {
  slugify,
  formatClock,
  listEpisodes,
  getEpisode,
  getPublishedBySlug,
  saveEpisode,
  deleteEpisode,
  recordWatch,
  episodeStats,
  renderPublic,
  cleanVideoPath,
};
