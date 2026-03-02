const express = require('express');
const router = express.Router();
const db = require('../db/database');

// Generate slug from title: lowercase, spaces to hyphens, remove non-alphanumeric
function slugify(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

// GET /api/blog/posts — all published posts with author username, ordered by created_at DESC
router.get('/posts', (req, res) => {
  const posts = db.prepare(`
    SELECT p.id, p.title, p.slug, p.content, p.excerpt, p.image, p.published,
           p.created_at, p.updated_at, u.username AS author_username
    FROM blog_posts p
    LEFT JOIN users u ON p.author_id = u.id
    WHERE p.published = 1
    ORDER BY p.created_at DESC
  `).all();
  res.json({ posts });
});

// GET /api/blog/admin/posts — admin only: all posts (published + draft) for admin list
router.get('/admin/posts', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') return res.status(403).json({ error: 'Admin required' });
  const posts = db.prepare(`
    SELECT p.id, p.title, p.slug, p.content, p.excerpt, p.image, p.published,
           p.created_at, p.updated_at, u.username AS author_username
    FROM blog_posts p
    LEFT JOIN users u ON p.author_id = u.id
    ORDER BY p.created_at DESC
  `).all();
  res.json({ posts });
});

// GET /api/blog/admin/posts/:id — admin only: single post by id for editing
router.get('/admin/posts/:id', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') return res.status(403).json({ error: 'Admin required' });
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid post ID' });
  const post = db.prepare(`
    SELECT p.id, p.title, p.slug, p.content, p.excerpt, p.image, p.published,
           p.created_at, p.updated_at, u.username AS author_username
    FROM blog_posts p
    LEFT JOIN users u ON p.author_id = u.id
    WHERE p.id = ?
  `).get(id);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  res.json({ post });
});

// GET /api/blog/posts/:slug — single post by slug with author and comments
router.get('/posts/:slug', (req, res) => {
  const { slug } = req.params;
  const post = db.prepare(`
    SELECT p.id, p.title, p.slug, p.content, p.excerpt, p.image, p.published,
           p.created_at, p.updated_at,
           u.id AS author_id, u.username AS author_username
    FROM blog_posts p
    LEFT JOIN users u ON p.author_id = u.id
    WHERE p.slug = ?
  `).get(slug);

  if (!post) return res.status(404).json({ error: 'Post not found' });

  const comments = db.prepare(`
    SELECT c.id, c.content, c.created_at,
           u.id AS user_id, u.username AS user_username
    FROM blog_comments c
    LEFT JOIN users u ON c.user_id = u.id
    WHERE c.post_id = ?
    ORDER BY c.created_at ASC
  `).all(post.id);

  const { author_id, author_username, ...postData } = post;
  res.json({
    post: {
      ...postData,
      author: author_username ? { id: author_id, username: author_username } : null
    },
    comments: comments.map(c => ({
      id: c.id,
      content: c.content,
      created_at: c.created_at,
      user: c.user_username ? { id: c.user_id, username: c.user_username } : null
    }))
  });
});

// POST /api/blog/posts/:slug/comments — require session, insert comment
router.post('/posts/:slug/comments', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Authentication required' });

  const { slug } = req.params;
  const { content } = req.body || {};

  if (!content || typeof content !== 'string' || !content.trim()) {
    return res.status(400).json({ error: 'Content is required' });
  }

  const post = db.prepare('SELECT id FROM blog_posts WHERE slug = ?').get(slug);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  const insert = db.prepare(`
    INSERT INTO blog_comments (post_id, user_id, content) VALUES (?, ?, ?)
  `);
  const result = insert.run(post.id, req.session.user.id, content.trim());

  const comment = db.prepare(`
    SELECT c.id, c.content, c.created_at,
           u.id AS user_id, u.username AS user_username
    FROM blog_comments c
    LEFT JOIN users u ON c.user_id = u.id
    WHERE c.id = ?
  `).get(result.lastInsertRowid);

  res.json({
    success: true,
    comment: {
      id: comment.id,
      content: comment.content,
      created_at: comment.created_at,
      user: comment.user_username ? { id: comment.user_id, username: comment.user_username } : null
    }
  });
});

// POST /api/blog/posts — admin only
router.post('/posts', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Authentication required' });
  if (req.session.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

  const { title, content, excerpt, image, published } = req.body || {};
  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ error: 'Title is required' });
  }
  if (!content || typeof content !== 'string') {
    return res.status(400).json({ error: 'Content is required' });
  }

  let slug = slugify(title);
  // Ensure unique slug
  const existing = db.prepare('SELECT id FROM blog_posts WHERE slug = ?').get(slug);
  if (existing) {
    let counter = 1;
    while (db.prepare('SELECT id FROM blog_posts WHERE slug = ?').get(`${slug}-${counter}`)) {
      counter++;
    }
    slug = `${slug}-${counter}`;
  }

  const imageVal = (image && typeof image === 'string' && image.trim()) ? image.trim() : null;

  const insert = db.prepare(`
    INSERT INTO blog_posts (title, slug, content, excerpt, image, author_id, published)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const result = insert.run(
    title.trim(),
    slug,
    content,
    excerpt && typeof excerpt === 'string' ? excerpt.trim() : null,
    imageVal,
    req.session.user.id,
    published ? 1 : 0
  );

  const post = db.prepare(`
    SELECT p.id, p.title, p.slug, p.content, p.excerpt, p.image, p.published,
           p.created_at, p.updated_at, u.username AS author_username
    FROM blog_posts p
    LEFT JOIN users u ON p.author_id = u.id
    WHERE p.id = ?
  `).get(result.lastInsertRowid);

  res.json({
    success: true,
    post: {
      ...post,
      author_username: post.author_username
    }
  });
});

// PUT /api/blog/posts/:id — admin only
router.put('/posts/:id', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Authentication required' });
  if (req.session.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid post ID' });

  const existing = db.prepare('SELECT id FROM blog_posts WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Post not found' });

  const { title, content, excerpt, image, published } = req.body || {};
  const updates = [];
  const params = [];

  if (title !== undefined) { updates.push('title = ?'); params.push(title); }
  if (content !== undefined) { updates.push('content = ?'); params.push(content); }
  if (excerpt !== undefined) { updates.push('excerpt = ?'); params.push(excerpt); }
  if (image !== undefined) { updates.push('image = ?'); params.push((image && typeof image === 'string' && image.trim()) ? image.trim() : null); }
  if (published !== undefined) { updates.push('published = ?'); params.push(published ? 1 : 0); }

  if (updates.length > 0) {
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);
    db.prepare(`UPDATE blog_posts SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  }

  res.json({ success: true });
});

// DELETE /api/blog/posts/:id — admin only, also delete comments
router.delete('/posts/:id', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Authentication required' });
  if (req.session.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid post ID' });

  const existing = db.prepare('SELECT id FROM blog_posts WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Post not found' });

  db.prepare('DELETE FROM blog_comments WHERE post_id = ?').run(id);
  db.prepare('DELETE FROM blog_posts WHERE id = ?').run(id);

  res.json({ success: true });
});

module.exports = router;
