'use strict';

const fs = require('fs');
const path = require('path');

const adminHtml = fs.readFileSync(path.join(__dirname, '..', 'views', 'admin.html'), 'utf8');

function ok(msg) { console.log('OK:', msg); }
function fail(msg) { console.error('FAIL:', msg); process.exitCode = 1; }

// activateAdminTab calls window['load' + Capitalized(data-tab)] when a tab is opened.
const tabIds = [];
const tabRe = /data-tab="([^"]+)"/g;
let tabMatch;
while ((tabMatch = tabRe.exec(adminHtml)) !== null) {
  tabIds.push(tabMatch[1]);
}
const uniqueTabs = tabIds.filter(function (t, i, a) { return a.indexOf(t) === i; });

const staticTabs = { compliance: true };

uniqueTabs.forEach(function (tab) {
  if (staticTabs[tab]) return;
  const loaderName = 'load' + tab.charAt(0).toUpperCase() + tab.slice(1);
  const fnDef = new RegExp('(?:async\\s+)?function\\s+' + loaderName + '\\s*\\(');
  const windowAssign = new RegExp('window\\.' + loaderName + '\\s*=\\s*' + loaderName);
  if (!fnDef.test(adminHtml)) {
    fail('tab "' + tab + '" has no ' + loaderName + '() function');
    return;
  }
  if (!windowAssign.test(adminHtml)) {
    fail('tab "' + tab + '" missing window.' + loaderName + ' registration');
    return;
  }
  ok('tab "' + tab + '" exports ' + loaderName);
});

if (process.exitCode) process.exit(process.exitCode);
console.log('All admin tab loader checks passed.');
