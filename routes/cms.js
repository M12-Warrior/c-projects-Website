const express = require('express');
const db = require('../db/database');

const router = express.Router();

/** Public read for page overrides (services, etc.) */
router.get('/pages/:key', (req, res) => {
  const key = String(req.params.key || '').replace(/[^a-z0-9-]/gi, '');
  if (!key) return res.status(400).json({ error: 'Invalid page key' });
  try {
    const row = db.prepare('SELECT content_json FROM cms_page_content WHERE page_key = ?').get(key);
    const fields = row && row.content_json ? JSON.parse(row.content_json) : {};
    if (!fields || typeof fields !== 'object') return res.json({ key, fields: {} });
    return res.json({ key, fields });
  } catch (e) {
    return res.status(500).json({ error: 'Could not load page content' });
  }
});

module.exports = router;
