const express = require('express');
const db = require('../db/database');

const router = express.Router();

// POST /api/contact
router.post('/', (req, res) => {
  const { name, email, subject, message, subscriber_priority, opt_out_address_book } = req.body;

  // Validate required fields
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Name is required' });
  }
  if (!email || typeof email !== 'string' || !email.trim()) {
    return res.status(400).json({ error: 'Email is required' });
  }
  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'Message is required' });
  }

  let finalSubject = subject ? subject.trim() : '';
  if (subscriber_priority) {
    finalSubject = '[Subscriber - Priority] ' + (finalSubject || 'Subscriber feedback');
  }

  try {
    const insert = db.prepare(`
      INSERT INTO contact_messages (name, email, subject, message)
      VALUES (?, ?, ?, ?)
    `);
    insert.run(name.trim(), email.trim(), finalSubject || null, message.trim());

    // Keep a lightweight guest address book for follow-up and involvement tracking.
    const optedOut = opt_out_address_book === true || opt_out_address_book === 1 || opt_out_address_book === '1';
    db.prepare(`
      INSERT INTO address_book (email, name, source, opt_out, updated_at)
      VALUES (?, ?, 'contact', ?, datetime('now'))
      ON CONFLICT(email) DO UPDATE SET
        name = COALESCE(excluded.name, address_book.name),
        source = COALESCE(address_book.source, 'contact'),
        opt_out = CASE WHEN excluded.opt_out = 1 THEN 1 ELSE address_book.opt_out END,
        updated_at = datetime('now')
    `).run(email.trim().toLowerCase(), name.trim(), optedOut ? 1 : 0);

    res.json({
      success: true,
      message: 'Message sent successfully'
    });
  } catch (err) {
    console.error('Contact form error:', err);
    res.status(500).json({
      error: 'Failed to send message. Please try again later.'
    });
  }
});

module.exports = router;
