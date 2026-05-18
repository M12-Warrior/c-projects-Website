/**
 * Fail fast before Railway boot if any startup-required .js file is UTF-16/binary.
 * Run: node scripts/verify-boot-encoding.js (also wired to npm prestart).
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const bootFiles = [
  'server.js',
  'db/database.js',
  'db/blog-posts-seed.js',
  'lib/module1PreviewAccess.js',
  'lib/laTime.js',
  'lib/micBadge.js',
  ...fs.readdirSync(path.join(root, 'routes')).filter((f) => f.endsWith('.js')).map((f) => path.join('routes', f))
];

let failed = 0;
for (const rel of bootFiles) {
  const filePath = path.join(root, rel);
  const buf = fs.readFileSync(filePath);
  const nulls = buf.filter((b) => b === 0).length;
  if (nulls === 0) continue;
  failed++;
  console.error(`[verify-boot-encoding] ${rel} has ${nulls} null bytes (likely UTF-16). Node cannot require this at boot.`);
  if (rel.endsWith('.js')) {
    try {
      // eslint-disable-next-line import/no-dynamic-require, global-require
      require(filePath);
    } catch (err) {
      console.error(`  require preview: ${err.message}`);
    }
  }
}

if (failed) {
  console.error(`[verify-boot-encoding] ${failed} file(s) must be re-saved as UTF-8 before deploy.`);
  process.exit(1);
}

console.log(`[verify-boot-encoding] OK — ${bootFiles.length} startup files are UTF-8.`);
