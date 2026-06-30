const express = require('express');
const db = require('../db/database');
const { userHasCourseAccess } = require('../lib/courseAccess');
const courseProgress = require('../lib/courseProgress');
const siteEmails = require('../lib/siteEmails');

const router = express.Router();

function requireSession(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

function getUserRow(userId) {
  return db.prepare(`
    SELECT id, username, email, cb_handle FROM users WHERE id = ?
  `).get(userId);
}

function parseProgressBody(body) {
  if (!body || typeof body !== 'object') return null;
  const raw = body.progress != null ? body.progress : body;
  if (!raw || typeof raw !== 'object') return null;
  return courseProgress.normalizeProgress(raw);
}

function saveUserProgress(userId, progress) {
  const normalized = courseProgress.normalizeProgress(progress);
  normalized.updatedAt = new Date().toISOString();
  const json = JSON.stringify(normalized);
  const now = normalized.updatedAt;
  db.prepare(`
    INSERT INTO course_progress (user_id, progress_json, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      progress_json = excluded.progress_json,
      updated_at = excluded.updated_at
  `).run(userId, json, now);
  return normalized;
}

function loadUserProgress(userId) {
  const row = db.prepare('SELECT progress_json, updated_at FROM course_progress WHERE user_id = ?').get(userId);
  if (!row || !row.progress_json) return null;
  try {
    const parsed = courseProgress.normalizeProgress(JSON.parse(row.progress_json));
    parsed.updatedAt = row.updated_at;
    return parsed;
  } catch (_) {
    return null;
  }
}

function upsertDriversWall(userId, progress) {
  if (!courseProgress.qualifiesForDriversWall(progress)) return null;
  const user = getUserRow(userId);
  if (!user) return null;
  const cbHandle = courseProgress.displayCbHandle(user);
  const now = new Date().toISOString();
  const existing = db.prepare('SELECT id, status FROM drivers_wall WHERE user_id = ?').get(userId);
  if (existing) {
    if (existing.status === 'removed') return null;
    db.prepare(`
      UPDATE drivers_wall SET cb_handle = ?, completed_at = ?, perfect_score = 1, status = 'active'
      WHERE user_id = ?
    `).run(cbHandle, now, userId);
    return db.prepare('SELECT * FROM drivers_wall WHERE user_id = ?').get(userId);
  }
  db.prepare(`
    INSERT INTO drivers_wall (user_id, cb_handle, completed_at, perfect_score, status)
    VALUES (?, ?, ?, 1, 'active')
  `).run(userId, cbHandle, now);
  return db.prepare('SELECT * FROM drivers_wall WHERE user_id = ?').get(userId);
}

function progressStats(progress) {
  return {
    completedModules: courseProgress.countCompletedModules(progress),
    quizRetries: courseProgress.totalQuizRetries(progress),
    moduleRedos: courseProgress.totalModuleRedos(progress),
    perfectScore: courseProgress.isPerfectScore(progress),
    qualifiesForDriversWall: courseProgress.qualifiesForDriversWall(progress)
  };
}

function saveProgressHandler(req, res) {
  const userId = req.session.user.id;
  const parsed = parseProgressBody(req.body);
  if (!parsed) {
    return res.status(400).json({ error: 'Invalid progress payload' });
  }
  const saved = saveUserProgress(userId, parsed);
  let wallEntry = null;
  if (courseProgress.qualifiesForDriversWall(saved)) {
    wallEntry = upsertDriversWall(userId, saved);
  }
  res.json({
    success: true,
    progress: saved,
    stats: progressStats(saved),
    driversWall: wallEntry ? { id: wallEntry.id, cbHandle: wallEntry.cb_handle } : null
  });
}

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

router.get('/progress', requireSession, (req, res) => {
  const progress = loadUserProgress(req.session.user.id);
  res.json({ progress: progress || null });
});

router.put('/progress', requireSession, saveProgressHandler);
router.post('/progress', requireSession, saveProgressHandler);

router.get('/wall', (req, res) => {
  const rows = db.prepare(`
    SELECT dw.id, dw.cb_handle, dw.completed_at, u.username
    FROM drivers_wall dw
    JOIN users u ON u.id = dw.user_id
    WHERE dw.status = 'active'
    ORDER BY dw.completed_at ASC, dw.id ASC
  `).all();
  res.json({
    drivers: rows.map((row) => ({
      id: row.id,
      cbHandle: row.cb_handle || row.username,
      completedAt: row.completed_at
    }))
  });
});

router.get('/wall/status', requireSession, (req, res) => {
  const userId = req.session.user.id;
  const progress = loadUserProgress(userId);
  const wallRow = db.prepare(`
    SELECT id, cb_handle, completed_at, status FROM drivers_wall WHERE user_id = ?
  `).get(userId);
  res.json({
    progressSaved: !!progress,
    courseComplete: progress ? courseProgress.isCourseComplete(progress) : false,
    perfectScore: progress ? courseProgress.isPerfectScore(progress) : false,
    hasRedos: progress ? courseProgress.hasAnyRedos(progress) : false,
    qualifiesForDriversWall: progress ? courseProgress.qualifiesForDriversWall(progress) : false,
    onWall: !!(wallRow && wallRow.status === 'active'),
    wallEntry: wallRow && wallRow.status === 'active'
      ? { id: wallRow.id, cbHandle: wallRow.cb_handle, completedAt: wallRow.completed_at }
      : null
  });
});

router.post('/certificate/request', requireSession, (req, res) => {
  const userId = req.session.user.id;
  if (!userHasCourseAccess(userId, req.session.user.role)) {
    return res.status(403).json({ error: 'Course access required.' });
  }

  const progress = loadUserProgress(userId);
  const bodyProgress = parseProgressBody(req.body);
  const effectiveProgress = bodyProgress || progress;
  if (!effectiveProgress || !courseProgress.isCourseComplete(effectiveProgress)) {
    return res.status(400).json({ error: 'Complete all 10 modules before requesting a certificate.' });
  }
  if (bodyProgress) saveUserProgress(userId, bodyProgress);
  else if (progress) saveUserProgress(userId, progress);

  const user = getUserRow(userId);
  const {
    studentName,
    cbHandle,
    message,
    mailingName,
    mailingAddress,
    mailingCity,
    mailingState,
    mailingZip,
    copyToInsuranceEmail,
    copyToSafetyEmail
  } = req.body || {};

  const name = (studentName && String(studentName).trim())
    || (user && user.username)
    || 'Course graduate';
  const cbHandle = courseProgress.displayCbHandle(user);

  const existing = db.prepare('SELECT certificate_number FROM course_completions WHERE user_id = ? ORDER BY id DESC LIMIT 1').get(userId);
  let certificateNumber = existing ? existing.certificate_number : null;

  if (!existing) {
    certificateNumber = nextCertificateNumber();
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO course_completions (
        user_id, certificate_number, student_name,
        mailing_name, mailing_address, mailing_city, mailing_state, mailing_zip,
        copy_to_insurance_email, copy_to_safety_email, completed_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      certificateNumber,
      name,
      mailingName && String(mailingName).trim() || null,
      mailingAddress && String(mailingAddress).trim() || null,
      mailingCity && String(mailingCity).trim() || null,
      mailingState && String(mailingState).trim() || null,
      mailingZip && String(mailingZip).trim() || null,
      copyToInsuranceEmail && String(copyToInsuranceEmail).trim() || null,
      copyToSafetyEmail && String(copyToSafetyEmail).trim() || null,
      now,
      now
    );
  }

  const msgCategory = siteEmails.normalizeCategory('certificate');
  const categoryTag = siteEmails.categoryTag(msgCategory);
  const subject = categoryTag + ' Certificate request — ' + name;
  const messageLines = [
    'Certificate request from course completion.',
    '',
    'Student name: ' + name,
    'CB handle: ' + cbHandle,
    'Account email: ' + (user && user.email ? user.email : '(unknown)'),
    'Certificate #: ' + certificateNumber,
    '',
    'Mailing address provided: ' + (mailingAddress && mailingCity ? 'Yes' : 'No — follow up for shipping address'),
  ];
  if (mailingAddress) {
    messageLines.push(
      '',
      'Mailing name: ' + (mailingName || name),
      'Address: ' + mailingAddress,
      'City/State/ZIP: ' + [mailingCity, mailingState, mailingZip].filter(Boolean).join(', ')
    );
  }
  if (copyToInsuranceEmail) messageLines.push('Insurance copy email: ' + copyToInsuranceEmail);
  if (copyToSafetyEmail) messageLines.push('Safety copy email: ' + copyToSafetyEmail);
  if (message) messageLines.push('Notes: ' + message);
  if (cbHandle) messageLines.push('CB handle (form): ' + cbHandle);

  db.prepare(`
    INSERT INTO contact_messages (name, email, subject, message, category)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    name,
    user && user.email ? user.email : 'noreply@mile12warrior.com',
    subject,
    messageLines.join('\n'),
    msgCategory
  );

  if (courseProgress.qualifiesForDriversWall(effectiveProgress)) {
    upsertDriversWall(userId, effectiveProgress);
  }

  res.json({
    success: true,
    certificateNumber,
    message: 'Certificate request received. Joyce will follow up about mailing your numbered certificate.'
  });
});

router.post('/complete', requireSession, (req, res) => {
  const userId = req.session.user.id;
  if (!userHasCourseAccess(userId, req.session.user.role)) {
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

  db.prepare(`
    INSERT INTO course_completions (
      user_id, certificate_number, student_name,
      mailing_name, mailing_address, mailing_city, mailing_state, mailing_zip,
      copy_to_insurance_email, copy_to_safety_email, completed_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
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

  db.prepare(`
    UPDATE course_completions SET
      mailing_name = ?, mailing_address = ?, mailing_city = ?, mailing_state = ?, mailing_zip = ?,
      copy_to_insurance_email = ?, copy_to_safety_email = ?,
      updated_at = ?
    WHERE id = ?
  `).run(
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
