const https = require('https');
const db = require('../db/database');

const AMAZON_TAG = 'm12warrior-20';

const AISLES = {
  'cab-comfort': 'Cab comfort',
  rest: 'Rest on the road',
  family: 'Family and home',
  'new-driver': 'New driver basics',
  'winter-warmers': 'Winter warmers',
  water: 'Water',
  exercise: 'Exercise'
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
    blurb: 'Contoured sleep mask with an adjustable strap. Pick a color. Each color is its own paid link.',
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

function publicChoices(row, options) {
  const extras = options.filter((option) => option.pick_id === row.id);
  if (!extras.length) return [];
  return [
    {
      label: row.choice_label || 'As shown',
      href: '/go/road-pick/' + row.id,
      image_url: row.image_url || ''
    }
  ].concat(extras.map((option) => ({
    label: option.label,
    href: '/go/road-pick/' + row.id + '/option/' + option.id,
    image_url: option.image_url || ''
  })));
}

function publicRow(row, options) {
  return {
    id: row.id,
    name: row.name,
    blurb: row.blurb || '',
    aisle: row.aisle,
    aisle_label: aisleLabel(row.aisle),
    image_url: row.image_url || '',
    href: '/go/road-pick/' + row.id,
    choices: publicChoices(row, options)
  };
}

function listOptions() {
  return db.prepare(`
    SELECT id, pick_id, label, asin, image_url, sort_order,
      (SELECT COUNT(*) FROM road_pick_clicks c WHERE c.option_id = road_pick_options.id) AS clicks_all,
      (SELECT COUNT(*) FROM road_pick_clicks c WHERE c.option_id = road_pick_options.id AND c.created_at >= datetime('now', '-7 days')) AS clicks_7,
      (SELECT COUNT(*) FROM road_pick_clicks c WHERE c.option_id = road_pick_options.id AND c.created_at >= datetime('now', '-30 days')) AS clicks_30
    FROM road_pick_options
    ORDER BY sort_order, id
  `).all();
}

function listPublic() {
  const options = db.prepare(`
    SELECT id, pick_id, label, image_url
    FROM road_pick_options
    ORDER BY sort_order, id
  `).all();
  const rows = db.prepare(`
    SELECT id, name, blurb, aisle, image_url, choice_label, sort_order
    FROM road_picks
    WHERE active = 1
    ORDER BY
      CASE aisle
        WHEN 'cab-comfort' THEN 1
        WHEN 'rest' THEN 2
        WHEN 'family' THEN 3
        WHEN 'new-driver' THEN 4
        WHEN 'winter-warmers' THEN 5
        WHEN 'water' THEN 6
        WHEN 'exercise' THEN 7
        ELSE 9
      END,
      sort_order,
      id
  `).all();
  return rows.map((row) => publicRow(row, options));
}

function listAdmin() {
  const options = listOptions();
  return db.prepare(`
    SELECT p.id, p.name, p.blurb, p.aisle, p.asin, p.image_url, p.choice_label, p.active, p.sort_order, p.created_at,
      (SELECT COUNT(*) FROM road_pick_clicks c WHERE c.pick_id = p.id) AS clicks_all,
      (SELECT COUNT(*) FROM road_pick_clicks c WHERE c.pick_id = p.id AND c.option_id IS NULL) AS clicks_main,
      (SELECT COUNT(*) FROM road_pick_clicks c WHERE c.pick_id = p.id AND c.created_at >= datetime('now', '-7 days')) AS clicks_7,
      (SELECT COUNT(*) FROM road_pick_clicks c WHERE c.pick_id = p.id AND c.created_at >= datetime('now', '-30 days')) AS clicks_30
    FROM road_picks p
    ORDER BY
      CASE p.aisle
        WHEN 'cab-comfort' THEN 1
        WHEN 'rest' THEN 2
        WHEN 'family' THEN 3
        WHEN 'new-driver' THEN 4
        WHEN 'winter-warmers' THEN 5
        WHEN 'water' THEN 6
        WHEN 'exercise' THEN 7
        ELSE 9
      END,
      p.sort_order,
      p.id
  `).all().map((row) => ({
    ...row,
    aisle_label: aisleLabel(row.aisle),
    amazon_url: amazonUrl(row.asin),
    active: row.active ? 1 : 0,
    options: options.filter((option) => option.pick_id === row.id).map((option) => ({
      id: option.id,
      label: option.label,
      asin: option.asin,
      image_url: option.image_url || '',
      clicks_all: option.clicks_all || 0,
      clicks_7: option.clicks_7 || 0,
      clicks_30: option.clicks_30 || 0
    }))
  }));
}

function destinationForClick(id, optionId) {
  const pickId = parseInt(id, 10);
  if (!pickId) return '';
  const row = db.prepare('SELECT id, asin, active FROM road_picks WHERE id = ?').get(pickId);
  if (!row || !row.active) return '';
  if (optionId) {
    const option = db.prepare('SELECT id, asin FROM road_pick_options WHERE id = ? AND pick_id = ?').get(parseInt(optionId, 10), pickId);
    if (!option) return '';
    db.prepare('INSERT INTO road_pick_clicks (pick_id, option_id) VALUES (?, ?)').run(row.id, option.id);
    return amazonUrl(option.asin);
  }
  db.prepare('INSERT INTO road_pick_clicks (pick_id, option_id) VALUES (?, NULL)').run(row.id);
  return amazonUrl(row.asin);
}

async function addOption(pickId, label, link) {
  const pick = db.prepare('SELECT id FROM road_picks WHERE id = ?').get(pickId);
  if (!pick) return { error: 'Pick not found.', status: 404 };
  const name = cleanText(label, 40);
  if (!name) return { error: 'Color name is required.', status: 400 };
  const asin = await resolveAsin(link);
  if (!asin) return { error: 'Paste the Amazon link for that color.', status: 400 };
  const asCard = db.prepare('SELECT id FROM road_picks WHERE asin = ?').get(asin);
  if (asCard) return { error: 'That color is already its own card. Remove that card before adding it here.', status: 400 };
  const asOption = db.prepare('SELECT id FROM road_pick_options WHERE asin = ?').get(asin);
  if (asOption) return { error: 'That color is already on a card.', status: 400 };
  const sort = db.prepare('SELECT COALESCE(MAX(sort_order), 0) AS n FROM road_pick_options WHERE pick_id = ?').get(pickId);
  const result = db.prepare(`
    INSERT INTO road_pick_options (pick_id, label, asin, sort_order)
    VALUES (?, ?, ?, ?)
  `).run(pickId, name, asin, (sort && sort.n ? sort.n : 0) + 1);
  return { id: result.lastInsertRowid };
}

function renameOption(pickId, optionId, label) {
  const name = cleanText(label, 40);
  if (!name) return { error: 'Color name is required.', status: 400 };
  const result = db.prepare('UPDATE road_pick_options SET label = ? WHERE id = ? AND pick_id = ?').run(name, optionId, pickId);
  if (!result.changes) return { error: 'Color not found.', status: 404 };
  return { ok: true };
}

function deleteOption(pickId, optionId) {
  const result = db.prepare('DELETE FROM road_pick_options WHERE id = ? AND pick_id = ?').run(optionId, pickId);
  if (!result.changes) return { error: 'Color not found.', status: 404 };
  return { ok: true };
}

const BATCHES = {
  '2026-11-21-b': [
    { aisle: 'cab-comfort', name: 'UTV roof fan', blurb: 'Dual roof fan for a UTV whose roof is about 41 to 57 inches wide. It is made for side-by-sides such as a Ranger or Defender, not a semi cab.', asin: 'B0GKG8DW3S' },
    { aisle: 'cab-comfort', name: '12-volt cab heater', blurb: '12-volt heater that plugs into a power outlet and can blow warm or cool air. It does not replace the truck\'s own defroster.', asin: 'B0FQJPW4KC' },
    { aisle: 'cab-comfort', name: 'Rechargeable clip fan', blurb: 'Rechargeable fan with a clip and an extendable arm.', asin: 'B0GZVMD26V' },
    { aisle: 'cab-comfort', name: 'Washable seat cushion', blurb: 'Washable non-slip seat cushion.', asin: 'B0GLNL6J5M' },
    { aisle: 'cab-comfort', name: 'Truck seat cushion', blurb: 'Truck seat cushion with a back piece.', asin: 'B0CZSTZRH6' },
    { aisle: 'cab-comfort', name: 'Backseat organizer', blurb: 'Backseat organizer with several pockets.', asin: 'B0HF4MTHMS' },
    { aisle: 'cab-comfort', name: 'Memory-foam back cushion', blurb: 'Memory-foam back cushion with straps for a seat. A comfort item, not a medical device.', asin: 'B074C9F45S' },
    { aisle: 'cab-comfort', name: 'Lumbar back pillow', blurb: 'Back pillow for the seat. A comfort item, not a medical device.', asin: 'B01IJNJAZ0' },
    { aisle: 'rest', name: 'Leg massager', blurb: 'Leg massager. A comfort item, not medical advice.', asin: 'B0HJH842L6' },
    { aisle: 'rest', name: 'Compression leg massager', blurb: 'Compression leg massager. A comfort item, not medical advice.', asin: 'B09PRJP43V' },
    { aisle: 'rest', name: 'Footless compression sleeves', blurb: 'Footless compression sleeves. A comfort item, not medical advice.', asin: 'B0D74NF2VM' },
    { aisle: 'rest', name: 'Compression socks', blurb: 'Compression socks. A comfort item, not medical advice.', asin: 'B083TP4ZQ1' },
    { aisle: 'rest', name: 'Knee sleeve', blurb: 'Knee sleeve. A comfort item, not medical advice.', asin: 'B08JGP1WYM' },
    { aisle: 'rest', name: 'Sleeper curtains', blurb: 'Curtains for a highway sleeper.', asin: 'B01LZESMEL' },
    { aisle: 'rest', name: 'Peterbilt blackout window cover', blurb: 'Blackout window cover listed for Peterbilt sleepers. Check the years on Amazon before you order.', asin: 'B0B25R47SJ' },
    { aisle: 'rest', name: 'Silicone sleep earplugs', blurb: 'Silicone earplugs for sleep.', asin: 'B0HMR9WXCW' },
    { aisle: 'rest', name: 'Ear plugs', blurb: 'Ear plugs for sleep.', asin: 'B00PSX6ZV2' },
    { aisle: 'rest', name: 'Silicone earplugs', blurb: 'Silicone earplugs.', asin: 'B0BKH1D62C' },
    { aisle: 'family', name: 'Clear storage bags', blurb: 'Clear moving and storage bags. Handy for a care package.', asin: 'B0F37Z3ZW5' },
    { aisle: 'family', name: 'Gift box', blurb: 'Gift box, about 13.5 by 10 by 4 inches. Other colors are on the Amazon page.', asin: 'B09WXZ383C' },
    { aisle: 'family', name: 'Collapsible gift box', blurb: 'Collapsible gift box with a ribbon.', asin: 'B09ZTLP8B2' },
    { aisle: 'new-driver', name: 'Accordion paper folder', blurb: 'Accordion folder for papers. The listing calls it fire-resistant.', asin: 'B0FWXLYKQG' },
    { aisle: 'new-driver', name: 'Document portfolio', blurb: 'Portfolio for papers and cards.', asin: 'B0GSZD1546' },
    { aisle: 'new-driver', name: 'Shoulder paper bag', blurb: 'Shoulder bag with pockets for papers.', asin: 'B0F43J25PZ' },
    { aisle: 'new-driver', name: 'Layered paper folder', blurb: 'Multi-layer folder for papers. The listing calls it fire-resistant.', asin: 'B0CX7VH3H7' },
    { aisle: 'new-driver', name: 'Canvas duffel', blurb: 'Canvas duffel that expands for a weekend bag.', asin: 'B0BYSF1C1H' },
    { aisle: 'new-driver', name: 'Hard-side carry-on', blurb: 'Expandable hard-side carry-on.', asin: 'B083PX1TDL' },
    { aisle: 'new-driver', name: 'Waterproof duffel', blurb: 'Waterproof bag with separate compartments.', asin: 'B09C7WQ123' }
  ],
  '2026-11-21-c': [
    { aisle: 'new-driver', name: 'Rechargeable flashlight', blurb: 'Rechargeable flashlight with a magnetic base.', asin: 'B0FH2DLXBG' },
    { aisle: 'new-driver', name: 'Storage clipboard', blurb: 'Clipboard with a storage compartment.', asin: 'B0BG445TPF' },
    { aisle: 'new-driver', name: 'Everyday pens', blurb: 'Pens for notes and paperwork.', asin: 'B08BX5THHP' }
  ],
  '2026-11-21-d': [
    { aisle: 'new-driver', name: 'Three-pack notebooks', blurb: 'Three hardcover spiral notebooks, about 5.5 by 8 inches. The pack includes dark red, dark green, and dark blue.', asin: 'B0FWJQDCTM' },
    { aisle: 'new-driver', name: 'Leather journal with a pen', blurb: 'Light brown journal with blank pages and a pen. It is about 5 by 7 inches.', asin: 'B074N4615Z' },
    { aisle: 'new-driver', name: 'Personalized notebook and pen', blurb: 'Notebook and pen that can be engraved with a name. The color and the wording are chosen on Amazon.', asin: 'B0HHN1B5HK' },
    { aisle: 'new-driver', name: 'Notebook with dividers', blurb: 'Purple hardcover notebook with removable dividers. It is about 8 by 10 inches.', asin: 'B0F38236PQ' }
  ],
  '2026-11-21-e': [
    { aisle: 'winter-warmers', name: 'Thick winter socks', blurb: 'Three pairs of thick winter socks.', asin: 'B0F1YPDW1J' },
    { aisle: 'winter-warmers', name: 'Leather work gloves', blurb: 'Leather work gloves with a soft lining. Coffee grey, size large. These are not safety equipment.', asin: 'B0BPNNPF83' },
    { aisle: 'winter-warmers', name: 'Insulated winter gloves', blurb: 'Insulated winter gloves. This listing is blue, size large. The listing says the thumb and index finger work on a touchscreen.', asin: 'B07XTC6DWM' },
    { aisle: 'winter-warmers', name: 'Alpaca crew socks', blurb: 'Thick crew socks with alpaca yarn. The listing color is pebble. A comfort item, not medical advice.', asin: 'B0FWY5YRW9' },
    { aisle: 'winter-warmers', name: 'Magnetic hand warmers', blurb: 'Two rechargeable hand warmers that snap together.', asin: 'B0DBQY9S8Y' },
    { aisle: 'winter-warmers', name: 'HotHands super warmers', blurb: 'Air-activated hand warmers. A pack of 40.', asin: 'B0007ZF4Q8' },
    { aisle: 'winter-warmers', name: 'Heated glove liners', blurb: 'Rechargeable heated glove liners. This listing is black, size large. A comfort item, not medical advice. Take the batteries out before washing.', asin: 'B0CL4BB87P' },
    { aisle: 'winter-warmers', name: 'HotHands variety pack', blurb: 'Air-activated warmers for toes, hands, and body.', asin: 'B004R1J464' },
    { aisle: 'winter-warmers', name: 'Stick-on body warmers', blurb: 'Air-activated stick-on body warmers. A pack of 5.', asin: 'B0DLXTPQ83' },
    { aisle: 'winter-warmers', name: 'Women\'s thermal set', blurb: 'Women\'s fleece-lined thermal top and bottom. This listing is black, size medium. Check the size on Amazon.', asin: 'B07HN2NH38' },
    { aisle: 'winter-warmers', name: 'Men\'s merino base layer', blurb: 'Men\'s merino wool base layer, top and bottom. Check the size on Amazon.', asin: 'B09C4WJ38S' },
    { aisle: 'winter-warmers', name: 'Heated socks', blurb: 'Rechargeable heated socks. The listing fits women\'s shoe sizes 5 to 10 and men\'s 5 to 9. A comfort item, not medical advice.', asin: 'B0H2VRP1V1' },
    { aisle: 'winter-warmers', name: 'Wearable blanket', blurb: 'Fleece blanket with sleeves. Aspen gray, about 70 by 60 inches.', asin: 'B08R7T4ZHS' },
    { aisle: 'winter-warmers', name: 'Silicone hand warmers', blurb: 'Two rechargeable silicone hand warmers.', asin: 'B0H6Q5MV2K' }
  ],
  '2026-11-21-f': [
    { aisle: 'new-driver', name: '350-piece first aid kit', blurb: 'Red kit the listing calls 350 pieces. A supply kit, not medical advice.', asin: 'B0CLNZ8KM4' },
    { aisle: 'new-driver', name: 'Contractor first aid kit', blurb: 'Metal-case kit the listing calls a 25-person, 178-piece contractor kit. A supply kit, not medical advice.', asin: 'B006RNSPYM' },
    { aisle: 'new-driver', name: '400-piece first aid bag', blurb: 'Soft bag the listing calls a 400-piece kit. A supply kit, not medical advice.', asin: 'B0BFN7K6ZZ' }
  ],
  '2026-11-21-g': [
    { aisle: 'water', name: '40-ounce insulated bottle', blurb: 'Insulated bottle with a straw lid and a spout lid. The listing color is indigo black.', asin: 'B0BN4281PV' },
    { aisle: 'water', name: 'Insulated water bottle', blurb: 'Insulated stainless bottle with a straw lid and a spout lid. Check the size and color on Amazon.', asin: 'B0F2FJRPN5' },
    { aisle: 'water', name: 'One-liter bottled water', blurb: 'Case of 15 one-liter bottles. The listing calls it alkaline water. This card does not claim a health benefit.', asin: 'B0H34V1B3Z' },
    { aisle: 'water', name: 'Bottled water 24-pack', blurb: 'Case of 24 bottles, 16.9 ounces each.', asin: 'B00C9RNQ8K' },
    { aisle: 'water', name: 'Flavored bottled water', blurb: '12 bottles, 16.9 ounces each. The listing adds chlorophyll, lemon, and spearmint. This card does not claim a health benefit.', asin: 'B07RHVS53H' }
  ],
  '2026-11-21-h': [
    { aisle: 'exercise', name: 'Seated elliptical', blurb: 'Seated elliptical with arm bands. The listing has 12 resistance levels. Check that it fits your space. Use it parked or at home, not while driving. A movement item, not medical advice.', asin: 'B0DNYC5SDX' },
    { aisle: 'exercise', name: 'Push-up board set', blurb: 'Foldable push-up board with bands, a bar, and an ab roller. Use it parked or at home, not while driving. A movement item, not medical advice.', asin: 'B0CRR1XXC4' },
    { aisle: 'exercise', name: 'Mini stepper', blurb: 'Mini stepper with two resistance bands. The listing says it supports up to 300 pounds. Use it parked or at home, not while driving. A movement item, not medical advice.', asin: 'B0016BQFSS' },
    { aisle: 'exercise', name: 'Resistance bands with handles', blurb: 'Six bands with handles, a door anchor, and ankle straps. Use them parked or at home, not while driving. A movement item, not medical advice.', asin: 'B0DB1NB9F5' },
    { aisle: 'exercise', name: 'Fabric loop bands', blurb: 'Five fabric loop bands. Use them parked or at home, not while driving. A movement item, not medical advice.', asin: 'B07WQLDKN2' },
    { aisle: 'exercise', name: 'Hand grip kit', blurb: 'Adjustable hand grippers, grip rings, finger exercisers, and stress balls. Use them parked or at home, not while driving. A movement item, not medical advice.', asin: 'B0H33JHTKC' }
  ]
};

const COLOR_SETS = {
  '2026-11-21-colors': [
    {
      parentAsin: 'B0DJP3CTT1',
      choice_label: 'Shown color',
      blurb: 'Contoured sleep mask with an adjustable strap. Pick a color. Each color is its own paid link.',
      options: [
        { label: 'Black', asin: 'B09H7FZ5JM' },
        { label: 'Olive green', asin: 'B0BR33QY9C' },
        { label: 'Pink', asin: 'B0B93GPDRS' },
        { label: 'Another color', asin: 'B0BW3P4ZVB' }
      ]
    },
    {
      parentAsin: 'B09WXZ383C',
      choice_label: 'Black',
      blurb: 'Magnetic gift box with a ribbon and filler. Sizes vary a little by color, so check the size on Amazon.',
      options: [
        { label: 'Navy blue', asin: 'B0FHVRN2SM' },
        { label: 'Another color', asin: 'B0CHLSN31L' }
      ]
    }
  ]
};

function applyColorSets(seen, mark) {
  const parentByAsin = db.prepare('SELECT id FROM road_picks WHERE asin = ?');
  const optionExists = db.prepare('SELECT id FROM road_pick_options WHERE asin = ?');
  const cardExists = db.prepare('SELECT id FROM road_picks WHERE asin = ?');
  const insertOpt = db.prepare(`
    INSERT INTO road_pick_options (pick_id, label, asin, sort_order)
    VALUES (?, ?, ?, ?)
  `);
  const updateParent = db.prepare('UPDATE road_picks SET choice_label = ?, blurb = ? WHERE id = ?');
  Object.keys(COLOR_SETS).forEach((key) => {
    if (seen.get(key)) return;
    COLOR_SETS[key].forEach((set) => {
      const parent = parentByAsin.get(set.parentAsin);
      if (!parent) return;
      updateParent.run(set.choice_label, set.blurb, parent.id);
      set.options.forEach((option, index) => {
        if (optionExists.get(option.asin) || cardExists.get(option.asin)) return;
        insertOpt.run(parent.id, option.label, option.asin, index + 1);
      });
    });
    mark.run(key);
  });
}

function applyCatalogs() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS road_pick_catalogs (
      catalog_key TEXT PRIMARY KEY,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  const seen = db.prepare('SELECT catalog_key FROM road_pick_catalogs WHERE catalog_key = ?');
  const mark = db.prepare('INSERT INTO road_pick_catalogs (catalog_key) VALUES (?)');
  const exists = db.prepare('SELECT id FROM road_picks WHERE asin = ?');
  const nextSort = db.prepare('SELECT COALESCE(MAX(sort_order), 0) AS n FROM road_picks');
  const insert = db.prepare(`
    INSERT INTO road_picks (name, blurb, aisle, asin, image_url, active, sort_order)
    VALUES (?, ?, ?, ?, NULL, 1, ?)
  `);
  const tx = db.transaction(() => {
    Object.keys(BATCHES).forEach((key) => {
      if (seen.get(key)) return;
      let sort = nextSort.get().n || 0;
      BATCHES[key].forEach((item) => {
        if (exists.get(item.asin)) return;
        sort += 1;
        insert.run(item.name, item.blurb, item.aisle, item.asin, sort);
      });
      mark.run(key);
    });
    applyColorSets(seen, mark);
  });
  tx();
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
  ensureSeed,
  applyCatalogs,
  addOption,
  renameOption,
  deleteOption
};
