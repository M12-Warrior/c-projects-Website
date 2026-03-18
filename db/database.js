const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const BLOG_POSTS_SEED = require('./blog-posts-seed.js');

// On Railway (or any host), set DB_PATH to a persistent volume path, e.g. /data/drivershield.db
const dbPath = process.env.DB_PATH || path.join(__dirname, 'drivershield.db');
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    avatar TEXT DEFAULT NULL,
    bio TEXT DEFAULT '',
    mic_visible INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    plan TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    started_at DATETIME NOT NULL,
    current_period_end DATETIME NOT NULL,
    cancelled_at DATETIME DEFAULT NULL,
    previous_tier INTEGER DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_subscriptions_user_plan ON subscriptions(user_id, plan);

  CREATE TABLE IF NOT EXISTS blog_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    image TEXT,
    author_id INTEGER REFERENCES users(id),
    published INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS blog_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER REFERENCES blog_posts(id),
    user_id INTEGER REFERENCES users(id),
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS forum_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS forum_threads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER REFERENCES forum_categories(id),
    user_id INTEGER REFERENCES users(id),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    pinned INTEGER DEFAULT 0,
    locked INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS forum_replies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    thread_id INTEGER REFERENCES forum_threads(id),
    user_id INTEGER REFERENCES users(id),
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    image TEXT,
    category TEXT,
    stock INTEGER DEFAULT 0,
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    total REAL NOT NULL,
    status TEXT DEFAULT 'pending',
    shipping_name TEXT,
    shipping_address TEXT,
    shipping_city TEXT,
    shipping_state TEXT,
    shipping_zip TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER REFERENCES orders(id),
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL,
    price REAL NOT NULL
  );

  CREATE TABLE IF NOT EXISTS contact_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT,
    message TEXT NOT NULL,
    read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS subscriber_journal_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    entry_date DATE NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_journal_user_date ON subscriber_journal_entries(user_id, entry_date);

  CREATE TABLE IF NOT EXISTS password_reset_tokens (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_reset_tokens_expires ON password_reset_tokens(expires_at);
`);

// Migrations for existing databases
try {
  db.exec('ALTER TABLE users ADD COLUMN mic_visible INTEGER DEFAULT 1');
} catch (_) {}
try {
  db.exec('ALTER TABLE users ADD COLUMN opt_in_newsletter INTEGER DEFAULT 0');
} catch (_) {}
try {
  db.exec('ALTER TABLE users ADD COLUMN opt_in_blog INTEGER DEFAULT 0');
} catch (_) {}
try {
  db.exec('ALTER TABLE users ADD COLUMN opt_in_product_updates INTEGER DEFAULT 0');
} catch (_) {}
try {
  db.exec('ALTER TABLE users ADD COLUMN opt_in_forum INTEGER DEFAULT 0');
} catch (_) {}
try {
  db.exec('ALTER TABLE users ADD COLUMN home_base TEXT DEFAULT ""');
} catch (_) {}
try {
  db.exec('CREATE TABLE IF NOT EXISTS password_reset_tokens (token TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), expires_at DATETIME NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)');
} catch (_) {}
try {
  db.exec('CREATE INDEX IF NOT EXISTS idx_reset_tokens_expires ON password_reset_tokens(expires_at)');
} catch (_) {}
try {
  db.exec('ALTER TABLE blog_posts ADD COLUMN scheduled_at DATETIME');
} catch (_) {}
try {
  db.exec("ALTER TABLE blog_comments ADD COLUMN status TEXT DEFAULT 'approved'");
} catch (_) {}
try {
  db.exec("UPDATE blog_comments SET status = 'approved' WHERE status IS NULL");
} catch (_) {}
try {
  db.exec('ALTER TABLE products ADD COLUMN is_subscription INTEGER DEFAULT 0');
} catch (_) {}
try {
  db.exec('ALTER TABLE products ADD COLUMN subscription_plan TEXT');
} catch (_) {}
// Subscriber journal: personal notes and progress for wellness journal subscribers
db.exec(`
  CREATE TABLE IF NOT EXISTS subscriber_journal_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    entry_date DATE NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_journal_user_date ON subscriber_journal_entries(user_id, entry_date);
`);

// Course completions (numbered certificates, mailing, optional copy to insurance/safety)
db.exec(`
  CREATE TABLE IF NOT EXISTS course_completions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    certificate_number TEXT UNIQUE NOT NULL,
    student_name TEXT NOT NULL,
    completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    mailing_name TEXT,
    mailing_address TEXT,
    mailing_city TEXT,
    mailing_state TEXT,
    mailing_zip TEXT,
    copy_to_insurance_email TEXT,
    copy_to_safety_email TEXT,
    insurance_copy_sent_at DATETIME,
    safety_copy_sent_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_course_completions_user ON course_completions(user_id);
  CREATE INDEX IF NOT EXISTS idx_course_completions_cert ON course_completions(certificate_number);
`);

// Product access grants: per-user download/access limits and fleet license expiry (12 months)
db.exec(`
  CREATE TABLE IF NOT EXISTS product_access_grants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    order_id INTEGER NOT NULL REFERENCES orders(id),
    product_slug TEXT NOT NULL,
    granted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME DEFAULT NULL,
    download_count INTEGER DEFAULT 0,
    max_downloads INTEGER DEFAULT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_product_access_grants_user ON product_access_grants(user_id);
  CREATE INDEX IF NOT EXISTS idx_product_access_grants_order ON product_access_grants(order_id);
  CREATE INDEX IF NOT EXISTS idx_product_access_grants_slug ON product_access_grants(product_slug);
`);

// Traffic visits: one row per page view for admin analytics (daily/weekly/monthly/yearly, return users, YoY)
db.exec(`
  CREATE TABLE IF NOT EXISTS traffic_visits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    visited_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    visitor_key TEXT NOT NULL,
    user_id INTEGER REFERENCES users(id),
    path TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_traffic_visits_at ON traffic_visits(visited_at);
  CREATE INDEX IF NOT EXISTS idx_traffic_visits_user ON traffic_visits(user_id);
  CREATE INDEX IF NOT EXISTS idx_traffic_visits_key ON traffic_visits(visitor_key);
`);

// Forum category "Miles Without Borders" for existing databases (idempotent)
try {
  const exists = db.prepare('SELECT id FROM forum_categories WHERE slug = ?').get('miles-without-borders');
  if (!exists) {
    db.prepare('INSERT INTO forum_categories (name, slug, description, sort_order) VALUES (?, ?, ?, ?)').run(
      'Miles Without Borders',
      'miles-without-borders',
      'Truckers from every country: share your experiences, cultural differences, and the struggles of the road. A place to compare how driver fatigue and hours-of-service are managed worldwide — and learn from each other.',
      5
    );
  }
} catch (_) {}

// Seed data (only if tables are empty)
const seedIfEmpty = () => {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userCount.count > 0) return;

  const insertUser = db.prepare(`
    INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)
  `);
  insertUser.run('admin', 'joyce@mile12warrior.com', bcrypt.hashSync('admin123', 10), 'admin');

  const insertCategory = db.prepare(`
    INSERT INTO forum_categories (name, slug, description, sort_order) VALUES (?, ?, ?, ?)
  `);
  insertCategory.run('General Discussion', 'general', 'Chat about anything related to life on the road.', 0);
  insertCategory.run('Safety Tips', 'safety-tips', 'Share and discuss safety practices, near-misses, and lessons learned.', 1);
  insertCategory.run('Health & Wellness', 'health-wellness', 'Physical fitness, mental health, nutrition, and self-care for drivers.', 2);
  insertCategory.run('Equipment & Tech', 'equipment-tech', 'Trucks, trailers, ELDs, dashcams, and gear recommendations.', 3);
  insertCategory.run('Mile 12 Moments', 'mile-12-moments', 'Share your Mile 12 turning points — the moments that tested you and made you stronger.', 4);
  insertCategory.run('Miles Without Borders', 'miles-without-borders', 'Truckers from every country: share your experiences, cultural differences, and the struggles of the road. A place to compare how driver fatigue and hours-of-service are managed worldwide — and learn from each other.', 5);

  const insertProduct = db.prepare(`
    INSERT INTO products (name, slug, description, price, category, stock, active) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertProduct.run('Mile 12 Warrior T-Shirt', 'mile-12-warrior-t-shirt', 'Premium cotton tee with the Mile 12 Warrior logo. Comfortable for long hauls and days off.', 24.99, 'apparel', 50, 1);
  insertProduct.run('Reflective Safety Vest', 'reflective-safety-vest', 'High-visibility ANSI Class 2 vest. Essential for roadside safety and pre-trip inspections.', 34.99, 'apparel', 100, 1);
  insertProduct.run('Trucker Wellness Journal', 'trucker-wellness-journal', 'Daily wellness tracker designed for drivers. Log sleep, meals, exercise, mood, and mileage.', 14.99, 'accessories', 75, 1);
  insertProduct.run('Mile 12 Warrior Kit', 'mile-12-warrior-kit', 'The complete fatigue-fighting toolkit. Includes the wellness journal, a resistance band set, essential oil roller, eye mask for sleeper berth rest, and the Mile 12 quick-reset card deck.', 49.99, 'kits', 30, 1);

  insertProduct.run('90-Day Onboarding Course', 'course-90day', '10 self-paced modules, 47 lessons, knowledge checks, and a certificate of completion. Everything a new CDL driver needs for their first 90 days — HOS mastery, fatigue management, inspections, emergency preparedness, defensive driving, and daily routine systems. Includes the New Driver Packet free.', 149.00, 'digital', 9999, 1);
  insertProduct.run('Seasoned Driver Packet', 'seasoned-packet', 'Advanced safety and wellness packet for experienced drivers (2+ years). 11 sections covering HOS refresher, advanced fatigue science, long-term health, CSA self-audit, career wellness, and mentorship planning. Print-ready with real regulatory references.', 29.00, 'digital', 9999, 1);
  insertProduct.run('Fleet New Hire Orientation Packet', 'fleet-new-hire-packet', 'Complete new-hire onboarding packet for fleet safety departments. 11 sections with FMCSA compliance, drug/alcohol testing requirements, accident procedures, company policy templates, and formal driver sign-off sheet per 49 CFR 391.51. Unlimited printing per company.', 79.00, 'digital', 9999, 1);
  insertProduct.run('Fleet Seasoned Driver Refresher Packet', 'fleet-refresher-packet', 'Annual/semi-annual refresher for experienced drivers. 10 sections with fatigue self-assessment, 12-month seasonal hazard calendar, regulatory self-audit, mentorship guidance, and formal driver sign-off sheet per 49 CFR 391.51. Unlimited printing per company.', 79.00, 'digital', 9999, 1);
  insertProduct.run('Fleet Bundle (New Hire + Refresher)', 'fleet-bundle', 'Both fleet safety packets — New Hire Orientation and Seasoned Driver Refresher — at a discounted price. Per company license with unlimited driver distribution and printing. Save $29 vs. buying separately.', 129.00, 'digital', 9999, 1);
  insertProduct.run('Complete Bundle (Course + All Packets)', 'complete-bundle', 'Everything Mile 12 Warrior offers in one package: the 90-Day Onboarding Course (10 modules), all 4 safety packets (New Driver, Seasoned Driver, Fleet New Hire, Fleet Refresher), and certificate of completion. Save $87 vs. buying separately.', 249.00, 'digital', 9999, 1);

  const insertPost = db.prepare(`
    INSERT INTO blog_posts (title, slug, content, excerpt, author_id, published) VALUES (?, ?, ?, ?, ?, ?)
  `);
  for (const post of BLOG_POSTS_SEED) {
    insertPost.run(post.title, post.slug, post.content, post.excerpt, 1, 1);
  }
};

seedIfEmpty();

// Refresh blog post content so existing DBs get updated copy (tone, length, structure, CTA)
try {
  const updatePost = db.prepare('UPDATE blog_posts SET content = ?, excerpt = ? WHERE slug = ?');
  for (const post of BLOG_POSTS_SEED) {
    updatePost.run(post.content, post.excerpt, post.slug);
  }
} catch (_) {}

// Ensure at least one admin exists (e.g. if DB had users before seed ran)
try {
  const adminCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin'").get();
  if (adminCount.count === 0) {
    const insertAdmin = db.prepare(`
      INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)
    `);
    insertAdmin.run('admin', 'joyce@mile12warrior.com', bcrypt.hashSync('admin123', 10), 'admin');
  }
} catch (_) {}

// Ensure Trucker Wellness Journal monthly subscription product exists
try {
  const hasMonthly = db.prepare('SELECT id FROM products WHERE slug = ?').get('trucker-wellness-journal-monthly');
  if (!hasMonthly) {
    db.prepare(`
      INSERT INTO products (name, slug, description, price, category, stock, active, is_subscription, subscription_plan)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'Trucker Wellness Journal — Monthly',
      'trucker-wellness-journal-monthly',
      'E-product subscription: get the Trucker Wellness Journal as a downloadable and printable PDF-style log (sleep, meals, exercise, mood, mileage, notes) plus full platform perks: CB mic badge on the forum (tiers grow with tenure), Forum and Blog access, private My Journal online, incognito option, 30-day tier restore, and subscriber-priority messaging.',
      6.99,
      'subscription',
      9999,
      1,
      1,
      'wellness_journal'
    );
  }
} catch (_) {}

// Keep subscription product description in sync (e-product + platform perks)
try {
  db.prepare(`
    UPDATE products SET description = ?
    WHERE slug = 'trucker-wellness-journal-monthly'
  `).run(
    'E-product subscription: get the Trucker Wellness Journal as a downloadable and printable PDF-style log (sleep, meals, exercise, mood, mileage, notes) plus full platform perks: CB mic badge on the forum (tiers grow with tenure), Forum and Blog access, private My Journal online, incognito option, 30-day tier restore, and subscriber-priority messaging.'
  );
} catch (_) {}

module.exports = db;
