/**
 * Generates public/images/products/*.svg card placeholders (no external CDN).
 * Run: node scripts/generate-product-placeholders.js
 */
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'public', 'images', 'products');
const titles = {
  'course-90day.svg': '90-Day Onboarding',
  'seasoned-packet.svg': 'Seasoned Driver',
  'fleet-new-hire-packet.svg': 'Fleet · New hire',
  'fleet-refresher-packet.svg': 'Fleet · Refresher',
  'fleet-bundle.svg': 'Fleet Bundle',
  'complete-bundle.svg': 'Complete Bundle',
  'new-driver-packet.svg': 'New Driver Packet',
  'trucker-wellness-journal-monthly.svg': 'Journal · Monthly',
  'mile-12-warrior-t-shirt.svg': 'M12 T-Shirt',
  'reflective-safety-vest.svg': 'Safety Vest',
  'trucker-wellness-journal.svg': 'Wellness Journal',
  'mile-12-warrior-kit.svg': 'M12 Warrior Kit',
};

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function svgFor(title) {
  const t = esc(title);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="280" viewBox="0 0 400 280" role="img" aria-label="${t}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#3d3d40"/>
      <stop offset="100%" stop-color="#252528"/>
    </linearGradient>
  </defs>
  <rect width="400" height="280" fill="url(#bg)"/>
  <rect x="0" y="0" width="400" height="3" fill="#e6b800" opacity="0.9"/>
  <text x="200" y="118" text-anchor="middle" fill="#e6b800" font-family="system-ui,Segoe UI,sans-serif" font-size="20" font-weight="700">${t}</text>
  <text x="200" y="152" text-anchor="middle" fill="#a8a29e" font-family="system-ui,Segoe UI,sans-serif" font-size="12">Mile 12 Warrior</text>
</svg>
`;
}

if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
for (const [file, title] of Object.entries(titles)) {
  fs.writeFileSync(path.join(dir, file), svgFor(title), 'utf8');
}
console.log('Wrote', Object.keys(titles).length, 'SVGs to', dir);
