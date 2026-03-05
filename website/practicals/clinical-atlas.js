/* Clinical Atlas — MD Exam Prep
   Loads 5 JSON case files, renders 22 clinical cases in 4 modes.
   Architecture: IIFE, no framework, mirrors build.py render patterns. */

(function () {
  'use strict';

  // --- State ---
  var cases = [];       // Flattened array of all cases
  var systems = {};     // Grouped by system name
  var currentCase = null;
  var currentMode = 'atlas';
  var vivaQueue = [];
  var vivaIndex = 0;
  var vivaRevealed = false;
  var htmlCache = {};   // case id -> rendered HTML string
  var auditState = {};  // case id -> 'blank' | 'shaky' | 'confident'

  // --- Data files ---
  var DATA_FILES = [
    'data/cardiac.json',
    'data/respiratory.json',
    'data/neuro.json',
    'data/gi_specialty.json',
    'data/general_cases.json'
  ];

  // --- System display order + badge classes ---
  var SYSTEM_META = {
    'Cardiovascular System': { order: 1, badge: 'sb-badge-cardio', short: 'CVS' },
    'Respiratory System': { order: 2, badge: 'sb-badge-resp', short: 'RESP' },
    'Neurological System': { order: 3, badge: 'sb-badge-neuro', short: 'NEURO' },
    'GI & Specialty': { order: 4, badge: 'sb-badge-gi', short: 'GI' },
    'General & Cross-System Cases': { order: 5, badge: '', short: 'GEN' }
  };

  // --- DOM refs ---
  var $loading, $loaderBar, $loaderStatus, $app, $sidebar, $content;
  var $modeTabs, $searchInput, $hamburger, $overlay;

  // --- Helpers ---
  function esc(text) {
    if (!text) return '';
    var s = String(text);
    if (s.indexOf('&amp;') !== -1 || s.indexOf('&lt;') !== -1) return s;
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function $(id) { return document.getElementById(id); }

  // --- Loading ---
  function setLoading(pct, msg) {
    if ($loaderBar) $loaderBar.style.width = pct + '%';
    if ($loaderStatus) $loaderStatus.textContent = msg;
  }

  // --- Data Loading ---
  function loadAllData() {
    setLoading(10, 'Loading case data...');
    var promises = DATA_FILES.map(function (file) {
      return fetch(file).then(function (r) {
        if (!r.ok) throw new Error('Failed to load ' + file);
        return r.json();
      });
    });

    Promise.all(promises).then(function (results) {
      setLoading(60, 'Processing cases...');
      results.forEach(function (data) {
        var sysName = data.system_name || 'Unknown';
        if (!systems[sysName]) systems[sysName] = [];

        (data.cases || []).forEach(function (c) {
          c._system = sysName;
          c._file = sysName;
          cases.push(c);
          systems[sysName].push(c);
        });
      });

      setLoading(80, 'Building interface...');
      loadAuditState();
      buildSidebar();
      setLoading(100, 'Ready');

      setTimeout(function () {
        $loading.classList.add('done');
        $app.classList.add('ready');
      }, 300);
    }).catch(function (err) {
      setLoading(0, 'Error: ' + err.message);
      console.error(err);
    });
  }

  // --- Sidebar ---
  function buildSidebar() {
    var html = '';
    var sortedSystems = Object.keys(systems).sort(function (a, b) {
      return (SYSTEM_META[a] || { order: 99 }).order - (SYSTEM_META[b] || { order: 99 }).order;
    });

    sortedSystems.forEach(function (sysName) {
      var meta = SYSTEM_META[sysName] || { badge: '', short: 'SYS' };
      html += '<div class="sb-cat">' + esc(sysName) + '</div>';
      systems[sysName].forEach(function (c) {
        html += '<div class="sb-item" data-id="' + esc(c.id) + '">' +
          esc(c.name) +
          '<span class="sb-badge ' + meta.badge + '">' + meta.short + '</span>' +
        '</div>';
      });
    });

    $sidebar.innerHTML = html;

    // Click handlers
    $sidebar.addEventListener('click', function (e) {
      var item = e.target.closest('.sb-item');
      if (!item) return;
      var id = item.getAttribute('data-id');
      selectCase(id);
      closeSidebar();
    });
  }

  function highlightSidebarItem(id) {
    var items = $sidebar.querySelectorAll('.sb-item');
    items.forEach(function (el) {
      el.classList.toggle('active', el.getAttribute('data-id') === id);
    });
  }

  // --- Case Selection ---
  function selectCase(id) {
    var c = cases.find(function (x) { return x.id === id; });
    if (!c) return;
    currentCase = c;
    highlightSidebarItem(id);

    if (currentMode === 'atlas') {
      renderAtlas(c);
    } else if (currentMode === 'xref') {
      renderXref();
    }
    // viva and audit modes don't change on case select
  }

  // --- Mode Switching ---
  function switchMode(mode) {
    currentMode = mode;
    var tabs = $modeTabs.querySelectorAll('.mode-tab');
    tabs.forEach(function (t) {
      t.classList.toggle('active', t.getAttribute('data-mode') === mode);
    });

    if (mode === 'atlas') {
      $sidebar.style.display = '';
      if (currentCase) renderAtlas(currentCase);
      else $content.innerHTML = '<div class="empty-state"><h2>Select a case</h2><p>Choose a clinical case from the sidebar to begin studying.</p></div>';
    } else if (mode === 'xref') {
      $sidebar.style.display = '';
      renderXref();
    } else if (mode === 'viva') {
      $sidebar.style.display = '';
      startVivaDrill();
    } else if (mode === 'audit') {
      $sidebar.style.display = '';
      renderAudit();
    }
  }

  // ========================
  // RENDER FUNCTIONS (mirror build.py)
  // ========================

  function renderPresentationScript(ps) {
    var h = '<h2>Presentation Script</h2>';
    h += '<div class="card card-accent"><p class="label">WHAT TO SAY TO THE EXAMINER</p>';
    h += '<p><strong>' + esc(ps.opening) + '</strong></p>';
    h += '<p><strong>' + esc(ps.gpe_findings) + '</strong></p>';
    h += '<p><strong>' + esc(ps.system_findings) + '</strong></p>';
    h += '<p><strong>"My provisional diagnosis is ' + esc(ps.diagnosis_statement) + '"</strong></p>';
    var diffs = (ps.differentials || []).slice(0, 3).join(', ');
    h += '<p><strong>"My differentials include ' + esc(diffs) + '."</strong></p>';
    h += '</div>';
    if (ps.tips && ps.tips.length) {
      h += '<div class="card card-blue"><p class="label">PRESENTATION TIPS</p><ul>';
      ps.tips.forEach(function (tip) { h += '<li>' + esc(tip) + '</li>'; });
      h += '</ul></div>';
    }
    return h;
  }

  function renderCaseScenario(cs) {
    var h = '<h2>Case Scenario</h2><table><tbody>';
    var fields = ['demographics', 'chief_complaint', 'hpi', 'past_history', 'family_history', 'drug_history', 'social_history'];
    fields.forEach(function (key) {
      if (cs[key]) {
        var label = key.replace(/_/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); });
        h += '<tr><th>' + label + '</th><td>' + esc(cs[key]) + '</td></tr>';
      }
    });
    h += '</tbody></table>';
    return h;
  }

  function renderClinicalSummary(findings) {
    var h = '<h2>Clinical Summary</h2>';
    h += '<table><thead><tr><th>Area</th><th>Finding</th><th>Detail</th><th>Significance</th></tr></thead><tbody>';
    findings.forEach(function (f) {
      h += '<tr><td>' + esc(f.area) + '</td><td><strong>' + esc(f.finding) + '</strong></td><td>' + esc(f.detail) + '</td><td>' + esc(f.significance) + '</td></tr>';
    });
    h += '</tbody></table>';
    return h;
  }

  function renderExaminationTechnique(et) {
    var h = '<h2>Examination Technique</h2>';
    if (et.sequence) {
      h += '<div class="card card-blue"><p class="label">SEQUENCE</p><p><strong>' + esc(et.sequence) + '</strong></p></div>';
    }
    (et.steps || []).forEach(function (step) {
      h += '<h3>' + esc(step.phase) + '</h3>';
      (step.actions || []).forEach(function (action) {
        h += '<div class="card"><p>' + esc(action) + '</p></div>';
      });
      if (step.findings_in_this_case && step.findings_in_this_case.length) {
        h += '<div class="card card-accent"><p class="label">IN THIS CASE</p><ul>';
        step.findings_in_this_case.forEach(function (f) {
          h += '<li><strong>' + esc(f) + '</strong></li>';
        });
        h += '</ul></div>';
      }
    });
    return h;
  }

  function renderFindingsMechanisms(findings) {
    var h = '<h2>Findings &amp; Mechanisms</h2>';
    findings.forEach(function (f) {
      h += '<div class="card">';
      h += '<p class="label">' + esc(f.finding) + '</p>';
      h += '<p><strong>Mechanism:</strong> ' + esc(f.mechanism) + '</p>';
      if (f.mechanism_chain) h += '<p class="mechanism-chain">' + esc(f.mechanism_chain) + '</p>';
      if (f.caveat) h += '<p><strong>Caveat:</strong> ' + esc(f.caveat) + '</p>';
      if (f.grading) h += '<p><strong>Grading:</strong> ' + esc(f.grading) + '</p>';
      h += '</div>';
    });
    return h;
  }

  function renderDiagnosisDifferentials(dd) {
    var h = '<h2>Diagnosis &amp; Differentials</h2>';
    h += '<div class="card card-accent"><p class="label">PROVISIONAL DIAGNOSIS</p>';
    h += '<p><strong>' + esc(dd.provisional || dd.primary || '') + '</strong></p>';
    var evidence = dd.supporting_evidence || dd.evidence_for || [];
    if (evidence.length) {
      h += '<p class="label" style="margin-top:0.75rem">SUPPORTING EVIDENCE</p><ul>';
      evidence.forEach(function (ev) { h += '<li>' + esc(ev) + '</li>'; });
      h += '</ul>';
    }
    h += '</div>';
    if (dd.differentials && dd.differentials.length) {
      h += '<h3>Differentials</h3>';
      dd.differentials.forEach(function (d) {
        h += '<div class="card">';
        h += '<p><strong>' + esc(d.condition) + '</strong></p>';
        if (d.points_for) h += '<p><em>For:</em> ' + esc(d.points_for) + '</p>';
        var why = d.why_not || d.distinguishing || '';
        if (why) h += '<p><em>Against:</em> ' + esc(why) + '</p>';
        h += '</div>';
      });
    }
    return h;
  }

  function renderInvestigations(invs) {
    var h = '<h2>Investigations</h2>';
    h += '<table><thead><tr><th>Test</th><th>Expected</th><th>Why</th></tr></thead><tbody>';
    invs.forEach(function (inv) {
      h += '<tr><td><strong>' + esc(inv.test) + '</strong></td><td>' + esc(inv.expected) + '</td><td>' + esc(inv.why || inv.purpose || '') + '</td></tr>';
    });
    h += '</tbody></table>';
    return h;
  }

  function renderManagement(mgmt) {
    var h = '<h2>Management</h2>';
    var medical = mgmt.medical || mgmt.principles || [];
    if (medical.length) {
      h += '<h3>Medical</h3>';
      medical.forEach(function (m) {
        h += '<div class="card">';
        h += '<p><strong>' + esc(m.intervention) + '</strong></p>';
        if (m.rationale) h += '<p>' + esc(m.rationale) + '</p>';
        if (m.specifics) h += '<p><em>' + esc(m.specifics) + '</em></p>';
        h += '</div>';
      });
    }
    if (mgmt.interventional) h += '<h3>Interventional</h3><div class="card"><p>' + esc(mgmt.interventional) + '</p></div>';
    if (mgmt.surgical) h += '<h3>Surgical</h3><div class="card"><p>' + esc(mgmt.surgical) + '</p></div>';
    if (mgmt.this_patient) {
      h += '<div class="card card-accent"><p class="label">THIS PATIENT</p><p><strong>' + esc(mgmt.this_patient) + '</strong></p></div>';
    }
    return h;
  }

  function renderComplications(comps) {
    if (!comps || !comps.length) return '';
    var h = '<h2>Complications</h2>';
    comps.forEach(function (c) {
      h += '<div class="card">';
      h += '<p class="label">' + esc(c.complication) + '</p>';
      if (c.mechanism) h += '<p><strong>Mechanism:</strong> ' + esc(c.mechanism) + '</p>';
      if (c.presentation) h += '<p><strong>Presentation:</strong> ' + esc(c.presentation) + '</p>';
      if (c.management) h += '<p><strong>Management:</strong> ' + esc(c.management) + '</p>';
      h += '</div>';
    });
    return h;
  }

  function renderVivas(vivas) {
    var h = '<h2>Viva Questions</h2>';
    vivas.forEach(function (v, i) {
      h += '<details class="viva-chain">';
      h += '<summary class="viva-title">' + (i + 1) + '. ' + esc(v.question) + '</summary>';
      h += '<div class="viva-content">';
      h += '<p>' + esc(v.answer) + '</p>';
      if (v.follow_ups && v.follow_ups.length) {
        v.follow_ups.forEach(function (fu) {
          h += '<p><strong>Follow-up: ' + esc(fu.question) + '</strong></p>';
          h += '<p>' + esc(fu.answer) + '</p>';
        });
      }
      h += '</div></details>';
    });
    return h;
  }

  // --- Full case render (cached) ---
  function renderFullCase(c) {
    if (htmlCache[c.id]) return htmlCache[c.id];

    var h = '';
    if (c.presentation_script) h += renderPresentationScript(c.presentation_script);
    if (c.case_scenario) h += renderCaseScenario(c.case_scenario);
    if (c.clinical_summary) h += renderClinicalSummary(c.clinical_summary);
    if (c.examination_technique) h += renderExaminationTechnique(c.examination_technique);
    if (c.findings_with_mechanisms) h += renderFindingsMechanisms(c.findings_with_mechanisms);
    if (c.diagnosis_and_differentials) h += renderDiagnosisDifferentials(c.diagnosis_and_differentials);
    if (c.investigations) h += renderInvestigations(c.investigations);
    if (c.management) h += renderManagement(c.management);
    if (c.complications) h += renderComplications(c.complications);
    if (c.vivas) h += renderVivas(c.vivas);

    htmlCache[c.id] = h;
    return h;
  }

  // ========================
  // MODE: ATLAS
  // ========================
  function renderAtlas(c) {
    var meta = SYSTEM_META[c._system] || { short: 'SYS' };
    var html = '<h1 class="content-header">' + esc(c.name) + '</h1>';
    html += '<div class="content-source">' + meta.short + ' &mdash; ' + esc(c._system) + '</div>';
    html += '<div class="section">' + renderFullCase(c) + '</div>';
    $content.innerHTML = html;
    $content.scrollTop = 0;
  }

  // ========================
  // MODE: CROSS-REFERENCE
  // ========================
  function renderXref() {
    var query = ($searchInput.value || '').toLowerCase().trim();
    if (!query) {
      $content.innerHTML = '<div class="xref-intro"><h2>Cross-Reference Search</h2><p>Type a finding, diagnosis, or mechanism in the search bar to find it across all cases.</p></div>';
      return;
    }

    var results = [];
    cases.forEach(function (c) {
      var fullText = renderFullCase(c);
      var plainText = fullText.replace(/<[^>]+>/g, '').toLowerCase();
      var idx = plainText.indexOf(query);
      if (idx === -1) return;

      // Extract excerpt around match
      var start = Math.max(0, idx - 60);
      var end = Math.min(plainText.length, idx + query.length + 100);
      var excerpt = (start > 0 ? '...' : '') + plainText.substring(start, end) + (end < plainText.length ? '...' : '');
      // Highlight match
      var re = new RegExp('(' + query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
      excerpt = esc(excerpt).replace(re, '<mark>$1</mark>');

      results.push({ case: c, excerpt: excerpt });
    });

    if (!results.length) {
      $content.innerHTML = '<div class="xref-intro"><h2>No results</h2><p>No cases mention "' + esc(query) + '". Try a different term.</p></div>';
      return;
    }

    var html = '<h1 class="content-header">' + results.length + ' result' + (results.length !== 1 ? 's' : '') + ' for "' + esc(query) + '"</h1><div style="margin-top:1rem">';
    results.forEach(function (r) {
      var meta = SYSTEM_META[r.case._system] || { short: 'SYS' };
      html += '<div class="xref-result" data-id="' + esc(r.case.id) + '">';
      html += '<div class="xref-file">' + meta.short + '</div>';
      html += '<div class="xref-title">' + esc(r.case.name) + '</div>';
      html += '<div class="xref-excerpt">' + r.excerpt + '</div>';
      html += '</div>';
    });
    html += '</div>';

    $content.innerHTML = html;
    $content.scrollTop = 0;

    // Click to jump to case in atlas mode
    $content.querySelectorAll('.xref-result').forEach(function (el) {
      el.addEventListener('click', function () {
        var id = this.getAttribute('data-id');
        switchMode('atlas');
        selectCase(id);
      });
    });
  }

  // ========================
  // MODE: VIVA DRILL
  // ========================
  function collectAllVivas() {
    var all = [];
    cases.forEach(function (c) {
      (c.vivas || []).forEach(function (v) {
        all.push({ question: v.question, answer: v.answer, follow_ups: v.follow_ups, source: c.name, system: c._system });
      });
    });
    // Shuffle
    for (var i = all.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = all[i]; all[i] = all[j]; all[j] = tmp;
    }
    return all;
  }

  function startVivaDrill() {
    vivaQueue = collectAllVivas();
    vivaIndex = 0;
    vivaRevealed = false;
    renderVivaCard();
  }

  function renderVivaCard() {
    if (!vivaQueue.length) {
      $content.innerHTML = '<div class="empty-state"><h2>No viva questions</h2><p>No viva data found in the loaded cases.</p></div>';
      return;
    }
    if (vivaIndex >= vivaQueue.length) vivaIndex = 0;

    var v = vivaQueue[vivaIndex];
    var meta = SYSTEM_META[v.system] || { short: 'SYS' };
    var pct = ((vivaIndex + 1) / vivaQueue.length * 100).toFixed(1);

    var html = '<div class="viva-progress"><div class="viva-progress-fill" style="width:' + pct + '%"></div></div>';
    html += '<div class="viva-card">';
    html += '<div class="viva-card-header"><span class="viva-card-count">' + (vivaIndex + 1) + ' / ' + vivaQueue.length + '</span>';
    html += '<span class="viva-card-source">' + meta.short + ' &mdash; ' + esc(v.source) + '</span></div>';
    html += '<div class="viva-card-question">' + esc(v.question) + '</div>';
    html += '<div class="viva-card-answer" id="viva-answer">';
    html += '<p>' + esc(v.answer) + '</p>';
    if (v.follow_ups && v.follow_ups.length) {
      v.follow_ups.forEach(function (fu) {
        html += '<p><strong>Follow-up: ' + esc(fu.question) + '</strong></p>';
        html += '<p>' + esc(fu.answer) + '</p>';
      });
    }
    html += '</div>';
    html += '<div class="viva-card-actions">';
    if (!vivaRevealed) {
      html += '<button class="viva-btn primary" id="viva-reveal">Reveal Answer</button>';
    } else {
      html += '<button class="viva-btn" id="viva-prev">Previous</button>';
      html += '<button class="viva-btn primary" id="viva-next">Next</button>';
    }
    html += '</div></div>';
    html += '<div class="viva-keys"><kbd>Space</kbd> reveal &middot; <kbd>&rarr;</kbd> next &middot; <kbd>&larr;</kbd> prev</div>';

    $content.innerHTML = html;
    $content.scrollTop = 0;

    // Bind actions
    var revealBtn = $('viva-reveal');
    if (revealBtn) {
      revealBtn.addEventListener('click', function () {
        vivaRevealed = true;
        var ans = $('viva-answer');
        if (ans) ans.classList.add('revealed');
        renderVivaCard();
      });
    }
    var nextBtn = $('viva-next');
    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        vivaIndex++;
        vivaRevealed = false;
        renderVivaCard();
      });
    }
    var prevBtn = $('viva-prev');
    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        vivaIndex = Math.max(0, vivaIndex - 1);
        vivaRevealed = false;
        renderVivaCard();
      });
    }
  }

  // ========================
  // MODE: QUICK AUDIT
  // ========================
  function loadAuditState() {
    try {
      var stored = localStorage.getItem('atlas-audit');
      if (stored) auditState = JSON.parse(stored);
    } catch (e) { /* ignore */ }
  }

  function saveAuditState() {
    try { localStorage.setItem('atlas-audit', JSON.stringify(auditState)); } catch (e) { /* ignore */ }
  }

  function cycleAudit(id) {
    var current = auditState[id] || 'blank';
    if (current === 'blank') auditState[id] = 'shaky';
    else if (current === 'shaky') auditState[id] = 'confident';
    else auditState[id] = 'blank';
    saveAuditState();
    renderAudit();
  }

  function renderAudit() {
    var confident = 0, shaky = 0, blank = 0;
    cases.forEach(function (c) {
      var s = auditState[c.id] || 'blank';
      if (s === 'confident') confident++;
      else if (s === 'shaky') shaky++;
      else blank++;
    });

    var html = '<h1 class="content-header">Quick Audit</h1>';
    html += '<div class="content-source">Track your confidence across all cases</div>';
    html += '<div class="audit-summary">';
    html += '<span style="color:var(--green)">Confident: ' + confident + '</span>';
    html += '<span style="color:var(--accent)">Shaky: ' + shaky + '</span>';
    html += '<span style="color:var(--red)">Not studied: ' + blank + '</span>';
    html += '</div>';

    html += '<div class="audit-grid">';
    var sortedSystems = Object.keys(systems).sort(function (a, b) {
      return (SYSTEM_META[a] || { order: 99 }).order - (SYSTEM_META[b] || { order: 99 }).order;
    });

    sortedSystems.forEach(function (sysName) {
      var meta = SYSTEM_META[sysName] || { short: 'SYS' };
      html += '<div class="sb-cat" style="padding-left:0.85rem">' + esc(sysName) + '</div>';
      systems[sysName].forEach(function (c) {
        var status = auditState[c.id] || 'blank';
        var statusLabel = status === 'confident' ? 'Confident' : status === 'shaky' ? 'Shaky' : 'Not studied';
        html += '<div class="audit-row" data-id="' + esc(c.id) + '">';
        html += '<span class="audit-title">' + esc(c.name) + '</span>';
        html += '<span class="audit-status ' + status + '">' + statusLabel + '</span>';
        html += '</div>';
      });
    });
    html += '</div>';

    $content.innerHTML = html;
    $content.scrollTop = 0;

    // Click to cycle
    $content.querySelectorAll('.audit-row').forEach(function (el) {
      el.addEventListener('click', function () {
        cycleAudit(this.getAttribute('data-id'));
      });
    });
  }

  // ========================
  // SEARCH
  // ========================
  function handleSearch() {
    if (currentMode === 'xref') {
      renderXref();
    } else {
      // Filter sidebar items
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

      // Hide category headers with no visible items
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
  }

  // ========================
  // SIDEBAR TOGGLE (mobile)
  // ========================
  function openSidebar() {
    $sidebar.classList.add('open');
    $overlay.classList.add('visible');
  }
  function closeSidebar() {
    $sidebar.classList.remove('open');
    $overlay.classList.remove('visible');
  }

  // ========================
  // KEYBOARD
  // ========================
  function handleKeyboard(e) {
    if (currentMode !== 'viva') return;
    if (e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault();
      if (!vivaRevealed) {
        vivaRevealed = true;
        renderVivaCard();
      }
    } else if (e.key === 'ArrowRight') {
      vivaIndex++;
      vivaRevealed = false;
      renderVivaCard();
    } else if (e.key === 'ArrowLeft') {
      vivaIndex = Math.max(0, vivaIndex - 1);
      vivaRevealed = false;
      renderVivaCard();
    }
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

    // Mode tabs
    $modeTabs.addEventListener('click', function (e) {
      var tab = e.target.closest('.mode-tab');
      if (!tab) return;
      switchMode(tab.getAttribute('data-mode'));
    });

    // Search
    var searchTimer;
    $searchInput.addEventListener('input', function () {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(handleSearch, 200);
    });

    // Sidebar toggle
    $hamburger.addEventListener('click', function () {
      if ($sidebar.classList.contains('open')) closeSidebar();
      else openSidebar();
    });
    $overlay.addEventListener('click', closeSidebar);

    // Keyboard
    document.addEventListener('keydown', handleKeyboard);

    // Load data
    loadAllData();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
