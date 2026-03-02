const express = require('express');
const db = require('../db/database');

const router = express.Router();

// POST /api/contact
router.post('/', (req, res) => {
  const { name, email, subject, message, subscriber_priority } = req.body;

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
