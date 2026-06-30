'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const packetsJs = fs.readFileSync(path.join(root, 'public/js/packets.js'), 'utf8');

function ok(msg) { console.log('OK:', msg); }
function fail(msg) { console.error('FAIL:', msg); process.exitCode = 1; }

const ctx = {};
vm.createContext(ctx);
try {
  vm.runInContext(packetsJs, ctx);
} catch (e) {
  fail('packets.js failed to load: ' + e.message);
  process.exit(1);
}

const Packets = ctx.Packets;
if (!Packets || typeof Packets.seasonedDriver !== 'function') {
  fail('Packets.seasonedDriver missing');
  process.exit(1);
}

const types = [
  ['new-driver', 'newDriver', 50000],
  ['seasoned-driver', 'seasonedDriver', 30000],
  ['fleet-new-hire', 'fleetNewHire', 40000],
  ['fleet-refresher', 'fleetRefresher', 30000]
];

types.forEach(function (pair) {
  const type = pair[0];
  const fn = pair[1];
  const minLen = pair[2];
  const html = Packets[fn]();
  if (!html || html.length < minLen) {
    fail(type + ' HTML too short (' + (html ? html.length : 0) + ')');
    return;
  }
  if (html.indexOf('<body>') === -1 || html.indexOf('</html>') === -1) {
    fail(type + ' missing body/html wrapper');
    return;
  }
  if (html.replace(/<[^>]+>/g, '').trim().length < 5000) {
    fail(type + ' body text too sparse');
    return;
  }
  ok(type + ' renders ' + html.length + ' chars');
});

if (Packets._normalizeType('seasoned-packet') !== 'seasoned-driver') {
  fail('seasoned-packet slug alias');
} else {
  ok('seasoned-packet slug maps to seasoned-driver');
}

if (Packets._buildHtml('seasoned-packet') && Packets._buildHtml('seasoned-packet').length > 30000) {
  ok('_buildHtml accepts product slug');
} else {
  fail('_buildHtml product slug');
}

if (typeof Packets.printGated === 'function' && typeof Packets.previewAdmin === 'function' &&
    typeof Packets.viewGated === 'function' && typeof Packets.viewFleet === 'function') {
  ok('gated print, view, and admin preview helpers present');
} else {
  fail('missing printGated, viewGated, viewFleet, or previewAdmin');
}

if (typeof Packets._openHtmlWindow === 'function' &&
    /document\.write/.test(String(Packets._openHtmlWindow))) {
  ok('_openHtmlWindow uses document.write (avoids blob tab failures)');
} else {
  fail('_openHtmlWindow should write HTML into blank window');
}

if (typeof Packets._schedulePrint === 'function') {
  ok('_schedulePrint helper present');
} else {
  fail('_schedulePrint helper missing');
}

if (process.exitCode) process.exit(process.exitCode);
console.log('All packet render checks passed.');
