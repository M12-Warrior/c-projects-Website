'use strict';

const express = require('express');
const crypto = require('crypto');
const episodes = require('../lib/episodes');

const router = express.Router();

router.post('/watch', (req, res) => {
  try {
    const result = episodes.recordWatch(req, req.body || {}, crypto);
    if (result.error) return res.status(result.status || 400).json({ error: result.error });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Could not record this view.' });
  }
});

module.exports = router;
