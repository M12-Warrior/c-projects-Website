const express = require('express');
const db = require('../db/database');
const profanityFilter = require('../lib/profanityFilter');
const {
  PREDEFINED,
  labelDisplay,
  normalizeLabels,
  parseLabelsJson
} = require('../lib/recipeLabels');

const router = express.Router();

function requireSession(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

function isAdminSession(req) {
  return !!(req.session && req.session.user && req.session.user.role === 'admin');
}

function userForumBanned(userId) {
  if (!userId) return false;
  const row = db.prepare('SELECT forum_banned FROM users WHERE id = ?').get(userId);
  return !!(row && row.forum_banned);
}

function maskText(req, text) {
  if (isAdminSession(req)) return text;
  return profanityFilter.maskProfanity(text);
}

function slugFromTitle(title) {
  const base = String(title)
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
  return `${base || 'recipe'}-${Date.now()}`;
}

function trimField(raw, maxLen) {
  return String(raw || '').trim().slice(0, maxLen);
}

function recipeRowToJson(req, row) {
  const labels = parseLabelsJson(row.labels);
  return {
    id: row.id,
    user_id: row.user_id,
    username: row.username || 'Anonymous',
    title: row.title,
    slug: row.slug,
    summary: maskText(req, row.summary || ''),
    ingredients: maskText(req, row.ingredients || ''),
    instructions: maskText(req, row.instructions || ''),
    author_notes: maskText(req, row.author_notes || ''),
    labels,
    label_names: labels.map(labelDisplay),
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

function selectRecipeSql(extraWhere = '') {
  return `
    SELECT r.*, u.username
    FROM family_circle_recipes r
    LEFT JOIN users u ON u.id = r.user_id
    ${extraWhere}
  `;
}

// GET /api/family-circle/recipes/labels — predefined + labels in use
router.get('/labels', (req, res) => {
  const rows = db.prepare('SELECT labels FROM family_circle_recipes').all();
  const inUse = new Set();
  rows.forEach((row) => {
    parseLabelsJson(row.labels).forEach((l) => inUse.add(l));
  });
  const predefined = Object.entries(PREDEFINED).map(([slug, name]) => ({
    slug,
    name,
    in_use: inUse.has(slug)
  }));
  const custom = [...inUse]
    .filter((slug) => !PREDEFINED[slug])
    .sort()
    .map((slug) => ({ slug, name: labelDisplay(slug), in_use: true }));
  res.json({ predefined, custom, all: [...predefined, ...custom] });
});

// GET /api/family-circle/recipes — list (?label=slug)
router.get('/', (req, res) => {
  const label = trimField(req.query.label, 40).toLowerCase();
  let rows = db.prepare(`
    ${selectRecipeSql()}
    ORDER BY r.updated_at DESC, r.id DESC
  `).all();

  if (label) {
    rows = rows.filter((row) => parseLabelsJson(row.labels).includes(label));
  }

  res.json({
    recipes: rows.map((row) => recipeRowToJson(req, row))
  });
});

// GET /api/family-circle/recipes/:slug
router.get('/:slug', (req, res) => {
  const slug = trimField(req.params.slug, 120);
  const row = db.prepare(`${selectRecipeSql('WHERE r.slug = ?')}`).get(slug);
  if (!row) return res.status(404).json({ error: 'Recipe not found.' });
  res.json({ recipe: recipeRowToJson(req, row) });
});

// POST /api/family-circle/recipes
router.post('/', requireSession, (req, res) => {
  const userId = req.session.user.id;
  if (userForumBanned(userId)) {
    return res.status(403).json({ error: 'Your account cannot post in the community.' });
  }

  const title = trimField(req.body.title, 200);
  const summary = trimField(req.body.summary, 2000);
  const ingredients = trimField(req.body.ingredients, 8000);
  const instructions = trimField(req.body.instructions, 8000);
  const authorNotes = trimField(req.body.author_notes, 4000);
  const labels = normalizeLabels(req.body.labels);

  if (!title) return res.status(400).json({ error: 'Title is required.' });
  if (!ingredients && !instructions) {
    return res.status(400).json({ error: 'Add ingredients or instructions so others can use your recipe.' });
  }

  const slug = slugFromTitle(title);
  const result = db.prepare(`
    INSERT INTO family_circle_recipes (user_id, title, slug, summary, ingredients, instructions, author_notes, labels)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(userId, title, slug, summary, ingredients, instructions, authorNotes, JSON.stringify(labels));

  const row = db.prepare(`${selectRecipeSql('WHERE r.id = ?')}`).get(result.lastInsertRowid);
  res.status(201).json({ recipe: recipeRowToJson(req, row) });
});

// PUT /api/family-circle/recipes/:id — author or admin
router.put('/:id', requireSession, (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!id) return res.status(400).json({ error: 'Invalid recipe id.' });

  const existing = db.prepare('SELECT * FROM family_circle_recipes WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Recipe not found.' });

  const userId = req.session.user.id;
  const isAdmin = isAdminSession(req);
  if (existing.user_id !== userId && !isAdmin) {
    return res.status(403).json({ error: 'You can only edit recipes you shared.' });
  }
  if (userForumBanned(userId) && !isAdmin) {
    return res.status(403).json({ error: 'Your account cannot post in the community.' });
  }

  const title = trimField(req.body.title, 200) || existing.title;
  const summary = req.body.summary != null ? trimField(req.body.summary, 2000) : existing.summary;
  const ingredients = req.body.ingredients != null ? trimField(req.body.ingredients, 8000) : existing.ingredients;
  const instructions = req.body.instructions != null ? trimField(req.body.instructions, 8000) : existing.instructions;
  const authorNotes = req.body.author_notes != null ? trimField(req.body.author_notes, 4000) : existing.author_notes;
  const labels = req.body.labels != null ? normalizeLabels(req.body.labels) : parseLabelsJson(existing.labels);

  if (!ingredients && !instructions) {
    return res.status(400).json({ error: 'Add ingredients or instructions so others can use your recipe.' });
  }

  db.prepare(`
    UPDATE family_circle_recipes
    SET title = ?, summary = ?, ingredients = ?, instructions = ?, author_notes = ?, labels = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(title, summary, ingredients, instructions, authorNotes, JSON.stringify(labels), id);

  const row = db.prepare(`${selectRecipeSql('WHERE r.id = ?')}`).get(id);
  res.json({ recipe: recipeRowToJson(req, row) });
});

// DELETE /api/family-circle/recipes/:id — author or admin
router.delete('/:id', requireSession, (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!id) return res.status(400).json({ error: 'Invalid recipe id.' });

  const existing = db.prepare('SELECT user_id FROM family_circle_recipes WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Recipe not found.' });

  const userId = req.session.user.id;
  if (existing.user_id !== userId && !isAdminSession(req)) {
    return res.status(403).json({ error: 'You can only delete recipes you shared.' });
  }

  db.prepare('DELETE FROM family_circle_recipes WHERE id = ?').run(id);
  res.json({ success: true });
});

module.exports = router;
