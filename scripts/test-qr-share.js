'use strict';

const fs = require('fs');
const path = require('path');
const { resolveShareUrl, presetUrl, isBlockedPath, getShareLinks } = require('../lib/qrShare');

function ok(msg) { console.log('OK:', msg); }
function fail(msg) { console.error('FAIL:', msg); process.exitCode = 1; }

const adminHtml = fs.readFileSync(path.join(__dirname, '..', 'views', 'admin.html'), 'utf8');
const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');
const serverJs = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');
const adminJs = fs.readFileSync(path.join(__dirname, '..', 'routes', 'admin.js'), 'utf8');

const mockReq = {
  protocol: 'https',
  get: function (h) { return h === 'host' ? 'mile12warrior.com' : null; },
};

if (isBlockedPath('/admin')) ok('blocks /admin paths');
else fail('/admin should be blocked');

if (isBlockedPath('/login')) ok('blocks /login paths');
else fail('/login should be blocked');

if (!resolveShareUrl('https://mile12warrior.com/admin', mockReq)) ok('rejects admin URL');
else fail('admin URL must be rejected');

if (!resolveShareUrl('https://evil.com/forum/category/general', mockReq)) ok('rejects foreign host');
else fail('foreign host must be rejected');

const loungeUrl = resolveShareUrl('https://mile12warrior.com/forum/category/general', mockReq);
if (loungeUrl === 'https://mile12warrior.com/forum/category/general') ok('accepts Coffee Shop URL');
else fail('Coffee Shop URL should be allowed');

const preset = presetUrl('forum-lounge', mockReq);
if (preset && preset.includes('/forum/category/general')) ok('forum-lounge preset resolves');
else fail('forum-lounge preset missing');

const links = getShareLinks(mockReq);
if (links.length >= 2 && links.some(function (l) { return l.id === 'homepage'; })) ok('share links include homepage');
else fail('share links should include homepage and lounge');

if (/\/api\/qr/.test(serverJs)) ok('server mounts /api/qr');
else fail('server.js should mount /api/qr');

if (/\/share-links/.test(adminJs)) ok('admin share-links route present');
else fail('admin.js missing share-links route');

if (/adminShareGrid/.test(adminHtml) && /loadShareQrs/.test(adminHtml)) ok('admin dashboard share UI present');
else fail('admin.html missing share QR section');

if (/footer-qr-block/.test(indexHtml) && /preset=forum-lounge/.test(indexHtml)) ok('homepage footer QR present');
else fail('index.html missing footer QR block');

var mainJs = fs.readFileSync(path.join(__dirname, '..', 'public', 'js', 'main.js'), 'utf8');
if (/function initFooterQr\(/.test(mainJs) && /preset=forum-lounge/.test(mainJs)) ok('main.js injects footer QR on other pages');
else fail('main.js missing initFooterQr');

if (process.exitCode) process.exit(process.exitCode);
console.log('All QR share checks passed.');
