'use strict';

const express = require('express');
const db = require('../db/database');
const { mapPartnerRow } = require('../lib/wellnessPartners');

const router = express.Router();

function normalizeSlug(raw) {
  return String(raw || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
}

router.get('/partners', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT *
      FROM wellness_partners
      WHERE active = 1
      ORDER BY sort_order ASC, id ASC
    `).all();
    return res.json({ partners: rows.map(mapPartnerRow).filter(Boolean) });
  } catch (e) {
    return res.status(500).json({ error: 'Could not load wellness partners' });
  }
});

router.get('/partners/:slug', (req, res) => {
  const slug = normalizeSlug(req.params.slug);
  if (!slug) return res.status(400).json({ error: 'Invalid partner slug' });
  try {
    const row = db.prepare(`
      SELECT *
      FROM wellness_partners
      WHERE slug = ? AND active = 1
    `).get(slug);
    if (!row) return res.status(404).json({ error: 'Partner not found' });
    return res.json({ partner: mapPartnerRow(row) });
  } catch (e) {
    return res.status(500).json({ error: 'Could not load wellness partner' });
  }
});

module.exports = router;