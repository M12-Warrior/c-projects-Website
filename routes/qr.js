'use strict';

const express = require('express');
const qrcode = require('qrcode');
const { resolveShareUrl, presetUrl } = require('../lib/qrShare');

const router = express.Router();

function parseSize(value, fallback) {
  const n = parseInt(value, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(512, Math.max(64, n));
}

router.get('/', async function (req, res) {
  const preset = typeof req.query.preset === 'string' ? req.query.preset.trim() : '';
  const rawUrl = typeof req.query.url === 'string' ? req.query.url.trim() : '';
  let targetUrl = null;

  if (preset) {
    targetUrl = presetUrl(preset, req);
  } else if (rawUrl) {
    targetUrl = resolveShareUrl(rawUrl, req);
  }

  if (!targetUrl) {
    return res.status(400).json({ error: 'Invalid or disallowed QR target.' });
  }

  const size = parseSize(req.query.size, preset ? 240 : 200);
  const format = String(req.query.format || 'png').toLowerCase();
  const margin = 2;

  try {
    if (format === 'svg') {
      const svg = await qrcode.toString(targetUrl, {
        type: 'svg',
        margin,
        width: size,
        color: { dark: '#0a0e17', light: '#ffffff' },
      });
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.send(svg);
    }

    const png = await qrcode.toBuffer(targetUrl, {
      type: 'png',
      margin,
      width: size,
      color: { dark: '#0a0e17ff', light: '#ffffffff' },
    });
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.send(png);
  } catch (_) {
    return res.status(500).json({ error: 'Could not generate QR code.' });
  }
});

module.exports = router;
