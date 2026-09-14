/**
 * Google Analytics 4 (public Measurement ID — safe in client HTML).
 * Override with GA_MEASUREMENT_ID on Railway if the property ever changes.
 */
const GA_MEASUREMENT_ID = (process.env.GA_MEASUREMENT_ID || 'G-E2E8MV3M2W').trim();

function gaHeadSnippet(id) {
  if (!id || !/^G-[A-Z0-9]+$/i.test(id)) return '';
  return [
    '<!-- Google Analytics (GA4) -->',
    '<script async src="https://www.googletagmanager.com/gtag/js?id=' + id + '"></script>',
    '<script>',
    'window.dataLayer = window.dataLayer || [];',
    'function gtag(){dataLayer.push(arguments);}',
    "gtag('js', new Date());",
    "gtag('config', '" + id + "', { anonymize_ip: true });",
    '</script>'
  ].join('\n');
}

function injectGaIntoHtml(html, opts) {
  if (!html || typeof html !== 'string') return html;
  if (!GA_MEASUREMENT_ID) return html;
  if (/googletagmanager\.com\/gtag\/js/i.test(html) || /gtag\('config'/i.test(html)) {
    return html;
  }
  if (opts && opts.skip) return html;

  const snippet = gaHeadSnippet(GA_MEASUREMENT_ID);
  if (!snippet) return html;

  if (/<\/head>/i.test(html)) {
    return html.replace(/<\/head>/i, snippet + '\n</head>');
  }
  if (/<body[^>]*>/i.test(html)) {
    return html.replace(/<body([^>]*)>/i, '<body$1>\n' + snippet);
  }
  return snippet + html;
}

function shouldSkipGaPath(urlPath) {
  const p = String(urlPath || '').split('?')[0].toLowerCase();
  if (p.startsWith('/admin')) return true;
  if (p.startsWith('/api')) return true;
  if (/journal-print/i.test(p)) return true;
  return false;
}

module.exports = {
  GA_MEASUREMENT_ID,
  gaHeadSnippet,
  injectGaIntoHtml,
  shouldSkipGaPath
};
