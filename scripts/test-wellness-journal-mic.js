// Wellness journal free access + community mic lighting (run via npm test)
const fs = require('fs');
const path = require('path');
const db = require('../db/database');
const micBadge = require('../lib/micBadge');
const wellnessAccess = require('../lib/wellnessAccess');
const paymentConfig = require('../lib/paymentConfig');
const subscriptionRouter = require('../routes/subscription');

const root = path.join(__dirname, '..');

let failed = 0;
function ok(label) { console.log('ok', label); }
function fail(label, detail) { console.error('FAIL', label, detail || ''); failed++; }

if (paymentConfig.isFreeAccessMode()) ok('free access mode for wellness journal');
else fail('free access mode expected');

if (wellnessAccess.userHasWellnessJournalAccess(999999, 'user')) ok('wellness access helper callable');
else fail('wellness access helper missing');

if (typeof micBadge.isMicLit === 'function') ok('micBadge.isMicLit exported');
else fail('micBadge.isMicLit missing');

if (typeof wellnessAccess.logJournalDownload === 'function') ok('wellnessAccess.logJournalDownload exported');
else fail('wellnessAccess.logJournalDownload missing');

const shopHtml = fs.readFileSync(path.join(root, 'views', 'shop.html'), 'utf8');
const shopProductHtml = fs.readFileSync(path.join(root, 'views', 'shop-product.html'), 'utf8');
const servicesHtml = fs.readFileSync(path.join(root, 'views', 'services.html'), 'utf8');
const journalJs = fs.readFileSync(path.join(root, 'routes', 'journal.js'), 'utf8');
const serverJs = fs.readFileSync(path.join(root, 'server.js'), 'utf8');
const forumJs = fs.readFileSync(path.join(root, 'routes', 'forum.js'), 'utf8');
const adminJs = fs.readFileSync(path.join(root, 'routes', 'admin.js'), 'utf8');

if (serverJs.includes("app.get('/journal/print', (req, res)")) ok('journal print route guest-accessible');
else fail('journal print should not require login');

if (typeof wellnessAccess.guestCanAccessJournalPrint === 'function' && wellnessAccess.guestCanAccessJournalPrint()) ok('guestCanAccessJournalPrint');
else fail('guestCanAccessJournalPrint missing or false');

if (shopHtml.includes('trucker-wellness-journal-monthly') && shopHtml.includes('Download Journal')) ok('shop journal free CTA');
else fail('shop missing journal free CTA');

if (shopHtml.includes('/shop/product/trucker-wellness-journal-monthly') && shopHtml.includes('digitalCardHref')) ok('shop journal card links to product page');
else fail('shop journal card should link to product page');

if (journalJs.includes("router.post('/fulfillment-log', (req, res)")) ok('fulfillment-log allows guests');
else fail('fulfillment-log should not require session');

if (shopProductHtml.includes("'trucker-wellness-journal-monthly'")) ok('shop-product journal free slug');
else fail('shop-product missing journal free slug');

if (servicesHtml.includes('/journal/print')) ok('services journal download link');
else fail('services missing journal download');

const journalSections = (servicesHtml.match(/<!-- ===== WELLNESS JOURNAL ===== -->/g) || []).length;
if (journalSections === 1) ok('services single wellness journal section');
else fail('services should have one wellness journal section', 'found ' + journalSections);

if (shopProductHtml.includes('no account needed') || shopProductHtml.includes('no account')) ok('shop-product journal guest copy');
else fail('shop-product missing guest journal copy');

if (servicesHtml.includes('account optional') || servicesHtml.includes('Optional free account')) ok('services welcoming journal copy');
else fail('services missing welcoming journal copy');

if (servicesHtml.includes('Daily Wellness Checklist') && servicesHtml.includes('Open interactive checklist')) {
  ok('services daily wellness checklist section visible');
} else {
  fail('services missing daily wellness checklist embed');
}

if (forumJs.includes('profanityFilter')) ok('forum profanity filter wired');
else fail('forum missing profanity filter');

if (adminJs.includes('/users/:id/warn') && adminJs.includes('/forum/replies')) ok('admin forum moderation routes');
else fail('admin forum moderation routes missing');

const testUser = 'mic_lit_test_' + Date.now();
const insert = db.prepare(`
  INSERT INTO users (username, email, password, opt_in_forum)
  VALUES (?, ?, 'hash', 0)
`);
const result = insert.run(testUser, testUser + '@example.test');
const userId = result.lastInsertRowid;

try {
  if (!micBadge.isMicLit(userId)) ok('mic not lit without download or community');
  else fail('mic should not be lit for brand-new user');

  db.prepare(`
    INSERT INTO download_events (visited_at, visitor_key, user_id, content_type, action, product_slug, path)
    VALUES (datetime('now'), 'test', ?, 'new-driver-packet', 'download', 'new-driver-packet', '/test')
  `).run(userId);

  if (!micBadge.isMicLit(userId)) ok('mic not lit with download only');
  else fail('mic should need community participation too');

  db.prepare('UPDATE users SET opt_in_forum = 1 WHERE id = ?').run(userId);

  if (micBadge.isMicLit(userId)) ok('mic lit after download + forum opt-in');
  else fail('mic should lit after download + community');

  wellnessAccess.logJournalDownload(userId, 'test');
  db.prepare('DELETE FROM download_events WHERE user_id = ? AND product_slug = ?').run(userId, 'new-driver-packet');
  db.prepare('UPDATE users SET opt_in_forum = 0 WHERE id = ?').run(userId);

  if (!micBadge.isMicLit(userId)) ok('mic not lit with journal download only');
  else fail('mic should need community with journal download');

  db.prepare('UPDATE users SET opt_in_forum = 1 WHERE id = ?').run(userId);

  if (micBadge.isMicLit(userId)) ok('mic lit after journal download + forum opt-in');
  else fail('mic should lit after journal download + community');

  if (paymentConfig.isFreeAccessMode() && subscriptionRouter.getSubscriberTierForUser(userId) === 1) {
    ok('forum mic tier 1 in free mode when lit');
  } else if (!paymentConfig.isFreeAccessMode()) {
    ok('forum mic tier skipped when checkout live');
  } else {
    fail('forum mic tier should be 1 when lit in free mode');
  }
} finally {
  db.prepare('DELETE FROM download_events WHERE user_id = ?').run(userId);
  db.prepare('DELETE FROM users WHERE id = ?').run(userId);
}

if (failed) process.exit(1);
console.log('All wellness journal / mic checks passed.');
