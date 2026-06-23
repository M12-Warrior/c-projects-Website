'use strict';

function parseServices(raw) {
  if (Array.isArray(raw)) return raw.map((s) => String(s).trim()).filter(Boolean);
  if (typeof raw !== 'string' || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map((s) => String(s).trim()).filter(Boolean);
  } catch (_) {}
  return raw
    .split(/\r?\n/)
    .map((s) => s.replace(/^[-•*]\s*/, '').trim())
    .filter(Boolean);
}

function clampImagePosition(raw) {
  const n = Number(raw);
  if (!Number.isFinite(n)) return 50;
  return Math.min(100, Math.max(0, n));
}

function mapPartnerRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    slug: row.slug || '',
    display_title: row.display_title || '',
    display_subtitle: row.display_subtitle || '',
    cert_note: row.cert_note || '',
    phone: row.phone || '',
    address: row.address || '',
    hours: row.hours || '',
    website_url: row.website_url || '',
    maps_url: row.maps_url || '',
    services: parseServices(row.services_json),
    image_path: row.image_path || '',
    image_position_x: clampImagePosition(row.image_position_x),
    image_position_y: clampImagePosition(row.image_position_y),
    intro_copy: row.intro_copy || '',
    walk_in_note: row.walk_in_note || '',
    active: row.active ? 1 : 0,
    sort_order: row.sort_order != null ? row.sort_order : 0,
    updated_at: row.updated_at || null,
  };
}

function phoneTel(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (digits.length === 10) return '+1' + digits;
  if (digits.length === 11 && digits.startsWith('1')) return '+' + digits;
  return digits ? '+' + digits : '';
}

module.exports = {
  parseServices,
  mapPartnerRow,
  clampImagePosition,
  phoneTel,
};
