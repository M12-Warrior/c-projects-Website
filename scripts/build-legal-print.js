/**
 * Builds print/PDF-ready legal HTML from live site views.
 * Output: docs/legal/Privacy-Policy-print.html
 *         docs/legal/Terms-of-Service-print.html
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'docs', 'legal');

function extractLegalInner(html) {
  const m = html.match(/<div class="legal-page"[^>]*>([\s\S]*?)<\/div>\s*<\/main>/i);
  if (!m) throw new Error('Could not find .legal-page content');
  return m[1]
    .replace(/\sstyle="[^"]*"/gi, '')
    .replace(/href="\/privacy"/g, 'href="https://mile12warrior.com/privacy"')
    .replace(/href="\/terms"/g, 'href="https://mile12warrior.com/terms"')
    .replace(/href="\/social-butterflies"/g, 'href="https://mile12warrior.com/social-butterflies"');
}

function wrap(title, sourceUrl, lastUpdatedNote, body) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — Mile 12 Warrior LLC (print / archive copy)</title>
  <style>
    @page { margin: 0.75in; }
    * { box-sizing: border-box; }
    body {
      font-family: Georgia, "Times New Roman", serif;
      font-size: 11pt;
      line-height: 1.55;
      color: #111;
      background: #fff;
      margin: 0;
      padding: 24px;
      max-width: 8.5in;
    }
    .toolbar {
      font-family: system-ui, sans-serif;
      background: #f4f4f4;
      border: 1px solid #ccc;
      padding: 12px 16px;
      margin-bottom: 24px;
      border-radius: 8px;
    }
    .toolbar button {
      font-size: 14px;
      padding: 8px 14px;
      margin-right: 8px;
      cursor: pointer;
    }
    .toolbar p { margin: 8px 0 0; font-size: 13px; color: #333; }
    .doc-header {
      border-bottom: 2px solid #111;
      padding-bottom: 12px;
      margin-bottom: 20px;
    }
    .doc-header h1 { font-size: 20pt; margin: 0 0 6px; font-family: system-ui, sans-serif; }
    .meta { font-size: 10pt; color: #333; margin: 0; }
    h2 { font-size: 13pt; margin-top: 1.4em; font-family: system-ui, sans-serif; page-break-after: avoid; }
    h3 { font-size: 11.5pt; margin-top: 1em; font-family: system-ui, sans-serif; page-break-after: avoid; }
    p, li { orphans: 3; widows: 3; }
    ul, ol { padding-left: 1.4em; }
    a { color: #111; text-decoration: underline; }
    hr { border: none; border-top: 1px solid #999; margin: 28px 0 16px; }
    .footer-note { font-size: 9pt; color: #444; margin-top: 32px; }
    @media print {
      .toolbar { display: none !important; }
      body { padding: 0; }
      a { text-decoration: none; }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <button type="button" onclick="window.print()">Print / Save as PDF</button>
    <p><strong>For your legal file:</strong> Click the button → choose <em>Microsoft Print to PDF</em> or <em>Save as PDF</em> → save into
    <code>Mile12Warrior-Business\\01-Legal-Formation\\</code>
    Suggested names: <code>2026-Privacy-Policy-live-site.pdf</code> and <code>2026-Terms-of-Service-live-site.pdf</code>.
    Then print a paper copy from that PDF if you want a physical file.</p>
  </div>
  <header class="doc-header">
    <h1>${title}</h1>
    <p class="meta">Mile 12 Warrior LLC · Archive / print copy of the live site policy</p>
    <p class="meta">Live URL: <a href="${sourceUrl}">${sourceUrl}</a></p>
    <p class="meta">${lastUpdatedNote}</p>
    <p class="meta">Exported for records: ${new Date().toISOString().slice(0, 10)}</p>
  </header>
  <main>
${body}
  </main>
  <p class="footer-note">This file mirrors the publicly posted policy on mile12warrior.com for business recordkeeping. The live page remains the controlling version if they ever differ — re-export after material updates.</p>
</body>
</html>
`;
}

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const privacySrc = fs.readFileSync(path.join(ROOT, 'views', 'privacy.html'), 'utf8');
const termsSrc = fs.readFileSync(path.join(ROOT, 'views', 'terms.html'), 'utf8');

fs.writeFileSync(
  path.join(OUT_DIR, 'Privacy-Policy-print.html'),
  wrap(
    'Privacy Policy',
    'https://mile12warrior.com/privacy',
    'See “Last Updated” date inside the document body (live site version).',
    extractLegalInner(privacySrc)
  )
);

fs.writeFileSync(
  path.join(OUT_DIR, 'Terms-of-Service-print.html'),
  wrap(
    'Terms of Service',
    'https://mile12warrior.com/terms',
    'See “Last Updated” date inside the document body (live site version). Includes refund / return policy.',
    extractLegalInner(termsSrc)
  )
);

console.log('Wrote print copies to', OUT_DIR);
