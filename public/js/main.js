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
    'mile12warrior.com | joyce@mile12warrior.com | (916) 292-7411' +
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

document.addEventListener('DOMContentLoaded', () => {

  // --- Scroll progress bar (shared: all pages) ---
  const progressBar = document.getElementById('scrollProgress');

  function updateProgress() {
    if (!progressBar) return;
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    progressBar.style.width = progress + '%';
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

    function setMobileNavOpen(open) {
      navToggle.classList.toggle('active', open);
      navLinks.classList.toggle('open', open);
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
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
  function observeRevealTargets(targets) {
    targets.forEach(el => {
      if (el.classList.contains('reveal') && el.dataset.revealObserved) return;
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
    var valid = ['new-driver', 'seasoned-driver', 'fleet-new-hire', 'fleet-refresher'].indexOf(type) !== -1;
    if (!valid) return;
    fetch('/api/shop/packet-access?type=' + encodeURIComponent(type), { credentials: 'include' })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!data.allowed) {
          if (type === 'new-driver') {
            alert('New Driver Packet is $9. Redirecting you to shop.');
            window.location.href = '/shop';
            return;
          }
          alert('You don\'t have access or your download limit has been reached. This license is for your use only. Purchase again or renew your fleet license if needed.');
          return;
        }
        if (typeof Packets !== 'undefined' && typeof Packets.download === 'function') {
          Packets.download(type);
        }
        fetch('/api/shop/packet-download-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: type }),
          credentials: 'include'
        }).catch(function () {});
      })
      .catch(function () {
        alert('Unable to verify access. Please log in and try again.');
      });
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
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');

      document.querySelectorAll('.phase-panel').forEach(function (p) {
        p.classList.remove('active');
      });
      var panel = document.getElementById('panel-' + target);
      if (panel) {
        panel.classList.add('active');
        var rect = phaseTabs.getBoundingClientRect();
        if (rect.top < 0 || rect.top > 120) {
          phaseTabs.scrollIntoView({ behavior: phaseTabScrollBehavior, block: 'start' });
        }
      }

      tab.scrollIntoView({ behavior: phaseTabScrollBehavior, block: 'nearest', inline: 'center' });
    }

    phaseTabButtons.forEach(function (t) {
      var tid = t.dataset.tab;
      if (!tid) return;
      t.setAttribute('role', 'tab');
      t.setAttribute('id', 'phase-tab-' + tid);
      t.setAttribute('aria-controls', 'panel-' + tid);
      t.setAttribute('aria-selected', t.classList.contains('active') ? 'true' : 'false');
      var p = document.getElementById('panel-' + tid);
      if (p) {
        p.setAttribute('role', 'tabpanel');
        p.setAttribute('aria-labelledby', 'phase-tab-' + tid);
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
});
