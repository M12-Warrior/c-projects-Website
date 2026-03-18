const express = require('express');
const router = express.Router();
const db = require('../db/database');

const ADMIN_EMAIL = 'admin@mile12warrior.com';

function ensureHttpsImage(url) {
  if (!url || typeof url !== 'string') return url;
  return url.trim().replace(/^http:\/\//i, 'https://');
}

// Strip links from content site-wide: remove <a> tags (keep text), replace URLs in plain text with [link removed]
function stripLinks(text) {
  if (!text || typeof text !== 'string') return text;
  let out = text
    .replace(/<a\s[^>]*href\s*=\s*["'][^"']*["'][^>]*>([\s\S]*?)<\/a>/gi, '$1')
    .replace(/<a\s[^>]*>([\s\S]*?)<\/a>/gi, '$1');
  out = out.replace(/https?:\/\/[^\s<>"']+/gi, '[link removed]');
  return out;
}

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
  const out = posts.map(p => ({ ...p, image: ensureHttpsImage(p.image) }));
  res.json({ posts: out });
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
  const out = posts.map(p => ({ ...p, image: ensureHttpsImage(p.image) }));
  res.json({ posts: out });
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
  res.json({ post: { ...post, image: ensureHttpsImage(post.image) } });
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
    WHERE c.post_id = ? AND (c.status = 'approved' OR c.status IS NULL)
    ORDER BY c.created_at ASC
  `).all(post.id);

  const { author_id, author_username, ...postData } = post;
  res.json({
    post: {
      ...postData,
      image: ensureHttpsImage(postData.image),
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

// Send email to admin when a logged-in user posts a comment (pending moderation)
function sendCommentNotification(commentId, postTitle, postSlug, authorUsername, contentSnippet, baseUrl) {
  try {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    if (host && user && pass) {
      const nodemailer = require('nodemailer');
      const port = parseInt(process.env.SMTP_PORT, 10) || 587;
      const from = process.env.FROM_EMAIL || process.env.SMTP_USER || 'noreply@mile12warrior.com';
      const transport = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
      const adminLink = (baseUrl || '').replace(/\/$/, '') + '/admin?tab=blog&comments=pending';
      const body = `A new blog comment is pending approval.\n\nPost: ${postTitle}\nAuthor: ${authorUsername}\nComment: ${(contentSnippet || '').slice(0, 300)}${(contentSnippet && contentSnippet.length > 300) ? '…' : ''}\n\nApprove, reject, or delete at: ${adminLink}`;
      transport.sendMail({
        from,
        to: ADMIN_EMAIL,
        subject: `[Mile 12 Warrior] New blog comment pending — "${(postTitle || '').slice(0, 50)}"`,
        text: body,
        html: '<p>A new blog comment is pending approval.</p><p><strong>Post:</strong> ' + (postTitle || '') + '</p><p><strong>Author:</strong> ' + (authorUsername || '') + '</p><p><strong>Comment:</strong></p><p>' + (contentSnippet || '').slice(0, 500).replace(/</g, '&lt;') + '</p><p><a href="' + adminLink + '">Open Admin to approve, reject, or delete</a></p>'
      }, function (err) {
        if (err) console.error('Comment notification email error:', err);
      });
      return;
    }
  } catch (e) { /* nodemailer optional */ }
  console.log('[Comment] Pending comment', commentId, 'on post', postSlug, '- notify', ADMIN_EMAIL);
}

// POST /api/blog/posts/:slug/comments — require session, insert comment (pending); notify admin
router.post('/posts/:slug/comments', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Authentication required' });

  const { slug } = req.params;
  const { content } = req.body || {};

  if (!content || typeof content !== 'string' || !content.trim()) {
    return res.status(400).json({ error: 'Content is required' });
  }

  const post = db.prepare('SELECT id, title, slug FROM blog_posts WHERE slug = ?').get(slug);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  const sanitized = stripLinks(content.trim());
  const insert = db.prepare(`
    INSERT INTO blog_comments (post_id, user_id, content, status) VALUES (?, ?, ?, 'pending')
  `);
  const result = insert.run(post.id, req.session.user.id, sanitized);

  const comment = db.prepare(`
    SELECT c.id, c.content, c.created_at,
           u.id AS user_id, u.username AS user_username
    FROM blog_comments c
    LEFT JOIN users u ON c.user_id = u.id
    WHERE c.id = ?
  `).get(result.lastInsertRowid);

  const baseUrl = process.env.BASE_URL || (req.protocol + '://' + (req.get('host') || 'localhost:3000'));
  sendCommentNotification(comment.id, post.title, post.slug, req.session.user.username, sanitized, baseUrl);

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
  // Keep links in blog post content (admin-authored); only comments have links stripped
  const contentToSave = content;

  const insert = db.prepare(`
    INSERT INTO blog_posts (title, slug, content, excerpt, image, author_id, published)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const result = insert.run(
    title.trim(),
    slug,
    contentToSave,
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

// GET /api/blog/admin/comments/pending — admin only: list pending comments
router.get('/admin/comments/pending', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') return res.status(403).json({ error: 'Admin required' });
  const rows = db.prepare(`
    SELECT c.id, c.post_id, c.content, c.created_at, c.status,
           u.username AS author_username,
           p.title AS post_title, p.slug AS post_slug
    FROM blog_comments c
    LEFT JOIN users u ON c.user_id = u.id
    LEFT JOIN blog_posts p ON c.post_id = p.id
    WHERE c.status = 'pending'
    ORDER BY c.created_at DESC
  `).all();
  res.json({ comments: rows });
});

// POST /api/blog/admin/comments/:id/approve — admin only
router.post('/admin/comments/:id/approve', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') return res.status(403).json({ error: 'Admin required' });
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid comment ID' });
  const r = db.prepare("UPDATE blog_comments SET status = 'approved' WHERE id = ?").run(id);
  if (r.changes === 0) return res.status(404).json({ error: 'Comment not found' });
  res.json({ success: true });
});

// POST /api/blog/admin/comments/:id/reject — admin only
router.post('/admin/comments/:id/reject', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') return res.status(403).json({ error: 'Admin required' });
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid comment ID' });
  const r = db.prepare("UPDATE blog_comments SET status = 'rejected' WHERE id = ?").run(id);
  if (r.changes === 0) return res.status(404).json({ error: 'Comment not found' });
  res.json({ success: true });
});

// DELETE /api/blog/admin/comments/:id — admin only
router.delete('/admin/comments/:id', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') return res.status(403).json({ error: 'Admin required' });
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid comment ID' });
  const r = db.prepare('DELETE FROM blog_comments WHERE id = ?').run(id);
  if (r.changes === 0) return res.status(404).json({ error: 'Comment not found' });
  res.json({ success: true });
});

module.exports = router;
