'use strict';

function esc(s) {
  const d = { t: s == null ? '' : String(s) };
  return d.t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function phoneTel(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length === 10) return '+1' + digits;
  if (digits.length === 11 && digits.charAt(0) === '1') return '+' + digits;
  return digits ? '+' + digits : '';
}

function clampPosition(raw) {
  const n = Number(raw);
  if (!Number.isFinite(n)) return 50;
  return Math.min(100, Math.max(0, n));
}

function objectPosition(partner) {
  const x = clampPosition(partner.image_position_x);
  const y = clampPosition(partner.image_position_y);
  return x + '% ' + y + '%';
}

function imageAlt(partner) {
  if (partner.slug === 'bay-area-pain-care') {
    return 'Massage Therapy — Bay Area Pain Care sign, Riverside CA';
  }
  var title = partner.display_title || '';
  var sub = partner.display_subtitle || '';
  if (title && sub) return title + ' — ' + sub;
  return sub || title || 'Wellness partner';
}

function renderBanner(partner, isAdmin) {
  if (partner.image_path) {
    return '<div class="wellness-partner-banner">' +
      '<img src="' + esc(partner.image_path) + '" alt="' + esc(imageAlt(partner)) + '" loading="lazy" decoding="async" style="object-position:' + esc(objectPosition(partner)) + '">' +
      '</div>';
  }
  var adminLink = isAdmin
    ? '<p style="margin:8px 0 0;font-size:0.75rem"><a href="/admin?tab=partners" style="color:var(--gold);text-decoration:none">Manage in Admin → Wellness Partners</a></p>'
    : '';
  return '<div class="wellness-partner-banner wellness-partner-banner--empty" aria-hidden="true">' +
    '<div class="wellness-partner-placeholder"><p style="margin:0;font-size:0.82rem">Photo coming soon</p>' + adminLink + '</div>' +
    '</div>';
}

function renderPartner(partner, isAdmin) {
  const tel = phoneTel(partner.phone);
  const services = (partner.services || []).map((s) => '<li>' + esc(s) + '</li>').join('');
  const websiteBtn = partner.website_url
    ? '<a href="' + esc(partner.website_url) + '" class="btn btn-secondary" target="_blank" rel="noopener noreferrer"><span>Visit website</span></a>'
    : '';
  const mapsBtn = partner.maps_url
    ? '<a href="' + esc(partner.maps_url) + '" class="btn btn-primary" target="_blank" rel="noopener noreferrer"><span>Get directions</span></a>'
    : '';
  const callBtn = tel ? '<a href="tel:' + esc(tel) + '" class="btn btn-primary"><span>Call ' + esc(partner.phone) + '</span></a>' : '';
  const textBtn = tel ? '<a href="sms:' + esc(tel) + '" class="btn btn-secondary"><span>Text for appointment</span></a>' : '';
  return '<article class="wellness-partner-card" id="partner-' + esc(partner.slug) + '">' +
    renderBanner(partner, isAdmin) +
    '<div class="wellness-partner-body">' +
    '<h2 class="wellness-brand-title">' + esc(partner.display_title) + '</h2>' +
    '<p class="wellness-brand-subtitle">' + esc(partner.display_subtitle) + '</p>' +
    (partner.cert_note ? '<p class="wellness-cert-note">' + esc(partner.cert_note) + '</p>' : '') +
    (partner.intro_copy ? '<p class="wellness-intro">' + esc(partner.intro_copy) + '</p>' : '') +
    (services ? '<ul class="wellness-services">' + services + '</ul>' : '') +
    '<div class="wellness-meta">' +
    (partner.phone ? '<div><strong>Phone</strong><a href="tel:' + esc(tel) + '">' + esc(partner.phone) + '</a></div>' : '') +
    (partner.address ? '<div><strong>Address</strong>' + esc(partner.address) + '</div>' : '') +
    (partner.hours ? '<div><strong>Hours</strong>' + esc(partner.hours) + '</div>' : '') +
    (partner.website_url ? '<div><strong>Website</strong><a href="' + esc(partner.website_url) + '" target="_blank" rel="noopener noreferrer">' + esc(partner.website_url.replace(/^https?:\/\//, '')) + '</a></div>' : '') +
    '</div>' +
    '<div class="wellness-cta-row">' + callBtn + textBtn + mapsBtn + websiteBtn + '</div>' +
    (partner.walk_in_note ? '<p class="wellness-walk-in">' + esc(partner.walk_in_note) + '</p>' : '') +
    '</div></article>';
}

Promise.all([
  fetch('/api/wellness/partners').then((r) => r.json()),
  fetch('/api/auth/me', { credentials: 'include' }).then((r) => r.json()).catch(() => ({ user: null }))
]).then(([data, auth]) => {
  const el = document.getElementById('wellnessPartnersList');
  if (!el) return;
  const isAdmin = !!(auth && auth.user && auth.user.role === 'admin');
  const partners = (data && data.partners) || [];
  if (!partners.length) {
    el.innerHTML = '<p class="wellness-empty">Wellness partner listings will appear here soon. Check back or <a href="/contact">contact us</a> for updates.</p>';
    return;
  }
  el.innerHTML = partners.map((p) => renderPartner(p, isAdmin)).join('');
}).catch(() => {
  const el = document.getElementById('wellnessPartnersList');
  if (el) el.innerHTML = '<p class="wellness-empty">Could not load partner listings. Please refresh or <a href="/contact">contact us</a>.</p>';
});
