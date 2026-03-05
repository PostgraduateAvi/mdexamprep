/* MD Exam Prep -- Theory Study Tools
   Modes: Browse (grouped accordion) + Quiz (single card navigation)
   Data: flashcards.json (310 cards, 11 systems, 3 difficulties) */

var TheoryUI = (function () {
  'use strict';

  var SYSTEMS_ORDER = ['Neuro','Endocrine','Renal','General','CVS','ID','Rheum','Heme','GI','RS','Derm'];
  var DIFFICULTIES = ['basic','intermediate','advanced'];
  var DIFF_LABELS = { basic: 'Basic', intermediate: 'Intermediate', advanced: 'Advanced' };

  var allCards = [];
  var filteredCards = [];
  var mode = 'browse'; // 'browse' | 'quiz'
  var filters = { system: null, difficulties: ['basic','intermediate','advanced'] };
  var quizState = { index: 0, order: [], answerVisible: false };

  // --- Data loading ---

  function loadData() {
    return fetch('data/flashcards.json')
      .then(function (r) {
        if (!r.ok) throw new Error('Failed to load flashcards');
        return r.json();
      })
      .then(function (cards) {
        allCards = cards;
        restoreFilters();
        applyFilters();
      });
  }

  // --- Filter persistence ---

  function restoreFilters() {
    try {
      var saved = localStorage.getItem('theory-filters');
      if (saved) {
        var parsed = JSON.parse(saved);
        if (parsed.system !== undefined) filters.system = parsed.system;
        if (Array.isArray(parsed.difficulties) && parsed.difficulties.length > 0) {
          filters.difficulties = parsed.difficulties;
        }
      }
      var pos = localStorage.getItem('theory-quiz-pos');
      if (pos) quizState.index = parseInt(pos, 10) || 0;
    } catch (e) { /* ignore */ }
  }

  function saveFilters() {
    try {
      localStorage.setItem('theory-filters', JSON.stringify(filters));
    } catch (e) { /* ignore */ }
  }

  function saveQuizPos() {
    try {
      localStorage.setItem('theory-quiz-pos', String(quizState.index));
    } catch (e) { /* ignore */ }
  }

  // --- Filtering ---

  function applyFilters() {
    filteredCards = allCards.filter(function (c) {
      if (filters.system && c.system !== filters.system) return false;
      if (filters.difficulties.indexOf(c.difficulty) === -1) return false;
      return true;
    });
    updateFilterStatus();
    saveFilters();

    // Reset quiz index if out of bounds
    if (quizState.index >= filteredCards.length) {
      quizState.index = 0;
    }
    quizState.order = [];
    for (var i = 0; i < filteredCards.length; i++) quizState.order.push(i);

    render();
  }

  function updateFilterStatus() {
    var el = document.getElementById('filter-status');
    if (el) el.textContent = 'Showing ' + filteredCards.length + ' of ' + allCards.length;
  }

  // --- Filter bar building ---

  function buildFilterBar() {
    var systemEl = document.getElementById('system-filters');
    var diffEl = document.getElementById('difficulty-filters');
    if (!systemEl || !diffEl) return;

    // System pills
    var html = '<button class="filter-pill' + (filters.system === null ? ' active' : '') + '" data-system="all">All</button>';
    var counts = {};
    for (var i = 0; i < allCards.length; i++) {
      var s = allCards[i].system;
      counts[s] = (counts[s] || 0) + 1;
    }
    for (var j = 0; j < SYSTEMS_ORDER.length; j++) {
      var sys = SYSTEMS_ORDER[j];
      var c = counts[sys] || 0;
      html += '<button class="filter-pill' + (filters.system === sys ? ' active' : '') + '" data-system="' + sys + '">' + sys + ' <span class="pill-count">' + c + '</span></button>';
    }
    systemEl.innerHTML = html;

    // Difficulty pills
    var dHtml = '';
    for (var k = 0; k < DIFFICULTIES.length; k++) {
      var d = DIFFICULTIES[k];
      var active = filters.difficulties.indexOf(d) !== -1;
      dHtml += '<button class="filter-pill' + (active ? ' active' : '') + '" data-diff="' + d + '">' + DIFF_LABELS[d] + '</button>';
    }
    diffEl.innerHTML = dHtml;
  }

  // --- Answer rendering ---

  function renderAnswer(text) {
    if (!text) return '';
    // Split on "Clinical Pearl:" to extract pearl
    var pearlIdx = text.indexOf('Clinical Pearl:');
    var mainText = pearlIdx !== -1 ? text.substring(0, pearlIdx) : text;
    var pearlText = pearlIdx !== -1 ? text.substring(pearlIdx + 15).trim() : null;

    // Convert \n to <br>
    var html = escapeHtml(mainText).replace(/\n/g, '<br>');

    if (pearlText) {
      // Strip surrounding quotes from pearl
      pearlText = pearlText.replace(/^["'\u201c]+|["'\u201d]+$/g, '').trim();
      html += '<div class="clinical-pearl"><div class="clinical-pearl-label">Clinical Pearl</div>' + escapeHtml(pearlText).replace(/\n/g, '<br>') + '</div>';
    }
    return html;
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  function diffTag(d) {
    var cls = d === 'basic' ? 'tag-gold' : d === 'advanced' ? 'tag-blue' : 'tag-muted';
    return '<span class="tag ' + cls + '">' + DIFF_LABELS[d] + '</span>';
  }

  // --- Render ---

  function render() {
    if (mode === 'browse') renderBrowse();
    else renderQuiz();
  }

  function renderBrowse() {
    var deck = document.getElementById('flashcard-deck');
    if (!deck) return;

    if (filteredCards.length === 0) {
      deck.innerHTML = '<div class="empty-state">No flashcards match the current filters.</div>';
      return;
    }

    // Group by system
    var groups = {};
    var order = [];
    for (var i = 0; i < filteredCards.length; i++) {
      var card = filteredCards[i];
      if (!groups[card.system]) {
        groups[card.system] = [];
        order.push(card.system);
      }
      groups[card.system].push(card);
    }

    // Sort groups by SYSTEMS_ORDER
    order.sort(function (a, b) {
      return SYSTEMS_ORDER.indexOf(a) - SYSTEMS_ORDER.indexOf(b);
    });

    var html = '';
    for (var g = 0; g < order.length; g++) {
      var sys = order[g];
      var cards = groups[sys];
      html += '<div class="flashcard-group" data-system="' + sys + '">';
      html += '<div class="flashcard-group-header"><span class="group-chevron">&#9660;</span><h3>' + sys + '</h3><span class="group-count">' + cards.length + ' cards</span></div>';
      html += '<div class="flashcard-group-cards">';
      for (var c = 0; c < cards.length; c++) {
        html += renderFlashcard(cards[c]);
      }
      html += '</div></div>';
    }
    deck.innerHTML = html;
  }

  function renderFlashcard(card) {
    return '<div class="flashcard" data-id="' + card.id + '">' +
      '<div class="flashcard-head">' +
        '<div class="flashcard-question">' + escapeHtml(card.question) + '</div>' +
        '<div class="flashcard-meta">' + diffTag(card.difficulty) +
          '<button class="flashcard-toggle" data-id="' + card.id + '">Show</button>' +
        '</div>' +
      '</div>' +
      '<div class="flashcard-answer" data-id="' + card.id + '">' + renderAnswer(card.answer) + '</div>' +
      '<div class="flashcard-topic">' + escapeHtml(card.topic) + '</div>' +
    '</div>';
  }

  function renderQuiz() {
    var deck = document.getElementById('flashcard-deck');
    if (!deck) return;

    if (filteredCards.length === 0) {
      deck.innerHTML = '<div class="empty-state">No flashcards match the current filters.</div>';
      return;
    }

    var idx = quizState.order[quizState.index] !== undefined ? quizState.order[quizState.index] : 0;
    var card = filteredCards[idx];
    if (!card) { quizState.index = 0; card = filteredCards[0]; }

    var html = '<div class="quiz-container">';
    html += '<div class="quiz-card">';
    html += '<div class="quiz-card-meta"><span class="tag tag-gold">' + card.system + '</span>' + diffTag(card.difficulty) + '</div>';
    html += '<div class="quiz-question">' + escapeHtml(card.question) + '</div>';

    if (quizState.answerVisible) {
      html += '<div class="quiz-answer visible">' + renderAnswer(card.answer) + '</div>';
    } else {
      html += '<button class="quiz-reveal" id="quiz-reveal">Show Answer</button>';
      html += '<div class="quiz-answer">' + renderAnswer(card.answer) + '</div>';
    }

    html += '</div>'; // quiz-card

    html += '<div class="quiz-nav">';
    html += '<button class="quiz-nav-btn" id="quiz-prev"' + (quizState.index <= 0 ? ' disabled' : '') + '>&larr; Prev</button>';
    html += '<button class="quiz-nav-btn" id="quiz-next"' + (quizState.index >= filteredCards.length - 1 ? ' disabled' : '') + '>Next &rarr;</button>';
    html += '<button class="quiz-nav-btn shuffle" id="quiz-shuffle">Shuffle</button>';
    html += '<span class="quiz-pos">' + (quizState.index + 1) + ' / ' + filteredCards.length + '</span>';
    html += '</div>';

    html += '</div>'; // quiz-container
    deck.innerHTML = html;
    saveQuizPos();
  }

  // --- Fisher-Yates shuffle ---

  function shuffleArray(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
  }

  // --- Event delegation ---

  function bindEvents() {
    // Mode toggles
    var modeToggles = document.querySelector('.mode-toggles');
    if (modeToggles) {
      modeToggles.addEventListener('click', function (e) {
        var btn = e.target.closest('.mode-btn');
        if (!btn || btn.classList.contains('active')) return;
        modeToggles.querySelector('.active').classList.remove('active');
        btn.classList.add('active');
        mode = btn.getAttribute('data-mode');
        quizState.answerVisible = false;
        render();
      });
    }

    // System filters
    var systemFilters = document.getElementById('system-filters');
    if (systemFilters) {
      systemFilters.addEventListener('click', function (e) {
        var pill = e.target.closest('.filter-pill');
        if (!pill) return;
        var sys = pill.getAttribute('data-system');
        filters.system = sys === 'all' ? null : sys;
        // Update active state
        var pills = systemFilters.querySelectorAll('.filter-pill');
        for (var i = 0; i < pills.length; i++) pills[i].classList.remove('active');
        pill.classList.add('active');
        applyFilters();
      });
    }

    // Difficulty filters
    var diffFilters = document.getElementById('difficulty-filters');
    if (diffFilters) {
      diffFilters.addEventListener('click', function (e) {
        var pill = e.target.closest('.filter-pill');
        if (!pill) return;
        var d = pill.getAttribute('data-diff');
        var idx = filters.difficulties.indexOf(d);
        if (idx !== -1) {
          // Don't allow deselecting all
          if (filters.difficulties.length <= 1) return;
          filters.difficulties.splice(idx, 1);
          pill.classList.remove('active');
        } else {
          filters.difficulties.push(d);
          pill.classList.add('active');
        }
        applyFilters();
      });
    }

    // Flashcard deck -- event delegation
    var deck = document.getElementById('flashcard-deck');
    if (deck) {
      deck.addEventListener('click', function (e) {
        // Browse mode: toggle answer
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

        // Browse mode: collapse group
        var groupHeader = e.target.closest('.flashcard-group-header');
        if (groupHeader) {
          groupHeader.parentElement.classList.toggle('collapsed');
          return;
        }

        // Quiz mode: reveal answer
        if (e.target.id === 'quiz-reveal') {
          quizState.answerVisible = true;
          renderQuiz();
          return;
        }

        // Quiz mode: prev
        if (e.target.id === 'quiz-prev' || e.target.closest('#quiz-prev')) {
          if (quizState.index > 0) {
            quizState.index--;
            quizState.answerVisible = false;
            renderQuiz();
          }
          return;
        }

        // Quiz mode: next
        if (e.target.id === 'quiz-next' || e.target.closest('#quiz-next')) {
          if (quizState.index < filteredCards.length - 1) {
            quizState.index++;
            quizState.answerVisible = false;
            renderQuiz();
          }
          return;
        }

        // Quiz mode: shuffle
        if (e.target.id === 'quiz-shuffle' || e.target.closest('#quiz-shuffle')) {
          quizState.order = [];
          for (var i = 0; i < filteredCards.length; i++) quizState.order.push(i);
          shuffleArray(quizState.order);
          quizState.index = 0;
          quizState.answerVisible = false;
          renderQuiz();
          return;
        }
      });
    }
  }

  // --- Init ---

  function init() {
    loadData()
      .then(function () {
        buildFilterBar();
        bindEvents();
        render();
      })
      .catch(function (err) {
        console.error('Theory load error:', err);
        var deck = document.getElementById('flashcard-deck');
        if (deck) deck.innerHTML = '<div class="empty-state">Failed to load flashcard data.</div>';
      });
  }

  document.addEventListener('DOMContentLoaded', init);

  return { init: init };
})();
