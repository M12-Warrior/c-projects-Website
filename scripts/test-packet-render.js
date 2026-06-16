// Smoke checks: packet HTML generation and slug aliases (run: node scripts/test-packet-render.js)
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const packetsJs = fs.readFileSync(path.join(root, 'public/js/packets.js'), 'utf8');

let failed = 0;
function ok(label) { console.log('ok', label); }
function fail(label, detail) { console.error('FAIL', label, detail || ''); failed++; }

const ctx = {};
vm.createContext(ctx);
try {
  vm.runInContext(packetsJs, ctx);
} catch (e) {
  fail('packets.js load', e.message);
  process.exit(1);
}

const Packets = ctx.Packets;
if (!Packets || typeof Packets.seasonedDriver !== 'function') {
  fail('seasonedDriver fn');
  process.exit(1);
}

[
  ['new-driver', 'newDriver', 50000],
  ['seasoned-driver', 'seasonedDriver', 30000],
  ['fleet-new-hire', 'fleetNewHire', 40000],
  ['fleet-refresher', 'fleetRefresher', 30000]
].forEach(function (pair) {
  const type = pair[0];
  const fn = pair[1];
  const minLen = pair[2];
  const html = Packets[fn]();
  if (!html || html.length < minLen) fail(type + ' length', String(html && html.length));
  else if (html.indexOf('<body>') === -1) fail(type + ' body tag');
  else if (html.replace(/<[^>]+>/g, '').trim().length < 5000) fail(type + ' sparse text');
  else ok(type + ' renders');
});

if (Packets._normalizeType('seasoned-packet') !== 'seasoned-driver') fail('slug alias');
else ok('seasoned-packet alias');

const built = Packets._buildHtml('seasoned-packet');
if (!built || built.length < 30000) fail('_buildHtml slug');
else ok('_buildHtml slug');

if (typeof Packets.printGated !== 'function') fail('printGated');
else ok('printGated');

if (typeof Packets.previewAdmin !== 'function') fail('previewAdmin');
else ok('previewAdmin');

if (failed) process.exit(1);
console.log('All packet render checks passed.');
