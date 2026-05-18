'use strict';

/**
 * Stripe client (prep only - checkout not enabled yet).
 * Returns null when STRIPE_SECRET_KEY is unset so the app boots without payments configured.
 */
const secretKey = process.env.STRIPE_SECRET_KEY;
let stripe = null;

if (secretKey && String(secretKey).trim()) {
  try {
    stripe = require('stripe')(String(secretKey).trim());
  } catch (err) {
    console.warn('[stripe] Could not initialize Stripe client:', err.message);
  }
}

module.exports = stripe;