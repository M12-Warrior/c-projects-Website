// Smoke checks: paused Stripe checkout + free digital access (run via npm test)
const fs = require('fs');
const path = require('path');
const paymentConfig = require('../lib/paymentConfig');

const root = path.join(__dirname, '..');
const shopJs = fs.readFileSync(path.join(root, 'routes', 'shop.js'), 'utf8');
const stripeJs = fs.readFileSync(path.join(root, 'routes', 'stripe.js'), 'utf8');
const servicesHtml = fs.readFileSync(path.join(root, 'views', 'services.html'), 'utf8');
const shopHtml = fs.readFileSync(path.join(root, 'views', 'shop.html'), 'utf8');
const shopProductHtml = fs.readFileSync(path.join(root, 'views', 'shop-product.html'), 'utf8');
const serverJs = fs.readFileSync(path.join(root, 'server.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(root, 'public', 'index.html'), 'utf8');

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

if (servicesHtml.includes('subject=' + require('../lib/siteEmails').SUBJECT_PARAMS.EXPO)) ok('services booking email CTA');
else fail('services missing admin booking email CTA');

if (servicesHtml.includes('Packets.printGated(\'seasoned-driver\')')) ok('seasoned free download buttons');
else fail('services missing seasoned download buttons');

if (shopHtml.includes('/packets/seasoned-driver')) ok('shop seasoned packet links to packet page');
else fail('shop.html should link seasoned-packet to /packets/seasoned-driver');

if (shopProductHtml.includes("href: '/packets/seasoned-driver'")) ok('shop product seasoned packet page href');
else fail('shop-product.html should link seasoned-packet to packet page');

if (serverJs.includes("app.get('/packets/seasoned-driver'")) ok('server seasoned driver packet route');
else fail('server.js missing /packets/seasoned-driver route');

if (indexHtml.includes('href="/packets/seasoned-driver"')) ok('homepage seasoned view packet link');
else fail('homepage missing seasoned view packet link');

if (shopHtml.includes('freeAccess')) ok('shop.html reads freeAccess flag');
else fail('shop.html missing freeAccess');

if (indexHtml.includes('Tier 2 — FREE') && indexHtml.includes('Fleet — FREE')) ok('homepage packet tiers show FREE');
else fail('homepage packet tiers should show FREE');

if (!indexHtml.includes('Get It — $') && !indexHtml.includes('$149') && !indexHtml.includes('$29') && !indexHtml.includes('$79') && !indexHtml.includes('$129')) ok('homepage packets section has no prices');
else fail('homepage packets section still shows prices');

if (indexHtml.includes("Packets.printGated('seasoned-driver')") && indexHtml.includes("Packets.downloadFleet('fleet-new-hire')")) ok('homepage free download/print CTAs');
else fail('homepage missing free packet CTAs');

if (indexHtml.includes('Packets.loadAccessConfig')) ok('homepage loads free access config');
else fail('homepage missing loadAccessConfig');

if (shopHtml.includes('Wellness Journal')) ok('shop mentions Wellness Journal');
else fail('shop missing Wellness Journal mention');

if (failed) process.exit(1);
console.log('All free-access / paused-checkout checks passed.');
