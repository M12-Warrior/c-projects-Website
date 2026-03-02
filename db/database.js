const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

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
  db.exec('CREATE TABLE IF NOT EXISTS password_reset_tokens (token TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), expires_at DATETIME NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)');
} catch (_) {}
try {
  db.exec('CREATE INDEX IF NOT EXISTS idx_reset_tokens_expires ON password_reset_tokens(expires_at)');
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
  insertPost.run(
    'Sleep Management for Commercial Drivers: Staying Alert Within HOS Limits',
    'sleep-management-commercial-drivers',
    `Operating safely on the road demands more than skill behind the wheel—it requires proper rest. Under FMCSA Hours of Service rules (49 CFR Part 395), drivers must take at least 10 consecutive hours off duty before driving again. How you use that time directly impacts your alertness and safety.

Quality sleep is the foundation of HOS compliance. A regular sleep schedule aligned with your natural circadian rhythm helps you fall asleep faster and wake refreshed. Avoid heavy meals, caffeine, and screens in the hour before bed. Your sleeper berth or rest area should be dark, quiet, and cool.

 naps can help when you're tired, but FMCSA mandates at least one 30-minute break during your 8-hour shift. Use rest periods wisely: short naps (20–30 minutes) can improve alertness without leaving you groggy.

Sleep apnea screening is required for CDL physicals. Untreated sleep apnea increases crash risk. If you're diagnosed, follow your treatment plan—CPAP or other prescribed therapy—to stay compliant and safe.

This information is educational only. For specific compliance questions, consult FMCSA regulations at fmcsa.dot.gov and qualified professionals.`,
    'Practical tips for quality rest within FMCSA Hours of Service requirements.',
    1,
    1
  );
  insertPost.run(
    'Mental Health on the Road: Building Resilience as a Trucker',
    'mental-health-on-the-road',
    `Long hours behind the wheel, time away from family, and the pressures of deadlines can take a toll on any driver. Mental wellness is as critical to safety as physical fitness. Stress, loneliness, and fatigue are common challenges—but there are proven ways to build resilience.

Stay connected. Regular calls or video chats with family and friends combat isolation. Many drivers find community through CB radio, truck stop meetups, or online forums. Driver support groups and peer networks can provide understanding and encouragement.

Practice simple coping techniques. Deep breathing, stretching during breaks, and short walks can reduce stress. Listen to music, audiobooks, or podcasts that lift your mood. A consistent routine—waking, eating, and resting at similar times—provides a sense of control.

Know when to seek help. Persistent sadness, anxiety, sleep problems, or changes in appetite warrant professional support. Many employers offer Employee Assistance Programs (EAPs) that provide free, confidential counseling. Mental health care is part of staying fit-for-duty under FMCSA medical certification standards (49 CFR Part 391).

This information is educational only. For medical or mental health concerns, consult qualified healthcare providers.`,
    'Strategies for maintaining mental wellness during long hauls.',
    1,
    1
  );
  insertPost.run(
    'Mile 12: Where Our Journey Gets Real',
    'mile-12-where-our-journey-gets-real',
    `Every long-haul driver knows the feeling. You're hours into a run, the highway stretches endlessly, and your body starts signaling that it's time to stop. That's Mile 12 — not a literal distance, but a metaphor for the moment when fatigue hits hardest and the temptation to push through is strongest.

At Mile 12 Warrior, we believe this moment is actually a gift. It's the turning point where awareness becomes action. Instead of fighting through with another energy drink or ignoring the warning signs, Mile 12 is where you choose to be a warrior — making the smart call, pulling over, resetting, and coming back stronger.

This is what separates professionals from statistics. The drivers who respect their limits, who understand that rest is not weakness but strategy, who treat their body and mind as their most valuable equipment — those are the ones who build careers that last decades, not just seasons.

Our founder Joyce Cooke has lived these moments for over 25 years. From school buses to P&D to regional OTR runs, she's been through every version of Mile 12. That experience is the foundation of everything we build here.

This information is educational only. For specific compliance questions regarding rest and HOS, consult FMCSA regulations at fmcsa.dot.gov.`,
    'The critical turning point every driver faces — and how to make it your strength.',
    1,
    1
  );
  insertPost.run(
    'Truck Driver Fatigue: 5 Quick Resets to Stay Alert on Long Hauls',
    '5-quick-resets-stay-alert',
    `Fatigue doesn't announce itself with a warning bell. It creeps in — heavy eyelids, wandering thoughts, microsleeps that last just long enough to drift across a lane line. As professional drivers, we need an arsenal of quick resets that actually work.

1. The 20-Minute Power Nap: Find a safe spot, set an alarm, close your eyes. Research shows that even 20 minutes of sleep can restore alertness for up to two hours. Don't sleep longer than 30 minutes or you'll hit deep sleep and wake groggy.

2. Cold Water and Fresh Air: Splash cold water on your face and step outside the cab. The temperature change and fresh oxygen give your nervous system a genuine jolt. Walk around your truck — do a quick walkaround inspection while you're at it.

3. The 4-7-8 Breathing Reset: Even though this is a relaxation technique, it resets your autonomic nervous system. Inhale for 4 seconds, hold for 7, exhale for 8. Three rounds. You'll feel more centered and clear-headed.

4. Protein Over Sugar: Skip the candy bar. Grab almonds, jerky, cheese sticks, or a protein bar. Sugar gives you a spike and crash. Protein gives you sustained, stable energy.

5. Strategic Caffeine Timing: Caffeine takes 20-30 minutes to kick in. Combine it with a power nap — drink the coffee, then immediately nap for 20 minutes. When you wake up, the caffeine hits and you get a double boost. The coffee nap is one of the most effective fatigue tools known.

Remember: these are resets, not replacements for real sleep. Under FMCSA Hours of Service rules (49 CFR Part 395), you must take proper rest breaks. These quick resets are for when you need a bridge to your next proper rest period.

This information is educational only. Always comply with FMCSA HOS regulations.`,
    'Five proven techniques to fight fatigue between rest stops.',
    1,
    1
  );
  insertPost.run(
    'Embracing Change with Confidence: A Trucker\'s Guide',
    'embracing-change-with-confidence',
    `Change is the only constant on the road — new routes, new regulations, new technology, new challenges. For truck drivers, adaptability isn't just a nice-to-have skill; it's survival.

Whether you're switching from day runs to night driving, transitioning from company driver to owner-operator, adapting to ELD mandates, or simply dealing with a detour that throws off your entire schedule — how you respond to change defines your career.

Start by reframing change as opportunity. Every new regulation you master, every new route you learn, every new piece of technology you embrace — these are competitive advantages. The drivers who resist change get left behind. The drivers who lean into it become the ones fleets fight to keep.

Build your confidence muscle with small wins. Try a new healthy meal instead of the usual truck stop fare. Take a different route and notice what you learn. Start a morning stretching routine. Each small change you successfully navigate builds the confidence to handle bigger ones.

And remember — you don't have to do it alone. That's what community is for. Share your experiences in the forum, learn from drivers who've been through similar transitions, and know that every successful trucker you admire once stood exactly where you're standing now.

The road ahead is always uncertain. But with the right mindset, the right tools, and the right community — you're ready for whatever comes next.`,
    'How professional drivers can build adaptability and thrive through career transitions.',
    1,
    1
  );
  insertPost.run(
    'How to Set Healthy Boundaries Without Feeling Guilty',
    'setting-healthy-boundaries',
    `As truck drivers, we face constant pressure to say yes. Yes to that extra load. Yes to the tight delivery window. Yes to skipping the break because dispatch is pushing. But learning to set boundaries isn't selfish — it's the foundation of a sustainable career.

Boundary-setting starts with knowing your non-negotiables. Your HOS limits aren't just regulations — they're your personal safety boundaries backed by federal law (FMCSA 49 CFR Part 395). No load, no bonus, no dispatcher pressure is worth violating them. When you frame compliance as self-care rather than restriction, the guilt disappears.

At home, boundaries look different but are equally important. Being honest with your family about what you can and can't control on the road reduces resentment on both sides. Set realistic expectations for communication — a scheduled 15-minute call is better than a broken promise of 'I'll call when I can.'

With your company, boundaries mean knowing your rights. You have the right to refuse an unsafe load. You have the right to proper rest. You have the right to a work environment free from harassment. These aren't entitlements — they're legal protections.

The mindset shift: every boundary you set is a vote for the career and life you want. Drivers who set clear boundaries experience less burnout, fewer safety incidents, and longer, more fulfilling careers.

This information is educational only. For questions about your rights and regulations, consult FMCSA at fmcsa.dot.gov and qualified legal professionals.`,
    'The mindset shift every driver needs for a sustainable, guilt-free career.',
    1,
    1
  );
};

seedIfEmpty();

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
