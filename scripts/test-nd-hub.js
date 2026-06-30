// New Driver hub smoke checks
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const indexHtml = fs.readFileSync(path.join(root, 'public', 'index.html'), 'utf8');
const hubJs = fs.readFileSync(path.join(root, 'public', 'js', 'new-driver-hub.js'), 'utf8');
const packetPage = fs.readFileSync(path.join(root, 'views', 'packets-new-driver.html'), 'utf8');
const shopProduct = fs.readFileSync(path.join(root, 'views', 'shop-product.html'), 'utf8');
const courseHtml = fs.readFileSync(path.join(root, 'views', 'course.html'), 'utf8');

let failed = 0;
function ok(label) { console.log('ok', label); }
function fail(label, detail) { console.error('FAIL', label, detail || ''); failed++; }

if (indexHtml.includes('data-nd-hub') && indexHtml.includes('tier1NewDriverHub')) ok('homepage nd-hub mount');
else fail('homepage nd-hub mount');

if (indexHtml.includes('new-driver-hub.js')) ok('homepage hub script');
else fail('homepage hub script');

if (hubJs.includes('maybePromptFirstEngage') && hubJs.includes('showFirstLessonBanner')) ok('hub account + first-lesson API');
else fail('hub prompt API');

if (hubJs.includes('[data-nd-hub]')) ok('hub auto-mount data attribute');
else fail('hub auto-mount');

if (packetPage.includes('data-nd-hub')) ok('packet page hub tabs');
else fail('packet page hub tabs');

if (shopProduct.includes('shopNewDriverHub') && shopProduct.includes('NewDriverHub.mount')) ok('shop new-driver dual entry');
else fail('shop new-driver hub');

if (courseHtml.includes('new-driver-hub.js')) ok('course hub script');
else fail('course hub script');

if (courseHtml.includes('maybePromptFirstEngage') && courseHtml.includes('showFirstLessonBanner')) ok('course engagement hooks');
else fail('course engagement hooks');

if (courseHtml.includes("showAccountPrompt('course-complete')")) ok('course completion guest prompt');
else fail('course completion prompt');

if (failed) process.exit(1);
console.log('All new-driver hub checks passed.');
