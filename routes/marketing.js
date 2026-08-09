const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const db = require('../db/database');
const { MARKETING_FILES_DIR } = require('../lib/paths');

const router = express.Router();

const marketingFilesDir = MARKETING_FILES_DIR;
if (!fs.existsSync(marketingFilesDir)) {
  fs.mkdirSync(marketingFilesDir, { recursive: true });
}

const ALLOWED_DOC_EXT = new Set([
  '.pdf', '.csv', '.txt', '.md', '.doc', '.docx', '.xls', '.xlsx',
  '.ppt', '.pptx', '.zip', '.png', '.jpg', '.jpeg', '.webp', '.gif'
]);
const MAX_MARKETING_FILE_MB = 25;

const marketingUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, marketingFilesDir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname || '').toLowerCase() || '.bin';
      cb(null, crypto.randomBytes(16).toString('hex') + ext);
    }
  }),
  limits: { fileSize: MAX_MARKETING_FILE_MB * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (!ALLOWED_DOC_EXT.has(ext)) {
      return cb(new Error('File type not allowed. Use PDF, CSV, Office docs, images, TXT, MD, or ZIP.'));
    }
    cb(null, true);
  }
});

const RSM_SHEET_SEED = [
  { file: '568583896.csv', title: 'RSM — Business & Search Opportunity Overview' },
  { file: '487701238.csv', title: 'RSM — The 70 Primary Keywords' },
  { file: '1589834282.csv', title: 'RSM — All 490 Keywords' },
  { file: '52500509.csv', title: 'RSM — AEO / GEO Question Keywords' },
  { file: '438560908.csv', title: 'RSM — Content Gap & White Space Analysis' },
  { file: '1779095545.csv', title: 'RSM — Competitor Landscape' },
  { file: '372685248.csv', title: 'RSM — Execution Roadmap' },
  { file: '164706283.csv', title: 'RSM — Workbook sheet' }
];

function seedRsmSheetFiles() {
  try {
    const count = db.prepare('SELECT COUNT(*) AS c FROM marketing_files').get().c;
    if (count > 0) return;
    const sheetDir = path.join(__dirname, '..', 'scripts', '_rsm-sheet');
    if (!fs.existsSync(sheetDir)) return;
    const insert = db.prepare(`
      INSERT INTO marketing_files (title, original_name, stored_name, mime_type, size_bytes, notes, uploaded_by)
      VALUES (?, ?, ?, ?, ?, ?, NULL)
    `);
    for (const item of RSM_SHEET_SEED) {
      const src = path.join(sheetDir, item.file);
      if (!fs.existsSync(src)) continue;
      const stored = crypto.randomBytes(16).toString('hex') + '.csv';
      const dest = path.join(marketingFilesDir, stored);
      fs.copyFileSync(src, dest);
      const size = fs.statSync(dest).size;
      insert.run(
        item.title,
        item.file,
        stored,
        'text/csv',
        size,
        'Seeded from Relevant Search Media keyword workbook (CSV export).'
      );
    }
  } catch (err) {
    console.error('[marketing] RSM sheet seed failed:', err && err.message ? err.message : err);
  }
}

seedRsmSheetFiles();

function portalUser(req) {
  return req.session && req.session.user ? req.session.user : null;
}

function isPortalRole(role) {
  return role === 'admin' || role === 'marketer';
}

function requirePortal(req, res, next) {
  const user = portalUser(req);
  if (!user || !isPortalRole(user.role)) {
    return res.status(403).json({ error: 'Marketing portal access required' });
  }
  next();
}

function requireAdmin(req, res, next) {
  const user = portalUser(req);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

router.use(requirePortal);

function listPortalPeople() {
  return db.prepare(`
    SELECT id, username, email, role
    FROM users
    WHERE role IN ('admin', 'marketer')
      AND COALESCE(account_disabled, 0) = 0
    ORDER BY
      CASE role WHEN 'admin' THEN 0 ELSE 1 END,
      username ASC
  `).all();
}

// GET /api/marketing/me
router.get('/me', (req, res) => {
  res.json({ user: portalUser(req), people: listPortalPeople() });
});

// GET /api/marketing/engagement
router.get('/engagement', (req, res) => {
  const engagement = db.prepare('SELECT * FROM marketing_engagement WHERE id = 1').get() || null;
  const contacts = db.prepare('SELECT * FROM marketing_contacts ORDER BY sort_order ASC, id ASC').all();
  res.json({ engagement, contacts });
});

// PUT /api/marketing/engagement (admin)
router.put('/engagement', requireAdmin, (req, res) => {
  const {
    company_name,
    package_name,
    term_months,
    investment_total,
    investment_note,
    start_date,
    end_date,
    workflow_summary
  } = req.body || {};
  const existing = db.prepare('SELECT id FROM marketing_engagement WHERE id = 1').get();
  if (!existing) {
    db.prepare(`
      INSERT INTO marketing_engagement (
        id, company_name, package_name, term_months, investment_total, investment_note,
        start_date, end_date, workflow_summary
      ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      String(company_name || 'Relevant Search Media').slice(0, 200),
      String(package_name || 'Standard').slice(0, 100),
      parseInt(term_months, 10) || 12,
      String(investment_total || '').slice(0, 80),
      String(investment_note || '').slice(0, 200),
      start_date ? String(start_date).slice(0, 40) : null,
      end_date ? String(end_date).slice(0, 40) : null,
      String(workflow_summary || '').slice(0, 8000)
    );
  } else {
    db.prepare(`
      UPDATE marketing_engagement SET
        company_name = COALESCE(?, company_name),
        package_name = COALESCE(?, package_name),
        term_months = COALESCE(?, term_months),
        investment_total = COALESCE(?, investment_total),
        investment_note = COALESCE(?, investment_note),
        start_date = ?,
        end_date = ?,
        workflow_summary = COALESCE(?, workflow_summary),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `).run(
      company_name != null ? String(company_name).slice(0, 200) : null,
      package_name != null ? String(package_name).slice(0, 100) : null,
      term_months != null ? (parseInt(term_months, 10) || 12) : null,
      investment_total != null ? String(investment_total).slice(0, 80) : null,
      investment_note != null ? String(investment_note).slice(0, 200) : null,
      start_date != null ? String(start_date).slice(0, 40) : null,
      end_date != null ? String(end_date).slice(0, 40) : null,
      workflow_summary != null ? String(workflow_summary).slice(0, 8000) : null
    );
  }
  res.json({ success: true, engagement: db.prepare('SELECT * FROM marketing_engagement WHERE id = 1').get() });
});

// Contacts
router.get('/contacts', (req, res) => {
  res.json({ contacts: db.prepare('SELECT * FROM marketing_contacts ORDER BY sort_order ASC, id ASC').all() });
});

router.post('/contacts', requireAdmin, (req, res) => {
  const { name, title, email, phone, whatsapp, notes, sort_order } = req.body || {};
  if (!name || !String(name).trim()) return res.status(400).json({ error: 'Name is required' });
  const result = db.prepare(`
    INSERT INTO marketing_contacts (name, title, email, phone, whatsapp, notes, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    String(name).trim().slice(0, 120),
    String(title || '').slice(0, 120),
    String(email || '').slice(0, 200),
    String(phone || '').slice(0, 80),
    String(whatsapp || '').slice(0, 80),
    String(notes || '').slice(0, 2000),
    parseInt(sort_order, 10) || 0
  );
  res.json({ success: true, contact: db.prepare('SELECT * FROM marketing_contacts WHERE id = ?').get(result.lastInsertRowid) });
});

router.put('/contacts/:id', requireAdmin, (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
  const existing = db.prepare('SELECT id FROM marketing_contacts WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const { name, title, email, phone, whatsapp, notes, sort_order } = req.body || {};
  db.prepare(`
    UPDATE marketing_contacts SET
      name = COALESCE(?, name),
      title = COALESCE(?, title),
      email = COALESCE(?, email),
      phone = COALESCE(?, phone),
      whatsapp = COALESCE(?, whatsapp),
      notes = COALESCE(?, notes),
      sort_order = COALESCE(?, sort_order)
    WHERE id = ?
  `).run(
    name != null ? String(name).trim().slice(0, 120) : null,
    title != null ? String(title).slice(0, 120) : null,
    email != null ? String(email).slice(0, 200) : null,
    phone != null ? String(phone).slice(0, 80) : null,
    whatsapp != null ? String(whatsapp).slice(0, 80) : null,
    notes != null ? String(notes).slice(0, 2000) : null,
    sort_order != null ? (parseInt(sort_order, 10) || 0) : null,
    id
  );
  res.json({ success: true, contact: db.prepare('SELECT * FROM marketing_contacts WHERE id = ?').get(id) });
});

router.delete('/contacts/:id', requireAdmin, (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
  db.prepare('DELETE FROM marketing_contacts WHERE id = ?').run(id);
  res.json({ success: true });
});

// Site info (shared important website facts)
router.get('/site-info', (req, res) => {
  const rows = db.prepare(`
    SELECT i.*, u.username AS created_by_name
    FROM marketing_site_info i
    LEFT JOIN users u ON u.id = i.created_by
    ORDER BY i.updated_at DESC, i.id DESC
  `).all();
  res.json({ items: rows });
});

router.post('/site-info', (req, res) => {
  const user = portalUser(req);
  const { title, body } = req.body || {};
  if (!title || !String(title).trim()) return res.status(400).json({ error: 'Title is required' });
  const result = db.prepare(`
    INSERT INTO marketing_site_info (title, body, created_by, updated_by)
    VALUES (?, ?, ?, ?)
  `).run(String(title).trim().slice(0, 200), String(body || '').slice(0, 10000), user.id, user.id);
  res.json({ success: true, item: db.prepare('SELECT * FROM marketing_site_info WHERE id = ?').get(result.lastInsertRowid) });
});

router.put('/site-info/:id', (req, res) => {
  const user = portalUser(req);
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
  const existing = db.prepare('SELECT * FROM marketing_site_info WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const { title, body } = req.body || {};
  db.prepare(`
    UPDATE marketing_site_info SET
      title = COALESCE(?, title),
      body = COALESCE(?, body),
      updated_by = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    title != null ? String(title).trim().slice(0, 200) : null,
    body != null ? String(body).slice(0, 10000) : null,
    user.id,
    id
  );
  res.json({ success: true, item: db.prepare('SELECT * FROM marketing_site_info WHERE id = ?').get(id) });
});

router.delete('/site-info/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
  db.prepare('DELETE FROM marketing_site_info WHERE id = ?').run(id);
  res.json({ success: true });
});

// Notes: shared (everyone in portal) or private (author only; admin can view for oversight)
router.get('/notes', (req, res) => {
  const user = portalUser(req);
  const scope = String(req.query.scope || 'shared').toLowerCase();
  if (scope !== 'shared' && scope !== 'private') {
    return res.status(400).json({ error: 'scope must be shared or private' });
  }
  let rows;
  if (scope === 'shared') {
    rows = db.prepare(`
      SELECT n.*, u.username AS author_name
      FROM marketing_notes n
      JOIN users u ON u.id = n.author_id
      WHERE n.scope = 'shared'
      ORDER BY n.updated_at DESC, n.id DESC
    `).all();
  } else if (user.role === 'admin') {
    rows = db.prepare(`
      SELECT n.*, u.username AS author_name
      FROM marketing_notes n
      JOIN users u ON u.id = n.author_id
      WHERE n.scope = 'private'
      ORDER BY n.updated_at DESC, n.id DESC
    `).all();
  } else {
    rows = db.prepare(`
      SELECT n.*, u.username AS author_name
      FROM marketing_notes n
      JOIN users u ON u.id = n.author_id
      WHERE n.scope = 'private' AND n.author_id = ?
      ORDER BY n.updated_at DESC, n.id DESC
    `).all(user.id);
  }
  res.json({ notes: rows });
});

router.post('/notes', (req, res) => {
  const user = portalUser(req);
  const { scope, title, body } = req.body || {};
  const sc = String(scope || 'shared').toLowerCase();
  if (sc !== 'shared' && sc !== 'private') {
    return res.status(400).json({ error: 'scope must be shared or private' });
  }
  if (!body || !String(body).trim()) return res.status(400).json({ error: 'Note body is required' });
  const result = db.prepare(`
    INSERT INTO marketing_notes (scope, author_id, title, body)
    VALUES (?, ?, ?, ?)
  `).run(sc, user.id, String(title || '').slice(0, 200), String(body).trim().slice(0, 10000));
  res.json({ success: true, note: db.prepare('SELECT * FROM marketing_notes WHERE id = ?').get(result.lastInsertRowid) });
});

router.put('/notes/:id', (req, res) => {
  const user = portalUser(req);
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
  const existing = db.prepare('SELECT * FROM marketing_notes WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  if (user.role !== 'admin' && existing.author_id !== user.id) {
    return res.status(403).json({ error: 'You can only edit your own notes' });
  }
  const { title, body } = req.body || {};
  db.prepare(`
    UPDATE marketing_notes SET
      title = COALESCE(?, title),
      body = COALESCE(?, body),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    title != null ? String(title).slice(0, 200) : null,
    body != null ? String(body).slice(0, 10000) : null,
    id
  );
  res.json({ success: true, note: db.prepare('SELECT * FROM marketing_notes WHERE id = ?').get(id) });
});

router.delete('/notes/:id', (req, res) => {
  const user = portalUser(req);
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
  const existing = db.prepare('SELECT * FROM marketing_notes WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  if (user.role !== 'admin' && existing.author_id !== user.id) {
    return res.status(403).json({ error: 'You can only delete your own notes' });
  }
  db.prepare('DELETE FROM marketing_notes WHERE id = ?').run(id);
  res.json({ success: true });
});

// Progress tracker
router.get('/progress', (req, res) => {
  const rows = db.prepare(`
    SELECT p.*,
      cu.username AS created_by_name,
      uu.username AS updated_by_name
    FROM marketing_progress p
    LEFT JOIN users cu ON cu.id = p.created_by
    LEFT JOIN users uu ON uu.id = p.updated_by
    ORDER BY
      CASE p.status WHEN 'in_progress' THEN 0 WHEN 'planned' THEN 1 ELSE 2 END,
      p.sort_order ASC,
      p.updated_at DESC
  `).all();
  res.json({ items: rows });
});

router.post('/progress', (req, res) => {
  const user = portalUser(req);
  const { title, details, status, month_label, sort_order } = req.body || {};
  if (!title || !String(title).trim()) return res.status(400).json({ error: 'Title is required' });
  const st = String(status || 'planned').toLowerCase();
  if (!['planned', 'in_progress', 'done', 'blocked'].includes(st)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  const result = db.prepare(`
    INSERT INTO marketing_progress (title, details, status, month_label, sort_order, created_by, updated_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    String(title).trim().slice(0, 200),
    String(details || '').slice(0, 8000),
    st,
    String(month_label || '').slice(0, 80),
    parseInt(sort_order, 10) || 0,
    user.id,
    user.id
  );
  res.json({ success: true, item: db.prepare('SELECT * FROM marketing_progress WHERE id = ?').get(result.lastInsertRowid) });
});

router.put('/progress/:id', (req, res) => {
  const user = portalUser(req);
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
  const existing = db.prepare('SELECT * FROM marketing_progress WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const { title, details, status, month_label, sort_order } = req.body || {};
  if (status != null) {
    const st = String(status).toLowerCase();
    if (!['planned', 'in_progress', 'done', 'blocked'].includes(st)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
  }
  db.prepare(`
    UPDATE marketing_progress SET
      title = COALESCE(?, title),
      details = COALESCE(?, details),
      status = COALESCE(?, status),
      month_label = COALESCE(?, month_label),
      sort_order = COALESCE(?, sort_order),
      updated_by = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    title != null ? String(title).trim().slice(0, 200) : null,
    details != null ? String(details).slice(0, 8000) : null,
    status != null ? String(status).toLowerCase() : null,
    month_label != null ? String(month_label).slice(0, 80) : null,
    sort_order != null ? (parseInt(sort_order, 10) || 0) : null,
    user.id,
    id
  );
  res.json({ success: true, item: db.prepare('SELECT * FROM marketing_progress WHERE id = ?').get(id) });
});

router.delete('/progress/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
  db.prepare('DELETE FROM marketing_progress WHERE id = ?').run(id);
  res.json({ success: true });
});

// Direct messages
router.get('/messages', (req, res) => {
  const user = portalUser(req);
  const withId = req.query.with ? parseInt(req.query.with, 10) : null;
  if (withId && !isNaN(withId)) {
    const rows = db.prepare(`
      SELECT m.*,
        fu.username AS from_username,
        tu.username AS to_username
      FROM marketing_messages m
      JOIN users fu ON fu.id = m.from_user_id
      JOIN users tu ON tu.id = m.to_user_id
      WHERE (m.from_user_id = ? AND m.to_user_id = ?)
         OR (m.from_user_id = ? AND m.to_user_id = ?)
      ORDER BY m.created_at ASC, m.id ASC
    `).all(user.id, withId, withId, user.id);
    db.prepare(`
      UPDATE marketing_messages
      SET read_at = CURRENT_TIMESTAMP
      WHERE to_user_id = ? AND from_user_id = ? AND read_at IS NULL
    `).run(user.id, withId);
    return res.json({ messages: rows, withUserId: withId });
  }
  const inbox = db.prepare(`
    SELECT m.*,
      fu.username AS from_username,
      tu.username AS to_username
    FROM marketing_messages m
    JOIN users fu ON fu.id = m.from_user_id
    JOIN users tu ON tu.id = m.to_user_id
    WHERE m.from_user_id = ? OR m.to_user_id = ?
    ORDER BY m.created_at DESC
    LIMIT 200
  `).all(user.id, user.id);
  const unread = db.prepare(`
    SELECT COUNT(*) AS c FROM marketing_messages
    WHERE to_user_id = ? AND read_at IS NULL
  `).get(user.id).c;
  res.json({ messages: inbox, unread });
});

router.post('/messages', (req, res) => {
  const user = portalUser(req);
  const { to_user_id, body } = req.body || {};
  const toId = parseInt(to_user_id, 10);
  if (isNaN(toId)) return res.status(400).json({ error: 'to_user_id is required' });
  if (!body || !String(body).trim()) return res.status(400).json({ error: 'Message body is required' });
  if (toId === user.id) return res.status(400).json({ error: 'Cannot message yourself' });
  const target = db.prepare(`
    SELECT id, role FROM users
    WHERE id = ? AND role IN ('admin', 'marketer') AND COALESCE(account_disabled, 0) = 0
  `).get(toId);
  if (!target) return res.status(404).json({ error: 'Recipient not found in marketing portal' });
  const result = db.prepare(`
    INSERT INTO marketing_messages (from_user_id, to_user_id, body)
    VALUES (?, ?, ?)
  `).run(user.id, toId, String(body).trim().slice(0, 8000));
  res.json({ success: true, message: db.prepare('SELECT * FROM marketing_messages WHERE id = ?').get(result.lastInsertRowid) });
});

// Private calendar (each user owns their events; admin can view all if ?all=1)
router.get('/calendar', (req, res) => {
  const user = portalUser(req);
  const all = req.query.all === '1' && user.role === 'admin';
  const month = String(req.query.month || '').trim(); // YYYY-MM
  let rows;
  if (all) {
    rows = db.prepare(`
      SELECT e.*, u.username AS owner_name
      FROM marketing_calendar_events e
      JOIN users u ON u.id = e.user_id
      ORDER BY e.event_date ASC, e.id ASC
    `).all();
  } else {
    rows = db.prepare(`
      SELECT e.*, u.username AS owner_name
      FROM marketing_calendar_events e
      JOIN users u ON u.id = e.user_id
      WHERE e.user_id = ?
      ORDER BY e.event_date ASC, e.id ASC
    `).all(user.id);
  }
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    rows = rows.filter((e) => String(e.event_date || '').startsWith(month));
  }
  res.json({ events: rows });
});

router.post('/calendar', (req, res) => {
  const user = portalUser(req);
  const { title, details, event_date, end_date, all_day } = req.body || {};
  if (!title || !String(title).trim()) return res.status(400).json({ error: 'Title is required' });
  if (!event_date || !/^\d{4}-\d{2}-\d{2}/.test(String(event_date))) {
    return res.status(400).json({ error: 'event_date must be YYYY-MM-DD' });
  }
  const result = db.prepare(`
    INSERT INTO marketing_calendar_events (user_id, title, details, event_date, end_date, all_day)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    user.id,
    String(title).trim().slice(0, 200),
    String(details || '').slice(0, 4000),
    String(event_date).slice(0, 10),
    end_date ? String(end_date).slice(0, 10) : null,
    all_day === false || all_day === 0 ? 0 : 1
  );
  res.json({ success: true, event: db.prepare('SELECT * FROM marketing_calendar_events WHERE id = ?').get(result.lastInsertRowid) });
});

router.put('/calendar/:id', (req, res) => {
  const user = portalUser(req);
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
  const existing = db.prepare('SELECT * FROM marketing_calendar_events WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  if (user.role !== 'admin' && existing.user_id !== user.id) {
    return res.status(403).json({ error: 'You can only edit your own calendar events' });
  }
  const { title, details, event_date, end_date, all_day } = req.body || {};
  db.prepare(`
    UPDATE marketing_calendar_events SET
      title = COALESCE(?, title),
      details = COALESCE(?, details),
      event_date = COALESCE(?, event_date),
      end_date = ?,
      all_day = COALESCE(?, all_day),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    title != null ? String(title).trim().slice(0, 200) : null,
    details != null ? String(details).slice(0, 4000) : null,
    event_date != null ? String(event_date).slice(0, 10) : null,
    end_date !== undefined ? (end_date ? String(end_date).slice(0, 10) : null) : existing.end_date,
    all_day !== undefined ? (all_day === false || all_day === 0 ? 0 : 1) : null,
    id
  );
  res.json({ success: true, event: db.prepare('SELECT * FROM marketing_calendar_events WHERE id = ?').get(id) });
});

router.delete('/calendar/:id', (req, res) => {
  const user = portalUser(req);
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
  const existing = db.prepare('SELECT * FROM marketing_calendar_events WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  if (user.role !== 'admin' && existing.user_id !== user.id) {
    return res.status(403).json({ error: 'You can only delete your own calendar events' });
  }
  db.prepare('DELETE FROM marketing_calendar_events WHERE id = ?').run(id);
  res.json({ success: true });
});

function fileRow(id) {
  return db.prepare(`
    SELECT f.*, u.username AS uploaded_by_name
    FROM marketing_files f
    LEFT JOIN users u ON u.id = f.uploaded_by
    WHERE f.id = ?
  `).get(id);
}

function formatBytes(n) {
  const num = Number(n) || 0;
  if (num < 1024) return num + ' B';
  if (num < 1024 * 1024) return (num / 1024).toFixed(1) + ' KB';
  return (num / (1024 * 1024)).toFixed(1) + ' MB';
}

// GET /api/marketing/files
router.get('/files', (req, res) => {
  seedRsmSheetFiles();
  const files = db.prepare(`
    SELECT f.id, f.title, f.original_name, f.mime_type, f.size_bytes, f.notes,
           f.uploaded_by, f.created_at, u.username AS uploaded_by_name
    FROM marketing_files f
    LEFT JOIN users u ON u.id = f.uploaded_by
    ORDER BY f.created_at DESC, f.id DESC
  `).all().map((f) => Object.assign({}, f, { size_label: formatBytes(f.size_bytes) }));
  res.json({ files });
});

// POST /api/marketing/files — multipart upload (field: file)
router.post('/files', (req, res) => {
  marketingUpload.single('file')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: `File too large. Max ${MAX_MARKETING_FILE_MB}MB.` });
      }
      return res.status(400).json({ error: err.message || 'Upload failed' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded. Use field name "file".' });
    }
    const user = portalUser(req);
    const title = String((req.body && req.body.title) || req.file.originalname || 'Attachment').trim().slice(0, 200);
    const notes = String((req.body && req.body.notes) || '').trim().slice(0, 2000);
    const result = db.prepare(`
      INSERT INTO marketing_files (title, original_name, stored_name, mime_type, size_bytes, notes, uploaded_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      title || req.file.originalname,
      req.file.originalname || req.file.filename,
      req.file.filename,
      req.file.mimetype || '',
      req.file.size || 0,
      notes,
      user.id
    );
    res.json({ success: true, file: fileRow(result.lastInsertRowid) });
  });
});

// GET /api/marketing/files/:id/download
router.get('/files/:id/download', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
  const row = db.prepare('SELECT * FROM marketing_files WHERE id = ?').get(id);
  if (!row) return res.status(404).json({ error: 'File not found' });
  const full = path.join(marketingFilesDir, row.stored_name);
  if (!fs.existsSync(full)) return res.status(404).json({ error: 'File missing on server' });
  res.download(full, row.original_name || row.stored_name);
});

// DELETE /api/marketing/files/:id — uploader or admin
router.delete('/files/:id', (req, res) => {
  const user = portalUser(req);
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
  const row = db.prepare('SELECT * FROM marketing_files WHERE id = ?').get(id);
  if (!row) return res.status(404).json({ error: 'File not found' });
  if (user.role !== 'admin' && row.uploaded_by !== user.id) {
    return res.status(403).json({ error: 'Only the uploader or an admin can delete this file' });
  }
  const full = path.join(marketingFilesDir, row.stored_name);
  try {
    if (fs.existsSync(full)) fs.unlinkSync(full);
  } catch (_) {}
  db.prepare('DELETE FROM marketing_files WHERE id = ?').run(id);
  res.json({ success: true });
});

// Admin: reset a marketer password
router.post('/reset-password', requireAdmin, (req, res) => {
  const { user_id, password } = req.body || {};
  const id = parseInt(user_id, 10);
  if (isNaN(id) || !password || String(password).length < 8) {
    return res.status(400).json({ error: 'user_id and password (min 8 chars) required' });
  }
  const target = db.prepare("SELECT id, role FROM users WHERE id = ? AND role = 'marketer'").get(id);
  if (!target) return res.status(404).json({ error: 'Marketer account not found' });
  db.prepare('UPDATE users SET password = ? WHERE id = ?').run(bcrypt.hashSync(String(password), 10), id);
  res.json({ success: true });
});

module.exports = router;
