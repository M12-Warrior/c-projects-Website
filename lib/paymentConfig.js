'use strict';

const stripe = require('./stripe');

// Checkout paused by default. Set CHECKOUT_PAUSED=false in Railway to re-enable Stripe checkout.
function isCheckoutPaused() {
  return process.env.CHECKOUT_PAUSED !== 'false';
}

function isCheckoutEnabled() {
  if (isCheckoutPaused()) return false;
  return !!stripe;
}

function isFreeDigitalAccess() {
  return isCheckoutPaused();
}

function paymentConfigPayload() {
  const rawSecret = process.env.STRIPE_SECRET_KEY ? String(process.env.STRIPE_SECRET_KEY).trim() : '';
  const rawPub = process.env.STRIPE_PUBLISHABLE_KEY ? String(process.env.STRIPE_PUBLISHABLE_KEY).trim() : '';
  let mode = null;
  if (/_live_/.test(rawSecret)) mode = 'live';
  else if (/_test_/.test(rawSecret)) mode = 'test';
  const paused = isCheckoutPaused();
  const stripeConfigured = !!stripe;
  return {
    enabled: isCheckoutEnabled(),
    paused,
    freeDigitalAccess: isFreeDigitalAccess(),
    freeAccess: isFreeDigitalAccess(),
    provider: stripeConfigured ? 'stripe' : null,
    mode,
    publishableKey: /^pk_(test|live)_/.test(rawPub) ? rawPub : null,
    pauseReason: paused
      ? 'Checkout is paused while we prepare the drivers gear shop. Digital training and packets are free in the meantime.'
      : null
  };
}

module.exports = {
  isCheckoutPaused,
  isCheckoutEnabled,
  isFreeDigitalAccess,
  isFreeAccessMode: isFreeDigitalAccess,
  paymentConfigPayload
};