const https = require('https');
const db = require('../db/database');

const AMAZON_TAG = 'm12warrior-20';

const AISLES = {
  'cab-comfort': 'Cab comfort',
  rest: 'Rest on the road',
  family: 'Family and home',
  'new-driver': 'New driver basics'
};

const SEED = [
  {
    aisle: 'cab-comfort',
    name: 'Rolling soft cooler',
    blurb: 'Collapsible cooler on wheels with a handle and two cup holders. It holds about 60 cans.',
    asin: 'B0GKD6D3D4',
    image_url: 'https://m.media-amazon.com/images/I/31Y59BDm2ML._AC_SL500_.jpg'
  },
  {
    aisle: 'cab-comfort',
    name: 'Cup holder tray',
    blurb: 'Detachable tray that drops into a cup holder, with space for a large bottle and a phone.',
    asin: 'B0DGSZDNCJ',
    image_url: null
  },
  {
    aisle: 'cab-comfort',
    name: 'Seat organizer',
    blurb: 'Seat organizer with a laptop pocket, straps, and room for papers and bottles.',
    asin: 'B07LFXYNR2',
    image_url: null
  },
  {
    aisle: 'cab-comfort',
    name: 'Collapsible organizer',
    blurb: 'Collapsible organizer with separate compartments.',
    asin: 'B07CZMDFFW',
    image_url: null
  },
  {
    aisle: 'cab-comfort',
    name: 'Garmin dezl OTR620',
    blurb: '6-inch truck GPS. It offers truck-size routing, bridge-height alerts, and parking notes from other drivers. Posted signs and current rules still come first.',
    asin: 'B0DBM36WTR',
    image_url: null
  },
  {
    aisle: 'cab-comfort',
    name: 'Front and rear dash camera',
    blurb: 'Front and rear dash camera. A memory card comes in the box.',
    asin: 'B0HDNQMY7W',
    image_url: null
  },
  {
    aisle: 'rest',
    name: 'Contour bunk pillow',
    blurb: 'Contour pillow for side, back, or stomach sleeping.',
    asin: 'B0HH3DCTHJ',
    image_url: 'https://m.media-amazon.com/images/I/81Z8wk1AMgL._AC_SL500_.jpg'
  },
  {
    aisle: 'rest',
    name: 'Washable pillow',
    blurb: 'A washable pillow for the bunk or the house.',
    asin: 'B0HRF5ZNJW',
    image_url: null
  },
  {
    aisle: 'rest',
    name: 'Adjustable memory pillow',
    blurb: 'Adjustable pillow filled with shredded memory foam.',
    asin: 'B09ZKFK4JD',
    image_url: null
  },
  {
    aisle: 'rest',
    name: 'Contoured sleep mask',
    blurb: 'Contoured sleep mask with an adjustable strap. Other colors of this same mask are on the Amazon page.',
    asin: 'B0DJP3CTT1',
    image_url: 'https://m.media-amazon.com/images/I/81jT2X4WhUL._AC_SL500_.jpg'
  },
  {
    aisle: 'rest',
    name: 'Bedside sound and light machine',
    blurb: 'Bedside sound and light machine for a nightstand.',
    asin: 'B0DLLSCVZW',
    image_url: null
  },
  {
    aisle: 'rest',
    name: 'Sound machine with a charger',
    blurb: 'Sound machine with a wireless phone charger.',
    asin: 'B0D5B4489Y',
    image_url: null
  },
  {
    aisle: 'family',
    name: 'Crystal butterfly lamp',
    blurb: 'Small crystal butterfly lamp with a wooden USB base.',
    asin: 'B0H54XQXJG',
    image_url: 'https://m.media-amazon.com/images/I/713ln0qf3QL._AC_SL500_.jpg'
  },
  {
    aisle: 'family',
    name: 'Butterfly encouragement gift',
    blurb: 'Butterfly gift with an encouragement message.',
    asin: 'B0D8Q2GMZG',
    image_url: null
  },
  {
    aisle: 'family',
    name: 'Butterfly gift',
    blurb: 'Butterfly gift for a birthday or for mom.',
    asin: 'B09NMCLBF1',
    image_url: null
  },
  {
    aisle: 'family',
    name: 'Spiritual butterfly keepsake',
    blurb: 'Butterfly keepsake with a spiritual message.',
    asin: 'B0BRG1VRB2',
    image_url: null
  },
  {
    aisle: 'new-driver',
    name: 'Tire pressure gauge',
    blurb: 'Tire pressure gauge with a flashlight. Checking a tire with a gauge does not replace the pre-trip inspection.',
    asin: 'B01NCX3H1G',
    image_url: null
  }
];

function aisleLabel(key) {
  return AISLES[key] || key;
}

function extractAsin(raw) {
  const text = String(raw || '').trim();
  if (!text) return '';
  const fromPath = text.match(/\/(?:dp|gp\/product|gp\/aw\/d)\/([A-Z0-9]{10})(?:[/?]|$)/i);
  if (fromPath) return fromPath[1].toUpperCase();
  if (/^[A-Z0-9]{10}$/i.test(text)) return text.toUpperCase();
  return '';
}

function cleanText(value, max) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (!text) return '';
  return text.slice(0, max);
}

function cleanImage(value) {
  const text = String(value || '').trim();
  if (!text) return null;
  if (!/^https:\/\/.+/i.test(text)) return null;
  return text.slice(0, 400);
}

function followUrl(url, hops) {
  return new Promise((resolve) => {
    let settled = false;
    const done = (value) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    let req;
    try {
      req = https.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Mile12Warrior/1.0)',
          Accept: 'text/html'
        }
      }, (res) => {
        const loc = res.headers.location;
        res.resume();
        if (res.statusCode >= 300 && res.statusCode < 400 && loc && hops < 6) {
          const next = loc.startsWith('http') ? loc : new URL(loc, url).href;
          const found = extractAsin(next);
          if (found) return done(found);
          return followUrl(next, hops + 1).then(done);
        }
        done(extractAsin(url));
      });
    } catch (_) {
      return done('');
    }
    req.on('error', () => done(''));
    req.setTimeout(8000, () => {
      req.destroy();
      done('');
    });
  });
}

async function resolveAsin(raw) {
  const direct = extractAsin(raw);
  if (direct) return direct;
  const text = String(raw || '').trim();
  if (!/^https?:\/\//i.test(text)) return '';
  return followUrl(text, 0);
}

function amazonUrl(asin) {
  return 'https://www.amazon.com/dp/' + asin + '?tag=' + AMAZON_TAG;
}

function publicRow(row) {
  return {
    id: row.id,
    name: row.name,
    blurb: row.blurb || '',
    aisle: row.aisle,
    aisle_label: aisleLabel(row.aisle),
    image_url: row.image_url || '',
    href: '/go/road-pick/' + row.id
  };
}

function listPublic() {
  const rows = db.prepare(`
    SELECT id, name, blurb, aisle, image_url, sort_order
    FROM road_picks
    WHERE active = 1
    ORDER BY
      CASE aisle
        WHEN 'cab-comfort' THEN 1
        WHEN 'rest' THEN 2
        WHEN 'family' THEN 3
        WHEN 'new-driver' THEN 4
        ELSE 9
      END,
      sort_order,
      id
  `).all();
  return rows.map(publicRow);
}

function listAdmin() {
  return db.prepare(`
    SELECT p.id, p.name, p.blurb, p.aisle, p.asin, p.image_url, p.active, p.sort_order, p.created_at,
      (SELECT COUNT(*) FROM road_pick_clicks c WHERE c.pick_id = p.id) AS clicks_all,
      (SELECT COUNT(*) FROM road_pick_clicks c WHERE c.pick_id = p.id AND c.created_at >= datetime('now', '-7 days')) AS clicks_7,
      (SELECT COUNT(*) FROM road_pick_clicks c WHERE c.pick_id = p.id AND c.created_at >= datetime('now', '-30 days')) AS clicks_30
    FROM road_picks p
    ORDER BY
      CASE p.aisle
        WHEN 'cab-comfort' THEN 1
        WHEN 'rest' THEN 2
        WHEN 'family' THEN 3
        WHEN 'new-driver' THEN 4
        ELSE 9
      END,
      p.sort_order,
      p.id
  `).all().map((row) => ({
    ...row,
    aisle_label: aisleLabel(row.aisle),
    amazon_url: amazonUrl(row.asin),
    active: row.active ? 1 : 0
  }));
}

function destinationForClick(id) {
  const pickId = parseInt(id, 10);
  if (!pickId) return '';
  const row = db.prepare('SELECT id, asin, active FROM road_picks WHERE id = ?').get(pickId);
  if (!row || !row.active) return '';
  db.prepare('INSERT INTO road_pick_clicks (pick_id) VALUES (?)').run(row.id);
  return amazonUrl(row.asin);
}

function ensureSeed() {
  const count = db.prepare('SELECT COUNT(*) AS n FROM road_picks').get();
  if (count && count.n > 0) return;
  const insert = db.prepare(`
    INSERT INTO road_picks (name, blurb, aisle, asin, image_url, active, sort_order)
    VALUES (?, ?, ?, ?, ?, 1, ?)
  `);
  const tx = db.transaction(() => {
    SEED.forEach((item, index) => {
      insert.run(item.name, item.blurb, item.aisle, item.asin, item.image_url, index + 1);
    });
  });
  tx();
}

module.exports = {
  AMAZON_TAG,
  AISLES,
  aisleLabel,
  extractAsin,
  cleanText,
  cleanImage,
  resolveAsin,
  amazonUrl,
  listPublic,
  listAdmin,
  destinationForClick,
  ensureSeed
};
