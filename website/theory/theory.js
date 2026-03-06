/* MD Exam Prep -- Theory: flashcards (browse) + tools catalog */
var TheoryUI = (function () {
  'use strict';

  var SYSTEMS_ORDER = ['Neuro','Endocrine','Renal','General','CVS','ID','Rheum','Heme','GI','RS','Derm'];

  var allCards = [];
  var filteredCards = [];
  var filters = { system: null };

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  function loadData() {
    return fetch('/theory/data/flashcards.json')
      .then(function (r) { if (!r.ok) throw new Error('Failed'); return r.json(); })
      .then(function (cards) {
        allCards = cards;
        restoreFilter();
        applyFilter();
      });
  }

  function restoreFilter() {
    try {
      var saved = localStorage.getItem('theory-filters');
      if (saved) {
        var parsed = JSON.parse(saved);
        if (parsed.system !== undefined) filters.system = parsed.system;
      }
    } catch (e) {}
  }

  function saveFilter() {
    try { localStorage.setItem('theory-filters', JSON.stringify(filters)); } catch (e) {}
  }

  function applyFilter() {
    filteredCards = allCards.filter(function (c) {
      if (filters.system && c.system !== filters.system) return false;
      return true;
    });
    updateStatus();
    saveFilter();
    renderCards();
  }

  function updateStatus() {
    var el = document.getElementById('filter-status');
    if (el) el.textContent = 'Showing ' + filteredCards.length + ' of ' + allCards.length;
  }

  function buildFilterButtons() {
    var el = document.getElementById('system-filters');
    if (!el) return;
    var counts = {};
    allCards.forEach(function (c) { counts[c.system] = (counts[c.system] || 0) + 1; });

    var html = '<button class="system-btn' + (filters.system === null ? ' active' : '') + '" data-system="all">All</button>';
    SYSTEMS_ORDER.forEach(function (sys) {
      var c = counts[sys] || 0;
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

  function renderCards() {
    var deck = document.getElementById('flashcard-deck');
    if (!deck) return;
    if (filteredCards.length === 0) {
      deck.innerHTML = '<div class="empty-state">No flashcards match the current filter.</div>';
      return;
    }

    var groups = {};
    var order = [];
    filteredCards.forEach(function (card) {
      if (!groups[card.system]) { groups[card.system] = []; order.push(card.system); }
      groups[card.system].push(card);
    });
    order.sort(function (a, b) { return SYSTEMS_ORDER.indexOf(a) - SYSTEMS_ORDER.indexOf(b); });

    var html = '';
    order.forEach(function (sys) {
      var cards = groups[sys];
      html += '<div class="flashcard-group" data-system="' + sys + '">';
      html += '<div class="flashcard-group-header"><span class="group-chevron">&#9660;</span><h3>' + sys + '</h3><span class="group-count">' + cards.length + ' cards</span></div>';
      html += '<div class="flashcard-group-cards">';
      cards.forEach(function (card) {
        html += '<div class="flashcard">' +
          '<div class="flashcard-head">' +
            '<div class="flashcard-question">' + escapeHtml(card.question) + '</div>' +
            '<div class="flashcard-meta"><button class="flashcard-toggle" data-id="' + card.id + '">Show</button></div>' +
          '</div>' +
          '<div class="flashcard-answer" data-id="' + card.id + '">' + renderAnswer(card.answer) + '</div>' +
          '<div class="flashcard-topic">' + escapeHtml(card.topic) + '</div></div>';
      });
      html += '</div></div>';
    });
    deck.innerHTML = html;
  }

  function loadCatalog() {
    return fetch('/theory/data/catalog.json')
      .then(function (r) { if (!r.ok) throw new Error('Failed'); return r.json(); })
      .then(function (tools) {
        var container = document.getElementById('tools-catalog');
        if (!container) return;
        var groups = {};
        var order = [];
        tools.forEach(function (t) {
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
      }).catch(function () {});
  }

  function bindEvents() {
    var deck = document.getElementById('flashcard-deck');
    if (!deck) return;
    deck.addEventListener('click', function (e) {
      var toggleBtn = e.target.closest('.flashcard-toggle');
      if (toggleBtn) {
        var id = toggleBtn.getAttribute('data-id');
        var answerEl = deck.querySelector('.flashcard-answer[data-id="' + id + '"]');
        if (answerEl) {
          var isVisible = answerEl.classList.contains('visible');
          answerEl.classList.toggle('visible');
          toggleBtn.textContent = isVisible ? 'Show' : 'Hide';
        }
        return;
      }
      var groupHeader = e.target.closest('.flashcard-group-header');
      if (groupHeader) {
        groupHeader.parentElement.classList.toggle('collapsed');
      }
    });
  }

  function init() {
    Promise.all([loadData(), loadCatalog()])
      .then(function () {
        buildFilterButtons();
        bindEvents();
      })
      .catch(function (err) {
        console.error('Theory load error:', err);
        var deck = document.getElementById('flashcard-deck');
        if (deck) deck.innerHTML = '<div class="empty-state">Failed to load flashcard data.</div>';
      });
  }

  document.addEventListener('DOMContentLoaded', init);
  return {};
})();
