const fs = require('fs');
const path = require('path');
const { UPLOADS_DIR, DB_PATH } = require('./paths');

const UPLOAD_PATH_RE = /\/uploads\/[a-zA-Z0-9._-]+/g;

function uploadsPathExists(uploadsDir, uploadPath) {
  const base = path.basename(String(uploadPath || '').split('?')[0]);
  if (!base || base === '.' || base === '..') return true;
  return fs.existsSync(path.join(uploadsDir, base));
}

function collectUploadPathsFromText(text, out) {
  if (!text) return;
  const matches = String(text).match(UPLOAD_PATH_RE);
  if (!matches) return;
  matches.forEach(function (match) {
    out.add(match.split('?')[0]);
  });
}

function countMissingUploadRefs(db, uploadsDir) {
  const refs = new Set();
  try {
    const posts = db.prepare('SELECT image, content FROM blog_posts').all();
    posts.forEach(function (post) {
      collectUploadPathsFromText(post.image, refs);
      collectUploadPathsFromText(post.content, refs);
    });
  } catch (_) {}
  try {
    const products = db.prepare('SELECT image FROM products').all();
    products.forEach(function (product) {
      collectUploadPathsFromText(product.image, refs);
    });
  } catch (_) {}
  try {
    const rows = db.prepare("SELECT value FROM cms_page_fields WHERE value LIKE '%/uploads/%'").all();
    rows.forEach(function (row) {
      collectUploadPathsFromText(row.value, refs);
    });
  } catch (_) {}

  let missing = 0;
  refs.forEach(function (ref) {
    if (!uploadsPathExists(uploadsDir, ref)) missing += 1;
  });
  return missing;
}

function getStorageHealth(db) {
  const isProduction = process.env.NODE_ENV === 'production';
  const uploadsDir = UPLOADS_DIR;
  const issues = [];
  let severity = 'ok';

  if (isProduction && !process.env.UPLOADS_DIR) {
    issues.push({
      code: 'missing_uploads_dir',
      message: 'UPLOADS_DIR is not set. Uploaded images will be lost on every redeploy.',
    });
    severity = 'error';
  }

  if (isProduction && !process.env.DB_PATH) {
    issues.push({
      code: 'missing_db_path',
      message: 'DB_PATH is not set. The database may reset on redeploy.',
    });
    severity = 'error';
  }

  let writable = false;
  try {
    fs.mkdirSync(uploadsDir, { recursive: true });
    fs.accessSync(uploadsDir, fs.constants.W_OK);
    writable = true;
  } catch (_) {
    issues.push({
      code: 'uploads_not_writable',
      message: 'The uploads folder is missing or not writable, so image uploads will fail.',
    });
    severity = 'error';
  }

  if (isProduction && process.env.UPLOADS_DIR) {
    const resolved = path.resolve(process.env.UPLOADS_DIR);
    if (!resolved.startsWith(path.resolve('/data'))) {
      issues.push({
        code: 'uploads_not_on_volume',
        message: 'UPLOADS_DIR should point at the Railway /data volume (for example /data/uploads).',
      });
      if (severity === 'ok') severity = 'warn';
    }
  }

  let legacyMissingCount = 0;
  if (db && writable) {
    legacyMissingCount = countMissingUploadRefs(db, uploadsDir);
    if (legacyMissingCount > 0 && severity === 'ok') {
      severity = 'info';
      issues.push({
        code: 'legacy_missing_uploads',
        count: legacyMissingCount,
        message: legacyMissingCount + ' older image link(s) point to files that are no longer on the server (usually from before persistent storage was enabled). Re-upload those images in the blog or shop editor. New uploads are saved permanently.',
      });
    }
  }

  return {
    ok: severity === 'ok' || severity === 'info',
    severity,
    uploadsDir,
    dbPath: DB_PATH,
    envUploadsDir: process.env.UPLOADS_DIR || null,
    envDbPath: process.env.DB_PATH || null,
    writable,
    legacyMissingCount,
    issues,
  };
}

module.exports = {
  getStorageHealth,
  countMissingUploadRefs,
  collectUploadPathsFromText,
  uploadsPathExists,
};
