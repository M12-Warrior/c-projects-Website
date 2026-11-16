/**
 * Prepare Social Butterflies logo:
 * - Edge flood-fill: white letterbox + soft peach wash → transparent
 * - Crop empty transparent margins
 * Keeps pink butterflies, black script, and wing spots.
 */
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');
const jpeg = require('jpeg-js');

const INPUT = process.argv[2] ? path.resolve(process.argv[2]) : '';
const OUTPUT = path.join(__dirname, '..', 'public', 'images', 'social-butterflies-logo.png');
const BACKUP = path.join(__dirname, '..', 'public', 'images', 'social-butterflies-logo.prev.png');

function isBackground(r, g, b) {
  // Solid / near-white letterbox
  if (r >= 248 && g >= 248 && b >= 248) return true;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const sat = max === 0 ? 0 : (max - min) / max;
  const lum = (r + g + b) / 3;

  // Soft peach / cream watercolor wash (not hot pink)
  // Hot pink: high R, much lower G. Peach: R≈G≈B high, slight warm bias.
  if (lum >= 205 && sat <= 0.38 && r >= 200 && g >= 165 && b >= 150 && g + 40 >= b) {
    // Exclude vivid pink/magenta (butterfly wings)
    if (r >= 220 && g <= 160 && b >= 140 && (r - g) >= 70) return false;
    return true;
  }

  // Very light cream leftovers
  if (lum >= 230 && sat <= 0.22) return true;

  return false;
}

function loadRgba(buf) {
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    const decoded = jpeg.decode(buf, { useTArray: true, formatAsRGBA: true });
    const png = new PNG({ width: decoded.width, height: decoded.height });
    png.data = Buffer.from(decoded.data);
    return png;
  }
  return PNG.sync.read(buf);
}

function processPng(buf) {
  const png = loadRgba(buf);
  const { width: w, height: h, data } = png;
  const vis = new Uint8Array(w * h);

  function idx(x, y) {
    return (w * y + x) << 2;
  }

  function isBgAt(i) {
    return isBackground(data[i], data[i + 1], data[i + 2]);
  }

  const q = [];
  function seed(x, y) {
    if (x < 0 || x >= w || y < 0 || y >= h) return;
    const p = y * w + x;
    if (vis[p]) return;
    if (!isBgAt(idx(x, y))) return;
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
    data[idx(x, y) + 3] = 0;
    seed(x + 1, y);
    seed(x - 1, y);
    seed(x, y + 1);
    seed(x, y - 1);
  }

  // Crop to non-transparent bounds with a little padding
  let minX = w;
  let minY = h;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[idx(x, y) + 3] > 8) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX < 0) throw new Error('No opaque content found after transparency pass');

  const pad = 8;
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(w - 1, maxX + pad);
  maxY = Math.min(h - 1, maxY + pad);

  const cw = maxX - minX + 1;
  const ch = maxY - minY + 1;
  const out = new PNG({ width: cw, height: ch });
  for (let y = 0; y < ch; y++) {
    for (let x = 0; x < cw; x++) {
      const si = idx(minX + x, minY + y);
      const di = (cw * y + x) << 2;
      out.data[di] = data[si];
      out.data[di + 1] = data[si + 1];
      out.data[di + 2] = data[si + 2];
      out.data[di + 3] = data[si + 3];
    }
  }
  return out;
}

const srcPath = fs.existsSync(INPUT)
  ? INPUT
  : path.join(
      'C:\\Users\\M-12\\.cursor\\projects\\e-Projects-Website\\assets\\c__Users_M-12_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_peach_background_butterflies-4c129815-3a86-4de6-b9ef-3a96d77655ec.png'
    );

if (!fs.existsSync(srcPath)) {
  console.error('Source image not found:', srcPath);
  process.exit(1);
}

if (fs.existsSync(OUTPUT)) {
  fs.copyFileSync(OUTPUT, BACKUP);
  console.log('Backed up current logo →', BACKUP);
}

const outPng = processPng(fs.readFileSync(srcPath));
fs.writeFileSync(OUTPUT, PNG.sync.write(outPng));
console.log('Wrote', OUTPUT, `(${outPng.width}x${outPng.height})`);
