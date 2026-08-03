// Railway/prod injects env before Node starts; avoid loading .env in production so an empty
// local .env file in the image cannot define blank secrets.
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const session = require('express-session');
const SqliteStore = require('better-sqlite3-session-store')(session);
const cors = require('cors');
const db = require('./db/database');
const { buildMonthPrintPages } = require('./lib/journalPrintMonth');
const { UPLOADS_DIR } = require('./lib/paths');
const { resolveCountryCode } = require('./lib/trafficGeo');
const seo = require('./lib/seo');
const { siteBaseUrl } = require('./lib/siteUrl');

const uploadsDir = UPLOADS_DIR;
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

const DEFAULT_SESSION_SECRET = 'drivershield-secret-key-2026';
let sessionSecret = process.env.SESSION_SECRET;
if (isProduction) {
  if (!sessionSecret || !String(sessionSecret).trim()) {
    console.error('FATAL: SESSION_SECRET must be set in production (Railway Variables).');
    process.exit(1);
  }
  if (sessionSecret === DEFAULT_SESSION_SECRET) {
    console.error('FATAL: SESSION_SECRET must not use the default dev value in production.');
    process.exit(1);
  }
} else {
  if (!sessionSecret || !String(sessionSecret).trim()) {
    sessionSecret = DEFAULT_SESSION_SECRET;
    console.warn('[security] Using default SESSION_SECRET; set SESSION_SECRET in .env for local dev.');
  } else if (sessionSecret === DEFAULT_SESSION_SECRET) {
    console.warn('[security] SESSION_SECRET matches the default dev value; use a unique secret.');
  }
}

// Redirect HTTP→HTTPS and www→apex in production
if (isProduction) {
  app.use((req, res, next) => {
    const proto = req.get('x-forwarded-proto');
    const host = (req.get('host') || 'mile12warrior.com').toLowerCase();
    const needsHttps = proto === 'http';
    const needsApex = host === 'www.mile12warrior.com';
    if (needsHttps || needsApex) {
      const targetHost = 'mile12warrior.com';
      return res.redirect(301, 'https://' + targetHost + req.originalUrl);
    }
    next();
  });
}

// Canonical domain: site is intended to be served at mile12warrior.com
app.use(cors({
  origin: [
    'http://localhost',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'capacitor://localhost',
    'ionic://localhost',
    'http://localhost:8100',
    'https://mile12warrior.com',
    'https://www.mile12warrior.com',
    'http://mile12warrior.com',
    'http://www.mile12warrior.com'
  ],
  credentials: true
}));

// Stripe webhook needs the raw request body for signature verification, so it must
// be registered BEFORE express.json() parses (and discards) the raw body.
app.post('/api/stripe/webhook', express.raw({ type: '*/*' }), require('./routes/stripe').handleWebhook);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const sessionCookie = { maxAge: 24 * 60 * 60 * 1000 };
if (isProduction) {
  sessionCookie.secure = true;
  sessionCookie.httpOnly = true;
  sessionCookie.sameSite = 'lax';
}
// Persist sessions in the existing SQLite DB (on the Railway /data volume via DB_PATH)
// so logins survive restarts and are shared across replicas. The default in-memory
// MemoryStore dropped sessions on Railway, causing intermittent 401/403 for the admin.
const sessionStore = new SqliteStore({
  client: db,
  expired: {
    clear: true,
    intervalMs: 24 * 60 * 60 * 1000
  }
});
app.use(session({
  store: sessionStore,
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: sessionCookie
}));

// Marketing partners must sign in at least daily; idle sessions expire sooner.
const { enforceMarketerSession } = require('./lib/marketerSession');
app.use(enforceMarketerSession);

// Serve uploaded images from the configured uploads dir (works when it lives on a
// persistent volume outside public/). Registered first so it wins for /uploads/*.
app.use('/uploads', express.static(UPLOADS_DIR));
app.use(express.static(path.join(__dirname, 'public'), {
  etag: false,
  lastModified: true,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.css') || filePath.endsWith('.js')) {
      res.setHeader('Cache-Control', 'no-cache, must-revalidate');
    }
  }
}));

// Ask the browser to load all resources over HTTPS (fixes mixed content warnings)
if (isProduction) {
  app.use((req, res, next) => {
    res.setHeader('Content-Security-Policy', 'upgrade-insecure-requests');
    next();
  });
}

// Make session user available to views
app.use((req, res, next) => {
  res.locals.user = req.session.user;
  next();
});

// Traffic logging: one row per page view (skip API and static assets) for admin analytics
app.use((req, res, next) => {
  if (req.method !== 'GET') return next();
  if (req.path.startsWith('/api')) return next();
  if (/\.(css|js|ico|svg|png|jpg|jpeg|gif|webp|woff2?|ttf|map)(\?|$)/i.test(req.path)) return next();
  const pathSeg = (req.path || '/').split('?')[0];
  const visitorKey = (req.session && req.sessionID) ? String(req.sessionID) : crypto.createHash('sha256').update((req.get('x-forwarded-for') || req.ip || '') + (req.get('user-agent') || '')).digest('hex').slice(0, 32);
  const userId = (req.session && req.session.user && req.session.user.id) ? req.session.user.id : null;
  const referrer = (req.get('referer') || '').slice(0, 1024) || null;
  const utmSource = (req.query && typeof req.query.utm_source === 'string') ? req.query.utm_source.slice(0, 120) : null;
  const utmMedium = (req.query && typeof req.query.utm_medium === 'string') ? req.query.utm_medium.slice(0, 120) : null;
  const utmCampaign = (req.query && typeof req.query.utm_campaign === 'string') ? req.query.utm_campaign.slice(0, 200) : null;
  next();
  setImmediate(function() {
    resolveCountryCode(req).then(function(countryCode) {
      try {
        const insert = db.prepare('INSERT INTO traffic_visits (visited_at, visitor_key, user_id, path, referrer, utm_source, utm_medium, utm_campaign, country_code) VALUES (datetime(\'now\'), ?, ?, ?, ?, ?, ?, ?, ?)');
        insert.run(visitorKey, userId, pathSeg, referrer, utmSource, utmMedium, utmCampaign, countryCode || null);
      } catch (_) {}
    }).catch(function() {
      try {
        const insert = db.prepare('INSERT INTO traffic_visits (visited_at, visitor_key, user_id, path, referrer, utm_source, utm_medium, utm_campaign, country_code) VALUES (datetime(\'now\'), ?, ?, ?, ?, ?, ?, ?, ?)');
        insert.run(visitorKey, userId, pathSeg, referrer, utmSource, utmMedium, utmCampaign, null);
      } catch (_) {}
    });
  });
});

// Download/print telemetry for free and paid content
app.post('/api/track-download', (req, res) => {
  const contentType = (req.body && typeof req.body.content_type === 'string') ? req.body.content_type.trim() : '';
  const action = (req.body && typeof req.body.action === 'string') ? req.body.action.trim().toLowerCase() : '';
  const productSlug = (req.body && typeof req.body.product_slug === 'string') ? req.body.product_slug.trim() : null;
  if (!contentType || (action !== 'download' && action !== 'print')) {
    return res.status(400).json({ error: 'Invalid tracking payload' });
  }
  const visitorKey = (req.session && req.sessionID)
    ? String(req.sessionID)
    : crypto.createHash('sha256').update((req.get('x-forwarded-for') || req.ip || '') + (req.get('user-agent') || '')).digest('hex').slice(0, 32);
  const userId = (req.session && req.session.user && req.session.user.id) ? req.session.user.id : null;
  const pathSeg = (req.path || '/').split('?')[0];
  try {
    db.prepare(`
      INSERT INTO download_events (visited_at, visitor_key, user_id, content_type, action, product_slug, path)
      VALUES (datetime('now'), ?, ?, ?, ?, ?, ?)
    `).run(visitorKey, userId, contentType.slice(0, 120), action, productSlug ? productSlug.slice(0, 120) : null, pathSeg);
    return res.json({ success: true });
  } catch (_) {
    return res.status(500).json({ error: 'Failed to track download event' });
  }
});

// API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/auth/2fa', require('./routes/twofa'));
app.use('/api/account', require('./routes/account'));
app.use('/api/blog', require('./routes/blog'));
app.use('/api/forum', require('./routes/forum'));
app.use('/api/shop', require('./routes/shop'));
app.use('/api/stripe', require('./routes/stripe').router);
app.use('/api/subscription', require('./routes/subscription'));
app.use('/api/journal', require('./routes/journal'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/marketing', require('./routes/marketing'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/thank-you', require('./routes/thank-you'));
app.use('/api/course', require('./routes/course'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/cms', require('./routes/cms'));
app.use('/api/qr', require('./routes/qr'));
app.use('/api/wellness', require('./routes/wellness'));
app.use('/api/family-circle/recipes', require('./routes/familyCircleRecipes'));

// Auth helpers
const requireLogin = (req, res, next) => {
  if (!req.session.user) return res.redirect('/login');
  next();
};

const requireAdmin = (req, res, next) => {
  if (!req.session.user || req.session.user.role !== 'admin') return res.redirect('/');
  next();
};

const requireMarketingPortal = (req, res, next) => {
  const role = req.session.user && req.session.user.role;
  if (!req.session.user) {
    const dest = req.originalUrl && req.originalUrl.startsWith('/marketing')
      ? req.originalUrl
      : '/marketing';
    return res.redirect('/login?redirect=' + encodeURIComponent(dest));
  }
  if (role !== 'admin' && role !== 'marketer') return res.redirect('/');
  next();
};

// Page routes
app.get('/sitemap.xml', (req, res) => {
  try {
    const base = siteBaseUrl(req) || 'https://mile12warrior.com';
    let posts = [];
    try {
      posts = db.prepare(`
        SELECT slug, audience, created_at, updated_at
        FROM blog_posts
        WHERE published = 1
        ORDER BY created_at DESC
      `).all();
    } catch (_) {}
    const xml = seo.buildSitemapXml(base, posts);
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(xml);
  } catch (err) {
    res.status(500).type('text').send('Sitemap unavailable');
  }
});

app.get('/', (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

function formatBlogDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch (_) {
    return '';
  }
}

function injectHeadMeta(html, title, metaBlock) {
  let out = html;
  if (title) {
    out = out.replace(/<title>[^<]*<\/title>/i, '<title>' + seo.escapeHtml(title) + '</title>');
  }
  if (metaBlock) {
    if (/<!--\s*SEO_META\s*-->/i.test(out)) {
      out = out.replace(/<!--\s*SEO_META\s*-->/i, metaBlock);
    } else {
      out = out.replace(/<\/head>/i, '  ' + metaBlock + '\n</head>');
    }
  }
  return out;
}

app.get('/blog', (req, res) => {
  try {
    const base = siteBaseUrl(req) || 'https://mile12warrior.com';
    const title = 'Truck Driver Safety Blog — Fatigue, HOS Rest & Wellness | Mile 12 Warrior';
    const description = 'Practical articles for professional truck drivers on fatigue management, HOS-aligned rest, sleep, mental wellness, and staying sharp on the road.';
    const posts = db.prepare(`
      SELECT p.id, p.title, p.slug, p.excerpt, p.image, p.content, p.created_at, p.author_display,
             u.username AS author_username
      FROM blog_posts p
      LEFT JOIN users u ON p.author_id = u.id
      WHERE p.published = 1 AND COALESCE(p.audience, 'driver') = 'driver'
      ORDER BY p.created_at DESC
      LIMIT 40
    `).all();
    const cards = posts.map(function (p) {
      const author = (p.author_display && String(p.author_display).trim()) || p.author_username || '';
      const excerpt = seo.truncate(p.excerpt || seo.stripHtml(p.content), 140);
      const img = p.image
        ? '<div class="blog-card-image"><img src="' + seo.escapeAttr(p.image) + '" alt="" loading="lazy"></div>'
        : '<div class="blog-card-image blog-card-placeholder" aria-hidden="true"></div>';
      return '<article class="blog-card glass-card">'
        + '<a href="/blog/' + seo.escapeAttr(p.slug) + '" class="blog-card-link">'
        + img
        + '<div class="blog-card-body">'
        + '<h2 class="blog-card-title">' + seo.escapeHtml(p.title) + '</h2>'
        + '<p class="blog-card-meta">' + seo.escapeHtml(formatBlogDate(p.created_at))
        + (author ? ' · ' + seo.escapeHtml(author) : '') + '</p>'
        + (excerpt ? '<p class="blog-card-excerpt">' + seo.escapeHtml(excerpt) + '</p>' : '')
        + '</div></a></article>';
    }).join('\n');
    let html = fs.readFileSync(path.join(__dirname, 'views', 'blog.html'), 'utf8');
    const meta = seo.renderHeadTags({
      title: title,
      description: description,
      url: base + '/blog',
      image: base + '/images/logo.png',
      type: 'website',
    });
    html = injectHeadMeta(html, title, meta);
    html = html.replace(
      /<h1 class="page-title">Blog<\/h1>\s*<p class="page-subtitle">[^<]*<\/p>/,
      '<h1 class="page-title">Truck Driver Safety Blog</h1>\n'
      + '      <p class="page-subtitle">Fatigue management, HOS-aligned rest, wellness, and road-ready tips for professional drivers.</p>'
    );
    if (cards) {
      html = html.replace('<div id="blogGrid" class="blog-grid"></div>', '<div id="blogGrid" class="blog-grid">' + cards + '</div>');
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=120');
    res.send(html);
  } catch (err) {
    res.sendFile(path.join(__dirname, 'views', 'blog.html'));
  }
});

app.get('/blog/:slug', (req, res) => {
  try {
    const slug = String(req.params.slug || '').trim();
    const post = db.prepare(`
      SELECT p.id, p.title, p.slug, p.content, p.excerpt, p.image, p.published, p.audience,
             p.author_display, p.created_at, p.updated_at,
             u.username AS author_username
      FROM blog_posts p
      LEFT JOIN users u ON p.author_id = u.id
      WHERE p.slug = ?
    `).get(slug);
    if (!post || !post.published) {
      return res.status(404).sendFile(path.join(__dirname, 'views', 'blog-post.html'));
    }
    if (post.audience === 'family') {
      return res.redirect(301, '/social-butterflies/blog/' + encodeURIComponent(post.slug));
    }
    const base = siteBaseUrl(req) || 'https://mile12warrior.com';
    const authorName = (post.author_display && String(post.author_display).trim()) || post.author_username || 'Mile 12 Warrior';
    const description = seo.truncate(post.excerpt || seo.stripHtml(post.content), 160);
    const title = post.title + ' — Mile 12 Warrior';
    const url = base + '/blog/' + post.slug;
    const image = post.image
      ? (post.image.indexOf('http') === 0 ? post.image : base + post.image)
      : base + '/images/logo.png';
    const meta = seo.renderHeadTags({
      title: title,
      description: description,
      url: url,
      image: image,
      type: 'article',
      jsonLd: seo.blogPostingJsonLd(base, post),
    });
    const featuredImg = post.image
      ? '<div class="post-featured-image"><img src="' + seo.escapeAttr(post.image) + '" alt="' + seo.escapeAttr(post.title) + '"></div>'
      : '';
    const articleHtml = ''
      + '<div class="blog-post-header-row"><h1>' + seo.escapeHtml(post.title) + '</h1></div>'
      + '<div class="post-meta">' + seo.escapeHtml(formatBlogDate(post.created_at)) + ' · ' + seo.escapeHtml(authorName) + '</div>'
      + featuredImg
      + '<div class="post-content">' + (post.content || '') + '</div>';
    let html = fs.readFileSync(path.join(__dirname, 'views', 'blog-post.html'), 'utf8');
    html = injectHeadMeta(html, title, meta);
    html = html.replace('<div id="postContent"></div>', '<div id="postContent" data-ssr="1">' + articleHtml + '</div>');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=120');
    res.send(html);
  } catch (err) {
    res.sendFile(path.join(__dirname, 'views', 'blog-post.html'));
  }
});

app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'about.html'));
});

app.get('/social-butterflies', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'social-butterflies.html'));
});

app.get('/social-butterflies/community', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'sb-community.html'));
});

app.get('/social-butterflies/community/new', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'sb-community-new.html'));
});

app.get('/social-butterflies/community/thread/:slug', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'sb-community-thread.html'));
});

app.get('/social-butterflies/community/recipes', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'sb-community-recipes.html'));
});

app.get('/social-butterflies/community/recipes/new', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'sb-community-recipe-new.html'));
});

app.get('/social-butterflies/community/recipes/:slug', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'sb-community-recipe.html'));
});

app.get('/social-butterflies/blog', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'sb-blog.html'));
});

app.get('/social-butterflies/blog/:slug', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'sb-blog-post.html'));
});

app.get('/packets/new-driver', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'packets-new-driver.html'));
});

app.get('/packets/seasoned-driver', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'packet-page.html'));
});

app.get('/packets/fleet-new-hire', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'packet-page.html'));
});

app.get('/packets/fleet-refresher', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'packet-page.html'));
});

app.get('/services', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'services.html'));
});

app.get('/wellness', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'wellness.html'));
});

app.get('/forum', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'forum.html'));
});

app.get('/forum/category/:slug', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'forum-category.html'));
});

app.get('/forum/thread/:slug', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'forum-thread.html'));
});

app.get('/forum/rules', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'forum-rules.html'));
});

app.get('/forum/new-thread', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'forum-new-thread.html'));
});

app.get('/shop', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'shop.html'));
});

app.get('/shop/product/:slug', (req, res) => {
  // Show monthly subscription when requesting the main wellness journal product URL
  if (req.params.slug === 'trucker-wellness-journal') {
    return res.redirect(301, '/shop/product/trucker-wellness-journal-monthly');
  }
  res.sendFile(path.join(__dirname, 'views', 'shop-product.html'));
});

app.get('/shop/cart', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'cart.html'));
});

app.get('/shop/checkout', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'checkout.html'));
});

app.get('/shop/order/:id', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'shop-order.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'register.html'));
});

app.get('/forgot-password', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'forgot-password.html'));
});

app.get('/reset-password', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'reset-password.html'));
});

app.get('/account', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'account.html'));
});

app.get('/profile', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'profile.html'));
});

app.get('/journal', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'journal.html'));
});

app.get('/journal/print', (req, res) => {
  const templatePath = path.join(__dirname, 'views', 'journal-print.html');
  let html = fs.readFileSync(templatePath, 'utf8');
  const monthParam = typeof req.query.month === 'string' ? req.query.month : '';
  const month = buildMonthPrintPages(monthParam);
  html = html.replace(/<!-- JOURNAL_MONTH_LABEL -->/g, month.monthLabel);
  html = html.replace('<!-- JOURNAL_MONTH_KEY -->', month.monthKey);
  html = html.replace('<!-- JOURNAL_DAY_PAGES -->', month.pagesHtml);
  res.type('html').send(html);
});

app.get('/admin', requireAdmin, (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});

app.get('/marketing', requireMarketingPortal, (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.sendFile(path.join(__dirname, 'views', 'marketing.html'));
});

app.get('/marketing/next-90-days', requireMarketingPortal, (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.sendFile(path.join(__dirname, 'views', 'marketing-next-90-days.html'));
});

app.get('/course', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'course.html'));
});

app.get('/drivers-wall', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'drivers-wall.html'));
});

app.get('/course/wall', (req, res) => {
  res.redirect(301, '/drivers-wall');
});

app.get('/refresh', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'refresh.html'));
});

app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'contact.html'));
});

app.get('/advertise', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'advertise.html'));
});

app.get('/terms', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'terms.html'));
});

app.get('/privacy', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'privacy.html'));
});

app.get('/disclaimer', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'disclaimer.html'));
});

app.get('/accessibility', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'accessibility.html'));
});

app.get('/search', (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.sendFile(path.join(__dirname, 'views', 'search.html'));
});

const server = app.listen(PORT, () => {
  console.log('Mile 12 Warrior running on port', PORT, '→ https://mile12warrior.com');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
    process.exit(1);
  }
  throw err;
});
