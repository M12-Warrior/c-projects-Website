const express = require('express');
const db = require('../db/database');
const subscriptionRouter = require('./subscription');
const AuthorizeNet = require('authorizenet');
const ApiContracts = AuthorizeNet.APIContracts;
const ApiControllers = AuthorizeNet.APIControllers;
const constants = AuthorizeNet.Constants;
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

/** Canonical site URL for links in emails (prefer BASE_URL env). */
function publicBaseUrl(req) {
  const env = (process.env.BASE_URL || '').trim().replace(/\/$/, '');
  if (env) return env;
  const host = req.get('host') || 'localhost:3000';
  const proto = req.get('x-forwarded-proto') || (process.env.NODE_ENV === 'production' ? 'https' : 'http');
  return `${proto}://${host}`;
}

/** Order confirmation email; does not throw. Logs if SMTP missing or send fails. */
function sendOrderConfirmationEmail(toEmail, orderId, receiptUrl, totalNum) {
  const totalStr = typeof totalNum === 'number' ? totalNum.toFixed(2) : String(totalNum || '0');
  const text =
    'Thank you for your purchase at Mile 12 Warrior.\n\n' +
    `Order #${orderId} — total $${totalStr}\n\n` +
    `View your receipt anytime (sign in may be required):\n${receiptUrl}\n\n` +
    'Questions? Reply to this email or use the Contact page on our site.\n\n' +
    'This message is for your records. Mile 12 Warrior provides educational information, not legal or medical advice.';
  const siteOrigin = receiptUrl.replace(/\/shop\/order\/\d+.*$/, '');
  const contactUrl = `${siteOrigin}/contact`;
  const html =
    '<p>Thank you for your purchase at <strong>Mile 12 Warrior</strong>.</p>' +
    `<p><strong>Order #${orderId}</strong> — total <strong>$${totalStr}</strong></p>` +
    `<p><a href="${receiptUrl}">View your receipt</a> (sign in may be required).</p>` +
    `<p>Questions? <a href="${contactUrl}">Contact us</a>.</p>` +
    '<p style="font-size:0.85rem;color:#666">Educational information only; not legal or medical advice.</p>';
  try {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    if (host && user && pass) {
      const nodemailer = require('nodemailer');
      const port = parseInt(process.env.SMTP_PORT, 10) || 587;
      const from = process.env.FROM_EMAIL || process.env.SMTP_USER || 'noreply@mile12warrior.com';
      const transport = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
      transport.sendMail(
        {
          from,
          to: toEmail,
          subject: `Mile 12 Warrior — Order #${orderId} confirmed`,
          text,
          html,
        },
        function (err) {
          if (err) console.error('[order confirmation email]', err);
        }
      );
      return;
    }
  } catch (e) {
    console.error('[order confirmation email]', e && e.message);
  }
  console.log('[order confirmation email] No SMTP; receipt URL for order', orderId, ':', receiptUrl);
}

// Authorize.net SDK: execute() does not invoke the callback when Axios fails (apicontrollersbase.js).
const AUTHORIZE_EXECUTE_TIMEOUT_MS = 125000;

/** Strip BOM / whitespace / wrapping quotes from pasted Railway secrets. */
function envAuthorizeCredential(raw) {
  if (raw == null) return '';
  let s = String(raw).replace(/^\uFEFF/, '').trim();
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    s = s.slice(1, -1).trim();
  }
  return s;
}

function executeAuthorizeController(controller) {
  return new Promise((resolve, reject) => {
    let settled = false;
    let pollInterval;
    let timeoutId;
    const cleanup = () => {
      if (pollInterval) clearInterval(pollInterval);
      if (timeoutId) clearTimeout(timeoutId);
    };

    pollInterval = setInterval(() => {
      const err = typeof controller.getError === 'function' ? controller.getError() : null;
      if (err && !settled) {
        settled = true;
        cleanup();
        reject(err);
      }
    }, 100);

    controller.execute(() => {
      if (settled) return;
      settled = true;
      cleanup();
      try {
        const err = typeof controller.getError === 'function' ? controller.getError() : null;
        if (err) {
          reject(err);
          return;
        }
        resolve(controller.getResponse());
      } catch (e) {
        reject(e);
      }
    });

    timeoutId = setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      const err = typeof controller.getError === 'function' ? controller.getError() : null;
      reject(err || new Error('Authorize.net request timed out or did not complete'));
    }, AUTHORIZE_EXECUTE_TIMEOUT_MS);
  });
}

function summarizeAxiosError(err) {
  if (!err) return null;
  const out = {
    name: err.name,
    message: err.message,
    code: err.code,
  };
  if (err.response) {
    out.httpStatus = err.response.status;
    out.httpStatusText = err.response.statusText;
    const d = err.response.data;
    if (d != null) {
      try {
        const s = typeof d === 'string' ? d : JSON.stringify(d);
        out.responseBodySnippet = s.length > 2000 ? `${s.slice(0, 2000)}…` : s;
      } catch (_) {
        out.responseBodySnippet = '[unserializable]';
      }
    }
  }
  return out;
}

function summarizeAuthorizeTransactionResponse(response) {
  const out = {};
  const msgs = response.getMessages();
  if (msgs) {
    out.resultCode = msgs.getResultCode();
    const mlist = msgs.getMessage();
    out.apiMessages = [];
    if (mlist) {
      const arr = Array.isArray(mlist) ? mlist : [mlist];
      for (const m of arr) {
        if (m && m.getCode && m.getText) {
          out.apiMessages.push({ code: m.getCode(), text: m.getText() });
        }
      }
    }
  }
  const tr = response.getTransactionResponse();
  if (tr) {
    out.transaction = {
      responseCode: tr.getResponseCode(),
      transId: tr.getTransId(),
      authCode: tr.getAuthCode(),
      avsResultCode: tr.getAvsResultCode(),
      cvvResultCode: tr.getCvvResultCode(),
      accountNumber: tr.getAccountNumber(),
    };
    const errs = tr.getErrors();
    if (errs && errs.getError) {
      const el = errs.getError();
      const arr = Array.isArray(el) ? el : el ? [el] : [];
      out.transactionErrors = arr.map((e) => ({
        code: e.getErrorCode ? e.getErrorCode() : undefined,
        text: e.getErrorText ? e.getErrorText() : undefined,
      }));
    }
    const trMsgs = tr.getMessages && tr.getMessages();
    if (trMsgs && trMsgs.getMessage) {
      const ml = trMsgs.getMessage();
      const arr = Array.isArray(ml) ? ml : ml ? [ml] : [];
      out.transactionMessages = arr.map((m) => ({
        code: m.getCode ? m.getCode() : undefined,
        description: m.getDescription ? m.getDescription() : undefined,
      }));
    }
  }
  return out;
}

function logAuthorizePaymentFailure(context) {
  console.error('[authorize.net]', JSON.stringify(context));
}

function firstApiLevelMessage(msgs) {
  if (!msgs) return 'Payment could not be processed.';
  const mlist = msgs.getMessage();
  if (!mlist) return 'Payment could not be processed.';
  const arr = Array.isArray(mlist) ? mlist : [mlist];
  const first = arr[0];
  if (first && first.getText) return first.getText();
  return 'Payment could not be processed.';
}

function firstDeclineUserMessage(tr) {
  const errs = tr.getErrors && tr.getErrors();
  if (errs && errs.getError) {
    const el = errs.getError();
    const arr = Array.isArray(el) ? el : el ? [el] : [];
    if (arr[0] && arr[0].getErrorText) return arr[0].getErrorText();
  }
  const trMsgs = tr.getMessages && tr.getMessages();
  if (trMsgs && trMsgs.getMessage) {
    const ml = trMsgs.getMessage();
    const arr = Array.isArray(ml) ? ml : ml ? [ml] : [];
    if (arr[0] && arr[0].getDescription) return arr[0].getDescription();
  }
  return 'Payment was declined. Please try another card or contact your bank.';
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
  'new-driver-packet': 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&q=80',              // guides/documents
  'seasoned-packet': 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&q=80',                 // documents
  'fleet-new-hire-packet': 'https://images.unsplash.com/photo-1459252619524-371e376d32b2?w=400&q=80',            // orientation/docs
  'fleet-refresher-packet': 'https://images.unsplash.com/photo-1573164713719-8dd4f693d717?w=400&q=80',          // checklist
  'fleet-bundle': 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&q=80',                       // package
  'complete-bundle': 'https://images.unsplash.com/photo-1499750315157-5cbaf2ff4b58?w=400&q=80'                   // full set
};

// Fallback — truck on highway (unique, no repeat)
const FALLBACK_PRODUCT_IMAGE = 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=400&q=80';

function ensureHttpsImage(url) {
  if (!url || typeof url !== 'string') return url;
  const u = url.trim();
  return u.replace(/^http:\/\//i, 'https://');
}
function applyDefaultImage(products) {
  return Array.isArray(products) ? products.map(p => {
    const img = p.image && p.image.trim() ? ensureHttpsImage(p.image) : (DEFAULT_PRODUCT_IMAGES[p.slug] || FALLBACK_PRODUCT_IMAGE);
    return { ...p, image: img };
  }) : products;
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
// router.post('/orders', requireSession, (req, res) => {
//   const { items = [], shipping = {} } = req.body || {};

//   if (!Array.isArray(items) || items.length === 0) {
//     return res.status(400).json({ error: 'Items array is required and must not be empty' });
//   }

//   const { name, address, city, state, zip } = shipping;
//   if (!name || typeof name !== 'string' || !name.trim()) {
//     return res.status(400).json({ error: 'Shipping name is required' });
//   }
//   if (!address || typeof address !== 'string' || !address.trim()) {
//     return res.status(400).json({ error: 'Shipping address is required' });
//   }
//   if (!city || typeof city !== 'string' || !city.trim()) {
//     return res.status(400).json({ error: 'Shipping city is required' });
//   }
//   if (!state || typeof state !== 'string' || !state.trim()) {
//     return res.status(400).json({ error: 'Shipping state is required' });
//   }
//   if (!zip || typeof zip !== 'string' || !zip.trim()) {
//     return res.status(400).json({ error: 'Shipping zip is required' });
//   }

//   const insertOrder = db.prepare(`
//     INSERT INTO orders (user_id, total, status, shipping_name, shipping_address, shipping_city, shipping_state, shipping_zip)
//     VALUES (?, ?, 'pending', ?, ?, ?, ?, ?)
//   `);
//   const insertOrderItem = db.prepare(`
//     INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)
//   `);
//   const updateStock = db.prepare(`UPDATE products SET stock = stock - ? WHERE id = ?`);
//   const getProduct = db.prepare(`SELECT id, price, stock, subscription_plan FROM products WHERE id = ? AND active = 1`);

//   let total = 0;
//   const validatedItems = [];

//   for (const item of items) {
//     const productId = parseInt(item.product_id, 10);
//     const quantity = parseInt(item.quantity, 10);
//     if (isNaN(productId) || isNaN(quantity) || quantity < 1) {
//       return res.status(400).json({ error: `Invalid item: product_id and quantity required (quantity >= 1)` });
//     }

//     const product = getProduct.get(productId);
//     if (!product) {
//       return res.status(400).json({ error: `Product ${productId} not found or inactive` });
//     }
//     if (product.stock < quantity) {
//       return res.status(400).json({ error: `Insufficient stock for product ${productId}. Available: ${product.stock}` });
//     }

//     validatedItems.push({ product_id: productId, quantity, price: product.price, subscription_plan: product.subscription_plan });
//     total += product.price * quantity;
//   }

//   const run = db.transaction(() => {
//     const orderResult = insertOrder.run(
//       req.session.user.id,
//       total,
//       name.trim(),
//       address.trim(),
//       city.trim(),
//       state.trim(),
//       zip.trim()
//     );
//     const orderId = orderResult.lastInsertRowid;

//     for (const item of validatedItems) {
//       insertOrderItem.run(orderId, item.product_id, item.quantity, item.price);
//       updateStock.run(item.quantity, item.product_id);
//     }

//     return { id: orderId, total, status: 'pending' };
//   });

//   const order = run();

//   for (const item of validatedItems) {
//     if (item.subscription_plan === 'wellness_journal') {
//       try {
//         subscriptionRouter.activateWellnessSubscription(req.session.user.id);
//       } catch (_) {}
//       break;
//     }
//   }

//   res.json({ success: true, order });
// });
// Accept.js (browser) + API charge must use the same merchant: Login ID + Public Client Key here, Transaction Key on charge.
router.get('/payment-config', (req, res) => {
  const loginId = envAuthorizeCredential(process.env.AUTHORIZE_LOGIN_ID);
  const publicKey = envAuthorizeCredential(process.env.AUTHORIZE_PUBLIC_CLIENT_KEY);
  const useProd = process.env.AUTHORIZE_USE_PRODUCTION === '1';
  if (!loginId || !publicKey) {
    const missing = [];
    if (!loginId) missing.push('AUTHORIZE_LOGIN_ID');
    if (!publicKey) missing.push('AUTHORIZE_PUBLIC_CLIENT_KEY');
    return res.json({
      configured: false,
      mode: useProd ? 'production' : 'sandbox',
      message:
        'Set AUTHORIZE_LOGIN_ID and AUTHORIZE_PUBLIC_CLIENT_KEY in the server environment (same merchant as AUTHORIZE_TRANSACTION_KEY).',
      missing,
    });
  }
  res.json({
    configured: true,
    mode: useProd ? 'production' : 'sandbox',
    acceptScriptUrl: useProd
      ? 'https://js.authorize.net/v1/Accept.js'
      : 'https://jstest.authorize.net/v1/Accept.js',
    apiLoginId: loginId,
    publicClientKey: publicKey,
  });
});

// ==================== NEW AUTHORIZE.NET PAYMENT ROUTE (TEST MODE) ====================
router.post('/orders', requireSession, async (req, res) => {
  const { items = [], shipping = {}, opaqueDataDescriptor, opaqueDataValue } = req.body || {};

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Items array is required' });
  }
  if (!opaqueDataDescriptor || !opaqueDataValue) {
    return res.status(400).json({ error: 'Payment data is required' });
  }

  const { name, address, city, state, zip } = shipping;
  if (!name || !address || !city || !state || !zip) {
    return res.status(400).json({ error: 'Complete shipping info required' });
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
      return res.status(400).json({ error: 'Invalid item' });
    }
    const product = getProduct.get(productId);
    if (!product) return res.status(400).json({ error: `Product ${productId} not found` });
    if (product.stock < quantity) return res.status(400).json({ error: `Insufficient stock` });

    validatedItems.push({ product_id: productId, quantity, price: product.price, subscription_plan: product.subscription_plan });
    total += product.price * quantity;
  }

  // === AUTHORIZE.NET CHARGE ===
  try {
    const loginId = envAuthorizeCredential(process.env.AUTHORIZE_LOGIN_ID);
    const transactionKey = envAuthorizeCredential(process.env.AUTHORIZE_TRANSACTION_KEY);
    if (!loginId || !transactionKey) {
      console.error('[authorize.net]', JSON.stringify({
        event: 'missing_merchant_credentials',
        userId: req.session.user.id,
        hasLoginId: Boolean(loginId),
        hasTransactionKey: Boolean(transactionKey),
      }));
      return res.status(500).json({ error: 'Payment configuration error. Please contact support.' });
    }
    const merchantAuthentication = new ApiContracts.MerchantAuthenticationType();
    merchantAuthentication.setName(loginId);
    merchantAuthentication.setTransactionKey(transactionKey);

    const transactionRequest = new ApiContracts.TransactionRequestType();
    transactionRequest.setTransactionType(ApiContracts.TransactionTypeEnum.AUTHCAPTURETRANSACTION);
    transactionRequest.setAmount(total.toFixed(2));
    const opaqueData = new ApiContracts.OpaqueDataType();
    opaqueData.setDataDescriptor(opaqueDataDescriptor);
    opaqueData.setDataValue(opaqueDataValue);
    const paymentType = new ApiContracts.PaymentType();
    paymentType.setOpaqueData(opaqueData);
    transactionRequest.setPayment(paymentType);

    const billTo = new ApiContracts.CustomerAddressType();
    billTo.setFirstName(name.split(' ')[0]);
    billTo.setLastName(name.split(' ').slice(1).join(' ') || '');
    billTo.setAddress(address);
    billTo.setCity(city);
    billTo.setState(state);
    billTo.setZip(zip);
    transactionRequest.setBillTo(billTo);

    const createRequest = new ApiContracts.CreateTransactionRequest();
    createRequest.setMerchantAuthentication(merchantAuthentication);
    createRequest.setTransactionRequest(transactionRequest);

    const controller = new ApiControllers.CreateTransactionController(createRequest.getJSON());
    // SDK expects full gateway URL (see authorizenet lib/apicontrollersbase.js), not an enum.
    const authorizeEndpoint =
      process.env.AUTHORIZE_USE_PRODUCTION === '1'
        ? constants.endpoint.production
        : constants.endpoint.sandbox;
    controller.setEnvironment(authorizeEndpoint);

    const raw = await executeAuthorizeController(controller);
    const innerPayload = raw && raw.createTransactionResponse ? raw.createTransactionResponse : raw;
    const response = new ApiContracts.CreateTransactionResponse(innerPayload);

    const topMessages = response.getMessages();
    if (!topMessages || topMessages.getResultCode() !== 'Ok') {
      logAuthorizePaymentFailure({
        event: 'api_messages_not_ok',
        userId: req.session.user.id,
        amount: total.toFixed(2),
        endpoint: authorizeEndpoint,
        credentialMeta: { loginIdLen: loginId.length, transactionKeyLen: transactionKey.length },
        summary: summarizeAuthorizeTransactionResponse(response),
      });
      return res.status(400).json({ error: firstApiLevelMessage(topMessages) });
    }

    const transResponse = response.getTransactionResponse();
    if (!transResponse) {
      logAuthorizePaymentFailure({
        event: 'missing_transaction_response',
        userId: req.session.user.id,
        amount: total.toFixed(2),
        endpoint: authorizeEndpoint,
        summary: summarizeAuthorizeTransactionResponse(response),
      });
      return res.status(400).json({ error: 'Payment could not be processed.' });
    }

    const cardResponseCode = transResponse.getResponseCode();
    if (cardResponseCode !== '1') {
      logAuthorizePaymentFailure({
        event: 'transaction_declined_or_error',
        userId: req.session.user.id,
        amount: total.toFixed(2),
        endpoint: authorizeEndpoint,
        summary: summarizeAuthorizeTransactionResponse(response),
      });
      return res.status(400).json({ error: firstDeclineUserMessage(transResponse) });
    }

    const transactionId = transResponse.getTransId();
    const authCode = transResponse.getAuthCode();

    const run = db.transaction(() => {
      const orderResult = insertOrder.run(
        req.session.user.id, total, name.trim(), address.trim(), city.trim(), state.trim(), zip.trim()
      );
      const orderId = orderResult.lastInsertRowid;

      for (const item of validatedItems) {
        insertOrderItem.run(orderId, item.product_id, item.quantity, item.price);
        updateStock.run(item.quantity, item.product_id);
      }

      db.prepare(`
        UPDATE orders 
        SET payment_status = 'paid', 
            transaction_id = ?, 
            auth_code = ?, 
            paid_at = datetime('now'), 
            payment_method = 'authorize.net' 
        WHERE id = ?
      `).run(transactionId, authCode, orderId);

      return { id: orderId, total, status: 'paid' };
    });

    const order = run();

    for (const item of validatedItems) {
      if (item.subscription_plan === 'wellness_journal') {
        try { subscriptionRouter.activateWellnessSubscription(req.session.user.id); } catch (_) {}
        break;
      }
    }
    createProductAccessGrantsForOrder(order.id);

    res.json({ success: true, order });

    const base = publicBaseUrl(req);
    const receiptUrl = `${base}/shop/order/${order.id}`;
    setImmediate(() => {
      try {
        const row = db.prepare('SELECT email FROM users WHERE id = ?').get(req.session.user.id);
        if (row && row.email) {
          sendOrderConfirmationEmail(String(row.email).trim(), order.id, receiptUrl, total);
        }
      } catch (e) {
        console.error('[order confirmation email] enqueue failed', e && e.message);
      }
    });
  } catch (err) {
    const isAxios = err && (err.isAxiosError === true || err.name === 'AxiosError');
    logAuthorizePaymentFailure({
      event: isAxios ? 'axios_transport_error' : 'payment_exception',
      userId: req.session.user.id,
      amount: total.toFixed(2),
      endpoint:
        process.env.AUTHORIZE_USE_PRODUCTION === '1'
          ? constants.endpoint.production
          : constants.endpoint.sandbox,
      axios: isAxios ? summarizeAxiosError(err) : undefined,
      error: !isAxios ? { name: err.name, message: err.message } : undefined,
    });
    return res.status(500).json({ error: 'Payment failed. Please try again or contact us.' });
  }
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
    SELECT oi.id, oi.product_id, oi.quantity, oi.price, p.name AS product_name, p.slug AS product_slug
    FROM order_items oi
    LEFT JOIN products p ON p.id = oi.product_id
    WHERE oi.order_id = ?
  `).all(id);
  const { user_id, ...safe } = order;
  res.json({ order: { ...safe, items } });
});

// 4b. GET /api/shop/course-access — Has the current user purchased the full course or complete bundle? (for course page gate)
// Course access does not expire; fleet packet access uses packet-access and expires at 12 months.
router.get('/course-access', (req, res) => {
  if (!req.session || !req.session.user) {
    return res.json({ hasCourseAccess: false });
  }
  const uid = req.session.user.id;
  const now = new Date().toISOString();
  // Prefer valid grant (course-90day grant has no expiry)
  const grantRow = db.prepare(`
    SELECT 1 FROM product_access_grants
    WHERE user_id = ? AND product_slug = 'course-90day'
      AND (expires_at IS NULL OR expires_at > ?)
    LIMIT 1
  `).get(uid, now);
  if (grantRow) return res.json({ hasCourseAccess: true });
  // Fallback: completed order with course (backward compat / before grants existed)
  const orderRow = db.prepare(`
    SELECT 1
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    JOIN products p ON p.id = oi.product_id
    WHERE o.user_id = ? AND o.status != 'cancelled'
      AND p.slug IN ('course-90day', 'complete-bundle')
    LIMIT 1
  `).get(uid);
  res.json({ hasCourseAccess: !!orderRow });
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
