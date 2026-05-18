const express = require('express');
const rateLimit = require('express-rate-limit');
const db = require('../db/database');

const router = express.Router();

const thankYouLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many submissions. Please try again in a minute.' }
});

router.post('/', thankYouLimiter, (req, res) => {
  const name =
    req.body && typeof req.body.name === 'string' && req.body.name.trim()
      ? req.body.name.trim().slice(0, 120)
      : null;
  const emailRaw =
    req.body && typeof req.body.email === 'string' && req.body.email.trim()
      ? req.body.email.trim().slice(0, 254)
      : null;

  if (emailRaw && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  try {
    db.prepare('INSERT INTO thank_you_submissions (name, email) VALUES (?, ?)').run(
      name,
      emailRaw ? emailRaw.toLowerCase() : null
    );
    res.json({
      success: true,
      message: 'Thank you! Your note means a lot to us on the road.'
    });
  } catch (err) {
    console.error('[thank-you]', err);
    res.status(500).json({ error: 'Unable to save your thank-you. Please try again.' });
  }
});

module.exports = router;