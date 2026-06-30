// Smoke checks: admin@ for bookings, joyce@ for general contact
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const servicesHtml = fs.readFileSync(path.join(root, 'views', 'services.html'), 'utf8');
const contactHtml = fs.readFileSync(path.join(root, 'views', 'contact.html'), 'utf8');
const contactJs = fs.readFileSync(path.join(root, 'routes', 'contact.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(root, 'public', 'index.html'), 'utf8');

let failed = 0;
function ok(label) { console.log('ok', label); }
function fail(label, detail) { console.error('FAIL', label, detail || ''); failed++; }

if (servicesHtml.includes('mailto:admin@mile12warrior.com?subject=EXPO')) ok('services EXPO uses admin@');
else fail('services EXPO should use admin@');

if (servicesHtml.includes('mailto:admin@mile12warrior.com?subject=Driver%20wellness%20coaching')) ok('coaching uses admin@');
else fail('coaching should use admin@');

if (servicesHtml.includes('mailto:admin@mile12warrior.com?subject=Fleet%20safety%20program')) ok('fleet program uses admin@');
else fail('fleet program should use admin@');

if (contactHtml.includes('id="category"') && contactHtml.includes('booking')) ok('contact form category dropdown');
else fail('contact form missing category dropdown');

if (contactHtml.includes('admin@mile12warrior.com') && contactHtml.includes('joyce@mile12warrior.com')) ok('contact page shows both emails');
else fail('contact page should show both emails');

if (contactJs.includes('category') && contactJs.includes('joyce@mile12warrior.com')) ok('contact API routes by category');
else fail('contact API missing category routing');

if (indexHtml.includes('admin@mile12warrior.com') && indexHtml.includes('joyce@mile12warrior.com')) ok('home footer shows both emails');
else fail('home footer should show both emails');

if (failed) process.exit(1);
console.log('All email routing checks passed.');
