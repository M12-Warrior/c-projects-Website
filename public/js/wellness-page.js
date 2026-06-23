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

function imageAlt(partner) {
  if (partner.slug === 'bay-area-pain-care') {
    return 'Massage Therapy — Bay Area Pain Care sign, Riverside CA';
  }
  var title = partner.display_title || '';
  var sub = partner.display_subtitle || '';
  if (title && sub) return title + ' — ' + sub;
  return sub || title || 'Wellness partner';
}

function renderMedia(partner) {
  if (partner.image_path) {
    return '<img src="' + esc(partner.image_path) + '" alt="' + esc(imageAlt(partner)) + '" loading="lazy" decoding="async">';
  }
  return '<div class="wellness-partner-placeholder" aria-hidden="true"><p style="margin:0;font-size:0.82rem">Photo coming soon</p></div>';
}

function renderPartner(partner) {
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
    '<div class="wellness-partner-grid">' +
    '<div class="wellness-partner-media">' + renderMedia(partner) + '</div>' +
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
    '</div></div></article>';
}

fetch('/api/wellness/partners')
  .then((r) => r.json())
  .then((data) => {
    const el = document.getElementById('wellnessPartnersList');
    if (!el) return;
    const partners = (data && data.partners) || [];
    if (!partners.length) {
      el.innerHTML = '<p class="wellness-empty">Wellness partner listings will appear here soon. Check back or <a href="/contact">contact us</a> for updates.</p>';
      return;
    }
    el.innerHTML = partners.map(renderPartner).join('');
  })
  .catch(() => {
    const el = document.getElementById('wellnessPartnersList');
    if (el) el.innerHTML = '<p class="wellness-empty">Could not load partner listings. Please refresh or <a href="/contact">contact us</a>.</p>';
  });
