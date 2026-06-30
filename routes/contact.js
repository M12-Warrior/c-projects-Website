const express = require('express');
const db = require('../db/database');

const router = express.Router();

const BOOKING_EMAIL = 'admin@mile12warrior.com';
const GENERAL_EMAIL = 'joyce@mile12warrior.com';

function normalizeCategory(raw) {
  const v = (raw == null ? '' : String(raw)).trim().toLowerCase();
  return v === 'booking' || v === 'services' || v === 'booking/services' ? 'booking' : 'general';
}

// POST /api/contact
router.post('/', (req, res) => {
  const { name, email, subject, message, subscriber_priority, opt_out_address_book, category } = req.body;

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

  const msgCategory = normalizeCategory(category);
  let finalSubject = subject ? subject.trim() : '';
  if (subscriber_priority) {
    finalSubject = '[Subscriber - Priority] ' + (finalSubject || 'Subscriber feedback');
  }
  const categoryTag = msgCategory === 'booking' ? '[Booking/Services]' : '[General]';
  finalSubject = categoryTag + ' ' + (finalSubject || (msgCategory === 'booking' ? 'Booking inquiry' : 'General inquiry'));

  try {
    const insert = db.prepare(`
      INSERT INTO contact_messages (name, email, subject, message, category)
      VALUES (?, ?, ?, ?, ?)
    `);
    insert.run(name.trim(), email.trim(), finalSubject || null, message.trim(), msgCategory);

    const notifyTo = msgCategory === 'booking'
      ? (process.env.BOOKING_EMAIL || process.env.ADMIN_EMAIL || BOOKING_EMAIL).trim()
      : (process.env.GENERAL_EMAIL || GENERAL_EMAIL).trim();
    try {
      const host = process.env.SMTP_HOST;
      const user = process.env.SMTP_USER;
      const pass = process.env.SMTP_PASS;
      if (host && user && pass) {
        const nodemailer = require('nodemailer');
        const port = parseInt(process.env.SMTP_PORT, 10) || 587;
        const from = process.env.FROM_EMAIL || process.env.SMTP_USER || 'noreply@mile12warrior.com';
        const transport = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
        const subj = finalSubject || '(no subject)';
        transport.sendMail(
          {
            from,
            to: notifyTo,
            replyTo: email.trim(),
            subject: `[Contact] ${subj}`,
            text: `Category: ${msgCategory === 'booking' ? 'Booking / services' : 'General'}\nFrom: ${name.trim()} <${email.trim()}>\n\n${message.trim()}`,
          },
          function (err) {
            if (err) console.error('[contact email]', err);
          }
        );
      }
    } catch (e) {
      console.error('[contact email]', e && e.message);
    }

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
