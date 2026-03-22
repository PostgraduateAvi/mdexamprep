/* MBBEasy -- Dashboard: returning-user progress on landing page */
(function () {
  'use strict';

  var MCQ_KEY = 'mbbeasy-mcq-progress';
  var SR_KEY = 'mbbeasy-flashcard-sr';
  var TOTAL_MCQS = 1000;
  var TOTAL_FLASHCARDS = 539;

  function todayStr() { return new Date().toISOString().slice(0, 10); }

  function init() {
    var container = document.getElementById('dashboard');
    if (!container) return;

    var mcqData = null, srData = null;
    try { mcqData = JSON.parse(localStorage.getItem(MCQ_KEY)); } catch (e) {}
    try { srData = JSON.parse(localStorage.getItem(SR_KEY)); } catch (e) {}

    /* Only show dashboard for returning users */
    if (!mcqData && !srData) return;

    var html = '<div class="dash-grid">';

    /* MCQ progress */
    if (mcqData && mcqData.answered) {
      var total = Object.keys(mcqData.answered).length;
      var correct = 0;
      for (var id in mcqData.correct) {
        if (mcqData.correct[id]) correct++;
      }
      var pct = total > 0 ? Math.round((correct / total) * 100) : 0;
      var deg = Math.round((total / TOTAL_MCQS) * 360);

      html += '<div class="dash-card">' +
        '<div class="dash-ring" style="background: conic-gradient(var(--correct) ' + deg + 'deg, var(--surface-hover) ' + deg + 'deg);">' +
          '<div class="dash-ring-inner">' +
            '<span class="dash-ring-value">' + total + '</span>' +
            '<span class="dash-ring-label">/ ' + TOTAL_MCQS + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="dash-card-info">' +
          '<div class="dash-card-title">MCQs Attempted</div>' +
          '<div class="dash-card-sub">' + correct + ' correct (' + pct + '%)</div>' +
        '</div>' +
      '</div>';

      /* Streak */
      var streak = mcqData.streak || 0;
      var bestStreak = mcqData.bestStreak || 0;
      if (mcqData.lastDate) {
        var diff = Math.floor((new Date(todayStr()) - new Date(mcqData.lastDate)) / 86400000);
        if (diff > 1) streak = 0;
      }

      html += '<div class="dash-card">' +
        '<div class="dash-streak-icon">' + streak + '</div>' +
        '<div class="dash-card-info">' +
          '<div class="dash-card-title">Answer Streak</div>' +
          '<div class="dash-card-sub">Best: ' + bestStreak + '</div>' +
        '</div>' +
      '</div>';

      /* Suggested next system */
      var sysCounts = {};
      for (var mid in mcqData.answered) {
        /* Can't get system without loading data, so skip if too complex */
      }
    }

    /* Flashcards due */
    if (srData && srData.cards) {
      var dueCount = 0;
      var today = todayStr();
      for (var fcId in srData.cards) {
        var entry = srData.cards[fcId];
        if (!entry.lastSeen) { dueCount++; continue; }
        var daysSince = Math.floor((new Date(today) - new Date(entry.lastSeen)) / 86400000);
        if (entry.bucket === 0) dueCount++;
        else if (entry.bucket === 1 && daysSince >= 3) dueCount++;
        else if (entry.bucket === 2 && daysSince >= 7) dueCount++;
      }

      /* Count by bucket */
      var buckets = [0, 0, 0];
      for (var fid in srData.cards) {
        var b = srData.cards[fid].bucket;
        if (b >= 0 && b <= 2) buckets[b]++;
      }
      var reviewed = buckets[0] + buckets[1] + buckets[2];

      html += '<div class="dash-card">' +
        '<div class="dash-due-count' + (dueCount > 0 ? ' dash-due-active' : '') + '">' + dueCount + '</div>' +
        '<div class="dash-card-info">' +
          '<div class="dash-card-title">Flashcards Due</div>' +
          '<div class="dash-card-sub">' + reviewed + ' of ' + TOTAL_FLASHCARDS + ' reviewed</div>' +
          (dueCount > 0 ? '<a class="dash-link" href="/learn/?review=true">Review now &rarr;</a>' : '<span class="dash-card-sub" style="color:var(--correct)">All caught up!</span>') +
        '</div>' +
      '</div>';
    }

    html += '</div>';
    container.innerHTML = html;
    container.style.display = 'block';
  }

  document.addEventListener('DOMContentLoaded', init);
})();
