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

  function esc(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  function buildSystemButtons() {
    var container = document.getElementById('system-btns');
    if (!container) return;
    var html = SYSTEMS.map(function (s) {
      return '<button class="system-btn" data-system="' + s.key + '">' + s.label + '</button>';
    }).join('');
    container.innerHTML = html;
    container.addEventListener('click', function (e) {
      var btn = e.target.closest('.system-btn');
      if (!btn) return;
      selectSystem(btn.dataset.system);
    });
  }

  function selectSystem(key) {
    activeSystem = key;
    var btns = document.querySelectorAll('.system-btn');
    btns.forEach(function (b) { b.classList.toggle('active', b.dataset.system === key); });
    loadSystem(key);
  }

  function loadSystem(key) {
    var deck = document.getElementById('topic-deck');
    var search = document.getElementById('topic-search');

    if (cache[key]) {
      renderTopics(cache[key], deck, search);
      return;
    }

    deck.innerHTML = '<p class="empty-state">Loading&hellip;</p>';

    fetch('/theory/data/' + key + '.json')
      .then(function (r) {
        if (!r.ok) throw new Error(r.status);
        return r.json();
      })
      .then(function (data) {
        cache[key] = data;
        renderTopics(data, deck, search);
      })
      .catch(function () {
        search.style.display = 'none';
        deck.innerHTML =
          '<div class="coming-soon">' +
          '<div class="coming-soon-icon" aria-hidden="true">&#128218;</div>' +
          '<h3>Coming soon</h3>' +
          '<p>Content for this system is being prepared from textbooks.</p>' +
          '</div>';
      });
  }

  function renderTopics(data, deck, search) {
    var topics = data.topics || [];

    if (topics.length === 0) {
      search.style.display = 'none';
      deck.innerHTML =
        '<div class="coming-soon">' +
        '<div class="coming-soon-icon" aria-hidden="true">&#128218;</div>' +
        '<h3>Coming soon</h3>' +
        '<p>Content for this system is being prepared from textbooks.</p>' +
        '</div>';
      return;
    }

    search.style.display = '';
    search.value = '';

    var html = topics.map(function (t) {
      var tags = '';
      if (t.tags && t.tags.indexOf('high-yield') !== -1) {
        tags = '<span class="tag-hy">High Yield</span>';
      }
      var source = t.source ? '<div class="topic-source">Source: ' + esc(t.source) + '</div>' : '';
      return '<details class="topic-card" data-title="' + esc(t.title.toLowerCase()) + '">' +
        '<summary>' + esc(t.title) + tags + '</summary>' +
        '<div class="topic-body">' +
        '<div class="content-html">' + (t.content || '<p>No content yet.</p>') + '</div>' +
        source +
        '</div>' +
        '</details>';
    }).join('');

    deck.innerHTML = html;
  }

  function setupSearch() {
    var search = document.getElementById('topic-search');
    if (!search) return;
    search.addEventListener('input', function () {
      var q = search.value.toLowerCase().trim();
      var cards = document.querySelectorAll('.topic-card');
      cards.forEach(function (card) {
        var title = card.getAttribute('data-title') || '';
        card.style.display = (q === '' || title.indexOf(q) !== -1) ? '' : 'none';
      });
    });
  }

  function init() {
    buildSystemButtons();
    setupSearch();

    // Auto-select from URL param or first system
    var params = new URLSearchParams(window.location.search);
    var system = params.get('system');
    if (system && SYSTEMS.some(function (s) { return s.key === system; })) {
      selectSystem(system);
    } else {
      selectSystem(SYSTEMS[0].key);
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
