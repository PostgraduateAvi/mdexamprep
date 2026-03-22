/* MBBEasy -- Learn: topics + inline flashcards + tools catalog */
var LearnUI = (function () {
  'use strict';

  var SYSTEMS_ORDER = ['CVS','Neuro','Renal','Endocrine','RS','GI','Heme','ID','Rheum','Derm','Pharmacology','General'];

  var allTopics = [];
  var allFlashcards = [];
  var allTools = [];
  var filteredTopics = [];
  var filters = { system: null, search: '' };

  /* Flashcards indexed by normalized topic name */
  var fcByTopic = {};

  /* Tools indexed by id */
  var toolsById = {};

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  function normalize(s) { return s.toLowerCase().trim(); }

  /* === Data loading === */

  function loadAll() {
    return Promise.all([
      fetch('/learn/data/topics.json').then(function (r) { return r.json(); }),
      fetch('/learn/data/flashcards.json').then(function (r) { return r.json(); }),
      fetch('/learn/data/catalog.json').then(function (r) { return r.json(); })
    ]).then(function (results) {
      allTopics = results[0];
      allFlashcards = results[1];
      allTools = results[2];
      buildIndices();
      restoreFilter();
      applyFilter();
      buildFilterButtons();
      bindEvents();
      renderCatalog();
    });
  }

  function buildIndices() {
    /* Build flashcard lookup: normalized topic name -> [cards] */
    allFlashcards.forEach(function (fc) {
      var key = normalize(fc.topic);
      if (!fcByTopic[key]) fcByTopic[key] = [];
      fcByTopic[key].push(fc);
    });

    /* Build tool lookup */
    allTools.forEach(function (t) { toolsById[t.id] = t; });
  }

  /* === Filters === */

  function restoreFilter() {
    try {
      var saved = localStorage.getItem('learn-filters');
      if (saved) {
        var parsed = JSON.parse(saved);
        if (parsed.system !== undefined) filters.system = parsed.system;
      }
    } catch (e) {}
  }

  function saveFilter() {
    try { localStorage.setItem('learn-filters', JSON.stringify({ system: filters.system })); } catch (e) {}
  }

  function applyFilter() {
    var searchLow = filters.search.toLowerCase();
    filteredTopics = allTopics.filter(function (t) {
      if (filters.system && t.system !== filters.system) return false;
      if (searchLow && t.topic.toLowerCase().indexOf(searchLow) === -1 &&
          (t.subtitle || '').toLowerCase().indexOf(searchLow) === -1) return false;
      return true;
    });
    updateStatus();
    saveFilter();
    renderTopics();
  }

  function updateStatus() {
    var el = document.getElementById('filter-status');
    if (el) el.textContent = 'Showing ' + filteredTopics.length + ' of ' + allTopics.length + ' topics';
  }

  function buildFilterButtons() {
    var el = document.getElementById('system-filters');
    if (!el) return;
    var counts = {};
    allTopics.forEach(function (t) { counts[t.system] = (counts[t.system] || 0) + 1; });

    var html = '<button class="system-btn' + (filters.system === null ? ' active' : '') + '" data-system="all">All</button>';
    SYSTEMS_ORDER.forEach(function (sys) {
      var c = counts[sys] || 0;
      if (c === 0) return;
      html += '<button class="system-btn' + (filters.system === sys ? ' active' : '') + '" data-system="' + sys + '">' + sys + ' (' + c + ')</button>';
    });
    el.innerHTML = html;

    el.addEventListener('click', function (e) {
      var btn = e.target.closest('.system-btn');
      if (!btn) return;
      var sys = btn.dataset.system;
      filters.system = sys === 'all' ? null : sys;
      el.querySelectorAll('.system-btn').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      applyFilter();
    });
  }

  /* === Topic rendering === */

  function getFlashcardsForTopic(topic) {
    var cards = [];
    (topic.flashcard_topics || []).forEach(function (ft) {
      var key = normalize(ft);
      if (fcByTopic[key]) {
        fcByTopic[key].forEach(function (c) {
          if (cards.indexOf(c) === -1) cards.push(c);
        });
      }
    });
    return cards;
  }

  function getToolsForTopic(topic) {
    var tools = [];
    (topic.tool_ids || []).forEach(function (tid) {
      if (toolsById[tid]) tools.push(toolsById[tid]);
    });
    return tools;
  }

  function renderAnswer(text) {
    if (!text) return '';
    var pearlIdx = text.indexOf('Clinical Pearl:');
    var mainText = pearlIdx !== -1 ? text.substring(0, pearlIdx) : text;
    var pearlText = pearlIdx !== -1 ? text.substring(pearlIdx + 15).trim() : null;
    var html = escapeHtml(mainText).replace(/\n/g, '<br>');
    if (pearlText) {
      pearlText = pearlText.replace(/^["'\u201c]+|["'\u201d]+$/g, '').trim();
      html += '<div class="clinical-pearl"><div class="clinical-pearl-label">Clinical Pearl</div>' + escapeHtml(pearlText).replace(/\n/g, '<br>') + '</div>';
    }
    return html;
  }

  function renderTopics() {
    var deck = document.getElementById('topic-deck');
    if (!deck) return;
    if (filteredTopics.length === 0) {
      deck.innerHTML = '<div class="empty-state">No topics match the current filter.</div>';
      return;
    }

    /* Group by system */
    var groups = {};
    var order = [];
    filteredTopics.forEach(function (t) {
      if (!groups[t.system]) { groups[t.system] = []; order.push(t.system); }
      groups[t.system].push(t);
    });
    order.sort(function (a, b) { return SYSTEMS_ORDER.indexOf(a) - SYSTEMS_ORDER.indexOf(b); });

    var html = '';
    order.forEach(function (sys) {
      var topics = groups[sys];
      html += '<div class="topic-system-group">';
      html += '<div class="topic-system-header"><h3>' + escapeHtml(sys) + '</h3><span class="group-count">' + topics.length + ' topics</span></div>';

      topics.forEach(function (t) {
        var cards = getFlashcardsForTopic(t);
        var tools = getToolsForTopic(t);

        html += '<div class="topic-list-card" data-topic-id="' + escapeHtml(t.id) + '">';
        html += '<div class="topic-list-header">';
        html += '<span class="topic-list-chevron">&#9654;</span>';
        html += '<div class="topic-list-info">';
        html += '<div class="topic-list-name">' + escapeHtml(t.topic) + '</div>';
        if (t.subtitle) html += '<div class="topic-list-subtitle">' + escapeHtml(t.subtitle) + '</div>';
        html += '</div>';
        html += '<div class="topic-list-meta">';
        if (cards.length) html += '<span class="tag tag-blue">' + cards.length + ' card' + (cards.length > 1 ? 's' : '') + '</span>';
        if (tools.length) html += '<span class="tag tag-gold">' + tools.length + ' tool' + (tools.length > 1 ? 's' : '') + '</span>';
        html += '</div>';
        html += '</div>'; /* /header */

        /* Body (hidden by default, rendered for all topics) */
        html += '<div class="topic-list-body">';

        if (t.what_to_memorize) {
          html += '<div class="topic-study-hint"><div class="clinical-pearl-label">What to memorize</div>' + escapeHtml(t.what_to_memorize) + '</div>';
        }

        if (cards.length) {
          html += '<div class="topic-inline-flashcards">';
          cards.forEach(function (card) {
            html += '<div class="flashcard">' +
              '<div class="flashcard-head">' +
                '<div class="flashcard-question">' + escapeHtml(card.question) + '</div>' +
                '<div class="flashcard-meta"><button class="flashcard-toggle" data-id="' + card.id + '">Show</button></div>' +
              '</div>' +
              '<div class="flashcard-answer" data-id="' + card.id + '">' + renderAnswer(card.answer) + '</div></div>';
          });
          html += '</div>';
        }

        if (tools.length) {
          html += '<div class="topic-inline-tools">';
          html += '<div class="clinical-pearl-label" style="margin-bottom:8px;">Related tools</div>';
          tools.forEach(function (tool) {
            html += '<a class="tool-link" href="/theory/tools/' + escapeHtml(tool.filename) + '">' +
              '<div class="tool-link-title">' + escapeHtml(tool.title) + '</div>' +
              '<div class="tool-link-desc">' + escapeHtml(tool.description) + '</div></a>';
          });
          html += '</div>';
        }

        if (!cards.length && !tools.length && !t.what_to_memorize) {
          html += '<div class="topic-empty-body">No flashcards or tools linked yet.</div>';
        }

        html += '</div>'; /* /body */
        html += '</div>'; /* /card */
      });

      html += '</div>'; /* /system-group */
    });

    deck.innerHTML = html;
  }

  /* === Tools catalog === */

  function renderCatalog() {
    var container = document.getElementById('tools-catalog');
    if (!container) return;
    var groups = {};
    var order = [];
    allTools.forEach(function (t) {
      if (!groups[t.category]) { groups[t.category] = []; order.push(t.category); }
      groups[t.category].push(t);
    });
    var html = '';
    order.forEach(function (cat) {
      html += '<div class="tools-group"><h3>' + escapeHtml(cat) + '</h3>';
      groups[cat].forEach(function (t) {
        html += '<a class="tool-link" href="/theory/tools/' + escapeHtml(t.filename) + '">' +
          '<div class="tool-link-title">' + escapeHtml(t.title) + '</div>' +
          '<div class="tool-link-desc">' + escapeHtml(t.description) + '</div></a>';
      });
      html += '</div>';
    });
    container.innerHTML = html;
  }

  /* === Events === */

  function bindEvents() {
    var deck = document.getElementById('topic-deck');
    if (!deck) return;

    deck.addEventListener('click', function (e) {
      /* Toggle topic expand/collapse */
      var header = e.target.closest('.topic-list-header');
      if (header) {
        var card = header.closest('.topic-list-card');
        if (card) card.classList.toggle('expanded');
        return;
      }

      /* Flashcard show/hide */
      var toggleBtn = e.target.closest('.flashcard-toggle');
      if (toggleBtn) {
        var id = toggleBtn.getAttribute('data-id');
        var answerEl = deck.querySelector('.flashcard-answer[data-id="' + id + '"]');
        if (answerEl) {
          var isVisible = answerEl.classList.contains('visible');
          answerEl.classList.toggle('visible');
          toggleBtn.textContent = isVisible ? 'Show' : 'Hide';
        }
      }
    });

    /* Search input */
    var searchEl = document.getElementById('topic-search');
    if (searchEl) {
      var debounceTimer;
      searchEl.addEventListener('input', function () {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(function () {
          filters.search = searchEl.value;
          applyFilter();
        }, 200);
      });
    }
  }

  /* === Init === */

  function init() {
    loadAll().catch(function (err) {
      console.error('Learn load error:', err);
      var deck = document.getElementById('topic-deck');
      if (deck) deck.innerHTML = '<div class="empty-state">Failed to load data.</div>';
    });
  }

  document.addEventListener('DOMContentLoaded', init);
  return {};
})();
