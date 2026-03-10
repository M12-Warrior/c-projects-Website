const express = require('express');
const db = require('../db/database');

const router = express.Router();

function requireSession(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

// Check if user has course access (purchased course-90day or complete-bundle)
function hasCourseAccess(userId) {
  const row = db.prepare(`
    SELECT 1
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    JOIN products p ON p.id = oi.product_id
    WHERE o.user_id = ? AND o.status != 'cancelled'
      AND p.slug IN ('course-90day', 'complete-bundle')
    LIMIT 1
  `).get(userId);
  return !!row;
}

// Generate next certificate number: M12W-YYYY-NNNNN
function nextCertificateNumber() {
  const year = new Date().getFullYear();
  const prefix = `M12W-${year}-`;
  const row = db.prepare(`
    SELECT certificate_number FROM course_completions
    WHERE certificate_number LIKE ?
    ORDER BY id DESC LIMIT 1
  `).get(prefix + '%');
  let seq = 1;
  if (row && row.certificate_number) {
    const n = row.certificate_number.slice(prefix.length);
    const parsed = parseInt(n, 10);
    if (!isNaN(parsed)) seq = parsed + 1;
  }
  return prefix + String(seq).padStart(5, '0');
}

// POST /api/course/complete — Register completion and (optionally) submit shipping + copy preferences.
// Body: studentName (required), mailingName?, mailingAddress?, mailingCity?, mailingState?, mailingZip?, copyToInsuranceEmail?, copyToSafetyEmail?
// If the user already has a completion, returns existing cert number and does not create a duplicate.
router.post('/complete', requireSession, (req, res) => {
  const userId = req.session.user.id;
  if (!hasCourseAccess(userId)) {
    return res.status(403).json({ error: 'Course access required. Purchase the course or complete bundle first.' });
  }

  const existing = db.prepare('SELECT certificate_number FROM course_completions WHERE user_id = ? ORDER BY id DESC LIMIT 1').get(userId);
  if (existing) {
    return res.json({
      success: true,
      certificateNumber: existing.certificate_number,
      message: 'You already requested your certificate. It will be mailed to the address on file.'
    });
  }

  const {
    studentName,
    mailingName,
    mailingAddress,
    mailingCity,
    mailingState,
    mailingZip,
    copyToInsuranceEmail,
    copyToSafetyEmail
  } = req.body || {};

  if (!studentName || typeof studentName !== 'string' || !studentName.trim()) {
    return res.status(400).json({ error: 'Student name (for certificate) is required.' });
  }

  const certificateNumber = nextCertificateNumber();
  const now = new Date().toISOString();

  const insert = db.prepare(`
    INSERT INTO course_completions (
      user_id, certificate_number, student_name,
      mailing_name, mailing_address, mailing_city, mailing_state, mailing_zip,
      copy_to_insurance_email, copy_to_safety_email, completed_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insert.run(
    userId,
    certificateNumber,
    studentName.trim(),
    mailingName && typeof mailingName === 'string' ? mailingName.trim() || null : null,
    mailingAddress && typeof mailingAddress === 'string' ? mailingAddress.trim() || null : null,
    mailingCity && typeof mailingCity === 'string' ? mailingCity.trim() || null : null,
    mailingState && typeof mailingState === 'string' ? mailingState.trim() || null : null,
    mailingZip && typeof mailingZip === 'string' ? mailingZip.trim() || null : null,
    copyToInsuranceEmail && typeof copyToInsuranceEmail === 'string' ? copyToInsuranceEmail.trim() || null : null,
    copyToSafetyEmail && typeof copyToSafetyEmail === 'string' ? copyToSafetyEmail.trim() || null : null,
    now,
    now
  );

  res.json({
    success: true,
    certificateNumber,
    message: 'Completion recorded. Your certificate will be mailed to the address you provided. If you requested copies to insurance or safety, those will be sent separately.'
  });
});

// POST /api/course/certificate/shipping — Add or update mailing address and copy preferences for the user's latest completion.
router.post('/certificate/shipping', requireSession, (req, res) => {
  const userId = req.session.user.id;
  const {
    mailingName,
    mailingAddress,
    mailingCity,
    mailingState,
    mailingZip,
    copyToInsuranceEmail,
    copyToSafetyEmail
  } = req.body || {};

  const latest = db.prepare(`
    SELECT id FROM course_completions WHERE user_id = ? ORDER BY id DESC LIMIT 1
  `).get(userId);
  if (!latest) {
    return res.status(404).json({ error: 'No course completion found. Complete the course first.' });
  }

  const update = db.prepare(`
    UPDATE course_completions SET
      mailing_name = ?, mailing_address = ?, mailing_city = ?, mailing_state = ?, mailing_zip = ?,
      copy_to_insurance_email = ?, copy_to_safety_email = ?,
      updated_at = ?
    WHERE id = ?
  `);
  update.run(
    mailingName && typeof mailingName === 'string' ? mailingName.trim() : null,
    mailingAddress && typeof mailingAddress === 'string' ? mailingAddress.trim() : null,
    mailingCity && typeof mailingCity === 'string' ? mailingCity.trim() : null,
    mailingState && typeof mailingState === 'string' ? mailingState.trim() : null,
    mailingZip && typeof mailingZip === 'string' ? mailingZip.trim() : null,
    copyToInsuranceEmail && typeof copyToInsuranceEmail === 'string' ? copyToInsuranceEmail.trim() || null : null,
    copyToSafetyEmail && typeof copyToSafetyEmail === 'string' ? copyToSafetyEmail.trim() || null : null,
    new Date().toISOString(),
    latest.id
  );

  res.json({ success: true, message: 'Shipping and copy preferences updated.' });
});

// GET /api/course/certificate/status — Get the current user's latest completion (cert number, mailing status).
router.get('/certificate/status', requireSession, (req, res) => {
  const userId = req.session.user.id;
  const row = db.prepare(`
    SELECT certificate_number, student_name, completed_at,
           mailing_name, mailing_address, mailing_city, mailing_state, mailing_zip,
           copy_to_insurance_email, copy_to_safety_email
    FROM course_completions WHERE user_id = ?
    ORDER BY id DESC LIMIT 1
  `).get(userId);
  if (!row) {
    return res.json({ completed: false });
  }
  res.json({
    completed: true,
    certificateNumber: row.certificate_number,
    studentName: row.student_name,
    completedAt: row.completed_at,
    hasMailingAddress: !!(row.mailing_address && row.mailing_city && row.mailing_state && row.mailing_zip),
    copyToInsuranceEmail: row.copy_to_insurance_email || null,
    copyToSafetyEmail: row.copy_to_safety_email || null
  });
});

module.exports = router;
