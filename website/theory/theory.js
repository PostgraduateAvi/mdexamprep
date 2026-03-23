/* MBBEasy — Theory: browse topics by system */
(function () {
  'use strict';

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
  var TOPIC_CASE_MAP = {
    'mitral-stenosis': { system: 'cardiac', case: 'mitral_stenosis', label: 'Mitral Stenosis' },
    'mitral-regurgitation': { system: 'cardiac', case: 'mitral_regurgitation', label: 'Mitral Regurgitation' },
    'aortic-stenosis': { system: 'cardiac', case: 'aortic_stenosis', label: 'Aortic Stenosis' },
    'aortic-regurgitation': { system: 'cardiac', case: 'aortic_regurgitation', label: 'Aortic Regurgitation' },
    'infective-endocarditis': { system: 'cardiac', case: 'infective_endocarditis', label: 'Infective Endocarditis' },
    'valvular-heart-disease': { system: 'cardiac', case: 'mitral_stenosis', label: 'Valvular Cases' },
    'pleural-effusion': { system: 'respiratory', case: 'pleural_effusion', label: 'Pleural Effusion' },
    'pneumothorax': { system: 'respiratory', case: 'pneumothorax', label: 'Pneumothorax' },
    'pneumonia': { system: 'respiratory', case: 'consolidation', label: 'Consolidation' },
    'bronchial-asthma': { system: 'respiratory', case: 'bronchial_asthma', label: 'Bronchial Asthma' },
    'copd': { system: 'respiratory', case: 'copd_cor_pulmonale', label: 'COPD & Cor Pulmonale' },
    'guillain-barre-syndrome': { system: 'neuro', case: 'gbs', label: 'GBS' },
    'ischemic-stroke': { system: 'neuro', case: 'hemiplegia', label: 'Hemiplegia' },
    'spinal-cord-lesions': { system: 'neuro', case: 'paraplegia', label: 'Paraplegia' },
    'parkinsons-disease': { system: 'neuro', case: 'parkinsons', label: "Parkinson's Disease" },
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
          '<div class="coming-soon-icon" aria-hidden="true">&#128218;</div>' +
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
      '<button class="study-path-dismiss" aria-label="Dismiss" data-key="' + esc(dismissKey) + '">&times;</button>' +
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
        '<div class="coming-soon-icon" aria-hidden="true">&#128218;</div>' +
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
        ? '<button class="hy-toggle" id="hy-toggle">High Yield &middot; ' + hyCount + '</button>'
        : '') +
      '<button class="qr-toggle" id="qr-toggle">Quick Review</button>' +
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
          '<div class="content-html">' + (t.content || '<p>No content yet.</p>') + '</div>' +
          source +
          crossLinks +
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

    // Auto-select from URL param or first system
    var params = new URLSearchParams(window.location.search);
    var sys = params.get('system');
    var valid = SYSTEMS.some(function (s) { return s.key === sys; });
    selectSystem(valid ? sys : SYSTEMS[0].key);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
