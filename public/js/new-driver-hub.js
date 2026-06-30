/* New Driver hub — unified checklist + 90-Day Course entry, progress, account prompts */
var NewDriverHub = (function () {
  var COURSE_KEY = 'm12w_course';
  var PROMPT_PREFIX = 'm12_nd_prompted_';

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function loadJson(key) {
    try {
      return JSON.parse(localStorage.getItem(key));
    } catch (_) {
      return null;
    }
  }

  function getCourseStats() {
    var p = loadJson(COURSE_KEY);
    var completed = 0;
    if (p && p.modules) {
      for (var i = 1; i <= 10; i++) {
        if (p.modules[i] && p.modules[i].completed) completed++;
      }
    }
    var pct = Math.round((completed / 10) * 100);
    var hasStarted = completed > 0;
    if (!hasStarted && p && p.modules) {
      for (var j = 1; j <= 10; j++) {
        var mp = p.modules[j];
        if (mp && ((mp.lessons && mp.lessons.length) || mp.unlocked)) {
          hasStarted = true;
          break;
        }
      }
    }
    return {
      completed: completed,
      total: 10,
      pct: pct,
      hasStarted: hasStarted,
      label: completed + ' of 10 modules (' + pct + '%)'
    };
  }

  function getChecklistStats() {
    var state = loadJson(typeof Tier1Checklist !== 'undefined' ? Tier1Checklist.STORAGE_KEY : 'm12_tier1_checklist') || {};
    var sections = [];
    if (typeof Packets !== 'undefined' && typeof Packets.getNewDriverChecklist === 'function') {
      sections = Packets.getNewDriverChecklist();
    }
    var total = sections.reduce(function (n, s) { return n + s.items.length; }, 0);
    var done = 0;
    sections.forEach(function (sec) {
      sec.items.forEach(function (_, i) {
        if (state[sec.id + ':' + i]) done++;
      });
    });
    var pct = total ? Math.round((done / total) * 100) : 0;
    return { done: done, total: total, pct: pct, label: done + ' of ' + total + ' items (' + pct + '%)' };
  }

  function courseButtonLabel(stats) {
    if (stats.completed >= 10) return 'Review Course — Complete';
    if (stats.hasStarted || stats.completed > 0) return 'Continue Course — ' + stats.pct + '%';
    return 'Start 90-Day Course';
  }

  function crossLink(activeTab) {
    var course = getCourseStats();
    var checklist = getChecklistStats();
    if (activeTab === 'checklist') {
      var courseNote = course.hasStarted
        ? 'Course progress: ' + course.label + '. '
        : '';
      return courseNote + 'Working through the course? <a href="/course">Continue course</a> or switch to the 90-Day Course tab.';
    }
    var clNote = checklist.done > 0 ? 'Checklist: ' + checklist.label + '. ' : '';
    return clNote + 'Use the printable checklist in your cab — <button type="button" class="nd-hub-inline-link" data-nd-tab="checklist">View checklist</button> or <a href="/packets/new-driver">full-page checklist</a>.';
  }

  function renderProgressStrip(root) {
    var course = getCourseStats();
    var checklist = getChecklistStats();
    var strip = el('div', 'nd-hub-progress-strip');
    strip.innerHTML =
      '<div class="nd-hub-progress-item">' +
        '<span class="nd-hub-progress-name">Checklist</span>' +
        '<div class="nd-hub-progress-bar"><div class="nd-hub-progress-fill" style="width:' + checklist.pct + '%"></div></div>' +
        '<span class="nd-hub-progress-pct">' + checklist.pct + '%</span>' +
      '</div>' +
      '<div class="nd-hub-progress-item">' +
        '<span class="nd-hub-progress-name">Course</span>' +
        '<div class="nd-hub-progress-bar"><div class="nd-hub-progress-fill nd-hub-progress-fill-course" style="width:' + course.pct + '%"></div></div>' +
        '<span class="nd-hub-progress-pct">' + course.pct + '%</span>' +
      '</div>';
    root.appendChild(strip);
  }

  function bindTabSwitch(root, panels) {
    root.querySelectorAll('[data-nd-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var tab = btn.getAttribute('data-nd-tab');
        root.querySelectorAll('.nd-hub-tab').forEach(function (t) {
          t.classList.toggle('active', t.getAttribute('data-nd-tab') === tab);
          t.setAttribute('aria-selected', t.getAttribute('data-nd-tab') === tab ? 'true' : 'false');
        });
        Object.keys(panels).forEach(function (key) {
          if (panels[key]) panels[key].style.display = key === tab ? '' : 'none';
        });
        var cross = root.querySelector('.nd-hub-crosslink');
        if (cross) cross.innerHTML = crossLink(tab);
      });
    });
  }

  function renderChecklistPanel(panel, opts) {
    panel.innerHTML = '';
    if (opts && opts.embedChecklist) {
      var host = el('div', 'nd-hub-checklist-embed');
      panel.appendChild(host);
      if (typeof Tier1Checklist !== 'undefined' && Tier1Checklist.renderInto) {
        Tier1Checklist.renderInto(host);
      }
    } else {
      panel.innerHTML =
        '<p class="nd-hub-tab-desc">Interactive checklist from the Tier 1 packet — check items off as you work through your first 90 days. Progress saves in this browser.</p>' +
        '<div class="nd-hub-actions">' +
          '<button type="button" class="btn btn-primary nd-hub-open-checklist">View Checklist</button>' +
          '<button type="button" class="btn btn-secondary nd-hub-print-checklist">Print Full Packet</button>' +
          '<a href="/packets/new-driver" class="btn btn-secondary" style="text-decoration:none">Full-page checklist</a>' +
        '</div>';
      var openBtn = panel.querySelector('.nd-hub-open-checklist');
      var printBtn = panel.querySelector('.nd-hub-print-checklist');
      if (openBtn) {
        openBtn.addEventListener('click', function () {
          maybePromptEngagement('checklist');
          if (typeof Tier1Checklist !== 'undefined') Tier1Checklist.open();
        });
      }
      if (printBtn) {
        printBtn.addEventListener('click', function () {
          if (typeof Packets !== 'undefined') Packets.print('new-driver');
        });
      }
    }
  }

  function renderCoursePanel(panel) {
    var stats = getCourseStats();
    panel.innerHTML =
      '<p class="nd-hub-tab-desc">10 modules, 47 lessons, knowledge checks, and a certificate of completion — <strong style="color:var(--green)">FREE</strong>. Score 100% on every quiz with zero retakes to qualify for the <a href="/drivers-wall">Driver\u2019s Wall</a>.</p>' +
      '<div class="nd-hub-course-progress">' +
        '<div class="nd-hub-progress-bar nd-hub-progress-bar-lg"><div class="nd-hub-progress-fill nd-hub-progress-fill-course" style="width:' + stats.pct + '%"></div></div>' +
        '<p class="nd-hub-progress-label">' + stats.label + '</p>' +
      '</div>' +
      '<div class="nd-hub-actions">' +
        '<a href="/course" class="btn btn-primary nd-hub-course-link" style="text-decoration:none">' + courseButtonLabel(stats) + '</a>' +
      '</div>';
    var link = panel.querySelector('.nd-hub-course-link');
    if (link) {
      link.addEventListener('click', function () {
        maybePromptEngagement('course');
      });
    }
  }

  function mount(container, opts) {
    if (!container) return;
    opts = opts || {};
    var defaultTab = opts.defaultTab || 'checklist';
    while (container.firstChild) container.removeChild(container.firstChild);
    container.classList.add('nd-hub-root');

    renderProgressStrip(container);

    var tablist = el('div', 'nd-hub-tabs');
    tablist.setAttribute('role', 'tablist');
    ['checklist', 'course'].forEach(function (tab) {
      var btn = el('button', 'nd-hub-tab' + (tab === defaultTab ? ' active' : ''), tab === 'checklist' ? 'Checklist' : '90-Day Course');
      btn.type = 'button';
      btn.setAttribute('role', 'tab');
      btn.setAttribute('data-nd-tab', tab);
      btn.setAttribute('aria-selected', tab === defaultTab ? 'true' : 'false');
      tablist.appendChild(btn);
    });
    container.appendChild(tablist);

    var panels = {};
    panels.checklist = el('div', 'nd-hub-panel');
    panels.checklist.setAttribute('role', 'tabpanel');
    panels.checklist.style.display = defaultTab === 'checklist' ? '' : 'none';
    renderChecklistPanel(panels.checklist, opts);
    container.appendChild(panels.checklist);

    panels.course = el('div', 'nd-hub-panel');
    panels.course.setAttribute('role', 'tabpanel');
    panels.course.style.display = defaultTab === 'course' ? '' : 'none';
    renderCoursePanel(panels.course);
    container.appendChild(panels.course);

    var cross = el('p', 'nd-hub-crosslink');
    cross.innerHTML = crossLink(defaultTab);
    container.appendChild(cross);

    bindTabSwitch(container, panels);
  }

  function promptSeen(key) {
    try {
      return localStorage.getItem(PROMPT_PREFIX + key) === '1';
    } catch (_) {
      return false;
    }
  }

  function markPromptSeen(key) {
    try {
      localStorage.setItem(PROMPT_PREFIX + key, '1');
    } catch (_) {}
  }

  function isLoggedIn() {
    return fetch('/api/auth/me', { credentials: 'include' })
      .then(function (r) { return r.json(); })
      .then(function (d) { return !!(d && d.user); })
      .catch(function () { return false; });
  }

  function showAccountPrompt(reason) {
    var existing = document.getElementById('ndAccountPrompt');
    if (existing) existing.remove();

    var titles = {
      checklist: 'Save your checklist progress',
      course: 'Track your course & go for the Wall',
      'course-complete': 'You finished — claim your certificate'
    };
    var bodies = {
      checklist: 'Create a free account to sync checklist progress across devices. When you complete the 90-Day Course, you can request a numbered certificate and qualify for the Driver\u2019s Wall with a perfect run.',
      course: 'Your progress saves in this browser. Create a free account to back it up, request your mailed certificate at completion, and earn a spot on the Driver\u2019s Wall \u2014 100% on every knowledge check, zero retakes.',
      'course-complete': 'Outstanding work finishing all 10 modules! Sign in or create an account to request your numbered certificate, sync your perfect-run record, and qualify for the Driver\u2019s Wall if you scored 100% with no retakes.'
    };

    var modal = el('div', 'nd-account-prompt');
    modal.id = 'ndAccountPrompt';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');

    var backdrop = el('div', 'nd-account-prompt-backdrop');
    modal.appendChild(backdrop);

    var panel = el('div', 'nd-account-prompt-panel glass-card');
    panel.innerHTML =
      '<button type="button" class="nd-account-prompt-close" aria-label="Close">&times;</button>' +
      '<h3>' + (titles[reason] || titles.course) + '</h3>' +
      '<p>' + (bodies[reason] || bodies.course) + '</p>' +
      '<div class="nd-account-prompt-wall">' +
        '<strong>Driver\u2019s Wall challenge:</strong> Complete every module with a perfect score and no quiz retakes or module redos. Logged-in progress only counts toward the Wall.' +
      '</div>' +
      '<div class="nd-account-prompt-actions">' +
        '<a href="/register" class="btn btn-primary" style="text-decoration:none">Create free account</a>' +
        '<a href="/login" class="btn btn-secondary" style="text-decoration:none">Sign in</a>' +
        '<button type="button" class="btn btn-glass nd-account-prompt-dismiss">Continue as guest</button>' +
      '</div>';
    modal.appendChild(panel);
    document.body.appendChild(modal);
    document.body.classList.add('nd-prompt-open');

    function close() {
      modal.remove();
      document.body.classList.remove('nd-prompt-open');
      document.removeEventListener('keydown', onKey);
    }
    function onKey(e) {
      if (e.key === 'Escape') close();
    }
    backdrop.addEventListener('click', close);
    panel.querySelector('.nd-account-prompt-close').addEventListener('click', close);
    panel.querySelector('.nd-account-prompt-dismiss').addEventListener('click', close);
    document.addEventListener('keydown', onKey);
    panel.querySelector('.nd-account-prompt-dismiss').focus();
  }

  function maybePromptEngagement(type) {
    var key = type === 'course-complete' ? 'course-complete' : 'first-' + type;
    if (promptSeen(key)) return Promise.resolve();
    markPromptSeen(key);
    return isLoggedIn().then(function (loggedIn) {
      if (!loggedIn) showAccountPrompt(type === 'course-complete' ? 'course-complete' : type);
    });
  }

  function maybePromptFirstEngage(type) {
    return maybePromptEngagement(type);
  }

  function showFirstLessonBanner() {
    if (document.getElementById('ndFirstLessonBanner')) return;
    var main = document.getElementById('courseMain');
    if (!main) return;
    var banner = el('div', 'nd-first-lesson-banner');
    banner.id = 'ndFirstLessonBanner';
    banner.innerHTML =
      '<p><strong>Nice start!</strong> Create a free account to save progress, request your certificate at the finish line, and go for the Driver\u2019s Wall \u2014 100% on every quiz, zero retakes.</p>' +
      '<div class="nd-first-lesson-actions">' +
        '<a href="/register" class="btn btn-primary btn-sm" style="text-decoration:none">Create account</a>' +
        '<button type="button" class="btn btn-glass btn-sm nd-first-lesson-dismiss">Continue as guest</button>' +
      '</div>';
    main.insertBefore(banner, main.firstChild);
    banner.querySelector('.nd-first-lesson-dismiss').addEventListener('click', function () {
      banner.remove();
    });
  }

  function mountFromNode(node) {
    if (!node || node.getAttribute('data-nd-hub-mounted') === '1') return;
    var tab = node.getAttribute('data-nd-hub-tab') || (window.location.hash === '#course' ? 'course' : 'checklist');
    var embed = node.hasAttribute('data-nd-hub-embed');
    mount(node, { defaultTab: tab, embedChecklist: embed });
    node.setAttribute('data-nd-hub-mounted', '1');
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-nd-hub]').forEach(mountFromNode);

    var home = document.getElementById('newDriverHubHome');
    if (home) mountFromNode(home);

    var page = document.getElementById('newDriverHubPage');
    if (page) mountFromNode(page);
  });

  return {
    mount: mount,
    mountFromNode: mountFromNode,
    getCourseStats: getCourseStats,
    getChecklistStats: getChecklistStats,
    showAccountPrompt: showAccountPrompt,
    maybePromptEngagement: maybePromptEngagement,
    maybePromptFirstEngage: maybePromptFirstEngage,
    showFirstLessonBanner: showFirstLessonBanner,
    courseButtonLabel: courseButtonLabel
  };
})();
