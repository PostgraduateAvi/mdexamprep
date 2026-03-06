/* MD Exam Prep -- Theory: flashcards (browse) + MCQs + tools catalog */
var TheoryUI = (function () {
  'use strict';

  var SYSTEMS_ORDER = ['Neuro','Endocrine','Renal','General','CVS','ID','Rheum','Heme','GI','RS','Derm'];

  var allCards = [];
  var filteredCards = [];
  var filters = { system: null };

  var allMcqs = [];
  var filteredMcqs = [];
  var mcqFilters = { system: null };
  var MCQ_PAGE_SIZE = 20;
  var mcqPage = 0;

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  /* === Flashcards === */

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

  /* === MCQs === */

  function loadMcqs() {
    return fetch('/theory/data/mcqs.json')
      .then(function (r) { if (!r.ok) throw new Error('Failed'); return r.json(); })
      .then(function (mcqs) {
        allMcqs = mcqs;
        restoreMcqFilter();
        applyMcqFilter();
      });
  }

  function restoreMcqFilter() {
    try {
      var saved = localStorage.getItem('theory-mcq-filters');
      if (saved) {
        var parsed = JSON.parse(saved);
        if (parsed.system !== undefined) mcqFilters.system = parsed.system;
      }
    } catch (e) {}
  }

  function saveMcqFilter() {
    try { localStorage.setItem('theory-mcq-filters', JSON.stringify(mcqFilters)); } catch (e) {}
  }

  function applyMcqFilter() {
    filteredMcqs = allMcqs.filter(function (m) {
      if (mcqFilters.system && m.system !== mcqFilters.system) return false;
      return true;
    });
    mcqPage = 0;
    updateMcqStatus();
    saveMcqFilter();
    renderMcqs();
  }

  function updateMcqStatus() {
    var el = document.getElementById('mcq-filter-status');
    if (el) el.textContent = 'Showing ' + filteredMcqs.length + ' of ' + allMcqs.length;
  }

  function buildMcqFilterButtons() {
    var el = document.getElementById('mcq-system-filters');
    if (!el) return;
    var counts = {};
    allMcqs.forEach(function (m) { counts[m.system] = (counts[m.system] || 0) + 1; });

    var html = '<button class="system-btn' + (mcqFilters.system === null ? ' active' : '') + '" data-system="all">All</button>';
    SYSTEMS_ORDER.forEach(function (sys) {
      var c = counts[sys] || 0;
      if (c === 0) return;
      html += '<button class="system-btn' + (mcqFilters.system === sys ? ' active' : '') + '" data-system="' + sys + '">' + sys + ' (' + c + ')</button>';
    });
    el.innerHTML = html;

    el.addEventListener('click', function (e) {
      var btn = e.target.closest('.system-btn');
      if (!btn) return;
      var sys = btn.dataset.system;
      mcqFilters.system = sys === 'all' ? null : sys;
      el.querySelectorAll('.system-btn').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      applyMcqFilter();
    });
  }

  function renderMcqs() {
    var deck = document.getElementById('mcq-deck');
    if (!deck) return;
    if (filteredMcqs.length === 0) {
      deck.innerHTML = '<div class="empty-state">No MCQs match the current filter.</div>';
      return;
    }

    var LABELS = ['A', 'B', 'C', 'D'];
    var pageItems = filteredMcqs.slice(0, (mcqPage + 1) * MCQ_PAGE_SIZE);
    var html = '';

    pageItems.forEach(function (mcq, idx) {
      html += '<div class="mcq-card">';
      html += '<div class="mcq-head">';
      html += '<span class="mcq-number">' + (idx + 1) + '.</span>';
      html += '<div class="mcq-question">' + escapeHtml(mcq.question) + '</div>';
      html += '</div>';
      html += '<div class="mcq-options" data-id="' + mcq.id + '" data-answer="' + mcq.answer + '">';
      mcq.options.forEach(function (opt, i) {
        html += '<button class="mcq-option" data-choice="' + LABELS[i] + '">' +
          '<span class="mcq-option-label">' + LABELS[i] + '</span>' +
          '<span class="mcq-option-text">' + escapeHtml(opt) + '</span></button>';
      });
      html += '</div>';
      if (mcq.explanation) {
        html += '<div class="mcq-explanation" data-id="' + mcq.id + '">' +
          '<div class="clinical-pearl-label">Explanation</div>' +
          escapeHtml(mcq.explanation).replace(/\n/g, '<br>') + '</div>';
      }
      html += '<div class="mcq-meta">';
      html += '<span class="tag tag-muted">' + escapeHtml(mcq.system) + '</span>';
      html += '<span class="tag tag-muted">' + escapeHtml(mcq.subject) + '</span>';
      if (mcq.topic) html += '<span class="tag tag-muted">' + escapeHtml(mcq.topic) + '</span>';
      html += '</div>';
      html += '</div>';
    });

    if (pageItems.length < filteredMcqs.length) {
      html += '<button class="btn btn-secondary mcq-load-more" style="width:100%;margin-top:12px;">Load more (' + (filteredMcqs.length - pageItems.length) + ' remaining)</button>';
    }

    deck.innerHTML = html;
  }

  function bindMcqEvents() {
    var deck = document.getElementById('mcq-deck');
    if (!deck) return;
    deck.addEventListener('click', function (e) {
      var optBtn = e.target.closest('.mcq-option');
      if (optBtn) {
        var optionsEl = optBtn.closest('.mcq-options');
        if (optionsEl.classList.contains('answered')) return;
        var correctAnswer = optionsEl.dataset.answer;
        var chosen = optBtn.dataset.choice;
        optionsEl.classList.add('answered');

        optionsEl.querySelectorAll('.mcq-option').forEach(function (btn) {
          if (btn.dataset.choice === correctAnswer) {
            btn.classList.add('correct');
          } else if (btn === optBtn && chosen !== correctAnswer) {
            btn.classList.add('incorrect');
          }
          btn.disabled = true;
        });

        var expEl = optionsEl.parentElement.querySelector('.mcq-explanation[data-id="' + optionsEl.dataset.id + '"]');
        if (expEl) expEl.classList.add('visible');
        return;
      }

      var loadMore = e.target.closest('.mcq-load-more');
      if (loadMore) {
        mcqPage++;
        renderMcqs();
      }
    });
  }

  /* === Tools Catalog === */

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

  /* === Events === */

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

  /* === Init === */

  function init() {
    Promise.all([loadData(), loadMcqs(), loadCatalog()])
      .then(function () {
        buildFilterButtons();
        buildMcqFilterButtons();
        bindEvents();
        bindMcqEvents();
      })
      .catch(function (err) {
        console.error('Theory load error:', err);
        var deck = document.getElementById('flashcard-deck');
        if (deck) deck.innerHTML = '<div class="empty-state">Failed to load data.</div>';
      });
  }

  document.addEventListener('DOMContentLoaded', init);
  return {};
})();
