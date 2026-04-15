/**
 * Flood-fills white/near-white from image edges and sets those pixels transparent.
 * Keeps opaque white inside closed shapes (e.g. shield interior behind a solid border).
 */
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const INPUT = path.join(__dirname, '..', 'public', 'images', 'logo.png');
const THRESH = 248;

const buf = fs.readFileSync(INPUT);
const png = PNG.sync.read(buf);
const { width: w, height: h, data } = png;
const vis = new Uint8Array(w * h);

function isBg(i) {
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];
  return r >= THRESH && g >= THRESH && b >= THRESH;
}

function idx(x, y) {
  return (w * y + x) << 2;
}

const q = [];
function seed(x, y) {
  if (x < 0 || x >= w || y < 0 || y >= h) return;
  const p = y * w + x;
  if (vis[p]) return;
  if (!isBg(idx(x, y))) return;
  vis[p] = 1;
  q.push(x, y);
}

for (let x = 0; x < w; x++) {
  seed(x, 0);
  seed(x, h - 1);
}
for (let y = 0; y < h; y++) {
  seed(0, y);
  seed(w - 1, y);
}

let qi = 0;
while (qi < q.length) {
  const x = q[qi++];
  const y = q[qi++];
  const i = idx(x, y);
  data[i + 3] = 0;
  seed(x + 1, y);
  seed(x - 1, y);
  seed(x, y + 1);
  seed(x, y - 1);
}

fs.writeFileSync(INPUT, PNG.sync.write(png));
console.log('Updated', INPUT, '(edge-connected near-white → transparent)');
