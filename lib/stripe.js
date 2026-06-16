'use strict';

/**
 * Stripe client.
 *
 * Returns null (checkout stays disabled) unless STRIPE_SECRET_KEY is set AND looks
 * like a real Stripe secret key (sk_test_/sk_live_ or a restricted rk_ key). This
 * guards against a placeholder/mistyped value silently "enabling" a checkout that
 * would then fail on every Stripe API call — keeping the live site safe until valid
 * keys are in place.
 */
const raw = process.env.STRIPE_SECRET_KEY;
const secretKey = raw ? String(raw).trim() : '';
const looksLikeStripeSecret = /^(sk|rk)_(test|live)_/.test(secretKey);

let stripe = null;

if (looksLikeStripeSecret) {
  try {
    stripe = require('stripe')(secretKey);
  } catch (err) {
    console.warn('[stripe] Could not initialize Stripe client:', err.message);
  }
} else if (secretKey) {
  console.warn('[stripe] STRIPE_SECRET_KEY is set but does not look like a Stripe secret key (expected sk_test_/sk_live_). Checkout stays disabled until a valid key is set.');
}

module.exports = stripe;