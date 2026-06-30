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

if (typeof Packets._applyOrgStamp === 'function' && typeof Packets._finalizeFleetHtml === 'function' &&
    typeof Packets.mountFleetYardPanel === 'function' && typeof Packets._applyFleetPrefill === 'function') {
  ok('optional fleet yard stamp helpers present');
  var sampleHtml = Packets._wrap('Fleet test', '<p>Test</p>');
  var stamped = Packets._applyOrgStamp(sampleHtml, {
    company: 'Test Fleet LLC',
    yardIdentifier: 'Terminal 7',
    yardLabel: 'North yard'
  });
  if (stamped.indexOf('Test Fleet LLC') === -1 || stamped.indexOf('Terminal 7') === -1) {
    fail('_applyOrgStamp missing company/yard in output');
  } else {
    ok('_applyOrgStamp embeds company and yard');
  }
  var hireHtml = Packets.fleetNewHire();
  var prefilled = Packets._applyFleetPrefill(hireHtml, 'fleet-new-hire', {
    company: 'Acme Trucking',
    packetDate: 'June 29, 2026',
    chain: {
      safetyDirector: { name: 'Jane Safety', phone: '555-0100' },
      afterHoursHotline: { phone: '555-0199' }
    },
    contacts: { dispatchPhone: '555-0200' }
  });
  if (prefilled.indexOf('Acme Trucking') === -1) fail('prefill missing company');
  else if (prefilled.indexOf('Jane Safety') === -1) fail('prefill missing safety director');
  else if (prefilled.indexOf('555-0199') === -1) fail('prefill missing after-hours hotline');
  else if (prefilled.indexOf('555-0200') === -1) fail('prefill missing dispatch phone');
  else ok('fleet new hire prefill merges chain of command and dispatch');
  var refHtml = Packets.fleetRefresher();
  var refFilled = Packets._applyFleetPrefill(refHtml, 'fleet-refresher', {
    contacts: { dispatchName: 'Dispatch Desk', dispatchPhone: '555-0300' }
  });
  if (refFilled.indexOf('Dispatch Desk') === -1 || refFilled.indexOf('555-0300') === -1) {
    fail('prefill missing refresher emergency contacts');
  } else {
    ok('fleet refresher prefill merges emergency contacts');
  }
  if (hireHtml.indexOf('Safety resources provided by Mile 12 Warrior') === -1) {
    fail('fleet new hire missing fleet footer branding');
  } else if (hireHtml.indexOf('<div class="header"><h1>Mile 12 Warrior</h1>') !== -1) {
    fail('fleet new hire should not include Mile 12 page header');
  } else if (hireHtml.indexOf('fleet-cover-company') === -1) {
    fail('fleet new hire missing company-first cover');
  } else {
    ok('fleet new hire uses company-first cover and fleet footers');
  }
  if (refHtml.indexOf('Safety resources provided by Mile 12 Warrior') === -1) {
    fail('fleet refresher missing fleet footer branding');
  } else {
    ok('fleet refresher uses fleet footers');
  }
  var newDriverHtml = Packets.newDriver();
  if (newDriverHtml.indexOf('<div class="header"><h1>Mile 12 Warrior</h1>') !== -1) {
    ok('individual new driver packet keeps Mile 12 header');
  } else {
    fail('individual packets should keep Mile 12 header');
  }
} else {
  fail('missing optional fleet yard/prefill helpers');
}

const packetPagePath = path.join(root, 'views/packet-page.html');
const packetPageBuf = fs.readFileSync(packetPagePath);
const packetPageNulls = packetPageBuf.filter((b) => b === 0).length;
if (packetPageNulls > 0) {
  fail('packet-page.html has ' + packetPageNulls + ' null bytes (UTF-16). Re-save as UTF-8.');
} else {
  ok('packet-page.html is UTF-8 (no null bytes)');
}

const packetPageHtml = packetPageBuf.toString('utf8');
if (packetPageHtml.indexOf('Packets.viewFleet') === -1 || packetPageHtml.indexOf('id="packetActions"') === -1) {
  fail('packet-page.html missing viewFleet wiring or packetActions mount');
} else {
  ok('packet-page.html wires viewFleet and packetActions');
}

var fleetViewHtml = Packets._buildFleetHtml('fleet-new-hire');
if (!fleetViewHtml || fleetViewHtml.indexOf('49 CFR') === -1) {
  fail('viewFleet source HTML missing 49 CFR orientation content');
} else if (fleetViewHtml.indexOf('id="packetActions"') !== -1 || fleetViewHtml.indexOf('packet-page-actions') !== -1) {
  fail('viewFleet HTML must be generated packet content, not packet-page shell');
} else {
  ok('viewFleet prepares fleet-new-hire packet HTML (not page shell)');
}

if (process.exitCode) process.exit(process.exitCode);
console.log('All packet render checks passed.');
