/* Tier 1 New Driver Packet — online checklist for guests (localStorage) */
var Tier1Checklist = (function () {
  var STORAGE_KEY = 'm12_tier1_checklist';

  function getSections() {
    if (typeof Packets !== 'undefined' && typeof Packets.getNewDriverChecklist === 'function') {
      return Packets.getNewDriverChecklist();
    }
    return [];
  }

  function loadState() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch (_) {
      return {};
    }
  }

  function saveState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (_) {}
  }

  function itemKey(sectionId, index) {
    return sectionId + ':' + index;
  }

  function totalItems(sections) {
    return sections.reduce(function (n, s) { return n + s.items.length; }, 0);
  }

  function countChecked(sections, state) {
    var n = 0;
    sections.forEach(function (sec) {
      sec.items.forEach(function (_, i) {
        if (state[itemKey(sec.id, i)]) n++;
      });
    });
    return n;
  }

  function updateProgress(root, sections, state) {
    var total = totalItems(sections);
    var done = countChecked(sections, state);
    var pct = total ? Math.round((done / total) * 100) : 0;
    var fill = root.querySelector('.tier1-progress-fill');
    var label = root.querySelector('.tier1-progress-label');
    if (fill) fill.style.width = pct + '%';
    if (label) label.textContent = done + ' of ' + total + ' complete (' + pct + '%)';
  }

  function bindChecks(root, sections, state) {
    root.querySelectorAll('.tier1-check input[type="checkbox"]').forEach(function (cb) {
      cb.addEventListener('change', function () {
        state[cb.dataset.key] = cb.checked;
        saveState(state);
        updateProgress(root, sections, state);
      });
    });
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function renderInto(container) {
    var sections = getSections();
    var state = loadState();
    while (container.firstChild) container.removeChild(container.firstChild);
    container.classList.add('tier1-checklist-root');

    var progress = el('div', 'tier1-progress');
    var bar = el('div', 'tier1-progress-bar');
    bar.appendChild(el('div', 'tier1-progress-fill'));

    progress.appendChild(bar);
    progress.appendChild(el('p', 'tier1-progress-label'));
    container.appendChild(progress);

    sections.forEach(function (sec) {
      var section = el('section', 'tier1-section');
      section.id = 'tier1-' + sec.id;
      section.appendChild(el('h3', null, sec.title));
      sec.items.forEach(function (text, i) {
        var key = itemKey(sec.id, i);
        var label = el('label', 'tier1-check check-item');
        var input = document.createElement('input');
        input.type = 'checkbox';
        input.dataset.key = key;
        if (state[key]) input.checked = true;
        label.appendChild(input);
        label.appendChild(el('span', null, text));
        section.appendChild(label);
      });
      container.appendChild(section);
    });

    var actions = el('div', 'tier1-modal-actions');
    var resetBtn = el('button', 'btn btn-secondary tier1-reset', 'Reset checklist');
    resetBtn.type = 'button';
    var printBtn = el('button', 'btn btn-primary tier1-print', 'Print full packet');
    printBtn.type = 'button';
    actions.appendChild(resetBtn);
    actions.appendChild(printBtn);
    container.appendChild(actions);

    updateProgress(container, sections, state);
    bindChecks(container, sections, state);

    resetBtn.addEventListener('click', function () {
      if (!confirm('Clear all checkmarks for this packet?')) return;
      saveState({});
      renderInto(container);
    });
    printBtn.addEventListener('click', function () {
      if (typeof Packets !== 'undefined' && typeof Packets.print === 'function') {
        Packets.print('new-driver');
      }
    });
  }

  function openModal() {
    var existing = document.getElementById('tier1ChecklistModal');
    if (existing) existing.remove();

    var modal = el('div', 'tier1-modal');
    modal.id = 'tier1ChecklistModal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'tier1ChecklistTitle');

    var backdrop = el('div', 'tier1-modal-backdrop');
    modal.appendChild(backdrop);

    var panel = el('div', 'tier1-modal-panel glass-card');
    panel.setAttribute('tabindex', '-1');

    var header = el('div', 'tier1-modal-header');
    var intro = el('div');
    intro.appendChild(el('div', 'packet-tier packet-tier-free', 'Tier 1 — FREE'));
    var title = el('h2');
    title.id = 'tier1ChecklistTitle';
    title.textContent = 'New Driver Packet';
    intro.appendChild(title);
    intro.appendChild(el('p', 'tier1-modal-sub',
      'Check off items as you work through your first 90 days. Progress saves in this browser — no account needed. Free packet — no payment or checkout.'));
    var courseLink = el('p', 'tier1-modal-crosslink');
    courseLink.innerHTML = 'Working through the course? <a href="/course">Continue the 90-Day Course</a>';
    intro.appendChild(courseLink);
    header.appendChild(intro);
    var closeBtn = el('button', 'tier1-modal-close');
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.innerHTML = '&times;';
    header.appendChild(closeBtn);
    panel.appendChild(header);

    var body = el('div', 'tier1-modal-body');

    panel.appendChild(body);
    renderInto(body);
    modal.appendChild(panel);
    document.body.appendChild(modal);
    document.body.classList.add('tier1-modal-open');

    function close() {
      modal.remove();
      document.body.classList.remove('tier1-modal-open');
      document.removeEventListener('keydown', onKey);
    }
    function onKey(e) {
      if (e.key === 'Escape') close();
    }
    closeBtn.addEventListener('click', close);
    backdrop.addEventListener('click', close);
    document.addEventListener('keydown', onKey);
    panel.focus();
  }

  function open() {
    if (typeof NewDriverHub !== 'undefined') NewDriverHub.maybePromptFirstEngage('checklist');
    openModal();
  }

  document.addEventListener('DOMContentLoaded', function () {
    var pageRoot = document.getElementById('tier1ChecklistPage');
    if (pageRoot) renderInto(pageRoot);
    if (window.location.hash === '#tier1-checklist' && !pageRoot) open();
  });

  return { open: open, renderInto: renderInto, STORAGE_KEY: STORAGE_KEY };
})();
