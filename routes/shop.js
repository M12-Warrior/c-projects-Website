const express = require('express');
const db = require('../db/database');
const subscriptionRouter = require('./subscription');

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

// Generate slug from name: lowercase, spaces to hyphens, remove non-alphanumeric
function slugify(name) {
  return String(name)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

// Free stock images (Unsplash CDN) — one unique image per product, trucking/road themed where possible
const DEFAULT_PRODUCT_IMAGES = {
  // Merchandise & gear — real-time use on the road
  'mile-12-warrior-t-shirt': 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80',           // apparel
  'reflective-safety-vest': 'https://images.unsplash.com/photo-1589994965851-a8f479c573a9?w=400&q=80',         // high-vis safety
  'trucker-wellness-journal': 'https://images.unsplash.com/photo-1507925925852-0d7876ec2f8e?w=400&q=80',       // journal/notebook
  'mile-12-warrior-kit': 'https://images.unsplash.com/photo-1595435934249-5d2d4c8f6853?w=400&q=80',             // gear/kit
  // Subscription — wellness on the road
  'trucker-wellness-journal-monthly': 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&q=80', // wellness/rest
  // Digital — training & materials
  'course-90day': 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&q=80',                     // laptop/learning
  'seasoned-packet': 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&q=80',                 // documents
  'fleet-new-hire-packet': 'https://images.unsplash.com/photo-1459252619524-371e376d32b2?w=400&q=80',            // orientation/docs
  'fleet-refresher-packet': 'https://images.unsplash.com/photo-1573164713719-8dd4f693d717?w=400&q=80',          // checklist
  'fleet-bundle': 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&q=80',                       // package
  'complete-bundle': 'https://images.unsplash.com/photo-1499750315157-5cbaf2ff4b58?w=400&q=80'                   // full set
};

// Fallback — truck on highway (unique, no repeat)
const FALLBACK_PRODUCT_IMAGE = 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=400&q=80';

function applyDefaultImage(products) {
  return Array.isArray(products) ? products.map(p => ({
    ...p,
    image: p.image && p.image.trim() ? p.image : (DEFAULT_PRODUCT_IMAGES[p.slug] || FALLBACK_PRODUCT_IMAGE)
  })) : products;
}

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

// 3. POST /api/shop/orders — Require session, create order
router.post('/orders', requireSession, (req, res) => {
  const { items = [], shipping = {} } = req.body || {};

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Items array is required and must not be empty' });
  }

  const { name, address, city, state, zip } = shipping;
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Shipping name is required' });
  }
  if (!address || typeof address !== 'string' || !address.trim()) {
    return res.status(400).json({ error: 'Shipping address is required' });
  }
  if (!city || typeof city !== 'string' || !city.trim()) {
    return res.status(400).json({ error: 'Shipping city is required' });
  }
  if (!state || typeof state !== 'string' || !state.trim()) {
    return res.status(400).json({ error: 'Shipping state is required' });
  }
  if (!zip || typeof zip !== 'string' || !zip.trim()) {
    return res.status(400).json({ error: 'Shipping zip is required' });
  }

  const insertOrder = db.prepare(`
    INSERT INTO orders (user_id, total, status, shipping_name, shipping_address, shipping_city, shipping_state, shipping_zip)
    VALUES (?, ?, 'pending', ?, ?, ?, ?, ?)
  `);
  const insertOrderItem = db.prepare(`
    INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)
  `);
  const updateStock = db.prepare(`UPDATE products SET stock = stock - ? WHERE id = ?`);
  const getProduct = db.prepare(`SELECT id, price, stock, subscription_plan FROM products WHERE id = ? AND active = 1`);

  let total = 0;
  const validatedItems = [];

  for (const item of items) {
    const productId = parseInt(item.product_id, 10);
    const quantity = parseInt(item.quantity, 10);
    if (isNaN(productId) || isNaN(quantity) || quantity < 1) {
      return res.status(400).json({ error: `Invalid item: product_id and quantity required (quantity >= 1)` });
    }

    const product = getProduct.get(productId);
    if (!product) {
      return res.status(400).json({ error: `Product ${productId} not found or inactive` });
    }
    if (product.stock < quantity) {
      return res.status(400).json({ error: `Insufficient stock for product ${productId}. Available: ${product.stock}` });
    }

    validatedItems.push({ product_id: productId, quantity, price: product.price, subscription_plan: product.subscription_plan });
    total += product.price * quantity;
  }

  const run = db.transaction(() => {
    const orderResult = insertOrder.run(
      req.session.user.id,
      total,
      name.trim(),
      address.trim(),
      city.trim(),
      state.trim(),
      zip.trim()
    );
    const orderId = orderResult.lastInsertRowid;

    for (const item of validatedItems) {
      insertOrderItem.run(orderId, item.product_id, item.quantity, item.price);
      updateStock.run(item.quantity, item.product_id);
    }

    return { id: orderId, total, status: 'pending' };
  });

  const order = run();

  for (const item of validatedItems) {
    if (item.subscription_plan === 'wellness_journal') {
      try {
        subscriptionRouter.activateWellnessSubscription(req.session.user.id);
      } catch (_) {}
      break;
    }
  }

  res.json({ success: true, order });
});

// 4. GET /api/shop/orders — Require session, return user's orders with items
router.get('/orders', requireSession, (req, res) => {
  const orders = db.prepare(`
    SELECT o.id, o.total, o.status, o.shipping_name, o.shipping_address, o.shipping_city, o.shipping_state, o.shipping_zip, o.created_at
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

// 4b. GET /api/shop/course-access — Has the current user purchased the full course or complete bundle? (for course page gate)
router.get('/course-access', (req, res) => {
  if (!req.session || !req.session.user) {
    return res.json({ hasCourseAccess: false });
  }
  const row = db.prepare(`
    SELECT 1
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    JOIN products p ON p.id = oi.product_id
    WHERE o.user_id = ? AND o.status != 'cancelled'
      AND p.slug IN ('course-90day', 'complete-bundle')
    LIMIT 1
  `).get(req.session.user.id);
  res.json({ hasCourseAccess: !!row });
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

  const existing = db.prepare('SELECT id FROM orders WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Order not found' });

  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status.trim(), id);
  res.json({ success: true });
});

module.exports = router;
