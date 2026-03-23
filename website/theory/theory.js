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

  var cache = {};
  var activeSystem = null;
  var hyFilterActive = false;

  function esc(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

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

    deck.innerHTML = '<p class="empty-state">Loading&hellip;</p>';
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

    // Toolbar: HY filter + progress
    var hyCount = data.hyCount || 0;
    toolbar.innerHTML =
      (hyCount > 0
        ? '<button class="hy-toggle" id="hy-toggle">High Yield &middot; ' + hyCount + '</button>'
        : '<span></span>') +
      '<span class="read-progress" id="read-progress">' + readSet.size + ' / ' + topics.length + ' read</span>';

    // HY filter toggle
    var hyBtn = document.getElementById('hy-toggle');
    if (hyBtn) {
      hyBtn.addEventListener('click', function () {
        hyFilterActive = !hyFilterActive;
        hyBtn.classList.toggle('active', hyFilterActive);
        deck.classList.toggle('hy-only', hyFilterActive);
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
    var html = '';
    parts.forEach(function (p) {
      var group = partMap[p.key];
      if (!group || group.topics.length === 0) return;

      // Part header
      if (p.label) {
        html += '<div class="part-header" data-part="' + esc(p.key) + '">' +
          '<span class="part-header-label">' + esc(p.label) + '</span>' +
          '</div>';
      }

      // Topic cards
      group.topics.forEach(function (t) {
        var isHY = t.tags && t.tags.indexOf('high-yield') !== -1;
        var isRead = readSet.has(t.id);
        var tags = isHY ? '<span class="tag-hy">High Yield</span>' : '';
        var source = t.source ? '<div class="topic-source">Source: ' + esc(t.source) + '</div>' : '';

        html += '<details class="topic-card" data-title="' + esc(t.title.toLowerCase()) + '"' +
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
          '</div>' +
          '</details>';
      });
    });

    deck.innerHTML = html;
    deck.classList.remove('hy-only');

    // Reading progress: listen for toggle events
    deck.addEventListener('toggle', function (e) {
      var card = e.target.closest('.topic-card');
      if (!card || !card.open) return;
      var id = card.dataset.id;
      if (!id) return;
      markRead(activeSystem, id);
      card.setAttribute('data-read', '');
      updateReadProgress(data.topics.length);
    }, true);
  }

  /* ---------- Search ---------- */

  function setupSearch() {
    var search = document.getElementById('topic-search');
    if (!search) return;
    search.addEventListener('input', function () {
      var q = search.value.toLowerCase().trim();
      var cards = document.querySelectorAll('.topic-card');
      cards.forEach(function (card) {
        var title = card.dataset.title || '';
        var match = q === '' || title.indexOf(q) !== -1;
        card.style.display = match ? '' : 'none';
      });
      updatePartHeaderVisibility();
    });
  }

  /* ---------- Part Header Visibility ---------- */

  function updatePartHeaderVisibility() {
    var headers = document.querySelectorAll('.part-header');
    headers.forEach(function (header) {
      var partKey = header.dataset.part;
      // Find all topic cards for this part
      var cards = document.querySelectorAll('.topic-card[data-part="' + partKey + '"]');
      var anyVisible = false;
      cards.forEach(function (c) {
        if (c.style.display !== 'none' && !c.classList.contains('hy-hidden')) {
          // Also check if deck has hy-only and card lacks data-hy
          var deck = document.getElementById('topic-deck');
          if (deck.classList.contains('hy-only') && !c.hasAttribute('data-hy')) return;
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
