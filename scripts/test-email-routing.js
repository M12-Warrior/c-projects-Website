// Smoke checks: admin@ for bookings, joyce@ for general contact, Joyce-approved subjects
const fs = require('fs');
const path = require('path');
const siteEmails = require('../lib/siteEmails');

const root = path.join(__dirname, '..');
const servicesHtml = fs.readFileSync(path.join(root, 'views', 'services.html'), 'utf8');
const contactHtml = fs.readFileSync(path.join(root, 'views', 'contact.html'), 'utf8');
const contactJs = fs.readFileSync(path.join(root, 'routes', 'contact.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(root, 'public', 'index.html'), 'utf8');
const aboutHtml = fs.readFileSync(path.join(root, 'views', 'about.html'), 'utf8');

const enc = (s) => encodeURIComponent(s);
const S = siteEmails.SUBJECTS;

let failed = 0;
function ok(label) { console.log('ok', label); }
function fail(label, detail) { console.error('FAIL', label, detail || ''); failed++; }

function expectSubject(html, subject, label) {
  if (html.includes(enc(subject))) ok(label);
  else fail(label, subject);
}

expectSubject(servicesHtml, S.EXPO, 'services EXPO subject');
expectSubject(servicesHtml, S.CLASS_PRESENTATION, 'services class presentation subject');
expectSubject(servicesHtml, S.ONE_ON_ONE, 'services one-on-one subject');
expectSubject(servicesHtml, S.FLEET_CONSULTING, 'services fleet/consulting subject');
expectSubject(servicesHtml, S.WELLNESS_PARTNER, 'services wellness partner subject');
expectSubject(servicesHtml, S.BOOKING_SERVICES, 'services footer booking subject');

if (contactHtml.includes('value="expo"') && contactHtml.includes('value="wellness-partner"')) ok('contact form category options');
else fail('contact form missing expanded category dropdown');

expectSubject(contactHtml, S.BOOKING_SERVICES, 'contact page admin mailto subject');
expectSubject(contactHtml, S.GENERAL, 'contact page joyce mailto subject');

if (contactJs.includes("require('../lib/siteEmails')") && contactJs.includes('isBookingCategory')) ok('contact API routes by category via siteEmails');
else fail('contact API missing siteEmails category routing');

expectSubject(indexHtml, S.BOOKING_SERVICES, 'home reach-out booking subject');
expectSubject(indexHtml, S.GENERAL, 'home reach-out general subject');
expectSubject(indexHtml, S.BOOKING_SERVICES, 'home footer booking subject');

expectSubject(aboutHtml, S.GENERAL, 'about page joyce subject');
expectSubject(aboutHtml, S.BOOKING_SERVICES, 'about page admin subject');

if (failed) process.exit(1);
console.log('All email routing checks passed.');
