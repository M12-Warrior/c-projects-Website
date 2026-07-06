/** Predefined Family Circle recipe labels — slug → display name */
const PREDEFINED = {
  'steady-energy': 'Steady energy',
  'cab-friendly': 'Cab-friendly',
  'cooler-ready': 'Cooler-ready',
  'no-cook': 'No cook',
  'care-package': 'Care package',
  'home-prep': 'Home prep',
  'kid-friendly': 'Kid-friendly',
  'quick-prep': 'Quick prep'
};

function labelDisplay(slug) {
  if (!slug) return '';
  const key = String(slug).trim().toLowerCase();
  return PREDEFINED[key] || key.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function normalizeLabel(raw) {
  const base = String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .slice(0, 40);
  return base || null;
}

function normalizeLabels(input) {
  const list = Array.isArray(input) ? input : String(input || '').split(/[,;]+/);
  const out = [];
  for (const item of list) {
    const slug = normalizeLabel(item);
    if (slug && !out.includes(slug)) out.push(slug);
    if (out.length >= 8) break;
  }
  return out;
}

function parseLabelsJson(raw) {
  try {
    const parsed = JSON.parse(raw || '[]');
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch (_) {
    return [];
  }
}

module.exports = {
  PREDEFINED,
  labelDisplay,
  normalizeLabel,
  normalizeLabels,
  parseLabelsJson
};
