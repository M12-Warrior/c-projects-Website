/** Public-facing contact addresses and mailto subjects for mile12warrior.com */
const BOOKING = 'admin@mile12warrior.com';
const GENERAL = 'joyce@mile12warrior.com';

const SUBJECTS = {
  BOOKING_SERVICES: 'Mile 12 Warrior — Booking & Services Inquiry',
  EXPO: 'Mile 12 Warrior — EXPO & Info Tent Request',
  CLASS_PRESENTATION: 'Mile 12 Warrior — Class or Group Presentation Request',
  ONE_ON_ONE: 'Mile 12 Warrior — One-on-One Education Request',
  FLEET_CONSULTING: 'Mile 12 Warrior — Fleet or Consulting Inquiry',
  WELLNESS_PARTNER: 'Mile 12 Warrior — Wellness Partner Inquiry',
  GENERAL: 'Mile 12 Warrior — General Contact',
};

/** URL-encoded subject= values for static HTML mailto links */
const SUBJECT_PARAMS = {
  BOOKING_SERVICES: 'Mile%2012%20Warrior%20%E2%80%94%20Booking%20%26%20Services%20Inquiry',
  EXPO: 'Mile%2012%20Warrior%20%E2%80%94%20EXPO%20%26%20Info%20Tent%20Request',
  CLASS_PRESENTATION: 'Mile%2012%20Warrior%20%E2%80%94%20Class%20or%20Group%20Presentation%20Request',
  ONE_ON_ONE: 'Mile%2012%20Warrior%20%E2%80%94%20One-on-One%20Education%20Request',
  FLEET_CONSULTING: 'Mile%2012%20Warrior%20%E2%80%94%20Fleet%20or%20Consulting%20Inquiry',
  WELLNESS_PARTNER: 'Mile%2012%20Warrior%20%E2%80%94%20Wellness%20Partner%20Inquiry',
  GENERAL: 'Mile%2012%20Warrior%20%E2%80%94%20General%20Contact',
};

const BOOKING_CATEGORIES = new Set([
  'booking',
  'services',
  'booking/services',
  'expo',
  'presentation',
  'one-on-one',
  'one_on_one',
  'fleet',
  'wellness-partner',
  'wellness_partner',
]);

function normalizeCategory(raw) {
  const v = (raw == null ? '' : String(raw)).trim().toLowerCase();
  if (BOOKING_CATEGORIES.has(v)) return v === 'services' || v === 'booking/services' ? 'booking' : v.replace('_', '-');
  return 'general';
}

function isBookingCategory(raw) {
  return normalizeCategory(raw) !== 'general';
}

function subjectForCategory(category) {
  switch (normalizeCategory(category)) {
    case 'expo':
      return SUBJECTS.EXPO;
    case 'presentation':
      return SUBJECTS.CLASS_PRESENTATION;
    case 'one-on-one':
      return SUBJECTS.ONE_ON_ONE;
    case 'fleet':
      return SUBJECTS.FLEET_CONSULTING;
    case 'wellness-partner':
      return SUBJECTS.WELLNESS_PARTNER;
    case 'booking':
      return SUBJECTS.BOOKING_SERVICES;
    default:
      return SUBJECTS.GENERAL;
  }
}

function categoryTag(category) {
  switch (normalizeCategory(category)) {
    case 'expo':
      return '[EXPO/Info Tent]';
    case 'presentation':
      return '[Class/Group Presentation]';
    case 'one-on-one':
      return '[One-on-One Education]';
    case 'fleet':
      return '[Fleet/Consulting]';
    case 'wellness-partner':
      return '[Wellness Partner]';
    case 'booking':
      return '[Booking/Services]';
    default:
      return '[General]';
  }
}

function mailtoBooking(subjectKey, body) {
  const subject = SUBJECTS[subjectKey] || SUBJECTS.BOOKING_SERVICES;
  let href = 'mailto:' + BOOKING + '?subject=' + encodeURIComponent(subject);
  if (body) href += '&body=' + encodeURIComponent(body);
  return href;
}

function mailtoGeneral(body) {
  let href = 'mailto:' + GENERAL + '?subject=' + encodeURIComponent(SUBJECTS.GENERAL);
  if (body) href += '&body=' + encodeURIComponent(body);
  return href;
}

module.exports = {
  BOOKING,
  GENERAL,
  SUBJECTS,
  SUBJECT_PARAMS,
  normalizeCategory,
  isBookingCategory,
  subjectForCategory,
  categoryTag,
  mailtoBooking,
  mailtoGeneral,
};
