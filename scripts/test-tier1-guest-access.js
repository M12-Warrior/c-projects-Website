// Smoke checks: Tier 1 free paths vs Module 1 course lock (run: node scripts/test-tier1-guest-access.js)
const fs = require('fs');
const path = require('path');
const { hasModule1PreviewAccess } = require('../lib/module1PreviewAccess');

const root = path.join(__dirname, '..');
const indexHtml = fs.readFileSync(path.join(root, 'public', 'index.html'), 'utf8');
const packetsJs = fs.readFileSync(path.join(root, 'public', 'js', 'packets.js'), 'utf8');
const courseHtml = fs.readFileSync(path.join(root, 'views', 'course.html'), 'utf8');

let failed = 0;
function ok(label) { console.log('ok', label); }
function fail(label, detail) { console.error('FAIL', label, detail || ''); failed++; }

const hubJs = fs.readFileSync(path.join(root, 'public', 'js', 'new-driver-hub.js'), 'utf8');

if (!indexHtml.includes('new-driver-hub.js')) fail('homepage new-driver-hub script');
else ok('homepage new-driver-hub script');

if (!indexHtml.includes('data-nd-hub')) fail('homepage nd-hub tabs mount');
else ok('homepage nd-hub tabs mount');

if (!hubJs.includes('/course')) fail('new-driver-hub course link');
else ok('new-driver-hub course link');

if (indexHtml.includes('Tier1Checklist.open()')) ok('homepage Tier1 checklist reference');
else if (indexHtml.includes('tier1-checklist.js')) ok('homepage Tier1 checklist via hub');
else fail('homepage Tier1 checklist');

if (!indexHtml.includes('tier1-checklist.js')) fail('homepage tier1-checklist script');
else ok('homepage tier1-checklist script');

if (packetsJs.includes("fetch('/api/shop/packet-access") && /Packets\.print = function[\s\S]*new-driver[\s\S]*packet-access/.test(packetsJs)) {
  fail('packets.js gates new-driver print via packet-access');
} else ok('packets.js new-driver print not API-gated');

if (!packetsJs.includes('Packets.getNewDriverChecklist')) fail('packets.js checklist helper');
else ok('packets.js checklist helper');

if (courseHtml.includes("fetch('/api/shop/packet-access") && /function downloadPacket[\s\S]*packet-access/.test(courseHtml)) {
  fail('course downloadPacket still uses packet-access');
} else ok('course downloadPacket free for new-driver');

if (hasModule1PreviewAccess(null)) fail('guest has module1 preview');
else ok('guest module1 preview locked');

if (failed) process.exit(1);
console.log('All Tier 1 guest access checks passed.');
