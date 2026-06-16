const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { UPLOADS_DIR } = require('../lib/paths');

const router = express.Router();

function requireAdmin(req, res, next) {
  if (!req.session?.user || req.session.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

const uploadDir = UPLOADS_DIR;
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const safeName = (file.originalname || 'image').replace(/[^a-zA-Z0-9.-]/g, '_');
    const base = path.basename(safeName, path.extname(safeName)) || 'image';
    const ext = (path.extname(safeName) || '.jpg').toLowerCase();
    cb(null, base + '-' + Date.now() + ext);
  }
});

const MAX_UPLOAD_MB = 15;

const upload = multer({
  storage,
  limits: { fileSize: MAX_UPLOAD_MB * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const mime = (file.mimetype || '').toLowerCase();
    const name = (file.originalname || '').toLowerCase();
    // HEIC/HEIF (default iPhone format) can't be displayed by browsers, so give a
    // clear, friendly instruction instead of a confusing generic error.
    if (/^image\/(heic|heif)$/.test(mime) || /\.(heic|heif)$/.test(name)) {
      return cb(new Error('iPhone HEIC photos are not supported by web browsers. On your iPhone, open Settings → Camera → Formats and choose "Most Compatible", or change this photo to JPG/PNG and try again.'));
    }
    const allowed = /^image\/(jpe?g|png|gif|webp)$/i;
    if (allowed.test(mime)) {
      cb(null, true);
    } else {
      cb(new Error('That file type is not supported. Please use a JPG, PNG, GIF, or WebP image.'));
    }
  }
});

// POST /api/upload — admin only, single image
router.post('/', requireAdmin, (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: `That image is too large. Please use an image under ${MAX_UPLOAD_MB}MB (you can shrink a phone photo by emailing it to yourself at a smaller size, or screenshot it).` });
      }
      return res.status(400).json({ error: err.message || 'Upload failed' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded. Use field name "image".' });
    }
    res.json({
      success: true,
      url: '/uploads/' + req.file.filename
    });
  });
});

module.exports = router;
