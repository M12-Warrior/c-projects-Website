// Smoke checks: admin@ for bookings, joyce@ for general contact, approved subject lines
const fs = require('fs');
const path = require('path');
const siteEmails = require('../lib/siteEmails');

const root = path.join(__dirname, '..');
const servicesHtml = fs.readFileSync(path.join(root, 'views', 'services.html'), 'utf8');
const contactHtml = fs.readFileSync(path.join(root, 'views', 'contact.html'), 'utf8');
const contactJs = fs.readFileSync(path.join(root, 'routes', 'contact.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(root, 'public', 'index.html'), 'utf8');

let failed = 0;
function ok(label) { console.log('ok', label); }
function fail(label, detail) { console.error('FAIL', label, detail || ''); failed++; }

const P = siteEmails.SUBJECT_PARAMS;

if (servicesHtml.includes('subject=' + P.EXPO)) ok('services EXPO uses approved subject');
else fail('services EXPO should use approved subject');

if (servicesHtml.includes('subject=' + P.CLASS_PRESENTATION)) ok('services class presentation uses approved subject');
else fail('services class presentation should use approved subject');

if (servicesHtml.includes('subject=' + P.ONE_ON_ONE)) ok('coaching uses approved subject');
else fail('coaching should use approved subject');

if (servicesHtml.includes('subject=' + P.FLEET_CONSULTING)) ok('fleet program uses approved subject');
else fail('fleet program should use approved subject');

if (servicesHtml.includes('subject=' + P.WELLNESS_PARTNER)) ok('wellness partner uses approved subject');
else fail('wellness partner should use approved subject');

if (contactHtml.includes('value="expo"') && contactHtml.includes('value="fleet"')) ok('contact form category dropdown');
else fail('contact form missing expanded category dropdown');

if (contactHtml.includes('subject=' + P.BOOKING_SERVICES) && contactHtml.includes('subject=' + P.GENERAL)) ok('contact page mailto subjects');
else fail('contact page should use approved mailto subjects');

if (contactJs.includes('siteEmails')) ok('contact API uses siteEmails');
else fail('contact API missing siteEmails routing');

if (indexHtml.includes('subject=' + P.BOOKING_SERVICES) && indexHtml.includes('subject=' + P.GENERAL)) ok('home reach-out uses approved subjects');
else fail('home reach-out should use approved subjects');

if (failed) process.exit(1);
console.log('All email routing checks passed.');
