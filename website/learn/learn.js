/* MBBEasy -- Learn: topics + inline flashcards + tools catalog + spaced repetition + knowledge graph + study path */
var LearnUI = (function () {
  'use strict';

  var SYSTEMS_ORDER = ['CVS','Neuro','Renal','Endocrine','RS','GI','Heme','ID','Rheum','Derm','Pharmacology','General'];
  var SR_KEY = 'mbbeasy-flashcard-sr';
  var SR_INTERVALS = [0, 1, 3, 7, 14]; /* Bucket intervals in days: New, Learning, Familiar, Confident, Mastered */
  var SR_LABELS = ['New', 'Learning', 'Familiar', 'Confident', 'Mastered'];

  var CAT_LABELS = {
    'anatomy': 'Anatomy',
    'microbiology': 'Microbiology',
    'pharmacology': 'Pharmacology',
    'pulmonology': 'Pulmonology',
    'genetics': 'Genetics',
    'study-skills': 'Study Skills'
  };

  var allTopics = [];
  var allFlashcards = [];
  var allMcqs = [];
  var allTools = [];
  var filteredTopics = [];
  var filters = { system: null, search: '', yieldOnly: false };
  var viewMode = 'browse'; /* 'browse' | 'path' */

  /* Flashcards indexed by normalized topic name */
  var fcByTopic = {};

  /* MCQs indexed by topic_id */
  var mcqByTopic = {};

  /* Tools indexed by id */
  var toolsById = {};

  /* Knowledge graph data */
  var graphData = null;

  /* Spaced repetition state */
  var srState = { cards: {} };

  /* Review session state */
  var reviewCards = [];
  var reviewIdx = 0;
  var reviewCorrect = 0;

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  function normalize(s) { return s.toLowerCase().trim(); }

  function todayStr() { return new Date().toISOString().slice(0, 10); }

  /* === Spaced Repetition (5-bucket Leitner) === */

  function loadSR() {
    try {
      var saved = localStorage.getItem(SR_KEY);
      if (saved) srState = JSON.parse(saved);
      if (!srState.cards) srState.cards = {};
      /* Migrate old 3-bucket to 5-bucket: 0→0, 1→2, 2→4 */
      for (var id in srState.cards) {
        var entry = srState.cards[id];
        if (entry.bucket === 2 && !entry._migrated) {
          entry.bucket = 4; entry._migrated = true;
        } else if (entry.bucket === 1 && !entry._migrated) {
          entry.bucket = 2; entry._migrated = true;
        }
      }
    } catch (e) { srState = { cards: {} }; }
  }

  function saveSR() {
    try { localStorage.setItem(SR_KEY, JSON.stringify(srState)); } catch (e) {}
  }

  function markCard(fcId, hard) {
    var entry = srState.cards[fcId] || { bucket: 0, lastSeen: null };
    if (hard) {
      entry.bucket = Math.max(0, entry.bucket - 1);
    } else {
      entry.bucket = Math.min(entry.bucket + 1, 4);
    }
    entry.lastSeen = todayStr();
    srState.cards[fcId] = entry;
    saveSR();
  }

  function isDue(fcId) {
    var entry = srState.cards[fcId];
    if (!entry || !entry.lastSeen) return true;
    var daysSince = Math.floor((new Date(todayStr()) - new Date(entry.lastSeen)) / 86400000);
    if (entry.bucket === 0) return true;
    return daysSince >= SR_INTERVALS[entry.bucket];
  }

  function getDueCards() {
    return allFlashcards.filter(function (fc) { return isDue(fc.id); });
  }

  function getBucketLabel(fcId) {
    var entry = srState.cards[fcId];
    if (!entry) return null;
    return SR_LABELS[entry.bucket] || SR_LABELS[0];
  }

  function updateReviewBanner() {
    var banner = document.getElementById('sr-banner');
    if (!banner) return;
    var due = getDueCards();
    if (due.length > 0) {
      var est = Math.max(1, Math.round(due.length * 0.5));
      banner.innerHTML = '<span class="sr-banner-text">' + due.length + ' flashcard' + (due.length > 1 ? 's' : '') + ' due for review (~' + est + ' min)</span>' +
        '<button class="sr-banner-btn" id="sr-start-review">Review now &rarr;</button>';
      banner.style.display = 'flex';
    } else {
      banner.style.display = 'none';
    }
  }

  /* === Review overlay (upgraded) === */

  function openReview() {
    reviewCards = getDueCards();
    if (reviewCards.length === 0) return;
    reviewIdx = 0;
    reviewCorrect = 0;
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

    /* Check if session complete */
    if (reviewIdx >= reviewCards.length) {
      var pct = reviewCards.length > 0 ? Math.round(reviewCorrect * 100 / reviewCards.length) : 0;
      container.innerHTML =
        '<div class="sr-session-summary">' +
          '<h3>Session Complete</h3>' +
          '<div class="sr-session-stat"><strong>' + reviewCorrect + '/' + reviewCards.length + '</strong> correct (' + pct + '%)</div>' +
          '<div class="sr-session-stat">' + (reviewCards.length - reviewCorrect) + ' card' + (reviewCards.length - reviewCorrect !== 1 ? 's' : '') + ' need review</div>' +
          '<button class="btn-primary" style="margin-top:24px;" id="sr-done">Done</button>' +
        '</div>';
      return;
    }

    var card = reviewCards[reviewIdx];
    var bucket = getBucketLabel(card.id);
    var bucketClass = srState.cards[card.id] ? srState.cards[card.id].bucket : 0;
    var bucketTag = bucket ? '<span class="sr-bucket-tag sr-bucket-' + bucketClass + '">' + bucket + '</span>' : '';
    var progressPct = Math.round((reviewIdx / reviewCards.length) * 100);

    container.innerHTML =
      '<div class="sr-progress-bar"><div class="sr-progress-fill" style="width:' + progressPct + '%"></div></div>' +
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

  /* === Knowledge Graph === */

  function getRelatedTopics(topicId) {
    if (!graphData) return [];
    /* Merge both old related_topics and new topic_topics */
    var related = [];
    if (graphData.related_topics && graphData.related_topics[topicId]) {
      related = related.concat(graphData.related_topics[topicId]);
    }
    if (graphData.topic_topics && graphData.topic_topics[topicId]) {
      graphData.topic_topics[topicId].forEach(function (rid) {
        if (related.indexOf(rid) === -1) related.push(rid);
      });
    }
    return related
      .map(function (rid) { return allTopics.find(function (t) { return t.id === rid; }); })
      .filter(Boolean)
      .slice(0, 6);
  }

  function getPrerequisites(topicId) {
    if (!graphData || !graphData.prerequisites) return [];
    var prereqs = graphData.prerequisites[topicId] || [];
    return prereqs
      .map(function (pid) { return allTopics.find(function (t) { return t.id === pid; }); })
      .filter(Boolean);
  }

  function getToolsForSystem(system) {
    if (!graphData || !graphData.tool_topics) return [];
    var toolIds = [];
    var systemTopicIds = allTopics
      .filter(function (t) { return t.system === system; })
      .map(function (t) { return t.id; });
    for (var toolId in graphData.tool_topics) {
      var topicIds = graphData.tool_topics[toolId];
      for (var i = 0; i < topicIds.length; i++) {
        if (systemTopicIds.indexOf(topicIds[i]) !== -1) {
          if (toolIds.indexOf(toolId) === -1) toolIds.push(toolId);
          break;
        }
      }
    }
    return toolIds.map(function (tid) { return toolsById[tid]; }).filter(Boolean);
  }

  /* === MCQ counts per topic === */

  function getMcqCount(topicId) {
    return (mcqByTopic[topicId] || []).length;
  }

  /* === Topic mastery (for study path) === */

  function getTopicMastery(topic) {
    var cards = getFlashcardsForTopic(topic);
    var mcqCount = getMcqCount(topic.id);
    var mcqs = mcqByTopic[topic.id] || [];

    /* Check flashcard progress */
    var fcDone = 0;
    cards.forEach(function (c) {
      var entry = srState.cards[c.id];
      if (entry && entry.bucket >= 3) fcDone++;
    });

    /* Check MCQ progress from localStorage */
    var mcqProgress = null;
    try {
      var saved = localStorage.getItem('mbbeasy-mcq-progress');
      if (saved) mcqProgress = JSON.parse(saved);
    } catch (e) {}

    var mcqCorrect = 0;
    if (mcqProgress && mcqProgress.correct) {
      mcqs.forEach(function (m) {
        if (mcqProgress.correct[m.id]) mcqCorrect++;
      });
    }

    var fcPct = cards.length > 0 ? Math.round(fcDone * 100 / cards.length) : 100;
    var mcqPct = mcqCount > 0 ? Math.round(mcqCorrect * 100 / mcqCount) : 100;

    if (fcPct >= 80 && mcqPct >= 70) return 'mastered';
    if (fcDone > 0 || mcqCorrect > 0) return 'in-progress';
    return 'not-started';
  }

  /* === Data loading === */

  function loadAll() {
    return Promise.all([
      fetch('/learn/data/topics.json').then(function (r) { return r.json(); }),
      fetch('/learn/data/flashcards.json').then(function (r) { return r.json(); }),
      fetch('/learn/data/catalog.json').then(function (r) { return r.json(); }),
      fetch('/learn/data/graph.json').then(function (r) { return r.json(); }),
      fetch('/mcqs/data/mcqs.json').then(function (r) { return r.json(); })
    ]).then(function (results) {
      allTopics = results[0];
      allFlashcards = results[1];
      allTools = results[2];
      graphData = results[3];
      allMcqs = results[4];
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
    allFlashcards.forEach(function (fc) {
      var key = normalize(fc.topic);
      if (!fcByTopic[key]) fcByTopic[key] = [];
      fcByTopic[key].push(fc);
    });
    allTools.forEach(function (t) { toolsById[t.id] = t; });
    /* Build MCQ-by-topic index */
    allMcqs.forEach(function (m) {
      var tid = m.topic_id;
      if (tid) {
        if (!mcqByTopic[tid]) mcqByTopic[tid] = [];
        mcqByTopic[tid].push(m);
      }
    });
  }

  /* === Filters === */

  function restoreFilter() {
    try {
      var saved = localStorage.getItem('learn-filters');
      if (saved) {
        var parsed = JSON.parse(saved);
        if (parsed.system !== undefined) filters.system = parsed.system;
        if (parsed.yieldOnly !== undefined) filters.yieldOnly = parsed.yieldOnly;
        if (parsed.viewMode !== undefined) viewMode = parsed.viewMode;
      }
    } catch (e) {}
  }

  function saveFilter() {
    try { localStorage.setItem('learn-filters', JSON.stringify({ system: filters.system, yieldOnly: filters.yieldOnly, viewMode: viewMode })); } catch (e) {}
  }

  function applyFilter() {
    var searchLow = filters.search.toLowerCase();
    filteredTopics = allTopics.filter(function (t) {
      if (filters.system && t.system !== filters.system) return false;
      if (searchLow && t.topic.toLowerCase().indexOf(searchLow) === -1 &&
          (t.subtitle || '').toLowerCase().indexOf(searchLow) === -1) return false;
      if (filters.yieldOnly && t.yield !== 'high') return false;
      return true;
    });
    updateStatus();
    saveFilter();
    if (viewMode === 'path') {
      renderStudyPath();
    } else {
      renderTopics();
    }
  }

  function updateStatus() {
    var el = document.getElementById('filter-status');
    if (!el) return;
    var yieldNote = filters.yieldOnly ? ' (high-yield only)' : '';
    el.textContent = 'Showing ' + filteredTopics.length + ' of ' + allTopics.length + ' topics' + yieldNote;
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
      renderCatalog();
    });
  }

  /* === Topic rendering (Browse mode) === */

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

  function renderYieldTag(y) {
    if (!y) return '';
    var label = y === 'high' ? 'High yield' : y === 'medium' ? 'Medium yield' : '';
    if (!label) return '';
    return '<span class="tag tag-yield-' + y + '">' + label + '</span>';
  }

  function renderTopics() {
    var deck = document.getElementById('topic-deck');
    if (!deck) return;
    if (filteredTopics.length === 0) {
      deck.innerHTML = '<div class="empty-state">No topics match the current filter.</div>';
      return;
    }

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
        var related = getRelatedTopics(t.id);
        var prereqs = getPrerequisites(t.id);
        var mcqCount = getMcqCount(t.id);

        html += '<div class="topic-list-card" data-topic-id="' + escapeHtml(t.id) + '">';
        html += '<div class="topic-list-header">';
        html += '<span class="topic-list-chevron">&#9654;</span>';
        html += '<div class="topic-list-info">';
        html += '<div class="topic-list-name">' + escapeHtml(t.topic) + '</div>';
        if (t.subtitle) html += '<div class="topic-list-subtitle">' + escapeHtml(t.subtitle) + '</div>';
        html += '</div>';
        html += '<div class="topic-list-meta">';
        html += renderYieldTag(t.yield);
        if (mcqCount) html += '<span class="tag tag-muted">' + mcqCount + ' MCQ' + (mcqCount > 1 ? 's' : '') + '</span>';
        if (cards.length) html += '<span class="tag tag-blue">' + cards.length + ' card' + (cards.length > 1 ? 's' : '') + '</span>';
        if (tools.length) html += '<span class="tag tag-gold">' + tools.length + ' tool' + (tools.length > 1 ? 's' : '') + '</span>';
        if (related.length) html += '<span class="tag tag-related">' + related.length + ' related</span>';
        html += '</div>';
        html += '</div>';

        /* Body */
        html += '<div class="topic-list-body">';

        /* Prerequisites */
        if (prereqs.length) {
          html += '<div class="prereq-box"><div class="prereq-label">Prerequisites</div><div class="prereq-pills">';
          prereqs.forEach(function (p) {
            html += '<a class="prereq-pill" data-related-id="' + escapeHtml(p.id) + '">' + escapeHtml(p.topic) + '</a>';
          });
          html += '</div></div>';
        }

        if (t.what_to_memorize) {
          html += '<div class="topic-study-hint"><div class="clinical-pearl-label">What to memorize</div>' + escapeHtml(t.what_to_memorize) + '</div>';
        }

        if (cards.length) {
          html += '<div class="topic-inline-flashcards">';
          cards.forEach(function (card) {
            var bucketLabel = getBucketLabel(card.id);
            var bucketNum = srState.cards[card.id] ? srState.cards[card.id].bucket : 0;
            var bucketHtml = bucketLabel ? ' <span class="fc-bucket fc-bucket-' + bucketNum + '">' + bucketLabel + '</span>' : '';
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

        if (related.length) {
          html += '<div class="related-topics">';
          html += '<div class="related-topics-label">Related topics</div>';
          related.forEach(function (r) {
            html += '<a class="related-pill" data-related-id="' + escapeHtml(r.id) + '">' + escapeHtml(r.topic) + '</a>';
          });
          html += '</div>';
        }

        /* Practice MCQs link (topic-specific) */
        if (mcqCount > 0) {
          html += '<a class="topic-practice-btn" href="/mcqs/?topic_id=' + encodeURIComponent(t.id) + '">Practice ' + mcqCount + ' MCQ' + (mcqCount > 1 ? 's' : '') + ' &rarr;</a>';
        } else {
          html += '<a class="topic-cross-link" href="/mcqs/?system=' + encodeURIComponent(t.system) + '">Practice ' + escapeHtml(t.system) + ' MCQs &rarr;</a>';
        }

        if (!cards.length && !tools.length && !t.what_to_memorize && !related.length && !prereqs.length) {
          html += '<div class="topic-empty-body">No flashcards or tools linked yet.</div>';
        }

        html += '</div>';
        html += '</div>';
      });

      html += '</div>';
    });

    deck.innerHTML = html;
  }

  /* === Study Path rendering === */

  function topologicalSort(topics, prereqMap) {
    /* Sort topics: prerequisites first, then by yield (high > medium > low), then alphabetical */
    var yieldOrder = { 'high': 0, 'medium': 1, 'low': 2 };
    var idSet = {};
    topics.forEach(function (t) { idSet[t.id] = true; });

    /* Build in-degree map */
    var inDegree = {};
    var adj = {};
    topics.forEach(function (t) {
      inDegree[t.id] = 0;
      adj[t.id] = [];
    });
    topics.forEach(function (t) {
      var prereqs = prereqMap[t.id] || [];
      prereqs.forEach(function (pid) {
        if (idSet[pid]) {
          inDegree[t.id]++;
          if (!adj[pid]) adj[pid] = [];
          adj[pid].push(t.id);
        }
      });
    });

    /* Kahn's algorithm with yield-based priority */
    var topicById = {};
    topics.forEach(function (t) { topicById[t.id] = t; });

    var queue = [];
    topics.forEach(function (t) {
      if (inDegree[t.id] === 0) queue.push(t.id);
    });
    queue.sort(function (a, b) {
      var ya = yieldOrder[topicById[a].yield || 'low'] || 2;
      var yb = yieldOrder[topicById[b].yield || 'low'] || 2;
      if (ya !== yb) return ya - yb;
      return topicById[a].topic.localeCompare(topicById[b].topic);
    });

    var result = [];
    while (queue.length > 0) {
      var id = queue.shift();
      result.push(id);
      (adj[id] || []).forEach(function (nid) {
        inDegree[nid]--;
        if (inDegree[nid] === 0) {
          queue.push(nid);
          queue.sort(function (a, b) {
            var ya = yieldOrder[topicById[a].yield || 'low'] || 2;
            var yb = yieldOrder[topicById[b].yield || 'low'] || 2;
            if (ya !== yb) return ya - yb;
            return topicById[a].topic.localeCompare(topicById[b].topic);
          });
        }
      });
    }

    /* Any remaining (cycles) just append */
    topics.forEach(function (t) {
      if (result.indexOf(t.id) === -1) result.push(t.id);
    });

    return result.map(function (id) { return topicById[id]; });
  }

  function renderStudyPath() {
    var deck = document.getElementById('topic-deck');
    if (!deck) return;
    if (filteredTopics.length === 0) {
      deck.innerHTML = '<div class="empty-state">No topics match the current filter.</div>';
      return;
    }

    var prereqMap = graphData && graphData.prerequisites ? graphData.prerequisites : {};

    /* Group by system */
    var groups = {};
    var order = [];
    filteredTopics.forEach(function (t) {
      if (!groups[t.system]) { groups[t.system] = []; order.push(t.system); }
      groups[t.system].push(t);
    });
    order.sort(function (a, b) { return SYSTEMS_ORDER.indexOf(a) - SYSTEMS_ORDER.indexOf(b); });

    var html = '<div class="study-path">';
    order.forEach(function (sys) {
      var sorted = topologicalSort(groups[sys], prereqMap);
      html += '<div class="study-path-system">';
      html += '<div class="study-path-system-title">' + escapeHtml(sys) + ' (' + sorted.length + ' topics)</div>';

      sorted.forEach(function (t, idx) {
        var mastery = getTopicMastery(t);
        var mcqCount = getMcqCount(t.id);
        var cardCount = getFlashcardsForTopic(t).length;
        var prereqs = getPrerequisites(t.id);

        html += '<div class="study-path-item ' + mastery + '" data-topic-id="' + escapeHtml(t.id) + '">';
        html += '<div class="study-path-step">' + (mastery === 'mastered' ? '&#10003;' : (idx + 1)) + '</div>';
        html += '<div class="study-path-info">';
        html += '<div class="study-path-name">' + escapeHtml(t.topic) + '</div>';
        html += '<div class="study-path-tags">';
        html += renderYieldTag(t.yield);
        if (mcqCount) html += '<span class="tag tag-muted">' + mcqCount + ' MCQs</span>';
        if (cardCount) html += '<span class="tag tag-blue">' + cardCount + ' cards</span>';
        html += '</div>';
        if (prereqs.length) {
          html += '<div class="study-path-prereqs">Prereqs: ' + prereqs.map(function (p) { return escapeHtml(p.topic); }).join(', ') + '</div>';
        }
        html += '</div>';
        html += '</div>';
      });

      html += '</div>';
    });
    html += '</div>';

    deck.innerHTML = html;
  }

  /* === Tools catalog === */

  function renderCatalog() {
    var container = document.getElementById('tools-catalog');
    if (!container) return;

    var toolsToShow = allTools;
    if (filters.system) {
      var systemTools = getToolsForSystem(filters.system);
      var systemToolIds = systemTools.map(function (t) { return t.id; });
      toolsToShow = allTools.filter(function (t) {
        return systemToolIds.indexOf(t.id) !== -1 || t.category === 'study-skills';
      });
    }

    var groups = {};
    var order = [];
    toolsToShow.forEach(function (t) {
      if (!groups[t.category]) { groups[t.category] = []; order.push(t.category); }
      groups[t.category].push(t);
    });
    var html = '';
    order.forEach(function (cat) {
      var label = CAT_LABELS[cat] || cat;
      html += '<div class="tools-group"><h3>' + escapeHtml(label) + '</h3>';
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
      /* Study path item click → expand in browse mode */
      var pathItem = e.target.closest('.study-path-item');
      if (pathItem && viewMode === 'path') {
        var topicId = pathItem.dataset.topicId;
        if (topicId) {
          viewMode = 'browse';
          updateViewToggle();
          applyFilter();
          setTimeout(function () {
            var card = document.querySelector('[data-topic-id="' + topicId + '"]');
            if (card) {
              card.classList.add('expanded');
              card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 100);
        }
        return;
      }

      /* Related topic / prereq pill click */
      var pill = e.target.closest('.related-pill, .prereq-pill');
      if (pill) {
        e.preventDefault();
        var relatedId = pill.dataset.relatedId;
        if (!relatedId) return;
        var topic = allTopics.find(function (t) { return t.id === relatedId; });
        if (topic) {
          if (filters.system && topic.system !== filters.system) {
            filters.system = topic.system;
            applyFilter();
            buildFilterButtons();
            renderCatalog();
          }
          setTimeout(function () {
            var card = document.querySelector('[data-topic-id="' + relatedId + '"]');
            if (card) {
              card.classList.add('expanded');
              card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 100);
        }
        return;
      }

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

    /* View toggle */
    document.addEventListener('click', function (e) {
      var toggleBtn = e.target.closest('.view-toggle-btn');
      if (toggleBtn) {
        var mode = toggleBtn.dataset.mode;
        if (mode && mode !== viewMode) {
          viewMode = mode;
          updateViewToggle();
          applyFilter();
        }
        return;
      }

      /* Yield filter toggle */
      var yieldBtn = e.target.closest('.yield-toggle');
      if (yieldBtn) {
        filters.yieldOnly = !filters.yieldOnly;
        yieldBtn.classList.toggle('active', filters.yieldOnly);
        applyFilter();
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

    /* SR review banner + overlay clicks */
    document.addEventListener('click', function (e) {
      if (e.target.closest('#sr-start-review')) { openReview(); return; }
      if (e.target.closest('#sr-close') || e.target.closest('#sr-done')) { closeReview(); return; }
      if (e.target.closest('#sr-reveal')) {
        var ansEl = document.getElementById('sr-answer');
        var actEl = document.getElementById('sr-actions');
        if (ansEl) ansEl.classList.add('visible');
        if (actEl) actEl.style.display = 'flex';
        e.target.style.display = 'none';
        return;
      }
      var srAction = e.target.closest('.sr-btn');
      if (srAction && reviewCards.length > 0) {
        var isGotIt = srAction.dataset.action === 'gotit';
        var card = reviewCards[reviewIdx];
        markCard(card.id, !isGotIt);
        if (isGotIt) reviewCorrect++;
        reviewIdx++;
        renderReviewCard();
        return;
      }
    });
  }

  function updateViewToggle() {
    document.querySelectorAll('.view-toggle-btn').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.mode === viewMode);
    });
    saveFilter();
  }

  /* === URL params === */

  function handleUrlParams() {
    var params = new URLSearchParams(window.location.search);
    var sys = params.get('system');
    if (sys && SYSTEMS_ORDER.indexOf(sys) !== -1) {
      filters.system = sys;
      applyFilter();
      buildFilterButtons();
      renderCatalog();
    }
    var highlight = params.get('highlight');
    if (highlight) {
      var topic = allTopics.find(function (t) { return t.id === highlight; });
      if (topic) {
        viewMode = 'browse';
        updateViewToggle();
        filters.system = topic.system;
        applyFilter();
        buildFilterButtons();
        renderCatalog();
        setTimeout(function () {
          var card = document.querySelector('[data-topic-id="' + highlight + '"]');
          if (card) {
            card.classList.add('expanded');
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      }
    }
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
