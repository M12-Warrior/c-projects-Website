// Course quiz feedback, Driver's Wall, certificate request, shop journal dedup
const fs = require('fs');
const path = require('path');
const db = require('../db/database');
const courseProgress = require('../lib/courseProgress');
const siteEmails = require('../lib/siteEmails');

const root = path.join(__dirname, '..');
let failed = 0;

function ok(label) { console.log('ok', label); }
function fail(label, detail) { console.error('FAIL', label, detail || ''); failed++; }

function perfectProgress() {
  const modules = {};
  for (let i = 1; i <= 10; i++) {
    modules[i] = {
      unlocked: true,
      completed: true,
      lessons: ['x'],
      quizScore: 100,
      quizAttempts: 1,
      quizRetries: 0,
      moduleRedos: 0
    };
  }
  return { purchased: true, modules, studentName: 'Test Driver' };
}

function progressWithRetry() {
  const p = perfectProgress();
  p.modules[3].quizRetries = 1;
  return p;
}

if (courseProgress.qualifiesForDriversWall(perfectProgress())) ok('perfect progress qualifies for wall');
else fail('perfect progress should qualify for wall');

if (!courseProgress.qualifiesForDriversWall(progressWithRetry())) ok('retry disqualifies wall');
else fail('retry should disqualify wall');

if (!courseProgress.isPerfectScore(progressWithRetry())) ok('retry breaks perfect score flag');
else fail('retry should break perfect score');

if (siteEmails.normalizeCategory('certificate') === 'certificate') ok('certificate category normalized');
else fail('certificate category');

if (siteEmails.categoryTag('certificate') === '[Certificate]') ok('certificate tag');
else fail('certificate tag');

const courseHtml = fs.readFileSync(path.join(root, 'views', 'course.html'), 'utf8');
if (courseHtml.includes('renderQuizFeedbackHTML') && courseHtml.includes('Retry this quiz') && courseHtml.includes('Redo module')) {
  ok('course quiz review + retake buttons');
} else fail('course.html missing quiz UX');

if (courseHtml.includes('/api/course/certificate/request')) ok('course certificate request endpoint wired');
else fail('course missing certificate request');

const shopHtml = fs.readFileSync(path.join(root, 'views', 'shop.html'), 'utf8');
if (shopHtml.includes("p.slug !== 'trucker-wellness-journal-monthly'")) ok('shop hides duplicate subscription journal');
else fail('shop subscription dedup missing');

const shopJs = fs.readFileSync(path.join(root, 'routes', 'shop.js'), 'utf8');
if (shopJs.includes('trucker-wellness-journal') && shopJs.includes('SHOP_LISTING_EXCLUDE')) ok('shop API excludes physical journal');
else fail('shop API exclude list missing');

const wallHtml = fs.readFileSync(path.join(root, 'views', 'drivers-wall.html'), 'utf8');
if (wallHtml.includes('/api/course/wall')) ok('drivers wall page');
else fail('drivers wall page missing');

const serverJs = fs.readFileSync(path.join(root, 'server.js'), 'utf8');
if (serverJs.includes('/drivers-wall')) ok('server drivers-wall route');
else fail('server drivers-wall route');

const progressTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='course_progress'").get();
if (progressTable) ok('course_progress table exists');
else fail('course_progress table missing');

const wallTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='drivers_wall'").get();
if (wallTable) ok('drivers_wall table exists');
else fail('drivers_wall table missing');

const journalRow = db.prepare('SELECT active FROM products WHERE slug = ?').get('trucker-wellness-journal');
if (journalRow && journalRow.active === 0) ok('physical journal deactivated in DB');
else fail('physical journal should be inactive', journalRow && journalRow.active);

const monthlyRow = db.prepare('SELECT active FROM products WHERE slug = ?').get('trucker-wellness-journal-monthly');
if (monthlyRow && monthlyRow.active === 1) ok('monthly journal still active');
else fail('monthly journal should stay active');

if (failed) process.exit(1);
console.log('All course quiz / wall / journal dedup checks passed.');
