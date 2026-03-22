/* MBBEasy -- Learn: topics + inline flashcards + tools catalog + spaced repetition */
var LearnUI = (function () {
  'use strict';

  var SYSTEMS_ORDER = ['CVS','Neuro','Renal','Endocrine','RS','GI','Heme','ID','Rheum','Derm','Pharmacology','General'];
  var SR_KEY = 'mbbeasy-flashcard-sr';

  var allTopics = [];
  var allFlashcards = [];
  var allTools = [];
  var filteredTopics = [];
  var filters = { system: null, search: '' };

  /* Flashcards indexed by normalized topic name */
  var fcByTopic = {};

  /* Tools indexed by id */
  var toolsById = {};

  /* Spaced repetition state */
  var srState = { cards: {} };

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  function normalize(s) { return s.toLowerCase().trim(); }

  function todayStr() { return new Date().toISOString().slice(0, 10); }

  /* === Spaced Repetition === */

  function loadSR() {
    try {
      var saved = localStorage.getItem(SR_KEY);
      if (saved) srState = JSON.parse(saved);
      if (!srState.cards) srState.cards = {};
    } catch (e) { srState = { cards: {} }; }
  }

  function saveSR() {
    try { localStorage.setItem(SR_KEY, JSON.stringify(srState)); } catch (e) {}
  }

  function markCard(fcId, hard) {
    var entry = srState.cards[fcId] || { bucket: 0, lastSeen: null };
    if (hard) {
      entry.bucket = 0;
    } else {
      entry.bucket = Math.min(entry.bucket + 1, 2);
    }
    entry.lastSeen = todayStr();
    srState.cards[fcId] = entry;
    saveSR();
  }

  function isDue(fcId) {
    var entry = srState.cards[fcId];
    if (!entry || !entry.lastSeen) return true; /* Never seen = due */
    var daysSince = Math.floor((new Date(todayStr()) - new Date(entry.lastSeen)) / 86400000);
    if (entry.bucket === 0) return true;           /* Hard: always due */
    if (entry.bucket === 1) return daysSince >= 3;  /* Learning: 3 days */
    return daysSince >= 7;                          /* Known: 7 days */
  }

  function getDueCards() {
    return allFlashcards.filter(function (fc) { return isDue(fc.id); });
  }

  function getBucketLabel(fcId) {
    var entry = srState.cards[fcId];
    if (!entry) return null;
    return ['Hard', 'Learning', 'Known'][entry.bucket];
  }

  function updateReviewBanner() {
    var banner = document.getElementById('sr-banner');
    if (!banner) return;
    var due = getDueCards();
    if (due.length > 0) {
      banner.innerHTML = '<span class="sr-banner-text">' + due.length + ' flashcard' + (due.length > 1 ? 's' : '') + ' due for review</span>' +
        '<button class="sr-banner-btn" id="sr-start-review">Review now &rarr;</button>';
      banner.style.display = 'flex';
    } else {
      banner.style.display = 'none';
    }
  }

  /* === Review overlay === */

  var reviewCards = [];
  var reviewIdx = 0;

  function openReview() {
    reviewCards = getDueCards();
    if (reviewCards.length === 0) return;
    reviewIdx = 0;
    renderReviewCard();
    document.getElementById('sr-overlay').classList.add('visible');
    document.body.style.overflow = 'hidden';
  }

  function closeReview() {
    var overlay = document.getElementById('sr-overlay');
    if (overlay) overlay.classList.remove('visible');
    document.body.style.overflow = '';
    updateReviewBanner();
  }

  function renderReviewCard() {
    var container = document.getElementById('sr-card-container');
    if (!container || reviewCards.length === 0) return;

    var card = reviewCards[reviewIdx];
    var bucket = getBucketLabel(card.id);
    var bucketTag = bucket ? '<span class="sr-bucket-tag sr-bucket-' + (srState.cards[card.id] ? srState.cards[card.id].bucket : 0) + '">' + bucket + '</span>' : '';

    container.innerHTML =
      '<div class="sr-progress">' + (reviewIdx + 1) + ' / ' + reviewCards.length + ' ' + bucketTag + '</div>' +
      '<div class="sr-card">' +
        '<div class="sr-question">' + escapeHtml(card.question) + '</div>' +
        '<div class="sr-answer" id="sr-answer">' + renderAnswer(card.answer) + '</div>' +
        '<button class="sr-reveal-btn" id="sr-reveal">Show Answer</button>' +
        '<div class="sr-actions" id="sr-actions" style="display:none;">' +
          '<button class="sr-btn sr-btn-hard" data-action="hard">Hard</button>' +
          '<button class="sr-btn sr-btn-got-it" data-action="gotit">Got it</button>' +
        '</div>' +
      '</div>';
  }

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
      loadSR();
      restoreFilter();
      applyFilter();
      buildFilterButtons();
      bindEvents();
      renderCatalog();
      updateReviewBanner();
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
            var bucketLabel = getBucketLabel(card.id);
            var bucketHtml = bucketLabel ? ' <span class="fc-bucket fc-bucket-' + (srState.cards[card.id] ? srState.cards[card.id].bucket : 0) + '">' + bucketLabel + '</span>' : '';
            html += '<div class="flashcard">' +
              '<div class="flashcard-head">' +
                '<div class="flashcard-question">' + escapeHtml(card.question) + bucketHtml + '</div>' +
                '<div class="flashcard-meta"><button class="flashcard-toggle" data-id="' + card.id + '">Show</button></div>' +
              '</div>' +
              '<div class="flashcard-answer" data-id="' + card.id + '">' + renderAnswer(card.answer) +
                '<div class="fc-sr-buttons" data-fc-id="' + card.id + '">' +
                  '<button class="fc-sr-btn fc-sr-hard" data-action="hard">Hard</button>' +
                  '<button class="fc-sr-btn fc-sr-gotit" data-action="gotit">Got it</button>' +
                '</div>' +
              '</div></div>';
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

        /* Cross-link to MCQs page */
        html += '<a class="topic-cross-link" href="/mcqs/?system=' + encodeURIComponent(t.system) + '">Practice ' + escapeHtml(t.system) + ' MCQs &rarr;</a>';

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
        return;
      }

      /* SR buttons on inline flashcards */
      var srBtn = e.target.closest('.fc-sr-btn');
      if (srBtn) {
        var fcId = srBtn.closest('.fc-sr-buttons').dataset.fcId;
        markCard(fcId, srBtn.dataset.action === 'hard');
        /* Update bucket label */
        var flashcardEl = srBtn.closest('.flashcard');
        if (flashcardEl) {
          var oldBucket = flashcardEl.querySelector('.fc-bucket');
          var newLabel = getBucketLabel(fcId);
          var newBucket = srState.cards[fcId] ? srState.cards[fcId].bucket : 0;
          if (oldBucket) {
            oldBucket.textContent = newLabel;
            oldBucket.className = 'fc-bucket fc-bucket-' + newBucket;
          } else {
            var qEl = flashcardEl.querySelector('.flashcard-question');
            if (qEl) qEl.insertAdjacentHTML('beforeend', ' <span class="fc-bucket fc-bucket-' + newBucket + '">' + newLabel + '</span>');
          }
        }
        updateReviewBanner();
        return;
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

    /* SR review banner click */
    document.addEventListener('click', function (e) {
      if (e.target.closest('#sr-start-review')) {
        openReview();
        return;
      }
      if (e.target.closest('#sr-close')) {
        closeReview();
        return;
      }
      /* Review overlay: reveal */
      if (e.target.closest('#sr-reveal')) {
        var ansEl = document.getElementById('sr-answer');
        var actEl = document.getElementById('sr-actions');
        if (ansEl) ansEl.classList.add('visible');
        if (actEl) actEl.style.display = 'flex';
        e.target.style.display = 'none';
        return;
      }
      /* Review overlay: Hard / Got it */
      var srAction = e.target.closest('.sr-btn');
      if (srAction && reviewCards.length > 0) {
        var card = reviewCards[reviewIdx];
        markCard(card.id, srAction.dataset.action === 'hard');
        reviewIdx++;
        if (reviewIdx >= reviewCards.length) {
          closeReview();
        } else {
          renderReviewCard();
        }
        return;
      }
    });
  }

  /* === URL params === */

  function handleUrlParams() {
    var params = new URLSearchParams(window.location.search);
    var sys = params.get('system');
    if (sys && SYSTEMS_ORDER.indexOf(sys) !== -1) {
      filters.system = sys;
      applyFilter();
      buildFilterButtons();
    }
    var highlight = params.get('highlight');
    if (highlight) {
      /* Find topic's system, set filter, then scroll to it */
      var topic = allTopics.find(function (t) { return t.id === highlight; });
      if (topic) {
        filters.system = topic.system;
        applyFilter();
        buildFilterButtons();
        setTimeout(function () {
          var card = document.querySelector('[data-topic-id="' + highlight + '"]');
          if (card) {
            card.classList.add('expanded');
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      }
    }
    /* Auto-open review if requested */
    if (params.get('review') === 'true') {
      setTimeout(openReview, 200);
    }
  }

  /* === Init === */

  function init() {
    loadAll().then(function () {
      handleUrlParams();
    }).catch(function (err) {
      console.error('Learn load error:', err);
      var deck = document.getElementById('topic-deck');
      if (deck) deck.innerHTML = '<div class="empty-state">Failed to load data.</div>';
    });
  }

  document.addEventListener('DOMContentLoaded', init);
  return {};
})();
