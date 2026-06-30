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

// Redirect HTTP to HTTPS in production (Railway sends X-Forwarded-Proto)
if (isProduction) {
  app.use((req, res, next) => {
    const proto = req.get('x-forwarded-proto');
    if (proto === 'http') {
      const host = req.get('host') || 'mile12warrior.com';
      return res.redirect(301, 'https://' + host + req.originalUrl);
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
    try {
      const insert = db.prepare('INSERT INTO traffic_visits (visited_at, visitor_key, user_id, path, referrer, utm_source, utm_medium, utm_campaign) VALUES (datetime(\'now\'), ?, ?, ?, ?, ?, ?, ?)');
      insert.run(visitorKey, userId, pathSeg, referrer, utmSource, utmMedium, utmCampaign);
    } catch (_) {}
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
app.use('/api/contact', require('./routes/contact'));
app.use('/api/thank-you', require('./routes/thank-you'));
app.use('/api/course', require('./routes/course'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/cms', require('./routes/cms'));
app.use('/api/qr', require('./routes/qr'));
app.use('/api/wellness', require('./routes/wellness'));

// Auth helpers
const requireLogin = (req, res, next) => {
  if (!req.session.user) return res.redirect('/login');
  next();
};

const requireAdmin = (req, res, next) => {
  if (!req.session.user || req.session.user.role !== 'admin') return res.redirect('/');
  next();
};

// Page routes
app.get('/', (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'about.html'));
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

app.get('/blog', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'blog.html'));
});

app.get('/blog/:slug', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'blog-post.html'));
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
