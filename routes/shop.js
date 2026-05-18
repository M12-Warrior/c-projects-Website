const express = require('express');
const db = require('../db/database');
const { hasModule1PreviewAccess } = require('../lib/module1PreviewAccess');
const router = express.Router();

// Require session (401 if not logged in)
function requireSession(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

// Require admin role
function requireAdmin(req, res, next) {
  if (!req.session || !req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

/** Digital-only (packet) orders: mark complete after first logged packet download. */
function maybeCompleteDigitalOnlyOrderAfterPacketDownload(grantId) {
  const row = db.prepare(`
    SELECT g.order_id, o.status
    FROM product_access_grants g
    JOIN orders o ON o.id = g.order_id
    WHERE g.id = ?
  `).get(grantId);
  if (!row || String(row.status).toLowerCase() !== 'processing') return;
  const rows = db.prepare(`
    SELECT p.category
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    WHERE oi.order_id = ?
  `).all(row.order_id);
  const onlyDigital =
    rows.length > 0 && rows.every((r) => String(r.category || '').toLowerCase() === 'digital');
  if (onlyDigital) {
    db.prepare(`UPDATE orders SET status = 'completed' WHERE id = ?`).run(row.order_id);
  }
}

// Fleet license duration (months); individual packet download cap
const FLEET_LICENSE_MONTHS = 12;
const INDIVIDUAL_PACKET_MAX_DOWNLOADS = 5;

// Map product_slug -> list of grants { product_slug, expiresInMonths, max_downloads }
const DIGITAL_GRANT_MAP = {
  'course-90day': [
    { product_slug: 'course-90day', expiresInMonths: null, max_downloads: null },
    { product_slug: 'new-driver-packet', expiresInMonths: null, max_downloads: INDIVIDUAL_PACKET_MAX_DOWNLOADS }
  ],
  'complete-bundle': [
    { product_slug: 'course-90day', expiresInMonths: null, max_downloads: null },
    { product_slug: 'new-driver-packet', expiresInMonths: null, max_downloads: INDIVIDUAL_PACKET_MAX_DOWNLOADS },
    { product_slug: 'seasoned-packet', expiresInMonths: null, max_downloads: INDIVIDUAL_PACKET_MAX_DOWNLOADS },
    { product_slug: 'fleet-new-hire-packet', expiresInMonths: FLEET_LICENSE_MONTHS, max_downloads: null },
    { product_slug: 'fleet-refresher-packet', expiresInMonths: FLEET_LICENSE_MONTHS, max_downloads: null }
  ],
  'seasoned-packet': [
    { product_slug: 'seasoned-packet', expiresInMonths: null, max_downloads: INDIVIDUAL_PACKET_MAX_DOWNLOADS }
  ],
  'new-driver-packet': [
    { product_slug: 'new-driver-packet', expiresInMonths: null, max_downloads: INDIVIDUAL_PACKET_MAX_DOWNLOADS }
  ],
  'fleet-new-hire-packet': [
    { product_slug: 'fleet-new-hire-packet', expiresInMonths: FLEET_LICENSE_MONTHS, max_downloads: null }
  ],
  'fleet-refresher-packet': [
    { product_slug: 'fleet-refresher-packet', expiresInMonths: FLEET_LICENSE_MONTHS, max_downloads: null }
  ],
  'fleet-bundle': [
    { product_slug: 'fleet-new-hire-packet', expiresInMonths: FLEET_LICENSE_MONTHS, max_downloads: null },
    { product_slug: 'fleet-refresher-packet', expiresInMonths: FLEET_LICENSE_MONTHS, max_downloads: null }
  ]
};

function createProductAccessGrantsForOrder(orderId) {
  const order = db.prepare('SELECT id, user_id FROM orders WHERE id = ?').get(orderId);
  if (!order) return;
  const existing = db.prepare('SELECT id FROM product_access_grants WHERE order_id = ? LIMIT 1').get(orderId);
  if (existing) return;

  const items = db.prepare(`
    SELECT oi.id, oi.product_id, oi.quantity, p.slug AS product_slug, p.category
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    WHERE oi.order_id = ?
  `).all(orderId);

  const insertGrant = db.prepare(`
    INSERT INTO product_access_grants (user_id, order_id, product_slug, expires_at, max_downloads)
    VALUES (?, ?, ?, ?, ?)
  `);

  const now = new Date();
  for (const item of items) {
    if (item.category !== 'digital') continue;
    const grants = DIGITAL_GRANT_MAP[item.product_slug];
    if (!grants) continue;
    const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
    for (const g of grants) {
      let expiresAt = null;
      if (g.expiresInMonths != null) {
        const d = new Date(now);
        d.setMonth(d.getMonth() + g.expiresInMonths);
        expiresAt = d.toISOString();
      }
      const maxDown = g.max_downloads == null ? null : g.max_downloads * qty;
      insertGrant.run(order.user_id, orderId, g.product_slug, expiresAt, maxDown);
    }
  }
}

/** Links to show on receipts for digital / subscription line items */
function receiptLinksForProduct(slug, category, isSubscription) {
  const links = [];
  const c = String(category || '').toLowerCase();
  const ss = String(slug || '').trim();
  if (isSubscription) {
    links.push({ label: 'My Journal', href: '/journal' });
    links.push({ label: 'Print / download journal PDF', href: '/journal/print' });
    links.push({ label: 'Forum access', href: '/forum' });
    return links;
  }
  if (c !== 'digital') return links;
  if (ss === 'course-90day' || ss === 'complete-bundle') {
    links.push({ label: '90-Day Onboarding Course', href: '/course' });
  }
  const packetSlugs = [
    'new-driver-packet',
    'seasoned-packet',
    'fleet-new-hire-packet',
    'fleet-refresher-packet',
    'fleet-bundle',
    'complete-bundle',
    'course-90day'
  ];
  if (packetSlugs.indexOf(ss) !== -1) {
    links.push({ label: 'Packets & printable tools (Services)', href: '/services' });
  }
  return links;
}

function fulfillmentSummary(status, paymentStatus) {
  const s = String(status || '').toLowerCase();
  const p = String(paymentStatus || '').toLowerCase();
  if (p !== 'paid') {
    return {
      headline: 'Awaiting payment',
      detail: 'Finish payment so we can fulfill this order.',
      code: 'unpaid'
    };
  }
  if (s === 'pending') {
    return {
      headline: 'Payment received',
      detail:
        'Fulfillment still shows as pending on older orders. We are syncing records — refresh later, or contact us. New orders show Processing or Complete after payment.',
      code: 'paid_pending'
    };
  }
  if (s === 'processing') {
    return {
      headline: 'Processing',
      detail: 'Payment captured. We are preparing your shipment or finishing digital setup.',
      code: 'processing'
    };
  }
  if (s === 'shipped') {
    return { headline: 'Shipped', detail: 'Your package is on the way.', code: 'shipped' };
  }
  if (s === 'delivered') {
    return { headline: 'Delivered', detail: 'Carrier shows this order as delivered.', code: 'delivered' };
  }
  if (s === 'completed') {
    return {
      headline: 'Complete',
      detail: 'Digital access is active. Physical items (if any) are treated as fulfilled for this order.',
      code: 'completed'
    };
  }
  if (s === 'cancelled') {
    return { headline: 'Cancelled', detail: 'This order was cancelled.', code: 'cancelled' };
  }
  return { headline: status || '—', detail: '', code: s || 'unknown' };
}

// Generate slug from name: lowercase, spaces to hyphens, remove non-alphanumeric
function slugify(name) {
  return String(name)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

// In-repo SVG art (served from /public) — reliable on laptops, offline dev, and networks that block third-party CDNs.
const DEFAULT_PRODUCT_IMAGES = {
  'mile-12-warrior-t-shirt': '/images/products/mile-12-warrior-t-shirt.svg',
  'reflective-safety-vest': '/images/products/reflective-safety-vest.svg',
  'trucker-wellness-journal': '/images/products/trucker-wellness-journal.svg',
  'mile-12-warrior-kit': '/images/products/mile-12-warrior-kit.svg',
  'trucker-wellness-journal-monthly': '/images/products/trucker-wellness-journal-monthly.svg',
  'course-90day': '/images/products/course-90day.svg',
  'new-driver-packet': '/images/products/new-driver-packet.svg',
  'seasoned-packet': '/images/products/seasoned-packet.svg',
  'fleet-new-hire-packet': '/images/products/fleet-new-hire-packet.svg',
  'fleet-refresher-packet': '/images/products/fleet-refresher-packet.svg',
  'fleet-bundle': '/images/products/fleet-bundle.svg',
  'complete-bundle': '/images/products/complete-bundle.svg'
};

const FALLBACK_PRODUCT_IMAGE = '/images/logo.png';

function ensureHttpsImage(url) {
  if (!url || typeof url !== 'string') return url;
  const u = url.trim();
  return u.replace(/^http:\/\//i, 'https://');
}
function applyDefaultImage(products) {
  if (!Array.isArray(products)) return products;
  return products.map((p) => {
    const slug = p.slug;
    const local = slug ? DEFAULT_PRODUCT_IMAGES[slug] : null;
    if (local) return { ...p, image: local };
    const dbImg = p.image && String(p.image).trim();
    if (dbImg) return { ...p, image: ensureHttpsImage(dbImg) };
    return { ...p, image: FALLBACK_PRODUCT_IMAGE };
  });
}

// Admin: single product by id (any active flag) for dashboard edit
router.get('/admin/product/:id', requireAdmin, (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid product ID' });
  const product = db.prepare(`
    SELECT id, name, slug, description, price, image, category, stock, active, created_at,
           COALESCE(is_subscription, 0) AS is_subscription, subscription_plan
    FROM products WHERE id = ?
  `).get(id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json({ product });
});

// 1. GET /api/shop/products — Return all active products
router.get('/products', (req, res) => {
  const rows = db.prepare(`
    SELECT id, name, slug, description, price, image, category, stock, active, created_at,
           COALESCE(is_subscription, 0) AS is_subscription, subscription_plan
    FROM products
    WHERE active = 1
    ORDER BY COALESCE(is_subscription, 0) DESC, name
  `).all();
  const products = applyDefaultImage(rows);
  res.json({ products });
});

// 2. GET /api/shop/products/:slug — Return single product by slug
router.get('/products/:slug', (req, res) => {
  const { slug } = req.params;
  const product = db.prepare(`
    SELECT id, name, slug, description, price, image, category, stock, active, created_at,
           COALESCE(is_subscription, 0) AS is_subscription, subscription_plan
    FROM products
    WHERE slug = ? AND active = 1
  `).get(slug);

  if (!product) return res.status(404).json({ error: 'Product not found' });
  const withImage = applyDefaultImage([product])[0];
  res.json({ product: withImage });
});

// 3. POST /api/shop/orders — checkout disabled until payment returns
router.post('/orders', requireSession, (req, res) => {
  return res.status(503).json({
    error:
      'Online checkout is not available right now. You will be able to purchase products and services here soon. Questions? Use the Contact page.',
    checkoutDisabled: true,
  });
});
// 4. GET /api/shop/orders — Require session, return user's orders with items
router.get('/orders', requireSession, (req, res) => {
  const orders = db.prepare(`
    SELECT o.id, o.total, o.status, o.payment_status, o.paid_at,
           o.shipping_name, o.shipping_address, o.shipping_city, o.shipping_state, o.shipping_zip, o.created_at
    FROM orders o
    WHERE o.user_id = ?
    ORDER BY o.created_at DESC
  `).all(req.session.user.id);

  const ordersWithItems = orders.map((order) => {
    const items = db.prepare(`
      SELECT oi.id, oi.product_id, oi.quantity, oi.price, p.name AS product_name, p.slug AS product_slug
      FROM order_items oi
      LEFT JOIN products p ON p.id = oi.product_id
      WHERE oi.order_id = ?
    `).all(order.id);
    return { ...order, items };
  });

  res.json({ orders: ordersWithItems });
});

// 4a. GET /api/shop/orders/:id — Single order + line items (owner only); for receipt page
router.get('/orders/:id', requireSession, (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id) || id < 1) {
    return res.status(400).json({ error: 'Invalid order id' });
  }
  const order = db.prepare(`
    SELECT o.id, o.user_id, o.total, o.status, o.payment_status, o.paid_at,
           o.shipping_name, o.shipping_address, o.shipping_city, o.shipping_state, o.shipping_zip, o.created_at,
           o.transaction_id, o.auth_code, o.payment_method
    FROM orders o
    WHERE o.id = ?
  `).get(id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  if (order.user_id !== req.session.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }
  const items = db.prepare(`
    SELECT oi.id, oi.product_id, oi.quantity, oi.price, p.name AS product_name, p.slug AS product_slug,
           p.category AS product_category, COALESCE(p.is_subscription, 0) AS is_subscription
    FROM order_items oi
    LEFT JOIN products p ON p.id = oi.product_id
    WHERE oi.order_id = ?
  `).all(id);
  const enrichedItems = items.map((row) => ({
    ...row,
    receipt_links: receiptLinksForProduct(row.product_slug, row.product_category, !!row.is_subscription)
  }));
  const { user_id, ...safe } = order;
  const fulfillment = fulfillmentSummary(safe.status, safe.payment_status);
  res.json({ order: { ...safe, items: enrichedItems, fulfillment } });
});

function userHasPaidCourseAccess(userId) {
  const now = new Date().toISOString();
  const grantRow = db.prepare(`
    SELECT 1 FROM product_access_grants
    WHERE user_id = ? AND product_slug = 'course-90day'
      AND (expires_at IS NULL OR expires_at > ?)
    LIMIT 1
  `).get(userId, now);
  if (grantRow) return true;
  const orderRow = db.prepare(`
    SELECT 1
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    JOIN products p ON p.id = oi.product_id
    WHERE o.user_id = ? AND o.status != 'cancelled'
      AND p.slug IN ('course-90day', 'complete-bundle')
    LIMIT 1
  `).get(userId);
  return !!orderRow;
}

// 4b. GET /api/shop/course-access — Paid course + module 1 preview flags (for course page gate)
// Course access does not expire; fleet packet access uses packet-access and expires at 12 months.
// Module 1 preview is allowlisted test accounts only (see lib/module1PreviewAccess.js).
router.get('/course-access', (req, res) => {
  if (!req.session || !req.session.user) {
    return res.json({ hasCourseAccess: false, hasModule1Preview: false });
  }
  const uid = req.session.user.id;
  const hasCourseAccess = userHasPaidCourseAccess(uid);
  if (hasCourseAccess) {
    return res.json({ hasCourseAccess: true, hasModule1Preview: true });
  }
  const userRow = db.prepare('SELECT id, username, email, role FROM users WHERE id = ?').get(uid);
  const previewUser = userRow || req.session.user;
  const hasModule1Preview = hasModule1PreviewAccess(previewUser);
  res.json({ hasCourseAccess: false, hasModule1Preview });
});

// 4c. GET /api/shop/packet-access — Can the current user download this packet? (type: new-driver | seasoned-driver | fleet-new-hire | fleet-refresher)
const PACKET_TYPE_TO_SLUG = {
  'new-driver': 'new-driver-packet',
  'seasoned-driver': 'seasoned-packet',
  'fleet-new-hire': 'fleet-new-hire-packet',
  'fleet-refresher': 'fleet-refresher-packet'
};
router.get('/packet-access', (req, res) => {
  const type = (req.query.type || '').trim();
  const productSlug = PACKET_TYPE_TO_SLUG[type];
  if (!productSlug) {
    return res.status(400).json({ error: 'Invalid type', allowed: false });
  }
  if (!req.session || !req.session.user) {
    return res.json({ allowed: false, downloadsRemaining: null, expiresAt: null });
  }
  const uid = req.session.user.id;
  const now = new Date().toISOString();

  // Backfill grants for completed orders that never got grants (e.g. before this feature)
  const productSlugsThatGrant = Object.keys(DIGITAL_GRANT_MAP).filter(slug => {
    const grants = DIGITAL_GRANT_MAP[slug];
    return grants.some(g => g.product_slug === productSlug);
  });
  if (productSlugsThatGrant.length > 0) {
    const placeholders = productSlugsThatGrant.map(() => '?').join(',');
    const orderWithProduct = db.prepare(`
      SELECT o.id FROM orders o
      JOIN order_items oi ON oi.order_id = o.id
      JOIN products p ON p.id = oi.product_id
      WHERE o.user_id = ? AND o.status != 'cancelled' AND p.slug IN (${placeholders})
      ORDER BY o.created_at DESC LIMIT 1
    `).get(uid, ...productSlugsThatGrant);
    if (orderWithProduct) {
      const hasGrant = db.prepare('SELECT id FROM product_access_grants WHERE order_id = ? LIMIT 1').get(orderWithProduct.id);
      if (!hasGrant) {
        try {
          createProductAccessGrantsForOrder(orderWithProduct.id);
        } catch (_) {}
        }
    }
  }

  const grants = db.prepare(`
    SELECT id, download_count, max_downloads, expires_at
    FROM product_access_grants
    WHERE user_id = ? AND product_slug = ?
      AND (expires_at IS NULL OR expires_at > ?)
    ORDER BY expires_at IS NULL DESC, expires_at DESC
  `).all(uid, productSlug, now);

  for (const g of grants) {
    const remaining = g.max_downloads == null ? null : Math.max(0, g.max_downloads - g.download_count);
    if (g.max_downloads != null && remaining <= 0) continue;
    return res.json({
      allowed: true,
      downloadsRemaining: g.max_downloads == null ? null : remaining,
      expiresAt: g.expires_at || null
    });
  }
  return res.json({ allowed: false, downloadsRemaining: null, expiresAt: null });
});

// 4d. POST /api/shop/packet-download-log — Record one packet download (consumes one of max_downloads)
router.post('/packet-download-log', requireSession, (req, res) => {
  const type = (req.body && req.body.type) ? String(req.body.type).trim() : '';
  const productSlug = PACKET_TYPE_TO_SLUG[type];
  if (!productSlug) {
    return res.status(400).json({ error: 'Invalid type' });
  }
  const uid = req.session.user.id;
  const now = new Date().toISOString();

  const grant = db.prepare(`
    SELECT id, download_count, max_downloads
    FROM product_access_grants
    WHERE user_id = ? AND product_slug = ?
      AND (expires_at IS NULL OR expires_at > ?)
    ORDER BY expires_at IS NULL DESC, expires_at DESC
  `).all(uid, productSlug, now).find(g => g.max_downloads == null || g.download_count < g.max_downloads);

  if (!grant) {
    return res.status(403).json({ error: 'No access or download limit reached' });
  }
  db.prepare('UPDATE product_access_grants SET download_count = download_count + 1 WHERE id = ?').run(grant.id);
  try {
    maybeCompleteDigitalOnlyOrderAfterPacketDownload(grant.id);
  } catch (_) {}
  try {
    const visitorKey = (req.session && req.sessionID) ? String(req.sessionID) : null;
    db.prepare(`
      INSERT INTO download_events (visited_at, visitor_key, user_id, content_type, action, product_slug, path)
      VALUES (datetime('now'), ?, ?, ?, 'download', ?, '/api/shop/packet-download-log')
    `).run(visitorKey || String(uid), uid, productSlug, productSlug);
  } catch (_) {}
  res.json({ success: true });
});

// 5. POST /api/shop/products — Admin only, create product
router.post('/products', requireAdmin, (req, res) => {
  const { name, description, price, category, stock, image } = req.body || {};

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Name is required' });
  }
  const priceNum = parseFloat(price);
  if (isNaN(priceNum) || priceNum < 0) {
    return res.status(400).json({ error: 'Valid price is required' });
  }
  const stockNum = parseInt(stock, 10);
  if (isNaN(stockNum) || stockNum < 0) {
    return res.status(400).json({ error: 'Valid stock (>= 0) is required' });
  }

  let slug = slugify(name);
  const existing = db.prepare('SELECT id FROM products WHERE slug = ?').get(slug);
  if (existing) {
    let counter = 1;
    while (db.prepare('SELECT id FROM products WHERE slug = ?').get(`${slug}-${counter}`)) {
      counter++;
    }
    slug = `${slug}-${counter}`;
  }

  const imageVal = image && typeof image === 'string' ? image.trim() || null : null;
  const insert = db.prepare(`
    INSERT INTO products (name, slug, description, price, image, category, stock, active)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1)
  `);
  const result = insert.run(
    name.trim(),
    slug,
    description && typeof description === 'string' ? description.trim() : null,
    priceNum,
    imageVal,
    category && typeof category === 'string' ? category.trim() : null,
    stockNum
  );

  const product = db.prepare(`
    SELECT id, name, slug, description, price, image, category, stock, active, created_at
    FROM products WHERE id = ?
  `).get(result.lastInsertRowid);

  res.json({ success: true, product });
});

// 6. PUT /api/shop/products/:id — Admin only, update product
router.put('/products/:id', requireAdmin, (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid product ID' });

  const existing = db.prepare('SELECT id FROM products WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Product not found' });

  const { name, description, price, category, stock, active, image } = req.body || {};
  const updates = [];
  const params = [];

  if (name !== undefined) {
    updates.push('name = ?');
    params.push(typeof name === 'string' ? name.trim() : '');
  }
  if (description !== undefined) {
    updates.push('description = ?');
    params.push(description && typeof description === 'string' ? description.trim() : null);
  }
  if (price !== undefined) {
    const priceNum = parseFloat(price);
    if (!isNaN(priceNum) && priceNum >= 0) {
      updates.push('price = ?');
      params.push(priceNum);
    }
  }
  if (image !== undefined) {
    updates.push('image = ?');
    params.push(image && typeof image === 'string' ? image.trim() || null : null);
  }
  if (category !== undefined) {
    updates.push('category = ?');
    params.push(category && typeof category === 'string' ? category.trim() : null);
  }
  if (stock !== undefined) {
    const stockNum = parseInt(stock, 10);
    if (!isNaN(stockNum) && stockNum >= 0) {
      updates.push('stock = ?');
      params.push(stockNum);
    }
  }
  if (active !== undefined) {
    updates.push('active = ?');
    params.push(active ? 1 : 0);
  }

  if (updates.length > 0) {
    params.push(id);
    db.prepare(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  }

  res.json({ success: true });
});

// 7. DELETE /api/shop/products/:id — Admin only, soft delete
router.delete('/products/:id', requireAdmin, (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid product ID' });

  const existing = db.prepare('SELECT id FROM products WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Product not found' });

  db.prepare('UPDATE products SET active = 0 WHERE id = ?').run(id);
  res.json({ success: true });
});

// 8. GET /api/shop/orders/all — Admin only, return ALL orders with user and items
router.get('/orders/all', requireAdmin, (req, res) => {
  const orders = db.prepare(`
    SELECT o.id, o.user_id, o.total, o.status, o.shipping_name, o.shipping_address, o.shipping_city, o.shipping_state, o.shipping_zip, o.created_at,
           u.username, u.email
    FROM orders o
    LEFT JOIN users u ON u.id = o.user_id
    ORDER BY o.created_at DESC
  `).all();

  const ordersWithItems = orders.map((order) => {
    const items = db.prepare(`
      SELECT oi.id, oi.product_id, oi.quantity, oi.price, p.name AS product_name, p.slug AS product_slug
      FROM order_items oi
      LEFT JOIN products p ON p.id = oi.product_id
      WHERE oi.order_id = ?
    `).all(order.id);
    return {
      ...order,
      user: order.username ? { id: order.user_id, username: order.username, email: order.email } : null,
      items
    };
  });

  res.json({ orders: ordersWithItems });
});

// 9. PUT /api/shop/orders/:id — Admin only, update order status
router.put('/orders/:id', requireAdmin, (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid order ID' });

  const { status } = req.body || {};
  if (!status || typeof status !== 'string' || !status.trim()) {
    return res.status(400).json({ error: 'Status is required' });
  }

  const existing = db.prepare('SELECT id, status FROM orders WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Order not found' });

  const newStatus = status.trim().toLowerCase();
  const wasPending = (existing.status || '').toLowerCase() === 'pending';
  const isCompleted = newStatus === 'completed' || newStatus === 'paid';

  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status.trim(), id);

  if (wasPending && isCompleted) {
    try {
      createProductAccessGrantsForOrder(id);
    } catch (err) {
      console.error('Product access grants creation failed for order', id, err);
    }
  }

  res.json({ success: true });
});

module.exports = router;
