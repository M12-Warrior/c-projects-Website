/**
 * Business timezone for journal pricing and subscription periods (see docs/plans).
 */
const { DateTime } = require('luxon');

const ZONE = 'America/Los_Angeles';

function laNow() {
  return DateTime.now().setZone(ZONE);
}

/** Day of month (1–31) in Los Angeles for the instant `d` (default: now). */
function laDayOfMonth(d) {
  const dt = d && typeof d.toJSDate === 'function' ? d : laNow();
  return dt.day;
}

/** First-time monthly journal half-price: purchase on day 16 or later (LA). */
function isJournalHalfPriceFirstMonthDay(d) {
  return laDayOfMonth(d) > 15;
}

/** End of first subscription period: start of next calendar month, 00:00 in LA. */
function wellnessFirstPeriodEnd() {
  return laNow().startOf('month').plus({ months: 1 });
}

/** Add one calendar month in LA from an ISO or JS Date stored in DB. */
function wellnessRenewPeriodEnd(fromIsoOrDate) {
  const dt = DateTime.fromJSDate(new Date(fromIsoOrDate)).setZone(ZONE);
  return dt.plus({ months: 1 });
}

module.exports = {
  ZONE,
  laNow,
  laDayOfMonth,
  isJournalHalfPriceFirstMonthDay,
  wellnessFirstPeriodEnd,
  wellnessRenewPeriodEnd,
};
