const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const BLOG_POSTS_SEED = require('./blog-posts-seed.js');
const { DB_PATH } = require('../lib/paths');

// On Railway (or any host), set DB_PATH to a persistent volume path, e.g. /data/drivershield.db
const dbPath = DB_PATH;
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

  CREATE TABLE IF NOT EXISTS thank_you_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
  db.exec('ALTER TABLE users ADD COLUMN customer_category TEXT');
} catch (_) {}
try {
  db.exec('ALTER TABLE users ADD COLUMN opt_out_address_book INTEGER DEFAULT 0');
} catch (_) {}
try {
  db.exec('ALTER TABLE users ADD COLUMN mic_color TEXT DEFAULT NULL');
} catch (_) {}
// Two-factor authentication (TOTP) columns. Opt-in: totp_enabled stays 0 until the
// user finishes enrollment, so deploying this can never turn 2FA on for anyone.
try {
  db.exec('ALTER TABLE users ADD COLUMN totp_secret TEXT');
} catch (_) {}
try {
  db.exec('ALTER TABLE users ADD COLUMN totp_enabled INTEGER DEFAULT 0');
} catch (_) {}
try {
  db.exec('ALTER TABLE users ADD COLUMN totp_backup_codes TEXT');
} catch (_) {}
try {
  db.exec('CREATE INDEX IF NOT EXISTS idx_users_customer_category ON users(customer_category)');
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
try {
  db.exec("ALTER TABLE orders ADD COLUMN payment_status TEXT DEFAULT 'pending'");
} catch (_) {}
try {
  db.exec('ALTER TABLE orders ADD COLUMN transaction_id TEXT');
} catch (_) {}
try {
  db.exec('ALTER TABLE orders ADD COLUMN auth_code TEXT');
} catch (_) {}
try {
  db.exec('ALTER TABLE orders ADD COLUMN paid_at DATETIME');
} catch (_) {}
try {
  db.exec('ALTER TABLE orders ADD COLUMN payment_method TEXT');
} catch (_) {}
try {
  db.exec("ALTER TABLE contact_messages ADD COLUMN category TEXT DEFAULT 'general'");
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

// Course progress sync and Driver's Wall (100% perfect, zero redos)
db.exec(`
  CREATE TABLE IF NOT EXISTS course_progress (
    user_id INTEGER PRIMARY KEY REFERENCES users(id),
    progress_json TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS drivers_wall (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id),
    cb_handle TEXT NOT NULL,
    completed_at DATETIME NOT NULL,
    perfect_score INTEGER DEFAULT 1,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    removed_at DATETIME DEFAULT NULL,
    removed_by INTEGER REFERENCES users(id)
  );
`);
try {
  db.exec("ALTER TABLE drivers_wall ADD COLUMN status TEXT DEFAULT 'active'");
} catch (_) {}
try {
  db.exec('ALTER TABLE drivers_wall ADD COLUMN removed_at DATETIME');
} catch (_) {}
try {
  db.exec('ALTER TABLE drivers_wall ADD COLUMN removed_by INTEGER REFERENCES users(id)');
} catch (_) {}
try {
  db.exec('CREATE INDEX IF NOT EXISTS idx_drivers_wall_status ON drivers_wall(status)');
} catch (_) {}
try {
  db.exec('ALTER TABLE users ADD COLUMN cb_handle TEXT');
} catch (_) {}
try {
  db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_cb_handle ON users(cb_handle) WHERE cb_handle IS NOT NULL');
} catch (_) {}

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

// Fleets: company-level info captured when a fleet packet is purchased. One row per
// company/account; individual yard licenses live on product_access_grants (extended below).
db.exec(`
  CREATE TABLE IF NOT EXISTS fleets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    company_name TEXT NOT NULL,
    contact_name TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    num_yards INTEGER,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_fleets_user ON fleets(user_id);
  CREATE INDEX IF NOT EXISTS idx_fleets_company ON fleets(company_name);
`);

// Per-yard licensing: each fleet-packet grant is bound to ONE yard (terminal # or address).
// Idempotent ALTERs so existing databases pick up the new columns on next boot.
try {
  db.exec('ALTER TABLE product_access_grants ADD COLUMN fleet_id INTEGER REFERENCES fleets(id)');
} catch (_) {}
try {
  db.exec('ALTER TABLE product_access_grants ADD COLUMN yard_identifier TEXT');
} catch (_) {}
try {
  db.exec('ALTER TABLE product_access_grants ADD COLUMN yard_label TEXT');
} catch (_) {}
try {
  db.exec("ALTER TABLE product_access_grants ADD COLUMN status TEXT DEFAULT 'active'");
} catch (_) {}
try {
  db.exec('ALTER TABLE product_access_grants ADD COLUMN revoked_at DATETIME');
} catch (_) {}
try {
  db.exec('CREATE INDEX IF NOT EXISTS idx_product_access_grants_fleet ON product_access_grants(fleet_id)');
} catch (_) {}

// Orders: capture the fleet/yard questionnaire entered at checkout so it can be copied
// onto the grant (and a fleets row) when access is granted. Idempotent ALTERs.
try {
  db.exec('ALTER TABLE orders ADD COLUMN fleet_company TEXT');
} catch (_) {}
try {
  db.exec('ALTER TABLE orders ADD COLUMN fleet_contact_name TEXT');
} catch (_) {}
try {
  db.exec('ALTER TABLE orders ADD COLUMN fleet_contact_email TEXT');
} catch (_) {}
try {
  db.exec('ALTER TABLE orders ADD COLUMN fleet_contact_phone TEXT');
} catch (_) {}
try {
  db.exec('ALTER TABLE orders ADD COLUMN fleet_num_yards INTEGER');
} catch (_) {}
try {
  db.exec('ALTER TABLE orders ADD COLUMN yard_identifier TEXT');
} catch (_) {}
try {
  db.exec('ALTER TABLE orders ADD COLUMN yard_label TEXT');
} catch (_) {}
// Multi-yard purchases: one yard per fleet-packet unit, stored as JSON
// [{ slug, yardIdentifier, yardLabel }] so grant creation can mint one license per yard.
try {
  db.exec('ALTER TABLE orders ADD COLUMN fleet_yards_json TEXT');
} catch (_) {}

// Replacement packet requests: a licensed fleet asking for a fresh copy of a yard they
// already hold (lost/damaged). Surfaced to the admin Fleets & Yards panel and Messages.
db.exec(`
  CREATE TABLE IF NOT EXISTS replacement_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    fleet_id INTEGER REFERENCES fleets(id),
    grant_id INTEGER REFERENCES product_access_grants(id),
    product_slug TEXT,
    yard_identifier TEXT,
    yard_label TEXT,
    note TEXT,
    status TEXT DEFAULT 'open',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME
  );
  CREATE INDEX IF NOT EXISTS idx_replacement_requests_status ON replacement_requests(status);
  CREATE INDEX IF NOT EXISTS idx_replacement_requests_fleet ON replacement_requests(fleet_id);
`);

// Traffic visits: one row per page view for admin analytics (daily/weekly/monthly/yearly, return users, YoY)
db.exec(`
  CREATE TABLE IF NOT EXISTS traffic_visits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    visited_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    visitor_key TEXT NOT NULL,
    user_id INTEGER REFERENCES users(id),
    path TEXT,
    referrer TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_traffic_visits_at ON traffic_visits(visited_at);
  CREATE INDEX IF NOT EXISTS idx_traffic_visits_user ON traffic_visits(user_id);
  CREATE INDEX IF NOT EXISTS idx_traffic_visits_key ON traffic_visits(visitor_key);
`);
try {
  db.exec('ALTER TABLE traffic_visits ADD COLUMN referrer TEXT');
} catch (_) {}
try {
  db.exec('ALTER TABLE traffic_visits ADD COLUMN utm_source TEXT');
} catch (_) {}
try {
  db.exec('ALTER TABLE traffic_visits ADD COLUMN utm_medium TEXT');
} catch (_) {}
try {
  db.exec('ALTER TABLE traffic_visits ADD COLUMN utm_campaign TEXT');
} catch (_) {}

// Paid orders: align fulfillment status (was left "pending" while payment_status became "paid")
try {
  db.prepare(`
    UPDATE orders SET status = 'processing'
    WHERE COALESCE(payment_status, '') = 'paid'
      AND LOWER(TRIM(COALESCE(status, ''))) = 'pending'
      AND EXISTS (
        SELECT 1 FROM order_items oi
        JOIN products p ON p.id = oi.product_id
        WHERE oi.order_id = orders.id
          AND LOWER(COALESCE(p.category, '')) NOT IN ('digital', 'subscription')
      )
  `).run();
} catch (_) {}
try {
  db.prepare(`
    UPDATE orders SET status = 'completed'
    WHERE COALESCE(payment_status, '') = 'paid'
      AND LOWER(TRIM(COALESCE(status, ''))) = 'pending'
      AND NOT EXISTS (
        SELECT 1 FROM order_items oi
        JOIN products p ON p.id = oi.product_id
        WHERE oi.order_id = orders.id
          AND LOWER(COALESCE(p.category, '')) NOT IN ('digital', 'subscription')
      )
  `).run();
} catch (_) {}

// Legacy checkout: mark fulfilled orders as paid so revenue/tax and mic badge stay consistent.
try {
  db.prepare(`
    UPDATE orders
    SET payment_status = 'paid',
        paid_at = COALESCE(paid_at, created_at)
    WHERE LOWER(COALESCE(status, '')) IN ('completed', 'processing', 'shipped', 'delivered', 'paid')
      AND COALESCE(payment_status, '') IN ('', 'pending')
      AND COALESCE(total, 0) > 0
      AND LOWER(COALESCE(status, '')) != 'cancelled'
  `).run();
} catch (_) {}

db.exec(`
  CREATE TABLE IF NOT EXISTS download_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    visited_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    visitor_key TEXT NOT NULL,
    user_id INTEGER REFERENCES users(id),
    content_type TEXT NOT NULL,
    action TEXT NOT NULL,
    product_slug TEXT,
    path TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_download_events_at ON download_events(visited_at);
  CREATE INDEX IF NOT EXISTS idx_download_events_user ON download_events(user_id);
  CREATE INDEX IF NOT EXISTS idx_download_events_content ON download_events(content_type);
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS address_book (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    source TEXT,
    opt_out INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_address_book_opt_out ON address_book(opt_out);
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS cms_page_content (
    page_key TEXT PRIMARY KEY,
    content_json TEXT NOT NULL DEFAULT '{}',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Wellness partner listings (admin-editable; soft-launch collaborators)
db.exec(`
  CREATE TABLE IF NOT EXISTS wellness_partners (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    display_title TEXT NOT NULL,
    display_subtitle TEXT,
    phone TEXT,
    address TEXT,
    hours TEXT,
    website_url TEXT,
    maps_url TEXT,
    services_json TEXT DEFAULT '[]',
    intro_copy TEXT,
    cert_note TEXT,
    walk_in_note TEXT,
    image_path TEXT,
    sort_order INTEGER DEFAULT 0,
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_wellness_partners_active ON wellness_partners(active, sort_order);
`);

try {
  db.exec('ALTER TABLE wellness_partners ADD COLUMN image_position_x REAL DEFAULT 50');
} catch (_) {}
try {
  db.exec('ALTER TABLE wellness_partners ADD COLUMN image_position_y REAL DEFAULT 50');
} catch (_) {}

// Committed partner sign photo (persists on Railway; survives redeploys)
const BAY_AREA_SIGN_PATH = '/images/wellness/bay-area-pain-care-sign.jpg';
const BAY_AREA_SIGN_FILE = path.join(__dirname, '..', 'public', 'images', 'wellness', 'bay-area-pain-care-sign.jpg');

// Seed Bay Area Pain Care wellness partner (idempotent)
try {
  const BAY_AREA_SERVICES = JSON.stringify([
    'Full body massage (30–120 minutes)',
    'Pain relief therapy combo',
    'Lymphatic drainage',
    'Add-ons: cupping, body scrub',
  ]);
  const BAY_AREA_INTRO = [
    'Long hours behind the wheel take a toll — tight shoulders, lower back knots, swollen feet, and fatigue that sleep alone does not fix.',
    'Mile 12 Warrior collaborates with trusted wellness providers who understand what trucking life does to your body.',
    'Bay Area Pain Care offers professional massage therapy to support recovery, circulation, and day-to-day comfort between runs.',
  ].join(' ');
  const existingPartner = db.prepare('SELECT id FROM wellness_partners WHERE slug = ?').get('bay-area-pain-care');
  if (!existingPartner) {
    db.prepare(`
      INSERT INTO wellness_partners (
        slug, display_title, display_subtitle, phone, address, hours,
        website_url, maps_url, services_json, intro_copy, cert_note, walk_in_note,
        image_path, sort_order, active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'bay-area-pain-care',
      'MASSAGE THERAPY',
      'Bay Area Pain Care',
      '(951) 491-5431',
      '3927 Van Buren Blvd., Riverside, CA 92503',
      '10:00 AM – 8:30 PM PST',
      'https://bayareamass-6qiq3c6z.manus.space/',
      'https://maps.app.goo.gl/s1cutuDmRj7ASV2u7',
      BAY_AREA_SERVICES,
      BAY_AREA_INTRO,
      'Certified Massage Therapist',
      'Walk-ins welcome; appointment preferred',
      fs.existsSync(BAY_AREA_SIGN_FILE) ? BAY_AREA_SIGN_PATH : '',
      0,
      1
    );
  }
  if (fs.existsSync(BAY_AREA_SIGN_FILE)) {
    db.prepare(`
      UPDATE wellness_partners
      SET image_path = ?
      WHERE slug = 'bay-area-pain-care'
        AND (image_path IS NULL OR TRIM(image_path) = '')
    `).run(BAY_AREA_SIGN_PATH);
  }
} catch (_) {}

// Rebrand General Discussion → Coffee Shop lounge (existing databases)
try {
  db.prepare(`
    UPDATE forum_categories
    SET name = ?, description = ?
    WHERE slug = 'general'
  `).run(
    'Coffee Shop — Main Lounge',
    'Pull up a seat. Our main lounge for road stories, wins, and everyday convos — like your favorite truck stop coffee shop.'
  );
} catch (_) {}

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

const isProduction = process.env.NODE_ENV === 'production';

function resolveInitialAdminPassword() {
  const fromEnv = process.env.ADMIN_INITIAL_PASSWORD;
  if (fromEnv && String(fromEnv).trim()) {
    return String(fromEnv).trim();
  }
  if (isProduction) {
    return null;
  }
  return 'admin123';
}

// Seed data — idempotent and crash-proof. Safe to run on every boot, even on a
// fully populated DB: each entity is seeded only when its own table is empty, and
// every insert uses INSERT OR IGNORE so a re-run can never throw a UNIQUE/constraint
// error (previously a plain INSERT here crash-looped production when the users table
// stayed empty because ADMIN_INITIAL_PASSWORD was unset).
const seedIfEmpty = () => {
  const adminPassword = resolveInitialAdminPassword();
  if (adminPassword) {
    const insertUser = db.prepare(`
      INSERT OR IGNORE INTO users (username, email, password, role) VALUES (?, ?, ?, ?)
    `);
    insertUser.run('admin', 'joyce@mile12warrior.com', bcrypt.hashSync(adminPassword, 10), 'admin');
  } else if (isProduction) {
    console.warn('[database] Empty production DB: set ADMIN_INITIAL_PASSWORD in Railway to create the first admin, or register and promote manually.');
  }

  const categoryCount = db.prepare('SELECT COUNT(*) as count FROM forum_categories').get();
  if (categoryCount.count === 0) {
    const insertCategory = db.prepare(`
      INSERT OR IGNORE INTO forum_categories (name, slug, description, sort_order) VALUES (?, ?, ?, ?)
    `);
    insertCategory.run(
      'Coffee Shop — Main Lounge',
      'general',
      'Pull up a seat. Our main lounge for road stories, wins, and everyday convos — like your favorite truck stop coffee shop.',
      0
    );
    insertCategory.run('Safety Tips', 'safety-tips', 'Share and discuss safety practices, near-misses, and lessons learned.', 1);
    insertCategory.run('Health & Wellness', 'health-wellness', 'Physical fitness, mental health, nutrition, and self-care for drivers.', 2);
    insertCategory.run('Equipment & Tech', 'equipment-tech', 'Trucks, trailers, ELDs, dashcams, and gear recommendations.', 3);
    insertCategory.run('Mile 12 Moments', 'mile-12-moments', 'Share your Mile 12 turning points — the moments that tested you and made you stronger.', 4);
    insertCategory.run('Miles Without Borders', 'miles-without-borders', 'Truckers from every country: share your experiences, cultural differences, and the struggles of the road. A place to compare how driver fatigue and hours-of-service are managed worldwide — and learn from each other.', 5);
  }

  const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get();
  if (productCount.count === 0) {
    const insertProduct = db.prepare(`
      INSERT OR IGNORE INTO products (name, slug, description, price, category, stock, active) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertProduct.run('Mile 12 Warrior T-Shirt', 'mile-12-warrior-t-shirt', 'Premium cotton tee with the Mile 12 Warrior logo. Comfortable for long hauls and days off.', 24.99, 'apparel', 50, 1);
    insertProduct.run('Reflective Safety Vest', 'reflective-safety-vest', 'High-visibility ANSI Class 2 vest. Essential for roadside safety and pre-trip inspections.', 34.99, 'apparel', 100, 1);
    insertProduct.run('Trucker Wellness Journal', 'trucker-wellness-journal', 'Daily wellness tracker designed for drivers. Log sleep, meals, exercise, mood, and mileage.', 14.99, 'accessories', 75, 1);
    insertProduct.run('Mile 12 Warrior Kit', 'mile-12-warrior-kit', 'The complete fatigue-fighting toolkit. Includes the wellness journal, a resistance band set, essential oil roller, eye mask for sleeper berth rest, and the Mile 12 quick-reset card deck.', 49.99, 'kits', 30, 1);

    insertProduct.run('90-Day Onboarding Course', 'course-90day', '10 self-paced modules, 47 lessons, knowledge checks, and a certificate of completion. Everything a new CDL driver needs for their first 90 days — HOS mastery, fatigue management, inspections, emergency preparedness, defensive driving, and daily routine systems. Includes the New Driver Packet free.', 149.00, 'digital', 9999, 1);
    insertProduct.run('New Driver Packet', 'new-driver-packet', 'Foundational safety and wellness packet for new CDL drivers. 13 print-ready sections including HOS basics, fatigue management, DVIR checklists, emergency protocol, and daily routines. Free for everyone — view, print, or download at /services with no checkout.', 0.00, 'digital', 9999, 1);
    insertProduct.run('Seasoned Driver Packet', 'seasoned-packet', 'Advanced safety and wellness packet for experienced drivers (2+ years). 11 sections covering HOS refresher, advanced fatigue science, long-term health, CSA self-audit, career wellness, and mentorship planning. Print-ready with real regulatory references.', 29.00, 'digital', 9999, 1);
    insertProduct.run('Fleet New Hire Orientation Packet', 'fleet-new-hire-packet', 'Complete new-hire onboarding packet for fleet safety departments. 11 sections with FMCSA compliance, drug/alcohol testing requirements, accident procedures, company policy templates, and formal driver sign-off sheet per 49 CFR 391.51. Unlimited printing per company.', 79.00, 'digital', 9999, 1);
    insertProduct.run('Fleet Seasoned Driver Refresher Packet', 'fleet-refresher-packet', 'Annual/semi-annual refresher for experienced drivers. 10 sections with fatigue self-assessment, 12-month seasonal hazard calendar, regulatory self-audit, mentorship guidance, and formal driver sign-off sheet per 49 CFR 391.51. Unlimited printing per company.', 79.00, 'digital', 9999, 1);
    insertProduct.run('Fleet Bundle (New Hire + Refresher)', 'fleet-bundle', 'Both fleet safety packets — New Hire Orientation and Seasoned Driver Refresher — at a discounted price. Per company license with unlimited driver distribution and printing. Save $29 vs. buying separately.', 129.00, 'digital', 9999, 1);
    insertProduct.run('Complete Bundle (Course + All Packets)', 'complete-bundle', 'Everything Mile 12 Warrior offers in one package: the 90-Day Onboarding Course (10 modules), all 4 safety packets (New Driver, Seasoned Driver, Fleet New Hire, Fleet Refresher), and certificate of completion. Save $87 vs. buying separately.', 249.00, 'digital', 9999, 1);
  }

  const postCount = db.prepare('SELECT COUNT(*) as count FROM blog_posts').get();
  if (postCount.count === 0) {
    // Attribute seed posts to the admin if one exists; otherwise leave author null
    // so the foreign key constraint cannot fail (e.g. production with no admin yet).
    const adminUser = db.prepare("SELECT id FROM users WHERE role = 'admin' ORDER BY id ASC LIMIT 1").get();
    const authorId = adminUser ? adminUser.id : null;
    const insertPost = db.prepare(`
      INSERT OR IGNORE INTO blog_posts (title, slug, content, excerpt, image, author_id, published) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    for (const post of BLOG_POSTS_SEED) {
      insertPost.run(post.title, post.slug, post.content, post.excerpt, post.image || null, authorId, 1);
    }
  }
};

try {
  seedIfEmpty();
} catch (err) {
  console.error('[database] Seeding encountered an error and was skipped (app will continue):', err && err.message ? err.message : err);
}

// Refresh blog post content so existing DBs get updated copy (tone, length, structure, CTA)
try {
  const updatePost = db.prepare('UPDATE blog_posts SET content = ?, excerpt = ?, image = ? WHERE slug = ?');
  for (const post of BLOG_POSTS_SEED) {
    updatePost.run(post.content, post.excerpt, post.image || null, post.slug);
  }
} catch (_) {}

// Ensure New Driver Packet exists and remains free ($0 — no checkout)
try {
  const existing = db.prepare('SELECT id FROM products WHERE slug = ?').get('new-driver-packet');
  if (!existing) {
    db.prepare(`
      INSERT INTO products (name, slug, description, price, category, stock, active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      'New Driver Packet',
      'new-driver-packet',
      'Foundational safety and wellness packet for new CDL drivers. 13 print-ready sections including HOS basics, fatigue management, DVIR checklists, emergency protocol, and daily routines. Free for everyone — view, print, or download at /services with no checkout.',
      0.00,
      'digital',
      9999,
      1
    );
  } else {
    db.prepare(`
      UPDATE products
      SET name = ?, price = ?, category = ?, active = 1,
          description = ?
      WHERE slug = ?
    `).run(
      'New Driver Packet',
      0.00,
      'digital',
      'Foundational safety and wellness packet for new CDL drivers. 13 print-ready sections including HOS basics, fatigue management, DVIR checklists, emergency protocol, and daily routines. Free for everyone — view, print, or download at /services with no checkout.',
      'new-driver-packet'
    );
  }
} catch (_) {}

// Ensure at least one admin exists (e.g. if DB had users before seed ran) — never use admin123 in production
try {
  const adminCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin'").get();
  if (adminCount.count === 0) {
    const adminPassword = resolveInitialAdminPassword();
    if (adminPassword) {
      const insertAdmin = db.prepare(`
        INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)
      `);
      insertAdmin.run('admin', 'joyce@mile12warrior.com', bcrypt.hashSync(adminPassword, 10), 'admin');
    }
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

// Physical wellness journal superseded by monthly digital — hide from shop listing
try {
  db.prepare(`UPDATE products SET active = 0 WHERE slug = 'trucker-wellness-journal'`).run();
} catch (_) {}

// EMERGENCY 2FA ESCAPE HATCH (no-lockout safety net for the solo admin).
// If DISABLE_2FA is set truthy in the environment, turn off two-factor auth for
// every admin on boot so they can sign in with just their password and re-enroll.
// Intended for recovery only — set it in Railway Variables, redeploy/restart, sign
// in, then REMOVE the variable. See scripts/disable-2fa.js for a one-off CLI version.
try {
  const flag = String(process.env.DISABLE_2FA || '').trim().toLowerCase();
  if (flag === 'true' || flag === '1' || flag === 'yes') {
    const result = db.prepare(
      "UPDATE users SET totp_enabled = 0, totp_secret = NULL, totp_backup_codes = NULL WHERE role = 'admin' AND totp_enabled = 1"
    ).run();
    console.warn('[security] DISABLE_2FA is set: two-factor auth cleared for ' + result.changes + ' admin account(s). Remove the DISABLE_2FA variable once you have signed in and re-enrolled.');
  }
} catch (err) {
  console.error('[security] DISABLE_2FA escape hatch failed (continuing):', err && err.message ? err.message : err);
}

module.exports = db;
