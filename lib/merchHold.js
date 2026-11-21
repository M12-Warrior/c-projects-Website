'use strict';

/**
 * Physical merch with no printer attached yet.
 * Cards stay visible. Checkout must refuse these slugs until the hold is removed.
 */
const HELD_SLUGS = new Set([
  'mile-12-warrior-t-shirt',
  'reflective-safety-vest',
  'mile-12-warrior-kit'
]);

function isHeld(slug) {
  return HELD_SLUGS.has(String(slug || ''));
}

const checkoutError = 'The shirt, vest, and kit are out of stock. Remove them from your cart and check back soon. Packets and the course can still be purchased.';

module.exports = {
  HELD_SLUGS,
  isHeld,
  checkoutError
};
