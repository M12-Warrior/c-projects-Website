// Smoke checks: paused Stripe checkout + free digital access (run via npm test)
const fs = require('fs');
const path = require('path');
const paymentConfig = require('../lib/paymentConfig');

const root = path.join(__dirname, '..');
const shopJs = fs.readFileSync(path.join(root, 'routes', 'shop.js'), 'utf8');
const stripeJs = fs.readFileSync(path.join(root, 'routes', 'stripe.js'), 'utf8');
const servicesHtml = fs.readFileSync(path.join(root, 'views', 'services.html'), 'utf8');
const shopHtml = fs.readFileSync(path.join(root, 'views', 'shop.html'), 'utf8');

let failed = 0;
function ok(label) { console.log('ok', label); }
function fail(label, detail) { console.error('FAIL', label, detail || ''); failed++; }

if (paymentConfig.isCheckoutPaused()) ok('checkout paused by default');
else fail('checkout should be paused by default');

if (!paymentConfig.isCheckoutEnabled()) ok('checkout disabled while paused');
else fail('checkout should be disabled while paused');

if (paymentConfig.isFreeAccessMode()) ok('free access mode active while checkout paused');
else fail('free access mode should be active');

if (shopJs.includes("require('../lib/paymentConfig')")) ok('shop.js uses paymentConfig');
else fail('shop.js missing paymentConfig');

if (shopJs.includes('isFreeAccessMode()')) ok('shop.js free access grants');
else fail('shop.js missing isFreeAccessMode checks');

if (stripeJs.includes('isCheckoutEnabled()')) ok('stripe.js checkout gate');
else fail('stripe.js missing checkout gate');

if (servicesHtml.includes('EXPO, Info Tents')) ok('services EXPO section');
else fail('services missing EXPO section');

if (servicesHtml.includes('mailto:admin@mile12warrior.com?subject=EXPO')) ok('services booking email CTA');
else fail('services missing admin booking email CTA');

if (servicesHtml.includes('Packets.printGated(\'seasoned-driver\')')) ok('seasoned free download buttons');
else fail('services missing seasoned download buttons');

if (shopHtml.includes('freeAccess')) ok('shop.html reads freeAccess flag');
else fail('shop.html missing freeAccess');

if (failed) process.exit(1);
console.log('All free-access / paused-checkout checks passed.');
