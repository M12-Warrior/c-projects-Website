'use strict';

const fs = require('fs');
const path = require('path');
const { getStorageHealth, collectUploadPathsFromText, uploadsPathExists } = require('../lib/storageHealth');

function ok(msg) { console.log('OK:', msg); }
function fail(msg) { console.error('FAIL:', msg); process.exitCode = 1; }

const tmpDir = path.join(__dirname, '..', 'public', 'uploads', '__storage-health-test__');
fs.mkdirSync(tmpDir, { recursive: true });
const probe = path.join(tmpDir, 'probe.txt');
fs.writeFileSync(probe, 'ok');

const refs = new Set();
collectUploadPathsFromText('Featured <img src="/uploads/sample-123.jpg"> and /uploads/other.png', refs);
if (!refs.has('/uploads/sample-123.jpg') || !refs.has('/uploads/other.png')) {
  fail('collectUploadPathsFromText should extract /uploads paths from HTML');
} else {
  ok('upload path extraction works');
}

if (!uploadsPathExists(tmpDir, '/uploads/probe.txt')) {
  fail('uploadsPathExists should find files in uploads dir');
} else {
  ok('uploadsPathExists resolves upload filenames');
}

const fakeDb = {
  prepare(sql) {
    return {
      all() {
        if (/blog_posts/.test(sql)) {
          return [{ image: '/uploads/gone-before-volume.jpg', content: '<p><img src="/uploads/also-missing.png"></p>' }];
        }
        if (/products/.test(sql)) return [{ image: '/images/logo.png' }];
        if (/cms_page_fields/.test(sql)) return [];
        return [];
      },
    };
  },
};

const health = getStorageHealth(fakeDb);
if (health.severity !== 'info') {
  fail('missing legacy uploads should surface info severity, got ' + health.severity);
} else {
  ok('legacy missing uploads reported as info');
}

const legacyIssue = (health.issues || []).find(function (issue) { return issue.code === 'legacy_missing_uploads'; });
if (!legacyIssue || legacyIssue.count < 2) {
  fail('legacy missing upload count should include featured and inline blog images');
} else {
  ok('legacy missing upload count includes blog references');
}

try { fs.unlinkSync(probe); fs.rmdirSync(tmpDir); } catch (_) {}

if (process.exitCode) process.exit(process.exitCode);
console.log('All storage health checks passed.');
