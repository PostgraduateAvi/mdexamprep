/* MBBEasy — Theory: browse topics by system */
(function () {
  'use strict';

  var ICONS = {
    cardiology: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>',
    respiratory: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2"/><path d="M9.6 4.6A2 2 0 1 1 11 8H2"/><path d="M12.6 19.4A2 2 0 1 0 14 16H2"/></svg>',
    neurology: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/><path d="M17.599 6.5a3 3 0 0 0 .399-1.375"/><path d="M6.003 5.125A3 3 0 0 0 6.401 6.5"/><path d="M3.477 10.896a4 4 0 0 1 .585-.396"/><path d="M19.938 10.5a4 4 0 0 1 .585.396"/><path d="M6 18a4 4 0 0 1-1.967-.516"/><path d="M19.967 17.484A4 4 0 0 1 18 18"/></svg>',
    nephrology: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.165 18.002C6.14 16.41 4 13.253 4 9.5a6.5 6.5 0 0 1 8-6.327A6.5 6.5 0 0 1 20 9.5c0 3.753-2.14 6.91-6.165 8.502a.993.993 0 0 1-.67 0Z"/></svg>',
    gastro: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>',
    hematology: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/></svg>',
    endocrinology: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>',
    search: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>',
    flame: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>',
    zap: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/></svg>',
    chevronUp: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>',
    x: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
    bookDashed: '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 22h-2"/><path d="M20 15v2h-2"/><path d="M4 19.5V15"/><path d="M20 8v3"/><path d="M18 2h2v2"/><path d="M4 11V9"/><path d="M12 2h2"/><path d="M12 22h2"/><path d="M12 17h2"/><path d="M8 22H6.5a2.5 2.5 0 0 1 0-5H8"/><path d="M4 5v-.5A2.5 2.5 0 0 1 6.5 2H8"/></svg>'
  };

  var SYSTEMS = [
    { key: 'cardiology', label: 'Cardiology' },
    { key: 'respiratory', label: 'Respiratory' },
    { key: 'neurology', label: 'Neurology' },
    { key: 'nephrology', label: 'Nephrology' },
    { key: 'gastro', label: 'Gastroenterology' },
    { key: 'hematology', label: 'Hematology' },
    { key: 'endocrinology', label: 'Endocrinology' }
  ];

  /* Theory topic ID → practicals case mapping */
  /* NOTE: keys must match topic IDs in theory/data/{system}.json exactly */
  /* Respiratory, Neurology, Gastro topics below are pending content (system data not yet created) */
  var TOPIC_CASE_MAP = {
    /* Cardiology — IDs from cardiology.json */
    'mitral-stenosis-ms': { system: 'cardiac', case: 'mitral_stenosis', label: 'Mitral Stenosis' },
    'mitral-regurgitation-mr': { system: 'cardiac', case: 'mitral_regurgitation', label: 'Mitral Regurgitation' },
    'aortic-stenosis-as': { system: 'cardiac', case: 'aortic_stenosis', label: 'Aortic Stenosis' },
    'aortic-regurgitation-ar': { system: 'cardiac', case: 'aortic_regurgitation', label: 'Aortic Regurgitation' },
    /* Respiratory — pending content */
    'pleural-effusion': { system: 'respiratory', case: 'pleural_effusion', label: 'Pleural Effusion' },
    'pneumothorax': { system: 'respiratory', case: 'pneumothorax', label: 'Pneumothorax' },
    'pneumonia': { system: 'respiratory', case: 'consolidation', label: 'Consolidation' },
    'bronchial-asthma': { system: 'respiratory', case: 'bronchial_asthma', label: 'Bronchial Asthma' },
    'copd': { system: 'respiratory', case: 'copd_cor_pulmonale', label: 'COPD & Cor Pulmonale' },
    /* Neurology — pending content */
    'guillain-barre-syndrome': { system: 'neuro', case: 'gbs', label: 'GBS' },
    'ischemic-stroke': { system: 'neuro', case: 'hemiplegia', label: 'Hemiplegia' },
    'spinal-cord-lesions': { system: 'neuro', case: 'paraplegia', label: 'Paraplegia' },
    'parkinsons-disease': { system: 'neuro', case: 'parkinsons', label: "Parkinson's Disease" },
    /* Gastroenterology — pending content */
    'cirrhosis': { system: 'gi', case: 'cirrhosis_alcoholic', label: 'Alcoholic Cirrhosis' },
    'dermatomyositis': { system: 'gi', case: 'dermatomyositis_long_case', label: 'Dermatomyositis' }
  };

  var cache = {};
  var activeSystem = null;
  var hyFilterActive = false;
  var quickReviewActive = false;

  function esc(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  /* ---------- Skeleton Loading ---------- */

  function showSkeleton(deck) {
    deck.innerHTML =
      '<div class="skeleton-card"></div>' +
      '<div class="skeleton-card"></div>' +
      '<div class="skeleton-card"></div>' +
      '<div class="skeleton-card"></div>';
  }

  /* ---------- System Buttons ---------- */

  function buildSystemButtons() {
    var container = document.getElementById('system-btns');
    if (!container) return;
    var html = SYSTEMS.map(function (s) {
      return '<button class="system-btn" data-system="' + s.key + '">' +
        (ICONS[s.key] || '') +
        '<span class="system-btn-label">' + s.label + '</span>' +
        '</button>';
    }).join('');
    container.innerHTML = html;
    container.addEventListener('click', function (e) {
      var btn = e.target.closest('.system-btn');
      if (!btn) return;
      selectSystem(btn.dataset.system);
    });
  }

  function updateButtonStats(key, data) {
    var btn = document.querySelector('.system-btn[data-system="' + key + '"]');
    if (!btn || !data.topicCount) return;
    var label = btn.querySelector('.system-btn-label');
    if (label) {
      label.textContent = SYSTEMS.filter(function (s) { return s.key === key; })[0].label;
    }
    var existing = btn.querySelector('.system-btn-count');
    if (!existing) {
      var span = document.createElement('span');
      span.className = 'system-btn-count';
      span.textContent = data.topicCount;
      btn.appendChild(span);
    }
  }

  /* ---------- System Selection ---------- */

  function selectSystem(key) {
    activeSystem = key;
    hyFilterActive = false;
    quickReviewActive = false;
    var btns = document.querySelectorAll('.system-btn');
    btns.forEach(function (b) { b.classList.toggle('active', b.dataset.system === key); });
    loadSystem(key);
  }

  function loadSystem(key) {
    var deck = document.getElementById('topic-deck');
    var search = document.getElementById('topic-search');
    var toolbar = document.getElementById('theory-toolbar');

    if (cache[key]) {
      renderTopics(cache[key], deck, search, toolbar);
      updateButtonStats(key, cache[key]);
      return;
    }

    showSkeleton(deck);
    search.style.display = 'none';
    toolbar.style.display = 'none';

    fetch('/theory/data/' + key + '.json')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        cache[key] = data;
        renderTopics(data, deck, search, toolbar);
        updateButtonStats(key, data);
      })
      .catch(function () {
        search.style.display = 'none';
        toolbar.style.display = 'none';
        deck.innerHTML =
          '<div class="coming-soon">' +
          '<div class="coming-soon-icon" aria-hidden="true">' + ICONS.bookDashed + '</div>' +
          '<h3>Coming soon</h3>' +
          '<p>Content for this system is being prepared from textbooks.</p>' +
          '</div>';
      });
  }

  /* ---------- Cross-Link Chips ---------- */

  function buildCrossLinks(topicId) {
    var match = TOPIC_CASE_MAP[topicId];
    if (!match) return '';
    return '<div class="cross-links">' +
      '<span class="cross-links-label">Related case:</span>' +
      '<a class="cross-link" href="/practicals/?system=' + match.system + '#case-' + match.case + '">' +
      esc(match.label) +
      '</a></div>';
  }

  /* ---------- Study Path Banner ---------- */

  function buildStudyPath(systemKey, topicCount, hyCount) {
    var dismissKey = 'mbbe-studypath-' + systemKey;
    try { if (localStorage.getItem(dismissKey)) return ''; } catch (e) { /* ignore */ }

    return '<div class="study-path" id="study-path">' +
      '<span><strong>Study path:</strong> Start with the first 5 topics (foundations), ' +
      'then focus on <strong>High Yield</strong> topics' +
      (hyCount ? ' (' + hyCount + ' marked)' : '') +
      '. Practise with related clinical cases.</span>' +
      '<button class="study-path-dismiss" aria-label="Dismiss" data-key="' + esc(dismissKey) + '">' + ICONS.x + '</button>' +
      '</div>';
  }

  /* ---------- Render Topics (Grouped by Part) ---------- */

  function renderTopics(data, deck, search, toolbar) {
    var topics = data.topics || [];

    if (topics.length === 0) {
      search.style.display = 'none';
      toolbar.style.display = 'none';
      deck.innerHTML =
        '<div class="coming-soon">' +
        '<div class="coming-soon-icon" aria-hidden="true">' + ICONS.bookDashed + '</div>' +
        '<h3>Coming soon</h3>' +
        '<p>Content for this system is being prepared from textbooks.</p>' +
        '</div>';
      return;
    }

    // Show search + toolbar
    search.style.display = '';
    search.value = '';
    toolbar.style.display = '';

    // Reading progress
    var readSet = getReadSet(activeSystem);

    // Toolbar: HY filter + Quick Review + progress
    var hyCount = data.hyCount || 0;
    toolbar.innerHTML =
      '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">' +
      (hyCount > 0
        ? '<button class="hy-toggle" id="hy-toggle">' + ICONS.flame + 'High Yield &middot; ' + hyCount + '</button>'
        : '') +
      '<button class="qr-toggle" id="qr-toggle">' + ICONS.zap + 'Quick Review</button>' +
      '</div>' +
      '<span class="read-progress" id="read-progress">' + readSet.size + ' / ' + topics.length + ' read</span>';

    // HY filter toggle
    var hyBtn = document.getElementById('hy-toggle');
    if (hyBtn) {
      hyBtn.addEventListener('click', function () {
        hyFilterActive = !hyFilterActive;
        if (hyFilterActive) { quickReviewActive = false; document.getElementById('qr-toggle').classList.remove('active'); deck.classList.remove('quick-review'); }
        hyBtn.classList.toggle('active', hyFilterActive);
        deck.classList.toggle('hy-only', hyFilterActive);
        updatePartHeaderVisibility();
      });
    }

    // Quick Review toggle
    var qrBtn = document.getElementById('qr-toggle');
    if (qrBtn) {
      qrBtn.addEventListener('click', function () {
        quickReviewActive = !quickReviewActive;
        if (quickReviewActive) { hyFilterActive = false; if (hyBtn) hyBtn.classList.remove('active'); deck.classList.remove('hy-only'); }
        qrBtn.classList.toggle('active', quickReviewActive);
        deck.classList.toggle('quick-review', quickReviewActive);
        // Auto-expand all HY topics in quick review mode
        if (quickReviewActive) {
          deck.querySelectorAll('.topic-card[data-hy]').forEach(function (c) { c.open = true; });
          deck.querySelectorAll('.topic-card:not([data-hy])').forEach(function (c) { c.open = false; });
        }
        updatePartHeaderVisibility();
      });
    }

    // Group topics by part
    var parts = data.parts || [];
    var partMap = {};
    parts.forEach(function (p) { partMap[p.key] = { label: p.label, topics: [] }; });

    // Fallback for topics without parts
    topics.forEach(function (t) {
      var key = t.part || '_ungrouped';
      if (!partMap[key]) {
        partMap[key] = { label: '', topics: [] };
        parts.push({ key: key, label: '' });
      }
      partMap[key].topics.push(t);
    });

    // Build HTML
    var html = buildStudyPath(activeSystem, topics.length, hyCount);

    parts.forEach(function (p) {
      var group = partMap[p.key];
      if (!group || group.topics.length === 0) return;

      // Part header with progress
      if (p.label) {
        var partRead = 0;
        var partTotal = group.topics.length;
        group.topics.forEach(function (t) { if (readSet.has(t.id)) partRead++; });
        var pct = partTotal > 0 ? Math.round((partRead / partTotal) * 100) : 0;
        var fillClass = pct === 100 ? ' complete' : '';

        html += '<div class="part-header" data-part="' + esc(p.key) + '">' +
          '<span class="part-header-label">' + esc(p.label) + '</span>' +
          '<div class="part-progress">' +
          '<div class="part-progress-bar"><div class="part-progress-fill' + fillClass + '" style="width:' + pct + '%"></div></div>' +
          '<span class="part-progress-text">' + partRead + '/' + partTotal + '</span>' +
          '</div></div>';
      }

      // Topic cards
      group.topics.forEach(function (t) {
        var isHY = t.tags && t.tags.indexOf('high-yield') !== -1;
        var isRead = readSet.has(t.id);
        var tags = isHY ? '<span class="tag-hy">High Yield</span>' : '';
        var source = t.source ? '<div class="topic-source">Source: ' + esc(t.source) + '</div>' : '';
        var crossLinks = buildCrossLinks(t.id);

        html += '<details class="topic-card" data-title="' + esc(t.title.toLowerCase()) + '"' +
          ' data-content="' + esc((t.content || '').replace(/<[^>]*>/g, '').substring(0, 200).toLowerCase()) + '"' +
          ' data-id="' + esc(t.id) + '"' +
          ' data-part="' + esc(t.part || '') + '"' +
          (isHY ? ' data-hy' : '') +
          (isRead ? ' data-read' : '') +
          '>' +
          '<summary>' +
          '<span class="topic-num">' + t.num + '</span>' +
          '<span class="topic-title">' + esc(t.title) + '</span>' +
          tags +
          '</summary>' +
          '<div class="topic-body">' +
          '<div class="topic-body-inner">' +
          '<div class="content-html">' + (t.content || '<p>No content yet.</p>') + '</div>' +
          source +
          crossLinks +
          '</div>' +
          '</div>' +
          '</details>';
      });
    });

    deck.innerHTML = html;
    deck.classList.remove('hy-only');
    deck.classList.remove('quick-review');

    // Study path dismiss handler
    var dismissBtn = deck.querySelector('.study-path-dismiss');
    if (dismissBtn) {
      dismissBtn.addEventListener('click', function () {
        try { localStorage.setItem(dismissBtn.dataset.key, '1'); } catch (e) { /* ignore */ }
        var banner = document.getElementById('study-path');
        if (banner) banner.remove();
      });
    }

    // Reading progress: listen for toggle events
    deck.addEventListener('toggle', function (e) {
      var card = e.target.closest('.topic-card');
      if (!card || !card.open) return;
      var id = card.dataset.id;
      if (!id) return;
      markRead(activeSystem, id);
      card.setAttribute('data-read', '');
      updateReadProgress(data.topics.length);
      updatePartProgress();
    }, true);
  }

  /* ---------- Search (title + content) ---------- */

  function setupSearch() {
    var search = document.getElementById('topic-search');
    if (!search) return;
    search.addEventListener('input', function () {
      var q = search.value.toLowerCase().trim();
      var cards = document.querySelectorAll('.topic-card');
      cards.forEach(function (card) {
        var title = card.dataset.title || '';
        var content = card.dataset.content || '';
        var match = q === '' || title.indexOf(q) !== -1 || content.indexOf(q) !== -1;
        card.style.display = match ? '' : 'none';
      });
      updatePartHeaderVisibility();
    });
  }

  /* ---------- Part Header Visibility ---------- */

  function updatePartHeaderVisibility() {
    var headers = document.querySelectorAll('.part-header');
    var deck = document.getElementById('topic-deck');
    var isHYOnly = deck.classList.contains('hy-only');
    var isQR = deck.classList.contains('quick-review');

    headers.forEach(function (header) {
      var partKey = header.dataset.part;
      var cards = document.querySelectorAll('.topic-card[data-part="' + partKey + '"]');
      var anyVisible = false;
      cards.forEach(function (c) {
        if (c.style.display !== 'none') {
          if ((isHYOnly || isQR) && !c.hasAttribute('data-hy')) return;
          anyVisible = true;
        }
      });
      header.style.display = anyVisible ? '' : 'none';
    });
  }

  /* ---------- Reading Progress ---------- */

  function getReadSet(systemKey) {
    try {
      var raw = localStorage.getItem('mbbe-read-' + systemKey);
      if (raw) return new Set(JSON.parse(raw));
    } catch (e) { /* ignore */ }
    return new Set();
  }

  function markRead(systemKey, topicId) {
    var set = getReadSet(systemKey);
    set.add(topicId);
    try {
      localStorage.setItem('mbbe-read-' + systemKey, JSON.stringify(Array.from(set)));
    } catch (e) { /* ignore */ }
  }

  function updateReadProgress(total) {
    var el = document.getElementById('read-progress');
    if (!el) return;
    var set = getReadSet(activeSystem);
    el.textContent = set.size + ' / ' + total + ' read';
  }

  function updatePartProgress() {
    var readSet = getReadSet(activeSystem);
    document.querySelectorAll('.part-header').forEach(function (header) {
      var partKey = header.dataset.part;
      var cards = document.querySelectorAll('.topic-card[data-part="' + partKey + '"]');
      var total = cards.length;
      var read = 0;
      cards.forEach(function (c) { if (readSet.has(c.dataset.id)) read++; });
      var pct = total > 0 ? Math.round((read / total) * 100) : 0;
      var fill = header.querySelector('.part-progress-fill');
      var text = header.querySelector('.part-progress-text');
      if (fill) {
        fill.style.width = pct + '%';
        fill.classList.toggle('complete', pct === 100);
      }
      if (text) text.textContent = read + '/' + total;
    });
  }

  /* ---------- Scroll to Top ---------- */

  function setupScrollTop() {
    var btn = document.getElementById('scroll-top');
    if (!btn) return;

    var ticking = false;
    window.addEventListener('scroll', function () {
      if (!ticking) {
        requestAnimationFrame(function () {
          btn.classList.toggle('visible', window.scrollY > 600);
          ticking = false;
        });
        ticking = true;
      }
    });

    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---------- Init ---------- */

  function init() {
    buildSystemButtons();
    setupSearch();
    setupScrollTop();

    var scrollBtn = document.getElementById('scroll-top');
    if (scrollBtn) scrollBtn.innerHTML = ICONS.chevronUp;

    var searchInput = document.getElementById('topic-search');
    if (searchInput && !searchInput.parentElement.classList.contains('search-wrap')) {
      var wrap = document.createElement('div');
      wrap.className = 'search-wrap';
      searchInput.parentElement.insertBefore(wrap, searchInput);
      wrap.innerHTML = ICONS.search;
      wrap.appendChild(searchInput);
    }

    // Auto-select from URL param or first system
    var params = new URLSearchParams(window.location.search);
    var sys = params.get('system');
    var valid = SYSTEMS.some(function (s) { return s.key === sys; });
    selectSystem(valid ? sys : SYSTEMS[0].key);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
