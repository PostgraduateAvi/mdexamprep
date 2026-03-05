/* Viva Forge — MD Exam Prep
   Loads viva_forge_data.json, renders 16 cases with viva chains.
   Modes: Practice (browse+reveal), Stress (2min timer), Dialogue (transcript). */

(function () {
  'use strict';

  // --- State ---
  var data = null;        // Raw JSON
  var cases = [];         // data.cases
  var currentCase = null;
  var currentMode = 'practice';
  var stressTimer = null;
  var stressSeconds = 120;
  var stressVivaIdx = 0;
  var stressAnswered = {};

  // --- System display ---
  var SYSTEM_META = {
    cardiac: { order: 1, badge: 'sb-badge-cardio', label: 'Cardiovascular' },
    respiratory: { order: 2, badge: 'sb-badge-resp', label: 'Respiratory' },
    neuro: { order: 3, badge: 'sb-badge-neuro', label: 'Neurological' },
    abdomen: { order: 4, badge: 'sb-badge-gi', label: 'Abdomen' },
    rheumatology: { order: 5, badge: '', label: 'Rheumatology' }
  };

  // --- DOM refs ---
  var $loading, $loaderBar, $loaderStatus, $app, $sidebar, $content;
  var $modeTabs, $searchInput, $hamburger, $overlay;

  function esc(text) {
    if (!text) return '';
    var s = String(text);
    if (s.indexOf('&amp;') !== -1 || s.indexOf('&lt;') !== -1) return s;
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function $(id) { return document.getElementById(id); }

  function setLoading(pct, msg) {
    if ($loaderBar) $loaderBar.style.width = pct + '%';
    if ($loaderStatus) $loaderStatus.textContent = msg;
  }

  // --- Data Loading ---
  function loadData() {
    setLoading(10, 'Loading viva data...');
    fetch('data/viva_forge_data.json')
      .then(function (r) {
        if (!r.ok) throw new Error('Failed to load viva data');
        return r.json();
      })
      .then(function (d) {
        setLoading(60, 'Processing cases...');
        data = d;
        cases = d.cases || [];
        setLoading(80, 'Building interface...');
        buildSidebar();
        setLoading(100, 'Ready');
        setTimeout(function () {
          $loading.classList.add('done');
          $app.classList.add('ready');
        }, 300);
      })
      .catch(function (err) {
        setLoading(0, 'Error: ' + err.message);
        console.error(err);
      });
  }

  // --- Sidebar ---
  function buildSidebar() {
    // Group by system
    var grouped = {};
    cases.forEach(function (c) {
      var sys = c.system || 'other';
      if (!grouped[sys]) grouped[sys] = [];
      grouped[sys].push(c);
    });

    var sortedSystems = Object.keys(grouped).sort(function (a, b) {
      return (SYSTEM_META[a] || { order: 99 }).order - (SYSTEM_META[b] || { order: 99 }).order;
    });

    var html = '';
    sortedSystems.forEach(function (sys) {
      var meta = SYSTEM_META[sys] || { badge: '', label: sys };
      html += '<div class="sb-cat">' + esc(meta.label) + '</div>';
      grouped[sys].forEach(function (c) {
        var vivaCount = (c.vivas || []).length + (c.curveballs || []).length;
        html += '<div class="sb-item" data-id="' + esc(c.id) + '">' +
          esc(c.name) +
          '<span class="sb-badge ' + meta.badge + '">' + vivaCount + '</span>' +
        '</div>';
      });
    });

    $sidebar.innerHTML = html;

    $sidebar.addEventListener('click', function (e) {
      var item = e.target.closest('.sb-item');
      if (!item) return;
      selectCase(item.getAttribute('data-id'));
      closeSidebar();
    });
  }

  function highlightSidebarItem(id) {
    $sidebar.querySelectorAll('.sb-item').forEach(function (el) {
      el.classList.toggle('active', el.getAttribute('data-id') === id);
    });
  }

  // --- Case Selection ---
  function selectCase(id) {
    var c = cases.find(function (x) { return x.id === id; });
    if (!c) return;
    currentCase = c;
    highlightSidebarItem(id);
    clearStressTimer();
    renderCurrentMode();
  }

  function renderCurrentMode() {
    if (!currentCase) return;
    if (currentMode === 'practice') renderPractice(currentCase);
    else if (currentMode === 'stress') startStress(currentCase);
    else if (currentMode === 'dialogue') renderDialogue(currentCase);
  }

  // --- Mode Switching ---
  function switchMode(mode) {
    currentMode = mode;
    clearStressTimer();
    $modeTabs.querySelectorAll('.mode-tab').forEach(function (t) {
      t.classList.toggle('active', t.getAttribute('data-mode') === mode);
    });
    if (currentCase) renderCurrentMode();
    else $content.innerHTML = '<div class="empty-state"><h2>Select a case</h2><p>Choose a case from the sidebar to begin.</p></div>';
  }

  // ========================
  // MODE: PRACTICE
  // ========================
  function renderPractice(c) {
    var meta = SYSTEM_META[c.system] || { label: c.system };
    var html = '<h1 class="content-header">' + esc(c.name) + '</h1>';
    html += '<div class="content-source">' + esc(meta.label) + ' &mdash; ' + esc(c.examiner_command || '') + '</div>';

    // Presentation
    if (c.presentation) {
      html += '<div class="section"><h2>Presentation Script</h2>';
      html += '<div class="card card-accent"><p class="label">WHAT TO SAY</p>';
      if (typeof c.presentation === 'string') {
        html += '<p><strong>' + esc(c.presentation) + '</strong></p>';
      } else if (c.presentation.opening_statement) {
        html += '<p><strong>' + esc(c.presentation.opening_statement) + '</strong></p>';
        if (c.presentation.findings_statement) html += '<p><strong>' + esc(c.presentation.findings_statement) + '</strong></p>';
        if (c.presentation.diagnosis_statement) html += '<p><strong>' + esc(c.presentation.diagnosis_statement) + '</strong></p>';
      }
      html += '</div></div>';
    }

    // Viva questions
    if (c.vivas && c.vivas.length) {
      html += '<div class="section"><h2>Viva Questions (' + c.vivas.length + ')</h2>';
      c.vivas.forEach(function (v, i) {
        html += '<details class="viva-chain">';
        html += '<summary class="viva-title">' + (i + 1) + '. ' + esc(v.question) + '</summary>';
        html += '<div class="viva-content">';
        if (typeof v.answer === 'string') {
          html += '<p>' + esc(v.answer) + '</p>';
        } else if (Array.isArray(v.answer)) {
          html += '<ul>';
          v.answer.forEach(function (a) { html += '<li>' + esc(a) + '</li>'; });
          html += '</ul>';
        }
        if (v.follow_ups && v.follow_ups.length) {
          v.follow_ups.forEach(function (fu) {
            html += '<p><strong>Follow-up: ' + esc(fu.question) + '</strong></p>';
            if (typeof fu.answer === 'string') html += '<p>' + esc(fu.answer) + '</p>';
            else if (Array.isArray(fu.answer)) {
              html += '<ul>';
              fu.answer.forEach(function (a) { html += '<li>' + esc(a) + '</li>'; });
              html += '</ul>';
            }
          });
        }
        html += '</div></details>';
      });
      html += '</div>';
    }

    // Curveballs
    if (c.curveballs && c.curveballs.length) {
      html += '<div class="section"><h2>Curveball Questions (' + c.curveballs.length + ')</h2>';
      c.curveballs.forEach(function (cb, i) {
        html += '<details class="viva-chain">';
        html += '<summary class="viva-title">Curveball ' + (i + 1) + ': ' + esc(cb.question || cb.scenario || '') + '</summary>';
        html += '<div class="viva-content">';
        if (cb.answer) {
          if (typeof cb.answer === 'string') html += '<p>' + esc(cb.answer) + '</p>';
          else if (Array.isArray(cb.answer)) {
            html += '<ul>';
            cb.answer.forEach(function (a) { html += '<li>' + esc(a) + '</li>'; });
            html += '</ul>';
          }
        }
        if (cb.approach) html += '<p><strong>Approach:</strong> ' + esc(cb.approach) + '</p>';
        html += '</div></details>';
      });
      html += '</div>';
    }

    // Findings
    if (c.findings && c.findings.length) {
      html += '<div class="section"><h2>Key Findings</h2>';
      c.findings.forEach(function (f) {
        html += '<div class="card">';
        if (typeof f === 'string') {
          html += '<p>' + esc(f) + '</p>';
        } else {
          html += '<p class="label">' + esc(f.finding || f.sign || '') + '</p>';
          if (f.mechanism) html += '<p>' + esc(f.mechanism) + '</p>';
          if (f.significance) html += '<p><em>' + esc(f.significance) + '</em></p>';
        }
        html += '</div>';
      });
      html += '</div>';
    }

    $content.innerHTML = html;
    $content.scrollTop = 0;
  }

  // ========================
  // MODE: STRESS
  // ========================
  function clearStressTimer() {
    if (stressTimer) { clearInterval(stressTimer); stressTimer = null; }
  }

  function startStress(c) {
    clearStressTimer();
    stressSeconds = 120;
    stressVivaIdx = 0;
    stressAnswered = {};

    var allVivas = (c.vivas || []).concat(c.curveballs || []);
    if (!allVivas.length) {
      $content.innerHTML = '<div class="empty-state"><h2>No viva questions</h2><p>This case has no viva questions for stress mode.</p></div>';
      return;
    }

    renderStressView(c, allVivas);

    stressTimer = setInterval(function () {
      stressSeconds--;
      if (stressSeconds <= 0) {
        clearStressTimer();
        stressSeconds = 0;
      }
      updateTimerDisplay();
    }, 1000);
  }

  function updateTimerDisplay() {
    var el = document.getElementById('stress-timer');
    if (!el) return;
    var min = Math.floor(stressSeconds / 60);
    var sec = stressSeconds % 60;
    el.textContent = min + ':' + (sec < 10 ? '0' : '') + sec;
    el.className = 'stress-timer';
    if (stressSeconds <= 10) el.classList.add('danger');
    else if (stressSeconds <= 30) el.classList.add('warning');
    if (stressSeconds <= 0) el.textContent = "Time's up!";
  }

  function renderStressView(c, allVivas) {
    if (stressVivaIdx >= allVivas.length) {
      clearStressTimer();
      $content.innerHTML = '<div class="empty-state"><h2>Session Complete</h2><p>You answered ' + Object.keys(stressAnswered).length + ' of ' + allVivas.length + ' questions.</p><p><button class="viva-btn primary" onclick="document.getElementById(\'mode-tabs\').querySelector(\'[data-mode=practice]\').click()">Back to Practice</button></p></div>';
      return;
    }

    var v = allVivas[stressVivaIdx];
    var meta = SYSTEM_META[c.system] || { label: c.system };

    var html = '<div id="stress-timer" class="stress-timer">2:00</div>';
    html += '<div class="viva-progress"><div class="viva-progress-fill" style="width:' + ((stressVivaIdx + 1) / allVivas.length * 100).toFixed(1) + '%"></div></div>';
    html += '<div class="viva-card">';
    html += '<div class="viva-card-header"><span class="viva-card-count">Q' + (stressVivaIdx + 1) + ' / ' + allVivas.length + '</span>';
    html += '<span class="viva-card-source">' + esc(meta.label) + '</span></div>';
    html += '<div class="viva-card-question">' + esc(v.question || v.scenario || '') + '</div>';

    if (stressAnswered[stressVivaIdx]) {
      html += '<div class="viva-card-answer revealed">';
      var ans = v.answer || v.approach || '';
      if (typeof ans === 'string') html += '<p>' + esc(ans) + '</p>';
      else if (Array.isArray(ans)) {
        html += '<ul>';
        ans.forEach(function (a) { html += '<li>' + esc(a) + '</li>'; });
        html += '</ul>';
      }
      html += '</div>';
    }

    html += '<div class="viva-card-actions">';
    if (!stressAnswered[stressVivaIdx]) {
      html += '<button class="viva-btn primary" id="stress-answer">I answered — Reveal</button>';
      html += '<button class="viva-btn" id="stress-skip">Skip</button>';
    } else {
      html += '<button class="viva-btn primary" id="stress-next">Next Question</button>';
    }
    html += '</div></div>';

    $content.innerHTML = html;
    updateTimerDisplay();

    var answerBtn = $('stress-answer');
    if (answerBtn) {
      answerBtn.addEventListener('click', function () {
        stressAnswered[stressVivaIdx] = true;
        renderStressView(c, allVivas);
      });
    }
    var skipBtn = $('stress-skip');
    if (skipBtn) {
      skipBtn.addEventListener('click', function () {
        stressVivaIdx++;
        renderStressView(c, allVivas);
      });
    }
    var nextBtn = $('stress-next');
    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        stressVivaIdx++;
        renderStressView(c, allVivas);
      });
    }
  }

  // ========================
  // MODE: DIALOGUE
  // ========================
  function renderDialogue(c) {
    var meta = SYSTEM_META[c.system] || { label: c.system };
    var html = '<h1 class="content-header">' + esc(c.name) + ' — Dialogue</h1>';
    html += '<div class="content-source">' + esc(meta.label) + ' &mdash; Simulated examiner-candidate exchange</div>';

    var allVivas = (c.vivas || []).concat(c.curveballs || []);
    if (!allVivas.length) {
      html += '<div class="empty-state" style="padding-top:4vh"><p>No viva questions for dialogue mode.</p></div>';
      $content.innerHTML = html;
      return;
    }

    html += '<div class="section" style="margin-top:1.5rem">';
    allVivas.forEach(function (v, i) {
      // Examiner question
      html += '<div class="card card-blue" style="margin-bottom:0.25rem">';
      html += '<p class="label">EXAMINER</p>';
      html += '<p><strong>' + esc(v.question || v.scenario || '') + '</strong></p>';
      html += '</div>';
      // Candidate answer
      html += '<div class="card card-accent" style="margin-left:2rem;margin-bottom:1rem">';
      html += '<p class="label">CANDIDATE</p>';
      var ans = v.answer || v.approach || '';
      if (typeof ans === 'string') {
        html += '<p>' + esc(ans) + '</p>';
      } else if (Array.isArray(ans)) {
        html += '<ul>';
        ans.forEach(function (a) { html += '<li>' + esc(a) + '</li>'; });
        html += '</ul>';
      }
      html += '</div>';

      // Follow-ups
      if (v.follow_ups && v.follow_ups.length) {
        v.follow_ups.forEach(function (fu) {
          html += '<div class="card card-blue" style="margin-left:1rem;margin-bottom:0.25rem">';
          html += '<p class="label">FOLLOW-UP</p>';
          html += '<p><strong>' + esc(fu.question) + '</strong></p>';
          html += '</div>';
          html += '<div class="card card-accent" style="margin-left:3rem;margin-bottom:1rem">';
          html += '<p class="label">CANDIDATE</p>';
          if (typeof fu.answer === 'string') html += '<p>' + esc(fu.answer) + '</p>';
          else if (Array.isArray(fu.answer)) {
            html += '<ul>';
            fu.answer.forEach(function (a) { html += '<li>' + esc(a) + '</li>'; });
            html += '</ul>';
          }
          html += '</div>';
        });
      }
    });
    html += '</div>';

    $content.innerHTML = html;
    $content.scrollTop = 0;
  }

  // ========================
  // SEARCH
  // ========================
  function handleSearch() {
    var query = ($searchInput.value || '').toLowerCase().trim();
    var items = $sidebar.querySelectorAll('.sb-item');
    var cats = $sidebar.querySelectorAll('.sb-cat');

    if (!query) {
      items.forEach(function (el) { el.style.display = ''; });
      cats.forEach(function (el) { el.style.display = ''; });
      return;
    }

    items.forEach(function (el) {
      var name = (el.textContent || '').toLowerCase();
      el.style.display = name.indexOf(query) !== -1 ? '' : 'none';
    });

    cats.forEach(function (cat) {
      var next = cat.nextElementSibling;
      var hasVisible = false;
      while (next && !next.classList.contains('sb-cat')) {
        if (next.style.display !== 'none') hasVisible = true;
        next = next.nextElementSibling;
      }
      cat.style.display = hasVisible ? '' : 'none';
    });
  }

  // --- Sidebar toggle ---
  function openSidebar() {
    $sidebar.classList.add('open');
    $overlay.classList.add('visible');
  }
  function closeSidebar() {
    $sidebar.classList.remove('open');
    $overlay.classList.remove('visible');
  }

  // ========================
  // INIT
  // ========================
  function init() {
    $loading = $('loading');
    $loaderBar = $('loader-bar');
    $loaderStatus = $('loader-status');
    $app = $('app');
    $sidebar = $('sidebar');
    $content = $('content');
    $modeTabs = $('mode-tabs');
    $searchInput = $('search-input');
    $hamburger = $('hamburger');
    $overlay = $('sidebar-overlay');

    $modeTabs.addEventListener('click', function (e) {
      var tab = e.target.closest('.mode-tab');
      if (!tab) return;
      switchMode(tab.getAttribute('data-mode'));
    });

    var searchTimer;
    $searchInput.addEventListener('input', function () {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(handleSearch, 200);
    });

    $hamburger.addEventListener('click', function () {
      if ($sidebar.classList.contains('open')) closeSidebar();
      else openSidebar();
    });
    $overlay.addEventListener('click', closeSidebar);

    loadData();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
