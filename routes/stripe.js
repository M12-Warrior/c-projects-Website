'use strict';

/**
 * Stripe Hosted Checkout integration for Mile 12 Warrior.
 *
 * Design goals:
 *  - PCI-light: card data only ever touches Stripe's hosted Checkout page.
 *  - Safe before keys exist: every endpoint degrades gracefully when
 *    STRIPE_SECRET_KEY is not set (lib/stripe exports null). Checkout returns a
 *    friendly 503, the webhook/confirm return 400, so deploying this can never
 *    break the live site or expose a half-built checkout.
 *  - Server is the source of truth for prices (recomputed from the DB) and for
 *    marking orders paid (Stripe webhook + a return-trip confirm fallback).
 *
 * Flow:
 *  1. POST /api/stripe/create-checkout-session — builds a pending order from the
 *     cart, creates a Stripe Checkout Session, returns its URL for redirect.
 *  2. Customer pays on Stripe's hosted page.
 *  3a. POST /api/stripe/webhook (checkout.session.completed) marks the order paid
 *      and runs fulfillment. This is the reliable path once the webhook secret is
 *      configured in Railway + Stripe.
 *  3b. POST /api/stripe/confirm (called by the receipt page on return) retrieves
 *      the session and finalizes if paid — a fallback so orders still complete
 *      even before the webhook endpoint is wired in the Stripe dashboard.
 */

const express = require('express');
const db = require('../db/database');
const stripe = require('../lib/stripe');
const shop = require('./shop');
const subscription = require('./subscription');

const router = express.Router();

function requireSession(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

// Products that include a per-yard fleet license (trigger the fleet/yard questionnaire).
const FLEET_LICENSE_PRODUCT_SLUGS = [
  'fleet-new-hire-packet',
  'fleet-refresher-packet',
  'fleet-bundle',
  'complete-bundle'
];

/** Normalize the small fleet/yard questionnaire from the checkout request body. */
function parseFleetInfo(body) {
  const fi = (body && typeof body.fleetInfo === 'object' && body.fleetInfo) ? body.fleetInfo : {};
  const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max || 200) : '');
  let numYards = parseInt(fi.numYards, 10);
  if (isNaN(numYards) || numYards < 0) numYards = null;
  if (numYards != null && numYards > 100000) numYards = 100000;
  // Per-yard list: one entry per fleet-packet unit purchased.
  // [{ slug, yardIdentifier, yardLabel }]
  const yards = [];
  if (Array.isArray(fi.yards)) {
    for (const y of fi.yards) {
      if (!y || typeof y !== 'object') continue;
      const slug = str(y.slug, 80);
      if (FLEET_LICENSE_PRODUCT_SLUGS.indexOf(slug) === -1) continue;
      yards.push({
        slug,
        yardIdentifier: str(y.yardIdentifier, 300),
        yardLabel: str(y.yardLabel, 200)
      });
    }
  }
  return {
    company: str(fi.company, 200),
    contactName: str(fi.contactName, 200),
    contactEmail: str(fi.contactEmail, 200),
    contactPhone: str(fi.contactPhone, 60),
    numYards,
    yardIdentifier: str(fi.yardIdentifier, 300),
    yardLabel: str(fi.yardLabel, 200),
    yards
  };
}

function baseUrl(req) {
  const fromEnv = process.env.BASE_URL && String(process.env.BASE_URL).trim();
  if (fromEnv) return fromEnv.replace(/\/+$/, '');
  return req.protocol + '://' + req.get('host');
}

/**
 * Mark a paid Stripe Checkout Session's order as paid and run fulfillment.
 * Idempotent: safe to call from both the webhook and the return-trip confirm.
 */
function finalizePaidOrder(session) {
  const orderId = parseInt(session && session.metadata && session.metadata.order_id, 10);
  if (!orderId) return { ok: false };

  const order = db.prepare('SELECT id, user_id, payment_status FROM orders WHERE id = ?').get(orderId);
  if (!order) return { ok: false };

  const alreadyPaid = String(order.payment_status || '').toLowerCase() === 'paid';

  const items = db.prepare(`
    SELECT p.category, p.subscription_plan, COALESCE(p.is_subscription, 0) AS is_subscription
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    WHERE oi.order_id = ?
  `).all(orderId);

  const hasPhysical = items.some((r) => {
    const c = String(r.category || '').toLowerCase();
    return c !== 'digital' && c !== 'subscription' && !r.is_subscription;
  });
  const hasSubscription = items.some((r) => r.subscription_plan === 'wellness_journal' || r.is_subscription);

  if (!alreadyPaid) {
    const paymentIntentId = typeof session.payment_intent === 'string'
      ? session.payment_intent
      : (session.payment_intent && session.payment_intent.id) || null;

    const ship = session.shipping_details
      || (session.collected_information && session.collected_information.shipping_details)
      || null;
    const cust = session.customer_details || null;
    const addr = (ship && ship.address) || (cust && cust.address) || null;
    const shipName = (ship && ship.name) || (cust && cust.name) || null;
    const shipAddress = addr
      ? [addr.line1, addr.line2].filter(Boolean).join(', ')
      : null;

    const newStatus = hasPhysical ? 'processing' : 'completed';

    db.prepare(`
      UPDATE orders
      SET payment_status = 'paid',
          paid_at = COALESCE(paid_at, datetime('now')),
          transaction_id = ?,
          payment_method = 'stripe',
          status = ?,
          shipping_name = COALESCE(?, shipping_name),
          shipping_address = COALESCE(?, shipping_address),
          shipping_city = COALESCE(?, shipping_city),
          shipping_state = COALESCE(?, shipping_state),
          shipping_zip = COALESCE(?, shipping_zip)
      WHERE id = ?
    `).run(
      paymentIntentId,
      newStatus,
      shipName,
      shipAddress,
      addr ? addr.city || null : null,
      addr ? addr.state || null : null,
      addr ? addr.postal_code || null : null,
      orderId
    );

    if (hasSubscription && order.user_id) {
      try {
        subscription.activateWellnessSubscription(order.user_id);
      } catch (err) {
        console.error('[stripe] subscription activation failed for order', orderId, err && err.message);
      }
    }
  }

  // Digital access grants are idempotent (skip if grants already exist), so it is
  // safe to call on every finalize, including a webhook that arrives after confirm.
  try {
    shop.createProductAccessGrantsForOrder(orderId);
  } catch (err) {
    console.error('[stripe] grant creation failed for order', orderId, err && err.message);
  }

  return { ok: true, orderId };
}

// POST /api/stripe/create-checkout-session — create a pending order + Stripe session
router.post('/create-checkout-session', requireSession, async (req, res) => {
  if (!stripe) {
    return res.status(503).json({
      checkoutDisabled: true,
      error: 'Online checkout is not available yet. Please check back soon, or use the Contact page with questions.'
    });
  }

  const rawItems = (req.body && Array.isArray(req.body.items)) ? req.body.items : [];
  const wanted = {};
  for (const it of rawItems) {
    const slug = it && typeof it.slug === 'string' ? it.slug.trim() : '';
    if (!slug) continue;
    let qty = parseInt(it && it.quantity, 10);
    if (isNaN(qty) || qty < 1) qty = 1;
    if (qty > 999) qty = 999;
    wanted[slug] = (wanted[slug] || 0) + qty;
  }
  const slugs = Object.keys(wanted);
  if (!slugs.length) {
    return res.status(400).json({ error: 'Your cart is empty.' });
  }

  const lineItems = [];
  const orderRows = [];
  let total = 0;
  let hasPhysical = false;
  let hasFleetPacket = false;
  const fleetQtyBySlug = {};

  for (const slug of slugs) {
    const p = db.prepare(`
      SELECT id, name, price, category, COALESCE(is_subscription, 0) AS is_subscription, subscription_plan
      FROM products WHERE slug = ? AND active = 1
    `).get(slug);
    if (!p) {
      return res.status(400).json({ error: 'A product in your cart is no longer available. Please review your cart.' });
    }
    if (slug === 'new-driver-packet') {
      return res.status(400).json({
        error: 'The New Driver Packet (Tier 1) is free - no checkout needed. View or print it on the Services page.'
      });
    }
    let qty = wanted[slug];
    // Subscriptions are billed one month at a time — always quantity 1.
    if (p.is_subscription || p.subscription_plan) qty = 1;

    const unitAmount = Math.round(Number(p.price) * 100);
    if (!(unitAmount > 0)) {
      return res.status(400).json({ error: 'A product in your cart has an invalid price. Please contact us.' });
    }
    total += (unitAmount * qty) / 100;

    const cat = String(p.category || '').toLowerCase();
    if (cat !== 'digital' && cat !== 'subscription' && !p.is_subscription) hasPhysical = true;
    if (FLEET_LICENSE_PRODUCT_SLUGS.indexOf(slug) !== -1) {
      hasFleetPacket = true;
      fleetQtyBySlug[slug] = (fleetQtyBySlug[slug] || 0) + qty;
    }

    lineItems.push({
      quantity: qty,
      price_data: {
        currency: 'usd',
        unit_amount: unitAmount,
        product_data: { name: p.name }
      }
    });
    orderRows.push({ product_id: p.id, quantity: qty, price: Number(p.price) });
  }

  // When the cart includes per-yard fleet packets, require a yard identifier for EACH
  // yard being purchased (one per fleet-packet unit) so every license ties to one yard.
  // Non-fleet carts are unaffected.
  const fleetInfo = parseFleetInfo(req.body);
  let finalYards = [];
  if (hasFleetPacket) {
    if (!fleetInfo.company) {
      return res.status(400).json({ error: 'Please enter your company / fleet name for the fleet packet.' });
    }
    // Group the provided yard identifiers by purchased slug.
    const provided = {};
    for (const y of fleetInfo.yards) {
      if (!y.yardIdentifier) continue;
      (provided[y.slug] = provided[y.slug] || []).push(y);
    }
    const totalUnits = Object.keys(fleetQtyBySlug).reduce((s, k) => s + fleetQtyBySlug[k], 0);
    // Back-compat: a single-yard cart that only sent the legacy single identifier.
    if (!fleetInfo.yards.length && totalUnits === 1 && fleetInfo.yardIdentifier) {
      const onlySlug = Object.keys(fleetQtyBySlug)[0];
      provided[onlySlug] = [{ yardIdentifier: fleetInfo.yardIdentifier, yardLabel: fleetInfo.yardLabel }];
    }
    for (const slug of Object.keys(fleetQtyBySlug)) {
      const need = fleetQtyBySlug[slug];
      const got = provided[slug] || [];
      if (got.length < need) {
        return res.status(400).json({
          error: 'Please enter a yard identifier (terminal number or physical address) for each yard. ' +
            'Each fleet packet covers one yard.'
        });
      }
      for (let i = 0; i < need; i++) {
        finalYards.push({ slug, yardIdentifier: got[i].yardIdentifier, yardLabel: got[i].yardLabel || '' });
      }
    }
    // Mirror the first yard into the legacy single-yard columns for older views.
    if (finalYards.length) {
      fleetInfo.yardIdentifier = finalYards[0].yardIdentifier;
      fleetInfo.yardLabel = finalYards[0].yardLabel;
    }
  }

  const userId = req.session.user.id;
  let orderId;
  try {
    const inserted = db.prepare(`
      INSERT INTO orders
        (user_id, total, status, payment_status,
         fleet_company, fleet_contact_name, fleet_contact_email, fleet_contact_phone,
         fleet_num_yards, yard_identifier, yard_label, fleet_yards_json)
      VALUES (?, ?, 'pending', 'pending', ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      Number(total.toFixed(2)),
      hasFleetPacket ? (fleetInfo.company || null) : null,
      hasFleetPacket ? (fleetInfo.contactName || null) : null,
      hasFleetPacket ? (fleetInfo.contactEmail || null) : null,
      hasFleetPacket ? (fleetInfo.contactPhone || null) : null,
      hasFleetPacket ? fleetInfo.numYards : null,
      hasFleetPacket ? (fleetInfo.yardIdentifier || null) : null,
      hasFleetPacket ? (fleetInfo.yardLabel || null) : null,
      hasFleetPacket && finalYards.length ? JSON.stringify(finalYards) : null
    );
    orderId = inserted.lastInsertRowid;
    const insItem = db.prepare('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)');
    for (const r of orderRows) insItem.run(orderId, r.product_id, r.quantity, r.price);
  } catch (err) {
    console.error('[stripe] failed to create pending order:', err && err.message);
    return res.status(500).json({ error: 'Could not start checkout. Please try again.' });
  }

  const base = baseUrl(req);
  const userRow = db.prepare('SELECT email FROM users WHERE id = ?').get(userId);

  try {
    const params = {
      mode: 'payment',
      line_items: lineItems,
      client_reference_id: String(orderId),
      metadata: { order_id: String(orderId), user_id: String(userId) },
      payment_intent_data: { metadata: { order_id: String(orderId), user_id: String(userId) } },
      success_url: base + '/shop/order/' + orderId + '?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: base + '/shop/cart'
    };
    if (userRow && userRow.email) params.customer_email = userRow.email;
    if (hasPhysical) params.shipping_address_collection = { allowed_countries: ['US'] };

    const checkoutSession = await stripe.checkout.sessions.create(params);
    return res.json({ url: checkoutSession.url, orderId });
  } catch (err) {
    console.error('[stripe] create checkout session failed:', err && err.message);
    // Roll back the just-created pending order so a failed/transient Stripe call
    // does not leave a stray "awaiting payment" order behind.
    try {
      db.prepare('DELETE FROM order_items WHERE order_id = ?').run(orderId);
      db.prepare("DELETE FROM orders WHERE id = ? AND COALESCE(payment_status, '') != 'paid'").run(orderId);
    } catch (_) {}
    return res.status(502).json({ error: 'Could not start checkout right now. Please try again in a moment.' });
  }
});

// POST /api/stripe/confirm — return-trip fallback so orders finalize even before
// the webhook endpoint is configured. Verifies ownership before doing anything.
router.post('/confirm', requireSession, async (req, res) => {
  if (!stripe) return res.status(400).json({ error: 'Payments are not configured.' });
  const sessionId = req.body && typeof req.body.session_id === 'string' ? req.body.session_id.trim() : '';
  if (!sessionId) return res.status(400).json({ error: 'Missing session_id.' });

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const orderId = parseInt(session.metadata && session.metadata.order_id, 10);
    if (!orderId) return res.status(404).json({ error: 'No order is linked to this checkout session.' });

    const order = db.prepare('SELECT id, user_id, payment_status FROM orders WHERE id = ?').get(orderId);
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    if (order.user_id !== req.session.user.id) return res.status(403).json({ error: 'Access denied.' });

    const ps = String(session.payment_status || '').toLowerCase();
    const paid = ps === 'paid' || ps === 'no_payment_required';
    if (paid) finalizePaidOrder(session);

    return res.json({ paid, orderId, payment_status: session.payment_status });
  } catch (err) {
    console.error('[stripe] confirm failed:', err && err.message);
    return res.status(502).json({ error: 'Could not confirm payment. Please refresh in a moment.' });
  }
});

// Raw-body webhook handler (mounted in server.js BEFORE express.json()).
function handleWebhook(req, res) {
  if (!stripe) return res.status(400).send('Stripe is not configured.');
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!whSecret) {
    console.warn('[stripe] webhook received but STRIPE_WEBHOOK_SECRET is not set; ignoring.');
    return res.status(400).send('Webhook secret not configured.');
  }
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, whSecret);
  } catch (err) {
    console.error('[stripe] webhook signature verification failed:', err && err.message);
    return res.status(400).send('Webhook Error: ' + (err && err.message));
  }

  try {
    if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
      const session = event.data.object;
      const ps = String(session.payment_status || '').toLowerCase();
      if (ps === 'paid' || ps === 'no_payment_required') {
        finalizePaidOrder(session);
      }
    }
  } catch (err) {
    console.error('[stripe] webhook handler error:', err && err.message);
  }

  return res.json({ received: true });
}

module.exports = { router, handleWebhook, finalizePaidOrder };
