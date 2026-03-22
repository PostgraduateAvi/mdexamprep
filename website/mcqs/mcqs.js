/* MBBEasy -- MCQs: practice page with persistent scoring + quiz modes */
var McqsUI = (function () {
  'use strict';

  var SYSTEMS_ORDER = ['CVS','Neuro','Renal','Endocrine','RS','GI','Heme','ID','Rheum','Derm','Pharmacology','General'];
  var STORAGE_KEY = 'mbbeasy-mcq-progress';
  var TIMER_KEY = 'mbbeasy-mcq-timer';

  var allMcqs = [];
  var filteredMcqs = [];
  var mcqFilters = { system: null, difficulty: null, topicId: null };
  var MCQ_PAGE_SIZE = 20;
  var mcqPage = 0;

  /* Quiz mode: 'practice' | 'quick20' | 'timed' */
  var quizMode = 'practice';
  var timerInterval = null;
  var timerEndTime = null;

  /* Persistent progress */
  var progress = { answered: {}, correct: {}, streak: 0, bestStreak: 0, lastDate: null };

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  function todayStr() {
    return new Date().toISOString().slice(0, 10);
  }

  function findTopicLink(mcq) {
    /* Use topic_id if available (from data pipeline) */
    if (mcq.topic_id) {
      var t = topicLookupById[mcq.topic_id];
      if (t) return { href: '/learn/?highlight=' + mcq.topic_id, label: t.topic };
    }
    /* Fallback: subject name match */
    var subjectKey = (mcq.subject || '').toLowerCase().trim();
    if (topicLookup[subjectKey]) {
      return { href: '/learn/?highlight=' + topicLookup[subjectKey].id, label: mcq.subject };
    }
    if (mcq.system) {
      return { href: '/learn/?system=' + encodeURIComponent(mcq.system), label: mcq.system + ' topics' };
    }
    return null;
  }

  /* === Persistence === */

  function loadProgress() {
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        var p = JSON.parse(saved);
        if (p.answered) progress.answered = p.answered;
        if (p.correct) progress.correct = p.correct;
        if (typeof p.streak === 'number') progress.streak = p.streak;
        if (typeof p.bestStreak === 'number') progress.bestStreak = p.bestStreak;
        if (p.lastDate) progress.lastDate = p.lastDate;
      }
    } catch (e) {}
    /* Reset streak if not today or yesterday */
    if (progress.lastDate) {
      var diff = Math.floor((new Date(todayStr()) - new Date(progress.lastDate)) / 86400000);
      if (diff > 1) progress.streak = 0;
    }
  }

  function saveProgress() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); } catch (e) {}
  }

  function recordAnswer(mcqId, chosen, isCorrect) {
    progress.answered[mcqId] = chosen;
    progress.correct[mcqId] = isCorrect;
    var today = todayStr();
    if (isCorrect) {
      progress.streak++;
      if (progress.streak > progress.bestStreak) progress.bestStreak = progress.streak;
    } else {
      progress.streak = 0;
    }
    progress.lastDate = today;
    saveProgress();
  }

  function getScoreFromProgress() {
    var total = 0, correct = 0;
    for (var id in progress.answered) {
      total++;
      if (progress.correct[id]) correct++;
    }
    return { total: total, correct: correct };
  }

  function resetProgress() {
    if (!window.confirm('Reset all MCQ progress? This cannot be undone.')) return;
    progress = { answered: {}, correct: {}, streak: 0, bestStreak: 0, lastDate: null };
    saveProgress();
    clearTimer();
    quizMode = 'practice';
    applyFilter();
    updateScore();
    updateModeButtons();
  }

  /* === Shuffle === */

  function shuffleArray(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  /* === Data === */

  /* Topic lookups for cross-links */
  var topicLookup = {}; /* normalized topic name -> { id, system, topic } */
  var topicLookupById = {}; /* topic id -> { id, system, topic } */

  function loadMcqs() {
    return Promise.all([
      fetch('/mcqs/data/mcqs.json').then(function (r) { return r.json(); }),
      fetch('/learn/data/topics.json').then(function (r) { return r.json(); }).catch(function () { return []; })
    ]).then(function (results) {
        allMcqs = results[0];
        /* Build topic cross-link lookups */
        (results[1] || []).forEach(function (t) {
          topicLookup[t.topic.toLowerCase().trim()] = { id: t.id, system: t.system, topic: t.topic };
          topicLookupById[t.id] = { id: t.id, system: t.system, topic: t.topic };
        });
        loadProgress();
        restoreFilter();
        applyFilter();
        buildFilterButtons();
        buildDifficultyButtons();
        buildModeButtons();
        bindEvents();
        updateScore();
        handleUrlParams();
      });
  }

  /* === URL params === */

  function handleUrlParams() {
    var params = new URLSearchParams(window.location.search);
    var changed = false;
    var sys = params.get('system');
    if (sys && SYSTEMS_ORDER.indexOf(sys) !== -1) {
      mcqFilters.system = sys;
      changed = true;
    }
    var tid = params.get('topic_id');
    if (tid) {
      mcqFilters.topicId = tid;
      changed = true;
    }
    var diff = params.get('difficulty');
    if (diff && ['easy', 'medium', 'hard'].indexOf(diff) !== -1) {
      mcqFilters.difficulty = diff;
      changed = true;
    }
    if (changed) {
      applyFilter();
      buildFilterButtons();
      buildDifficultyButtons();
    }
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
    var base = allMcqs.filter(function (m) {
      if (mcqFilters.system && m.system !== mcqFilters.system) return false;
      if (mcqFilters.difficulty && m.difficulty !== mcqFilters.difficulty) return false;
      if (mcqFilters.topicId && m.topic_id !== mcqFilters.topicId) return false;
      return true;
    });

    /* Apply quiz mode filtering */
    if (quizMode === 'quick20') {
      /* Filter options: unanswered, wrong, or all */
      var modeFilter = getModeFilter();
      if (modeFilter === 'unanswered') {
        base = base.filter(function (m) { return !progress.answered[m.id]; });
      } else if (modeFilter === 'wrong') {
        base = base.filter(function (m) { return progress.correct[m.id] === false; });
      }
      base = shuffleArray(base).slice(0, 20);
    } else if (quizMode === 'timed') {
      var modeFilter2 = getModeFilter();
      if (modeFilter2 === 'unanswered') {
        base = base.filter(function (m) { return !progress.answered[m.id]; });
      }
      base = shuffleArray(base).slice(0, 50);
    }

    filteredMcqs = base;
    mcqPage = 0;
    updateStatus();
    saveFilter();
    renderMcqs();
  }

  function getModeFilter() {
    var el = document.querySelector('.mode-subfilter.active');
    return el ? el.dataset.filter : 'all';
  }

  function updateStatus() {
    var el = document.getElementById('mcq-filter-status');
    if (!el) return;
    var extra = '';
    if (mcqFilters.topicId && topicLookupById[mcqFilters.topicId]) {
      extra = ' for "' + topicLookupById[mcqFilters.topicId].topic + '"';
    }
    if (quizMode === 'practice') {
      el.textContent = 'Showing ' + filteredMcqs.length + ' of ' + allMcqs.length + extra;
    } else if (quizMode === 'quick20') {
      el.textContent = 'Quick 20 — ' + filteredMcqs.length + ' questions' + extra;
    } else if (quizMode === 'timed') {
      el.textContent = 'Timed Exam — ' + filteredMcqs.length + ' questions' + extra;
    }
  }

  function updateScore() {
    var s = getScoreFromProgress();
    var correctEl = document.getElementById('score-correct');
    var totalEl = document.getElementById('score-total');
    var streakEl = document.getElementById('score-streak');
    if (correctEl) correctEl.textContent = s.correct;
    if (totalEl) totalEl.textContent = s.total;
    if (streakEl) streakEl.textContent = progress.streak;
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
      clearTimer();
      applyFilter();
    });
  }

  /* === Difficulty filter buttons === */

  function buildDifficultyButtons() {
    var el = document.getElementById('difficulty-filters');
    if (!el) return;
    var counts = { easy: 0, medium: 0, hard: 0 };
    allMcqs.forEach(function (m) {
      if (m.difficulty && counts[m.difficulty] !== undefined) counts[m.difficulty]++;
    });
    var html = '<button class="system-btn' + (!mcqFilters.difficulty ? ' active' : '') + '" data-diff="all">All</button>';
    ['easy', 'medium', 'hard'].forEach(function (d) {
      html += '<button class="system-btn tag-difficulty-' + d + (mcqFilters.difficulty === d ? ' active' : '') + '" data-diff="' + d + '">' +
        d.charAt(0).toUpperCase() + d.slice(1) + ' (' + counts[d] + ')</button>';
    });
    el.innerHTML = html;
    el.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-diff]');
      if (!btn) return;
      var d = btn.dataset.diff;
      mcqFilters.difficulty = d === 'all' ? null : d;
      el.querySelectorAll('.system-btn').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      clearTimer();
      applyFilter();
    });
  }

  /* === Quiz mode buttons === */

  function buildModeButtons() {
    var el = document.getElementById('quiz-mode-bar');
    if (!el) return;

    el.innerHTML =
      '<div class="quiz-modes">' +
        '<button class="mode-btn active" data-mode="practice">Practice</button>' +
        '<button class="mode-btn" data-mode="quick20">Quick 20</button>' +
        '<button class="mode-btn" data-mode="timed">Timed Exam</button>' +
      '</div>' +
      '<div class="mode-subfilters" id="mode-subfilters" style="display:none;">' +
        '<button class="mode-subfilter active" data-filter="all">All</button>' +
        '<button class="mode-subfilter" data-filter="unanswered">Unanswered</button>' +
        '<button class="mode-subfilter" data-filter="wrong">Wrong only</button>' +
      '</div>';

    el.addEventListener('click', function (e) {
      var modeBtn = e.target.closest('.mode-btn');
      if (modeBtn) {
        var mode = modeBtn.dataset.mode;
        setQuizMode(mode);
        return;
      }
      var subBtn = e.target.closest('.mode-subfilter');
      if (subBtn) {
        el.querySelectorAll('.mode-subfilter').forEach(function (b) { b.classList.remove('active'); });
        subBtn.classList.add('active');
        clearTimer();
        applyFilter();
        if (quizMode === 'timed') startTimer();
      }
    });
  }

  function setQuizMode(mode) {
    clearTimer();
    quizMode = mode;
    updateModeButtons();

    var subEl = document.getElementById('mode-subfilters');
    if (subEl) subEl.style.display = (mode === 'practice') ? 'none' : 'flex';

    applyFilter();
    if (mode === 'timed') startTimer();
  }

  function updateModeButtons() {
    var btns = document.querySelectorAll('.mode-btn');
    btns.forEach(function (b) {
      b.classList.toggle('active', b.dataset.mode === quizMode);
    });
  }

  /* === Timer (Timed Exam) === */

  function startTimer() {
    var timerEl = document.getElementById('exam-timer');
    if (!timerEl) return;
    timerEl.style.display = 'flex';
    timerEndTime = Date.now() + 60 * 60 * 1000; /* 60 minutes */
    try { localStorage.setItem(TIMER_KEY, String(timerEndTime)); } catch (e) {}
    updateTimerDisplay();
    timerInterval = setInterval(updateTimerDisplay, 1000);
  }

  function clearTimer() {
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
    timerEndTime = null;
    try { localStorage.removeItem(TIMER_KEY); } catch (e) {}
    var timerEl = document.getElementById('exam-timer');
    if (timerEl) { timerEl.style.display = 'none'; timerEl.classList.remove('timer-warning'); }
  }

  function updateTimerDisplay() {
    var timerEl = document.getElementById('exam-timer');
    if (!timerEl || !timerEndTime) return;
    var remaining = Math.max(0, timerEndTime - Date.now());
    var mins = Math.floor(remaining / 60000);
    var secs = Math.floor((remaining % 60000) / 1000);
    timerEl.querySelector('.timer-text').textContent =
      String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
    timerEl.classList.toggle('timer-warning', mins < 5);
    if (remaining <= 0) {
      clearTimer();
      autoSubmitUnanswered();
      showQuizSummary();
    }
  }

  function autoSubmitUnanswered() {
    document.querySelectorAll('.mcq-options:not(.answered)').forEach(function (optionsEl) {
      optionsEl.classList.add('answered');
      var correctAnswer = optionsEl.dataset.answer;
      optionsEl.querySelectorAll('.mcq-option').forEach(function (btn) {
        if (btn.dataset.choice === correctAnswer) btn.classList.add('correct');
        btn.disabled = true;
      });
      var mcqId = optionsEl.dataset.id;
      if (!progress.answered[mcqId]) {
        recordAnswer(mcqId, null, false);
      }
    });
    updateScore();
  }

  function showQuizSummary() {
    var deck = document.getElementById('mcq-deck');
    if (!deck) return;
    var answered = 0, correct = 0;
    filteredMcqs.forEach(function (m) {
      if (progress.answered[m.id] !== undefined) {
        answered++;
        if (progress.correct[m.id]) correct++;
      }
    });
    var pct = answered > 0 ? Math.round((correct / answered) * 100) : 0;
    var summary = '<div class="quiz-summary">' +
      '<h3>Quiz Complete</h3>' +
      '<div class="quiz-summary-stats">' +
        '<div class="quiz-stat"><span class="quiz-stat-value">' + correct + '/' + answered + '</span><span class="quiz-stat-label">Correct</span></div>' +
        '<div class="quiz-stat"><span class="quiz-stat-value">' + pct + '%</span><span class="quiz-stat-label">Accuracy</span></div>' +
        '<div class="quiz-stat"><span class="quiz-stat-value">' + progress.streak + '</span><span class="quiz-stat-label">Streak</span></div>' +
      '</div>' +
      '<button class="btn btn-secondary quiz-back-btn">Back to Practice</button>' +
    '</div>';
    deck.insertAdjacentHTML('afterbegin', summary);
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
    var showAll = (quizMode === 'quick20' || quizMode === 'timed');
    var pageItems = showAll ? filteredMcqs : filteredMcqs.slice(0, (mcqPage + 1) * MCQ_PAGE_SIZE);
    var html = '';

    pageItems.forEach(function (mcq, idx) {
      var prev = progress.answered[mcq.id];
      var isAnswered = prev !== undefined && prev !== null;
      var prevCorrect = progress.correct[mcq.id];

      html += '<div class="mcq-card">';
      html += '<div class="mcq-head">';
      html += '<span class="mcq-number">' + (idx + 1) + '.</span>';
      html += '<div class="mcq-question">' + escapeHtml(mcq.question) + '</div>';
      html += '</div>';
      /* Difficulty + Bloom tags */
      html += '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">';
      if (mcq.difficulty) html += '<span class="tag tag-difficulty-' + mcq.difficulty + '">' + mcq.difficulty.charAt(0).toUpperCase() + mcq.difficulty.slice(1) + '</span>';
      if (mcq.bloom) html += '<span class="tag tag-bloom">' + mcq.bloom.charAt(0).toUpperCase() + mcq.bloom.slice(1) + '</span>';
      html += '</div>';
      html += '<div class="mcq-options' + (isAnswered ? ' answered' : '') + '" data-id="' + mcq.id + '" data-answer="' + mcq.answer + '">';
      mcq.options.forEach(function (opt, i) {
        var label = LABELS[i];
        var cls = 'mcq-option';
        if (isAnswered) {
          if (label === mcq.answer) cls += ' correct';
          else if (label === prev && !prevCorrect) cls += ' incorrect';
        }
        html += '<button class="' + cls + '" data-choice="' + label + '"' + (isAnswered ? ' disabled' : '') + '>' +
          '<span class="mcq-option-label">' + label + '</span>' +
          '<span class="mcq-option-text">' + escapeHtml(opt) + '</span></button>';
      });
      html += '</div>';
      if (mcq.explanation) {
        html += '<div class="mcq-explanation' + (isAnswered ? ' visible' : '') + '" data-id="' + mcq.id + '">' +
          '<div class="clinical-pearl-label">Explanation</div>' +
          escapeHtml(mcq.explanation).replace(/\n/g, '<br>') + '</div>';
      }
      /* Cross-link to Learn page */
      var crossLink = findTopicLink(mcq);
      if (crossLink) {
        html += '<a class="mcq-cross-link" href="' + crossLink.href + '">Study ' + escapeHtml(crossLink.label) + ' &rarr;</a>';
      }
      html += '<div class="mcq-meta">';
      html += '<span class="tag tag-muted">' + escapeHtml(mcq.system) + '</span>';
      html += '<span class="tag tag-muted">' + escapeHtml(mcq.subject) + '</span>';
      if (mcq.topic) html += '<span class="tag tag-muted">' + escapeHtml(mcq.topic) + '</span>';
      html += '</div>';
      html += '</div>';
    });

    if (!showAll && pageItems.length < filteredMcqs.length) {
      html += '<button class="btn btn-secondary mcq-load-more" style="width:100%;margin-top:12px;">Load more (' + (filteredMcqs.length - pageItems.length) + ' remaining)</button>';
    }

    deck.innerHTML = html;
  }

  /* === Events === */

  function bindEvents() {
    var deck = document.getElementById('mcq-deck');
    if (!deck) return;
    deck.addEventListener('click', function (e) {
      if (e.target.closest('.quiz-back-btn')) { location.reload(); return; }
      var optBtn = e.target.closest('.mcq-option');
      if (optBtn) {
        var optionsEl = optBtn.closest('.mcq-options');
        if (optionsEl.classList.contains('answered')) return;
        var correctAnswer = optionsEl.dataset.answer;
        var chosen = optBtn.dataset.choice;
        var mcqId = optionsEl.dataset.id;
        var isCorrect = chosen === correctAnswer;
        optionsEl.classList.add('answered');

        /* Record persistent progress */
        recordAnswer(mcqId, chosen, isCorrect);
        updateScore();

        optionsEl.querySelectorAll('.mcq-option').forEach(function (btn) {
          if (btn.dataset.choice === correctAnswer) {
            btn.classList.add('correct');
          } else if (btn === optBtn && !isCorrect) {
            btn.classList.add('incorrect');
          }
          btn.disabled = true;
        });

        var expEl = optionsEl.parentElement.querySelector('.mcq-explanation[data-id="' + mcqId + '"]');
        if (expEl) expEl.classList.add('visible');

        /* Check if quiz complete (Quick 20 / Timed) */
        if (quizMode !== 'practice') {
          var allDone = filteredMcqs.every(function (m) { return progress.answered[m.id] !== undefined; });
          if (allDone) {
            clearTimer();
            showQuizSummary();
          }
        }
        return;
      }

      var loadMore = e.target.closest('.mcq-load-more');
      if (loadMore) {
        mcqPage++;
        renderMcqs();
      }
    });

    /* Reset button */
    var resetBtn = document.getElementById('mcq-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', resetProgress);
    }
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
