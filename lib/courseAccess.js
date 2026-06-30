'use strict';

const db = require('../db/database');
const { isFreeDigitalAccess } = require('./paymentConfig');

function userHasCourseAccess(userId, role) {
  if (role === 'admin') return true;
  if (isFreeDigitalAccess()) return true;
  if (!userId) return false;

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

module.exports = { userHasCourseAccess };
