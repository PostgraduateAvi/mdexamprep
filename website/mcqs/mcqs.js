/* MBBEasy -- MCQs: standalone practice page with score tracking */
var McqsUI = (function () {
  'use strict';

  var SYSTEMS_ORDER = ['Neuro','Endocrine','Renal','General','CVS','ID','Rheum','Heme','GI','RS','Derm'];

  var allMcqs = [];
  var filteredMcqs = [];
  var mcqFilters = { system: null };
  var MCQ_PAGE_SIZE = 20;
  var mcqPage = 0;

  /* Session score (resets on page load) */
  var scoreCorrect = 0;
  var scoreTotal = 0;

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  /* === Data === */

  function loadMcqs() {
    return fetch('/mcqs/data/mcqs.json')
      .then(function (r) { if (!r.ok) throw new Error('Failed'); return r.json(); })
      .then(function (mcqs) {
        allMcqs = mcqs;
        restoreFilter();
        applyFilter();
        buildFilterButtons();
        bindEvents();
      });
  }

  /* === Filters === */

  function restoreFilter() {
    try {
      var saved = localStorage.getItem('mcq-filters');
      if (saved) {
        var parsed = JSON.parse(saved);
        if (parsed.system !== undefined) mcqFilters.system = parsed.system;
      }
    } catch (e) {}
  }

  function saveFilter() {
    try { localStorage.setItem('mcq-filters', JSON.stringify(mcqFilters)); } catch (e) {}
  }

  function applyFilter() {
    filteredMcqs = allMcqs.filter(function (m) {
      if (mcqFilters.system && m.system !== mcqFilters.system) return false;
      return true;
    });
    mcqPage = 0;
    updateStatus();
    saveFilter();
    renderMcqs();
  }

  function updateStatus() {
    var el = document.getElementById('mcq-filter-status');
    if (el) el.textContent = 'Showing ' + filteredMcqs.length + ' of ' + allMcqs.length;
  }

  function updateScore() {
    var correctEl = document.getElementById('score-correct');
    var totalEl = document.getElementById('score-total');
    if (correctEl) correctEl.textContent = scoreCorrect;
    if (totalEl) totalEl.textContent = scoreTotal;
  }

  function buildFilterButtons() {
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
      applyFilter();
    });
  }

  /* === Rendering === */

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

  /* === Events === */

  function bindEvents() {
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

        /* Update score */
        scoreTotal++;
        if (chosen === correctAnswer) scoreCorrect++;
        updateScore();

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

  /* === Init === */

  function init() {
    loadMcqs().catch(function (err) {
      console.error('MCQ load error:', err);
      var deck = document.getElementById('mcq-deck');
      if (deck) deck.innerHTML = '<div class="empty-state">Failed to load data.</div>';
    });
  }

  document.addEventListener('DOMContentLoaded', init);
  return {};
})();
