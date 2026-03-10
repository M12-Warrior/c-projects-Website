const express = require('express');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const cors = require('cors');
require('./db/database');

const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const app = express();
const PORT = process.env.PORT || 3000;

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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'drivershield-secret-key-2026',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));
app.use(express.static(path.join(__dirname, 'public'), {
  etag: false,
  lastModified: true,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.css') || filePath.endsWith('.js')) {
      res.setHeader('Cache-Control', 'no-cache, must-revalidate');
    }
  }
}));

// Make session user available to views
app.use((req, res, next) => {
  res.locals.user = req.session.user;
  next();
});

// API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/blog', require('./routes/blog'));
app.use('/api/forum', require('./routes/forum'));
app.use('/api/shop', require('./routes/shop'));
app.use('/api/subscription', require('./routes/subscription'));
app.use('/api/journal', require('./routes/journal'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/course', require('./routes/course'));
app.use('/api/upload', require('./routes/upload'));

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

app.get('/services', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'services.html'));
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

app.get('/shop/checkout', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'checkout.html'));
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

app.get('/profile', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'profile.html'));
});

app.get('/journal', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'journal.html'));
});

app.get('/journal/print', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'journal-print.html'));
});

app.get('/admin', requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});

app.get('/course', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'course.html'));
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
