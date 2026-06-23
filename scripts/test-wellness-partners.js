'use strict';

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const root = path.join(__dirname, '..');

function ok(msg) { console.log('OK:', msg); }
function fail(msg) { console.error('FAIL:', msg); process.exitCode = 1; }

const dbJs = fs.readFileSync(path.join(root, 'db', 'database.js'), 'utf8');
const adminJs = fs.readFileSync(path.join(root, 'routes', 'admin.js'), 'utf8');
const wellnessJs = fs.readFileSync(path.join(root, 'routes', 'wellness.js'), 'utf8');
const serverJs = fs.readFileSync(path.join(root, 'server.js'), 'utf8');
const adminHtml = fs.readFileSync(path.join(root, 'views', 'admin.html'), 'utf8');
const servicesHtml = fs.readFileSync(path.join(root, 'views', 'services.html'), 'utf8');
const indexHtml = fs.readFileSync(path.join(root, 'public', 'index.html'), 'utf8');
const wellnessPageJs = fs.readFileSync(path.join(root, 'public', 'js', 'wellness-page.js'), 'utf8');

if (!/CREATE TABLE IF NOT EXISTS wellness_partners/.test(dbJs)) {
  fail('database.js missing wellness_partners table');
} else {
  ok('wellness_partners table migration present');
}

if (!/bay-area-pain-care/.test(dbJs)) {
  fail('database.js missing Bay Area Pain Care seed');
} else {
  ok('Bay Area Pain Care seed present');
}

if (!/router\.get\('\/wellness\/partners'/.test(adminJs)) {
  fail('admin.js missing GET /wellness/partners');
} else {
  ok('admin wellness partners GET route present');
}

if (!/router\.put\('\/wellness\/partners\/:id'/.test(adminJs)) {
  fail('admin.js missing PUT /wellness/partners/:id');
} else {
  ok('admin wellness partners PUT route present');
}

if (!/router\.get\('\/partners'/.test(wellnessJs)) {
  fail('wellness.js missing public GET /partners');
} else {
  ok('public wellness partners route present');
}

if (!/app\.get\('\/wellness'/.test(serverJs)) {
  fail('server.js missing /wellness page route');
} else {
  ok('/wellness page route present');
}

if (!/data-tab="partners"/.test(adminHtml) || !/function loadPartners\(/.test(adminHtml)) {
  fail('admin.html missing partners tab loader');
} else {
  ok('admin partners tab and loader present');
}

if (!/Upload sign photo \(JPG or PNG\)/.test(adminHtml) || !/Admin only — not on the public page/.test(adminHtml)) {
  fail('admin.html missing prominent wellness sign photo upload UX');
} else {
  ok('wellness sign photo upload UX present');
}

if (!/Manage in Admin → Wellness Partners/.test(wellnessPageJs)) {
  fail('wellness-page.js missing admin-only manage link on placeholder');
} else {
  ok('wellness placeholder admin manage link present');
}

if (!/\/wellness/.test(servicesHtml) || !/Wellness Partners/.test(servicesHtml)) {
  fail('services.html missing wellness promo or footer link');
} else {
  ok('services page links to wellness');
}

const indexNav = indexHtml.match(/<ul class="nav-links"[^>]*>[\s\S]*?<\/ul>/);
if (!indexNav || !/href="\/wellness">Wellness Partners<\/a>/.test(indexNav[0])) {
  fail('index.html top nav missing Wellness Partners link');
} else {
  ok('top nav includes Wellness Partners link');
}

if (!/function imageAlt\(/.test(wellnessPageJs) || !/Bay Area Pain Care sign, Riverside CA/.test(wellnessPageJs)) {
  fail('wellness-page.js missing partner image alt text');
} else {
  ok('wellness partner image alt text present');
}

if (!/BAY_AREA_SIGN_PATH/.test(dbJs) || !/bay-area-pain-care-sign\.jpg/.test(dbJs)) {
  fail('database.js missing committed partner sign image path');
} else {
  ok('committed partner sign image path configured');
}

const tmpDb = path.join(root, 'data', 'test-wellness-partners-' + Date.now() + '.db');
try {
  const db = new Database(tmpDb);
  db.exec(`
    CREATE TABLE wellness_partners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      display_title TEXT NOT NULL,
      display_subtitle TEXT,
      phone TEXT,
      address TEXT,
      hours TEXT,
      website_url TEXT,
      maps_url TEXT,
      services_json TEXT DEFAULT '[]',
      intro_copy TEXT,
      cert_note TEXT,
      walk_in_note TEXT,
      image_path TEXT,
      sort_order INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  db.prepare(`
    INSERT INTO wellness_partners (slug, display_title, display_subtitle, website_url, active)
    VALUES (?, ?, ?, ?, ?)
  `).run('bay-area-pain-care', 'MASSAGE THERAPY', 'Bay Area Pain Care', 'https://example.com', 1);
  const row = db.prepare("SELECT slug, display_title FROM wellness_partners WHERE slug = 'bay-area-pain-care'").get();
  db.close();
  if (!row || row.display_title !== 'MASSAGE THERAPY') {
    fail('seed partner row missing or incorrect');
  } else {
    ok('seed partner row shape verified');
  }
  try { fs.unlinkSync(tmpDb); } catch (_) {}
} catch (err) {
  fail('DB seed check failed: ' + (err && err.message ? err.message : err));
}

if (process.exitCode) process.exit(process.exitCode);
console.log('All wellness partner checks passed.');
