// --- Checklist Data (used by download & print) ---
const CHECKLISTS = {
  breakdown: {
    title: 'Breakdown Kit Essentials',
    items: [
      'Reflective triangles (3 minimum — per 49 CFR 393.95)',
      'High-visibility vest',
      'Heavy-duty flashlight + extra batteries',
      'Jumper cables / jump pack',
      'Basic tool kit (wrenches, pliers, screwdrivers)',
      'Tire pressure gauge',
      'Duct tape and zip ties',
      'Fire extinguisher (ABC rated — per 49 CFR 393.95)',
      'Spare fuses'
    ]
  },
  firstaid: {
    title: 'First Aid Kit',
    items: [
      'Bandages, gauze, medical tape',
      'Antiseptic wipes and ointment',
      'Pain relievers (ibuprofen, acetaminophen)',
      'Tourniquet',
      'CPR face shield',
      'Emergency blanket (mylar)',
      'Prescription medications (extra supply)',
      'Allergy medication (Benadryl)'
    ]
  },
  comms: {
    title: 'Communication Plan',
    items: [
      'Phone charger + backup battery pack',
      'Emergency contacts card (laminated, in cab)',
      'Company dispatch number memorized',
      'Insurance and registration accessible',
      'CB radio operational (channel 19)',
      'Roadside assistance membership'
    ]
  },
  protocol: {
    title: 'Roadside Safety Protocol',
    ordered: true,
    items: [
      'Pull completely off the roadway — as far right as possible',
      'Turn on hazard flashers immediately',
      'Put on your high-visibility vest before exiting',
      'Set triangles: 10 ft, 100 ft, and 200 ft behind truck',
      'Stay on the passenger side (away from traffic)',
      'Call for help: dispatch, roadside assistance, 911',
      'Never attempt repairs in a traffic lane',
      'If rear-end risk, exit cab — stand well clear of truck'
    ]
  }
};

function trackDownloadEvent(contentType, action, productSlug) {
  try {
    return fetch('/api/track-download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        content_type: contentType,
        action: action,
        product_slug: productSlug || null
      })
    }).catch(function() {});
  } catch (_) {
    return Promise.resolve();
  }
}

function buildPrintHTML(keys) {
  const lists = keys.map(function(key) {
    const cl = CHECKLISTS[key];
    let itemsHTML = cl.items.map(function(item, i) {
      const prefix = cl.ordered ? (i + 1) + '. ' : '';
      return '<div class="print-item">' + prefix + item + '</div>';
    }).join('');
    return '<h2>' + cl.title + '</h2>' + itemsHTML + '<br>';
  }).join('');

  return '<div style="max-width:700px;margin:0 auto">' +
    '<div style="text-align:center;margin-bottom:20px">' +
      '<h1 style="font-size:20pt;margin:0">Mile 12 Warrior</h1>' +
      '<p style="font-size:10pt;color:#666;margin:4px 0">Emergency Preparedness Checklists</p>' +
    '</div>' +
    lists +
    '<div class="print-footer">' +
      '&copy; 2026 Mile 12 Warrior LLC. All rights reserved. For educational purposes only — not professional advice. ' +
      'Verify current regulations at fmcsa.dot.gov and dot.ca.gov. mile12warrior.com' +
    '</div></div>';
}

function printChecklist(id) {
  var keys;
  if (id === 'all-emergency') {
    keys = ['breakdown', 'firstaid', 'comms', 'protocol'];
  } else {
    var map = {
      'checklist-breakdown': 'breakdown',
      'checklist-firstaid': 'firstaid',
      'checklist-comms': 'comms',
      'checklist-protocol': 'protocol'
    };
    keys = [map[id] || 'breakdown'];
  }

  var contentMap = {
    'checklist-breakdown': 'roadmap-breakdown',
    'checklist-firstaid': 'roadmap-firstaid',
    'checklist-comms': 'roadmap-comms',
    'checklist-protocol': 'roadmap-protocol',
    'all-emergency': 'roadmap-all'
  };
  trackDownloadEvent(contentMap[id] || 'roadmap-breakdown', 'print');

  var win = window.open('', '_blank', 'width=800,height=900');
  win.document.write('<!DOCTYPE html><html><head><title>Mile 12 Warrior - Checklist</title>' +
    '<style>' +
      'body{font-family:Arial,Helvetica,sans-serif;padding:24px;color:#000;background:#fff}' +
      'h1{font-family:Georgia,serif}' +
      'h2{font-size:14pt;border-bottom:2px solid #000;padding-bottom:6px;margin-top:24px}' +
      '.print-item{padding:6px 0;border-bottom:1px dotted #ccc;font-size:11pt}' +
      '.print-item::before{content:"\\2610  "}' +
      '.print-footer{margin-top:24px;font-size:8pt;color:#888;border-top:1px solid #ccc;padding-top:8px}' +
    '</style></head><body>' + buildPrintHTML(keys) + '</body></html>');
  win.document.close();
  win.focus();
  setTimeout(function() { win.print(); }, 400);
}

function downloadChecklist(id) {
  var keys;
  var filename;
  if (id === 'all') {
    keys = ['breakdown', 'firstaid', 'comms', 'protocol'];
    filename = 'Mile12Warrior-Emergency-Checklists.html';
  } else {
    keys = [id];
    filename = 'Mile12Warrior-' + CHECKLISTS[id].title.replace(/\s+/g, '-') + '.html';
  }

  trackDownloadEvent(id === 'all' ? 'roadmap-all' : ('roadmap-' + id), 'download');

  var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Mile 12 Warrior - ' +
    (id === 'all' ? 'All Emergency Checklists' : CHECKLISTS[keys[0]].title) +
    '</title><style>' +
      'body{font-family:Arial,Helvetica,sans-serif;max-width:700px;margin:0 auto;padding:32px;color:#000}' +
      'h1{font-family:Georgia,serif;text-align:center}' +
      'h2{font-size:14pt;border-bottom:2px solid #333;padding-bottom:6px;margin-top:28px}' +
      '.item{padding:8px 0;border-bottom:1px dotted #ccc;font-size:11pt;display:flex;align-items:baseline;gap:10px}' +
      '.box{width:14px;height:14px;border:1.5px solid #333;flex-shrink:0;margin-top:2px}' +
      '.footer{margin-top:32px;font-size:8pt;color:#888;border-top:1px solid #ccc;padding-top:8px;text-align:center}' +
      '@media print{body{padding:16px}.box{border-color:#000}}' +
    '</style></head><body>' +
    '<h1>Mile 12 Warrior</h1>' +
    '<p style="text-align:center;color:#666;font-size:10pt">Emergency Preparedness Checklists — Free Download</p>';

  keys.forEach(function(key) {
    var cl = CHECKLISTS[key];
    html += '<h2>' + cl.title + '</h2>';
    cl.items.forEach(function(item, i) {
      var label = cl.ordered ? '<strong>' + (i + 1) + '.</strong> ' + item : item;
      html += '<div class="item"><div class="box"></div><div>' + label + '</div></div>';
    });
  });

  html += '<div class="footer">' +
    '&copy; 2026 Mile 12 Warrior LLC. All rights reserved.<br>' +
    'For educational purposes only — not medical, legal, or regulatory advice.<br>' +
    'Verify current regulations at fmcsa.dot.gov and dot.ca.gov<br>' +
    'mile12warrior.com | Bookings: admin@mile12warrior.com | General: joyce@mile12warrior.com | (916) 292-7411' +
    '</div></body></html>';

  var blob = new Blob([html], { type: 'text/html' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
}

async function initCheckoutBanner() {
  try {
    if (sessionStorage.getItem('checkoutBannerDismissed') === '1') return;
  } catch (_) {}
  const navbar = document.getElementById('navbar');
  if (!navbar || document.getElementById('checkoutBanner')) return;

  let paymentsEnabled = false;
  let freeAccess = true;
  try {
    const res = await fetch('/api/shop/payment-config', { credentials: 'include' });
    const data = await res.json();
    paymentsEnabled = !!(data && data.enabled);
    freeAccess = !!(data && (data.freeAccess || data.freeDigitalAccess));
  } catch (_) {}

  if (paymentsEnabled && !freeAccess) return;

  const banner = document.createElement('div');
  banner.id = 'checkoutBanner';
  banner.className = 'checkout-banner';
  banner.setAttribute('role', 'status');
  banner.innerHTML =
    '<p class="checkout-banner-text">' +
    (freeAccess
      ? '<strong>All digital training is free right now</strong> — New Driver Packet &amp; Wellness Journal stay free forever. Course &amp; advanced packets on <a href="/services">Services</a>.'
      : '<strong>New Driver Packet &amp; Wellness Journal stay free</strong> — course &amp; advanced packets available on <a href="/services">Services</a> and <a href="/shop">Shop</a>.') +
    '</p>' +
    '<button type="button" class="checkout-banner-dismiss" aria-label="Dismiss checkout notice">&times;</button>';

  navbar.insertAdjacentElement('afterend', banner);
  document.body.classList.add('has-checkout-banner');

  const dismissBtn = banner.querySelector('.checkout-banner-dismiss');
  if (dismissBtn) {
    dismissBtn.addEventListener('click', function () {
      banner.remove();
      document.body.classList.remove('has-checkout-banner');
      try {
        sessionStorage.setItem('checkoutBannerDismissed', '1');
      } catch (_) {}
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initCheckoutBanner();

  // --- Accessibility bootstrap (WCAG 2.1 AA) ---
  document.documentElement.classList.remove('no-js');
  document.documentElement.classList.add('js');

  // Force a visible laptop nav (gold hamburger). Survives stale CSS caches.
  (function ensureVisibleNav() {
    if (document.getElementById('nav-critical-js')) return;
    var style = document.createElement('style');
    style.id = 'nav-critical-js';
    style.textContent = [
      '.navbar{position:fixed!important;top:12px!important;left:12px!important;right:12px!important;z-index:10050!important;background:#1a1a1c!important;border:2px solid #E6B800!important;border-radius:10px!important;box-shadow:0 10px 32px rgba(0,0,0,.55)!important;}',
      '.nav-container{display:flex!important;align-items:center!important;justify-content:space-between!important;min-height:64px!important;padding:10px 16px!important;}',
      '.nav-toggle{display:flex!important;flex-direction:column!important;justify-content:center!important;gap:6px!important;background:#E6B800!important;border:2px solid #F5C542!important;border-radius:6px!important;padding:14px 12px!important;min-width:52px!important;min-height:48px!important;margin-left:auto!important;cursor:pointer!important;box-shadow:0 2px 12px rgba(230,184,0,.45)!important;}',
      '.nav-toggle span{display:block!important;width:24px!important;height:3px!important;background:#1a1a1c!important;border-radius:2px!important;}',
      '.nav-links{position:fixed!important;top:92px!important;left:12px!important;right:12px!important;z-index:10049!important;background:#121214!important;border:2px solid #E6B800!important;border-radius:10px!important;flex-direction:column!important;padding:12px 16px 20px!important;max-height:calc(100vh - 120px)!important;overflow-y:auto!important;}',
      '.nav-links:not(.open){opacity:0!important;visibility:hidden!important;pointer-events:none!important;transform:translateY(-120%)!important;}',
      '.nav-links.open{opacity:1!important;visibility:visible!important;pointer-events:auto!important;transform:none!important;}',
      '.nav-links a{display:block!important;padding:14px 16px!important;font-size:1rem!important;font-weight:600!important;color:#f0f0f0!important;}'
    ].join('');
    document.head.appendChild(style);
    var toggle = document.getElementById('navToggle');
    if (toggle) {
      toggle.style.display = 'flex';
      toggle.setAttribute('aria-label', toggle.getAttribute('aria-label') || 'Toggle menu');
    }
  })();

  (function initSkipLinkAndMain() {
    var main =
      document.getElementById('main-content') ||
      document.querySelector('main') ||
      document.getElementById('hero') ||
      document.querySelector('.hero') ||
      document.querySelector('.page-shell');
    if (main) {
      if (!main.id) main.id = 'main-content';
      if (!main.hasAttribute('tabindex')) main.setAttribute('tabindex', '-1');
    }
    if (!document.querySelector('.skip-link') && main) {
      var skip = document.createElement('a');
      skip.className = 'skip-link';
      skip.href = '#' + main.id;
      skip.textContent = 'Skip to main content';
      document.body.insertBefore(skip, document.body.firstChild);
    }
    var navbarEl = document.getElementById('navbar');
    if (navbarEl && !navbarEl.getAttribute('aria-label')) {
      navbarEl.setAttribute('role', 'navigation');
      navbarEl.setAttribute('aria-label', 'Primary');
    }
    var cartBadge = document.getElementById('cartBadge');
    if (cartBadge && !cartBadge.getAttribute('aria-live')) {
      cartBadge.setAttribute('aria-live', 'polite');
      cartBadge.setAttribute('aria-atomic', 'true');
    }
  })();

  // Announce new-tab destination for icon-only / labeled links
  document.querySelectorAll('a[target="_blank"]').forEach(function (link) {
    var rel = (link.getAttribute('rel') || '').toLowerCase();
    if (!/\bnoopener\b/.test(rel)) {
      link.setAttribute('rel', (rel ? rel + ' ' : '') + 'noopener noreferrer');
    }
    var existing = (link.getAttribute('aria-label') || '').trim();
    if (existing && !/opens in (a )?new (tab|window)/i.test(existing)) {
      link.setAttribute('aria-label', existing + ' (opens in a new tab)');
    }
  });

  // --- Scroll progress bar (shared: all pages) ---
  const progressBar = document.getElementById('scrollProgress');
  if (progressBar) {
    progressBar.setAttribute('role', 'progressbar');
    progressBar.setAttribute('aria-label', 'Reading progress');
    progressBar.setAttribute('aria-valuemin', '0');
    progressBar.setAttribute('aria-valuemax', '100');
  }

  function updateProgress() {
    if (!progressBar) return;
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    progressBar.style.width = progress + '%';
    progressBar.setAttribute('aria-valuenow', String(Math.round(progress)));
  }

  // --- Navbar scroll effect ---
  const navbar = document.getElementById('navbar');
  const backToTop = document.getElementById('backToTop');

  function onScroll() {
    if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 20);
    if (backToTop) backToTop.classList.toggle('visible', window.scrollY > 500);
    updateProgress();
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // --- Mobile nav toggle (hamburger menu) ---
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  if (navToggle && navLinks) {
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-controls', 'navLinks');
    if (!navToggle.getAttribute('aria-label')) {
      navToggle.setAttribute('aria-label', 'Toggle menu');
    }

    function setMobileNavOpen(open) {
      navToggle.classList.toggle('active', open);
      navLinks.classList.toggle('open', open);
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
      if (open) {
        var firstLink = navLinks.querySelector('a');
        if (firstLink) firstLink.focus();
      }
    }

    navToggle.addEventListener('click', function () {
      setMobileNavOpen(!navLinks.classList.contains('open'));
    });
    navLinks.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        setMobileNavOpen(false);
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && navLinks.classList.contains('open')) {
        setMobileNavOpen(false);
        navToggle.focus();
      }
    });
  }

  // Global Search link (nav plan): one consistent link when main.js runs
  if (navLinks && !document.getElementById('navSearchLink')) {
    const li = document.createElement('li');
    li.innerHTML = '<a href="/search" id="navSearchLink">Search</a>';
    const firstLi = navLinks.querySelector('li');
    if (firstLi) firstLi.after(li);
    else navLinks.appendChild(li);
  }

  // --- Back to top ---
  if (backToTop) {
    backToTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // --- Scroll-reveal animations (shared: homepage + inner pages) ---
  const revealSelector =
    '.glass-card, .hazard-card, .rm-card, .crisis-banner, ' +
    '.section-header, .resource-pill, .exercise-chip, .exercise-section, ' +
    '.section-header-about, .about-section, .page-section, .blog-card, .forum-card, ' +
    '.contact-card, .consulting-card, .page-title, .about-page-intro, ' +
    '.service-card, .legal-page section, .account-access-card, .account-hero';
  const revealTargets = document.querySelectorAll(revealSelector);

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const delay = parseInt(entry.target.dataset.delay || '0', 10);
          setTimeout(() => entry.target.classList.add('visible'), delay);
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08, rootMargin: '0px 0px -30px 0px' }
  );

  const staggerContainers =
    '.card-grid, .hazard-bento, .roadmap-grid, .resource-row, .exercise-chips, ' +
    '.page-container, .blog-grid, .about-section, .account-access-grid';
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function observeRevealTargets(targets) {
    targets.forEach(el => {
      if (el.classList.contains('reveal') && el.dataset.revealObserved) return;
      if (prefersReducedMotion || document.documentElement.classList.contains('reduce-motion')) {
        el.classList.add('reveal', 'visible');
        el.dataset.revealObserved = '1';
        return;
      }
      el.classList.add('reveal');
      el.dataset.revealObserved = '1';
      const grid = el.closest(staggerContainers);
      if (grid) {
        const siblings = grid.querySelectorAll('.reveal');
        const index = Array.from(siblings).indexOf(el);
        el.dataset.delay = index * 60;
      }
      revealObserver.observe(el);
    });
  }
  observeRevealTargets(revealTargets);

  // Allow dynamic content (e.g. blog grid) to run reveal after inject
  window.refreshReveal = function () {
    const targets = document.querySelectorAll(revealSelector);
    observeRevealTargets(Array.from(targets));
  };

  // --- Animated stat counters ---
  const statNums = document.querySelectorAll('.stat-num[data-target]');
  let statsCounted = false;

  function animateCounters() {
    if (statsCounted) return;
    statsCounted = true;

    statNums.forEach(el => {
      const target = parseInt(el.dataset.target, 10);
      const suffix = el.dataset.suffix || (target === 100 ? '%' : '');
      const duration = 1600;
      const start = performance.now();

      function step(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 4);
        const current = Math.round(eased * target);
        el.textContent = current + suffix;

        if (progress < 1) {
          requestAnimationFrame(step);
        }
      }

      requestAnimationFrame(step);
    });
  }

  const statsObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounters();
          statsObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  const statsContainer = document.querySelector('.hero-stats');
  if (statsContainer) statsObserver.observe(statsContainer);

  // --- Active nav link highlighting ---
  const sections = document.querySelectorAll('section[id]');
  const navAnchors = document.querySelectorAll('.nav-links a');

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          navAnchors.forEach(a => {
            a.classList.toggle('active', a.getAttribute('href') === `#${id}`);
          });
        }
      });
    },
    { threshold: 0.15, rootMargin: '-80px 0px -50% 0px' }
  );

  sections.forEach(sec => sectionObserver.observe(sec));

  // --- Checklist persistence (localStorage, keyed by date for daily reset) ---
  const checkboxes = document.querySelectorAll('.check-item input[type="checkbox"]');

  function getChecklistDateKey() {
    const d = new Date();
    const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function getChecklistStorageKey() {
    return 'driverShieldChecklist_' + getChecklistDateKey();
  }

  function getChecklistState() {
    try {
      return JSON.parse(localStorage.getItem(getChecklistStorageKey())) || {};
    } catch {
      return {};
    }
  }

  function saveChecklistState(state) {
    localStorage.setItem(getChecklistStorageKey(), JSON.stringify(state));
  }

  function getCheckboxId(checkbox) {
    const group = checkbox.closest('[data-group]');
    const card = checkbox.closest('.checklist-card');
    const cardId = card && card.id ? card.id : null;
    const groupName = group ? group.dataset.group : (cardId || 'general');
    const container = group || checkbox.closest('.checklist');
    const siblings = container.querySelectorAll('input[type="checkbox"]');
    const index = Array.from(siblings).indexOf(checkbox);
    return `${groupName}-${index}`;
  }

  const savedState = getChecklistState();
  checkboxes.forEach(cb => {
    const id = getCheckboxId(cb);
    if (savedState[id]) cb.checked = true;

    cb.addEventListener('change', () => {
      const state = getChecklistState();
      state[getCheckboxId(cb)] = cb.checked;
      saveChecklistState(state);
    });
  });

  // Reset for new day: clear today's saved state and uncheck all
  function resetChecklistForNewDay() {
    localStorage.removeItem(getChecklistStorageKey());
    checkboxes.forEach(cb => { cb.checked = false; });
    const label = document.getElementById('checklistDateLabel');
    if (label) label.textContent = getChecklistDateKey();
  }
  window.resetChecklistForNewDay = resetChecklistForNewDay;

  // Show today's date in the checklist area
  const checklistDateLabel = document.getElementById('checklistDateLabel');
  if (checklistDateLabel) checklistDateLabel.textContent = getChecklistDateKey();

  // --- Auth-aware navbar ---
  const navAuth = document.getElementById('navAuth');
  const cartBadge = document.getElementById('cartBadge');

  fetch('/api/auth/me').then(r => r.json()).then(data => {
    if (data.user) {
      navAuth.innerHTML = `
        <a href="/account" style="color:var(--text-2);font-size:0.8rem;">${data.user.username}</a>
        &nbsp;
        <a href="#" id="navLogout" style="color:var(--text-3);font-size:0.78rem;">Sign Out</a>
      `;
      const logoutBtn = document.getElementById('navLogout');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
          e.preventDefault();
          fetch('/api/auth/logout', { method: 'POST' }).then(() => location.reload());
        });
      }
    }
  }).catch(() => {});

  function updateCartBadge() {
    try {
      const cart = JSON.parse(localStorage.getItem('driver_shield_cart')) || [];
      const count = cart.reduce((s, i) => s + i.quantity, 0);
      if (cartBadge) {
        cartBadge.textContent = count > 0 ? count : '';
        cartBadge.style.display = count > 0 ? 'inline-flex' : 'none';
      }
    } catch {}
  }
  updateCartBadge();

  // --- Gated packet download (checks access & logs download for paid packets) ---
  window.downloadPacketGated = function (type) {
    var normalized = type;
    if (typeof Packets !== 'undefined' && typeof Packets._normalizeType === 'function') {
      normalized = Packets._normalizeType(type);
    }
    var valid = ['new-driver', 'seasoned-driver', 'fleet-new-hire', 'fleet-refresher'].indexOf(normalized) !== -1;
    if (!valid) return;
    if (normalized === 'new-driver') {
      if (typeof Packets !== 'undefined' && typeof Packets.download === 'function') {
        Packets.download(normalized);
      }
      return;
    }
    if (normalized === 'fleet-new-hire' || normalized === 'fleet-refresher') {
      if (typeof Packets !== 'undefined' && typeof Packets.downloadFleet === 'function') {
        Packets.downloadFleet(normalized, function (res) {
          if (res && !res.allowed && res.message) alert(res.message);
        });
      }
      return;
    }
    if (typeof Packets !== 'undefined' && typeof Packets.downloadGated === 'function') {
      Packets.downloadGated(normalized, function (res) {
        if (res && !res.allowed && res.message) alert(res.message);
      });
      return;
    }
    fetch('/api/shop/packet-access?type=' + encodeURIComponent(normalized), { credentials: 'include' })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!data.allowed) {
          alert('You don\'t have access or your download limit has been reached. This license is for your use only. Purchase again or renew your fleet license if needed.');
          return;
        }
        if (typeof Packets !== 'undefined' && typeof Packets.download === 'function') {
          Packets.download(normalized);
        }
        fetch('/api/shop/packet-download-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: normalized }),
          credentials: 'include'
        }).catch(function () {});
      })
      .catch(function () {
        alert('Unable to verify access. Please log in and try again.');
      });
  };

  window.printPacketGated = function (type) {
    var normalized = type;
    if (typeof Packets !== 'undefined' && typeof Packets._normalizeType === 'function') {
      normalized = Packets._normalizeType(type);
    }
    var valid = ['new-driver', 'seasoned-driver', 'fleet-new-hire', 'fleet-refresher'].indexOf(normalized) !== -1;
    if (!valid) return;
    if (normalized === 'new-driver') {
      if (typeof Packets !== 'undefined' && typeof Packets.print === 'function') {
        Packets.print(normalized);
      }
      return;
    }
    if (normalized === 'fleet-new-hire' || normalized === 'fleet-refresher') {
      if (typeof Packets !== 'undefined' && typeof Packets.printFleet === 'function') {
        Packets.printFleet(normalized, function (res) {
          if (res && !res.allowed && res.message) alert(res.message);
        });
      }
      return;
    }
    if (typeof Packets !== 'undefined' && typeof Packets.printGated === 'function') {
      Packets.printGated(normalized, function (res) {
        if (res && !res.allowed && res.message) alert(res.message);
      });
    }
  };

  // --- Phase tab navigation (with channel-switch feedback + keyboard) ---
  const phaseTabs = document.getElementById('phaseTabs');
  if (phaseTabs) {
    phaseTabs.setAttribute('role', 'tablist');
    phaseTabs.setAttribute('aria-label', 'Driver safety roadmap sections');
    const phaseTabButtons = phaseTabs.querySelectorAll('.phase-tab');

    const phaseTabScrollBehavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 'auto'
      : 'smooth';

    function activatePhaseTab(tab) {
      if (!tab || !tab.dataset.tab) return;
      const target = tab.dataset.tab;

      tab.classList.remove('phase-tab--click');
      void tab.offsetWidth;
      tab.classList.add('phase-tab--click');
      setTimeout(function () {
        tab.classList.remove('phase-tab--click');
      }, 200);

      phaseTabButtons.forEach(function (t) {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
        t.setAttribute('tabindex', '-1');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      tab.setAttribute('tabindex', '0');

      document.querySelectorAll('.phase-panel').forEach(function (p) {
        p.classList.remove('active');
        p.setAttribute('hidden', '');
      });
      var panel = document.getElementById('panel-' + target);
      if (panel) {
        panel.classList.add('active');
        panel.removeAttribute('hidden');
        var rect = phaseTabs.getBoundingClientRect();
        if (rect.top < 0 || rect.top > 120) {
          phaseTabs.scrollIntoView({ behavior: phaseTabScrollBehavior, block: 'start' });
        }
      }

      tab.scrollIntoView({ behavior: phaseTabScrollBehavior, block: 'nearest', inline: 'center' });
    }

    phaseTabs.setAttribute('role', 'tablist');
    phaseTabs.setAttribute('aria-label', 'Driver Safety Roadmap phases');

    phaseTabButtons.forEach(function (t) {
      var tid = t.dataset.tab;
      if (!tid) return;
      t.setAttribute('role', 'tab');
      t.setAttribute('id', 'phase-tab-' + tid);
      t.setAttribute('aria-controls', 'panel-' + tid);
      t.setAttribute('aria-selected', t.classList.contains('active') ? 'true' : 'false');
      t.setAttribute('tabindex', t.classList.contains('active') ? '0' : '-1');
      var p = document.getElementById('panel-' + tid);
      if (p) {
        p.setAttribute('role', 'tabpanel');
        p.setAttribute('aria-labelledby', 'phase-tab-' + tid);
        if (!t.classList.contains('active')) p.setAttribute('hidden', '');
        else p.removeAttribute('hidden');
      }
    });

    phaseTabs.addEventListener('click', function (e) {
      const tab = e.target.closest('.phase-tab');
      if (!tab) return;
      activatePhaseTab(tab);
    });

    phaseTabs.addEventListener('keydown', function (e) {
      const tabs = Array.from(phaseTabButtons);
      var cur = tabs.indexOf(document.activeElement);
      if (cur < 0) {
        cur = tabs.findIndex(function (t) {
          return t.classList.contains('active');
        });
      }
      if (cur < 0) cur = 0;
      var next = cur;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        next = (cur + 1) % tabs.length;
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        next = (cur - 1 + tabs.length) % tabs.length;
      } else if (e.key === 'Home') {
        e.preventDefault();
        next = 0;
      } else if (e.key === 'End') {
        e.preventDefault();
        next = tabs.length - 1;
      } else {
        return;
      }
      activatePhaseTab(tabs[next]);
      tabs[next].focus();
    });
  }

  // --- $0 Thank you (homepage coffee support) ---
  const thankYouForm = document.getElementById('thankYouForm');
  if (thankYouForm) {
    thankYouForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const nameEl = document.getElementById('tyName');
      const emailEl = document.getElementById('tyEmail');
      const successEl = document.getElementById('tySuccess');
      const submitBtn = thankYouForm.querySelector('button[type="submit"]');
      const name = nameEl ? nameEl.value.trim() : '';
      const email = emailEl ? emailEl.value.trim() : '';
      if (submitBtn) submitBtn.disabled = true;
      try {
        const r = await fetch('/api/thank-you', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ name: name || null, email: email || null })
        });
        const data = await r.json().catch(function () { return {}; });
        if (!r.ok) {
          if (successEl) {
            successEl.textContent = data.error || 'Something went wrong. Please try again.';
            successEl.classList.add('show', 'error');
          }
          if (submitBtn) submitBtn.disabled = false;
          return;
        }
        if (successEl) {
          successEl.textContent = data.message || 'Thank you! We appreciate you.';
          successEl.classList.add('show');
          successEl.classList.remove('error');
        }
        thankYouForm.querySelectorAll('input').forEach(function (inp) {
          inp.value = '';
        });
        if (submitBtn) submitBtn.style.display = 'none';
      } catch (_) {
        if (successEl) {
          successEl.textContent = 'Unable to send. Please try again later.';
          successEl.classList.add('show', 'error');
        }
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }

  // --- Newsletter form ---
  const nlForm = document.getElementById('newsletterForm');
  if (nlForm) {
    nlForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      const name = document.getElementById('nlName').value.trim();
      const email = document.getElementById('nlEmail').value.trim();
      if (!name || !email) return;
      try {
        await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name,
            email: email,
            subject: 'Newsletter Subscription',
            message: name + ' (' + email + ') subscribed to the monthly newsletter.'
          }),
          credentials: 'include'
        });
      } catch (_) {}
      document.getElementById('nlSuccess').classList.add('show');
      nlForm.querySelector('.newsletter-inputs').style.display = 'none';
      nlForm.querySelector('.nl-submit').style.display = 'none';
    });
  }

  // --- Parallax hero glows on mouse move ---
  const hero = document.querySelector('.hero');
  const glows = document.querySelectorAll('.hero-glow');

  if (hero && glows.length && window.matchMedia('(pointer: fine)').matches) {
    hero.addEventListener('mousemove', (e) => {
      const rect = hero.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;

      glows.forEach((glow, i) => {
        const factor = (i + 1) * 15;
        glow.style.transform = `translate(${x * factor}px, ${y * factor}px)`;
      });
    });
  }

  initFooterQr();
});

function initFooterQr() {
  if (/^\/(admin|login|register|forgot-password|reset-password)(\/|$)/.test(window.location.pathname)) return;
  var footer = document.querySelector('footer.footer');
  if (!footer || footer.querySelector('.footer-qr-block')) return;

  var block = document.createElement('div');
  block.className = 'footer-qr-block';
  block.innerHTML =
    '<div class="footer-qr-card">' +
      '<img class="footer-qr-image" src="/api/qr?preset=forum-lounge&amp;size=168" width="168" height="168" alt="QR code — scan to join the Mile 12 Warrior Truckers Lounge" loading="lazy">' +
      '<div class="footer-qr-copy">' +
        '<p class="footer-qr-title">Scan to join Mile 12 Warrior</p>' +
        '<p class="footer-qr-text">Visit our Truckers Lounge — the Coffee Shop on the forum. Pull up a seat and connect with fellow drivers.</p>' +
        '<a href="/forum/category/general" class="footer-qr-link">Open Coffee Shop &rarr;</a>' +
      '</div>' +
    '</div>';

  var footerTop = footer.querySelector('.footer-top');
  if (footerTop) {
    footerTop.appendChild(block);
    return;
  }
  var container = footer.querySelector('.container') || footer;
  var footerBottom = footer.querySelector('.footer-bottom');
  if (footerBottom) {
    footerBottom.parentNode.insertBefore(block, footerBottom);
  } else {
    container.insertBefore(block, container.firstChild);
  }
}
