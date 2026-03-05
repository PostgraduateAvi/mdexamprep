/* MD Exam Prep — Predictor UI Controller
   State machine: CHOOSE → PARSING → RESULTS
   Depends on: template.js, predictor-engine.js, upload-parser.js */

var PredictorUI = (function () {
  'use strict';

  var STATE = { CHOOSE: 'choose', PARSING: 'parsing', RESULTS: 'results' };
  var currentState = STATE.CHOOSE;
  var data = { rankedList: null, kgTriples: null, quotas: null, slotTemplate: null };
  var currentResults = null;
  var userAdjustments = { excluded: [] };
  var activeView = 'ranked';
  var dataSource = null;

  // --- Reason code narratives ---
  var REASON_NARRATIVES = {
    'Algorithm\u2191': 'Structured topic \u2014 key for organized exam answers',
    'Balance\u2191': 'Rounds out your coverage \u2014 this system needs attention',
    'Bridge\u2191': 'Shows up across multiple papers \u2014 a recurring favourite',
    'ConfusablePair\u2191': 'Often confused \u2014 examiners love testing this distinction',
    'CoreFloor\u2191': 'Bread-and-butter topic \u2014 expected on almost every exam',
    'Dose\u2191': 'Drug dosing comes up often \u2014 know the key numbers',
    'Foil\u2191': 'Common trick option \u2014 worth knowing so you don\u2019t fall for it',
    'FormatPattern\u2191': 'Fits a question style they keep repeating',
    'Foundation\u2191': 'Keeps appearing year after year \u2014 reliable and important',
    'ILD-Link\u2191': 'Part of a high-yield topic cluster \u2014 study them together',
    'Manual\u2191': 'Flagged during review \u2014 deserves extra attention',
    'ProgramUpdate\u2191': 'Recently added to the curriculum \u2014 likely to be tested',
    'Recency\u2191': 'Showing up more often lately \u2014 gaining momentum',
    'Sleeper\u2191': 'Hasn\u2019t appeared in a while \u2014 overdue and worth preparing'
  };

  function buildRationale(reasonCodes) {
    if (!reasonCodes || reasonCodes.length === 0) return '';
    var phrases = [];
    for (var i = 0; i < Math.min(reasonCodes.length, 2); i++) {
      var phrase = REASON_NARRATIVES[reasonCodes[i]];
      if (phrase) phrases.push(phrase);
    }
    return phrases.join(' \u00b7 ');
  }

  // --- State transitions ---

  function setState(s) {
    currentState = s;
    document.getElementById('state-choose').style.display = s === STATE.CHOOSE ? 'flex' : 'none';
    document.getElementById('state-parsing').style.display = s === STATE.PARSING ? 'flex' : 'none';
    document.getElementById('state-results').style.display = s === STATE.RESULTS ? 'block' : 'none';
  }

  function updateParsing(msg, detail, pct) {
    document.getElementById('parsing-status').textContent = msg;
    document.getElementById('parsing-detail').textContent = detail || '';
    if (typeof pct === 'number') document.getElementById('parsing-bar').style.width = pct + '%';
  }

  // --- Data loading ---

  function loadJSON(url) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error('Failed to load ' + url);
      return r.json();
    });
  }

  function loadDemoData() {
    var base = '/predictor/data/';
    return Promise.all([
      loadJSON(base + 'ranked-list.json'),
      loadJSON(base + 'kg-triples.json'),
      loadJSON(base + 'portfolio-quotas.json'),
      loadJSON(base + 'slot-template.json')
    ]).then(function (r) {
      data.rankedList = r[0]; data.kgTriples = r[1]; data.quotas = r[2]; data.slotTemplate = r[3];
    }).catch(function (err) {
      throw new Error('Failed to load demo data. Check your connection and try again.');
    });
  }

  function loadSupportData() {
    var base = '/predictor/data/';
    return Promise.all([
      loadJSON(base + 'topic-dictionary.json'),
      loadJSON(base + 'medical-synonyms.json'),
      loadJSON(base + 'system-keywords.json'),
      loadJSON(base + 'kg-triples.json'),
      loadJSON(base + 'portfolio-quotas.json'),
      loadJSON(base + 'slot-template.json')
    ]).then(function (r) {
      data.kgTriples = r[3]; data.quotas = r[4]; data.slotTemplate = r[5];
      return { topicDict: r[0], synonyms: r[1], systemKeywords: r[2] };
    }).catch(function (err) {
      throw new Error('Failed to load support data. Check your connection and try again.');
    });
  }

  // --- Demo flow ---

  function startDemo() {
    setState(STATE.PARSING);
    updateParsing('Loading demo data...', 'Demo dataset \u2014 987 questions', 30);
    dataSource = 'demo';
    loadDemoData().then(function () {
      updateParsing('Computing rankings...', '', 80);
      currentResults = PredictorEngine.rank(data.rankedList, data.kgTriples, data.quotas, null);
      updateParsing('Done', '', 100);
      setTimeout(function () {
        showResults('Demo dataset \u2014 ' + data.rankedList.length + ' predicted topics');
      }, 400);
    }).catch(handleError);
  }

  // --- Upload flow ---

  function startUpload(files) {
    if (files.length === 0) return;
    setState(STATE.PARSING);
    updateParsing('Reading files...', files.length + ' file(s) selected', 10);
    dataSource = 'upload';

    Promise.all([
      loadSupportData(),
      UploadParser.parseFiles(files, function (msg, detail, pct) { updateParsing(msg, detail, pct); })
    ]).then(function (results) {
      var support = results[0];
      var questions = results[1];
      updateParsing('Matching topics...', questions.length + ' questions extracted', 70);
      var matched = UploadParser.matchTopics(questions, support.topicDict, support.synonyms, support.systemKeywords);
      if (matched.length === 0) { handleError(new Error('No topics matched. Try different files or use the demo.')); return; }
      updateParsing('Computing rankings...', matched.length + ' topics matched', 90);
      data.rankedList = matched;
      currentResults = PredictorEngine.rank(data.rankedList, data.kgTriples || [], data.quotas, null);
      updateParsing('Done', '', 100);
      setTimeout(function () {
        showResults('Your papers \u2014 ' + questions.length + ' questions, ' + matched.length + ' topics matched');
      }, 400);
    }).catch(handleError);
  }


  // --- Text paste flow ---

  function startTextParse(text) {
    if (!text.trim()) return;
    setState(STATE.PARSING);
    updateParsing('Matching topics...', '', 30);
    dataSource = 'upload';

    loadSupportData().then(function (support) {
      var lines = text.split(/\n/).map(function(l) { return l.trim(); }).filter(Boolean);
      updateParsing('Matching topics...', lines.length + ' lines found', 60);
      var matched = UploadParser.matchTopics(lines, support.topicDict, support.synonyms, support.systemKeywords);
      if (matched.length === 0) {
        handleError(new Error('No topics matched. Check your pasted text or try the demo.'));
        return;
      }
      updateParsing('Computing rankings...', matched.length + ' topics matched', 90);
      data.rankedList = matched;
      currentResults = PredictorEngine.rank(data.rankedList, data.kgTriples || [], data.quotas, null);
      updateParsing('Done', '', 100);
      setTimeout(function () {
        showResults('Your papers \u2014 ' + lines.length + ' questions, ' + matched.length + ' topics matched');
      }, 400);
    }).catch(handleError);
  }

  // --- Results ---

  function showResults(label) {
    var el = document.getElementById('results-source');
    if (el) el.textContent = label;
    var resultsSection = document.getElementById('state-results');
    var startOverBtn = document.getElementById('start-over');
    if (dataSource === 'demo') {
      resultsSection.classList.add('results--demo-mode');
      if (startOverBtn) startOverBtn.textContent = 'Try your own papers';
    } else {
      resultsSection.classList.remove('results--demo-mode');
      if (startOverBtn) startOverBtn.textContent = 'Upload new papers';
    }
    setState(STATE.RESULTS);
    renderResults(currentResults);
  }

  function handleError(err) {
    console.error('Predictor error:', err);
    // Clean up page-loader if it was active
    var loader = document.getElementById('page-loader');
    if (loader) {
      loader.classList.remove('page-loader--active');
      loader.classList.add('page-loader--done');
    }
    setState(STATE.CHOOSE);
    var zone = document.getElementById('upload-zone');
    var msg = document.createElement('p');
    msg.className = 'upload-error';
    msg.textContent = err.message || 'Something went wrong.';
    zone.appendChild(msg);
    setTimeout(function () { if (msg.parentNode) msg.parentNode.removeChild(msg); }, 5000);
  }

  function startOver() {
    userAdjustments = { excluded: [] };
    data = { rankedList: null, kgTriples: null, quotas: null, slotTemplate: null };
    currentResults = null; dataSource = null; activeView = 'ranked';
    var btns = document.querySelectorAll('.view-btn');
    for (var i = 0; i < btns.length; i++) btns[i].classList.toggle('active', btns[i].dataset.view === 'ranked');
    setState(STATE.CHOOSE);
  }

  // --- HTML helpers ---

  function esc(str) { var d = document.createElement('div'); d.textContent = str; return d.innerHTML; }
  function scorePercent(score) { return Math.min(100, Math.max(2, (score * 100))).toFixed(0); }

  // --- Render: Ranked view ---

  function renderRankedView(container, results) {
    var html = '';
    for (var i = 0; i < results.topics.length; i++) {
      var t = results.topics[i];
      var isExcluded = userAdjustments.excluded.indexOf(t.canonical_topic) !== -1;
      var tags = '';
      for (var j = 0; j < t.reason_codes.length; j++) {
        tags += '<span class="tag tag-gold">' + esc(t.reason_codes[j]) + '</span>';
      }
      html +=
        '<div class="card topic-card' + (isExcluded ? ' excluded' : '') + '">' +
        '<div class="topic-header">' +
        '<span class="topic-rank mono">#' + (i + 1) + '</span>' +
        '<h3 class="topic-name">' + esc(t.canonical_topic) + '</h3>' +
        '<span class="tag tag-blue topic-system">' + esc(t.system) + '</span></div>' +
        '<div class="topic-reasons">' + tags + '</div>' +
        '<div class="topic-rationale mono">' + esc(buildRationale(t.reason_codes)) + '</div>' +
        '<div class="topic-score-bar"><div class="score-fill" style="width:' + scorePercent(t._score) + '%"></div></div>' +
        '<details class="topic-detail"><summary>What to memorize</summary>' +
        '<p class="text-secondary">' + esc(t.what_to_memorize) + '</p></details>' +
        '<div class="topic-actions">' +
        '<button class="btn btn-secondary btn-sm" data-topic="' + esc(t.canonical_topic) + '" onclick="PredictorUI.toggleExclude(this.dataset.topic)">' +
        (isExcluded ? 'Restore' : 'Already studied') + '</button></div></div>';
    }
    container.innerHTML = html;
  }

  // --- Render: Slot view ---

  function renderSlotView(container, results) {
    if (!data.slotTemplate) { container.innerHTML = '<p class="text-muted">Slot analysis requires demo data.</p>'; return; }
    var slots = PredictorEngine.analyzeSlots(data.slotTemplate, results.topics);
    var html = '';
    for (var i = 0; i < slots.length; i++) {
      var s = slots[i], cc = s.confidence >= 0.8 ? 'tag-gold' : 'tag-blue';
      var th = '';
      if (s.matchedTopics.length > 0) {
        for (var j = 0; j < s.matchedTopics.length; j++) {
          var t = s.matchedTopics[j];
          th += '<div class="slot-topic-item"><span class="topic-rank mono">#' + t.rank + '</span><span>' + esc(t.canonical_topic) + '</span></div>';
        }
      } else { th = '<p class="empty-slot">No matching topics</p>'; }
      html += '<div class="card slot-card"><div class="slot-header">' +
        '<span class="slot-number mono">Slot ' + s.slot + '</span>' +
        '<h3>' + esc(s.label) + '</h3>' +
        '<span class="tag ' + cc + '">' + esc(s.classification) + '</span>' +
        '<span class="slot-confidence mono text-muted">' + (s.confidence * 100).toFixed(0) + '%</span></div>' +
        '<div class="slot-topics">' + th + '</div></div>';
    }
    container.innerHTML = html;
  }

  // --- Render: System view ---

  function renderSystemView(container, results) {
    var groups = PredictorEngine.groupBySystems(results.topics);
    var max = data.quotas ? data.quotas.max_per_system : 4;
    var html = '';
    for (var i = 0; i < groups.length; i++) {
      var g = groups[i], th = '';
      for (var j = 0; j < g.topics.length; j++) {
        th += '<div class="system-topic"><span class="topic-rank mono">#' + g.topics[j].rank + '</span> ' + esc(g.topics[j].canonical_topic) + '</div>';
      }
      html += '<div class="card slot-card"><div class="system-header">' +
        '<h3>' + esc(g.system) + '</h3><span class="system-count mono text-accent">' + g.topics.length + ' / ' + max + '</span></div>' + th + '</div>';
    }
    container.innerHTML = html;
  }

  // --- Stats + dispatch ---

  function renderStats(results) {
    var el = document.getElementById('predictor-stats');
    if (!el) return;
    var cc = results.categoryCounts, sc = Object.keys(results.systemCounts).length;
    el.innerHTML = '<div class="stat"><span class="mono text-accent">' + results.topics.length + '</span> topics</div>' +
      '<div class="stat"><span class="mono text-accent">' + sc + '</span> systems</div>' +
      '<div class="stat"><span class="mono text-accent">' + cc.algorithmic + '</span> algorithmic</div>' +
      '<div class="stat"><span class="mono text-accent">' + cc.confusable + '</span> confusable</div>';
  }

  function renderResults(results) {
    var c = document.getElementById('predictor-results');
    if (!c) return;
    switch (activeView) {
      case 'ranked': renderRankedView(c, results); break;
      case 'slots': renderSlotView(c, results); break;
      case 'systems': renderSystemView(c, results); break;
    }
    renderStats(results);
  }

  function toggleExclude(name) {
    var idx = userAdjustments.excluded.indexOf(name);
    if (idx >= 0) userAdjustments.excluded.splice(idx, 1);
    else userAdjustments.excluded.push(name);
    recompute();
  }

  function setView(view) {
    activeView = view;
    var btns = document.querySelectorAll('.view-btn');
    for (var i = 0; i < btns.length; i++) btns[i].classList.toggle('active', btns[i].dataset.view === view);
    if (currentResults) renderResults(currentResults);
  }

  function recompute() {
    currentResults = PredictorEngine.rank(data.rankedList, data.kgTriples, data.quotas, userAdjustments);
    renderResults(currentResults);
  }

  // --- Demo with page loader (auto-demo via URL param) ---

  function startDemoWithPageLoader() {
    dataSource = 'demo';
    // Hide all states immediately to prevent flash of CHOOSE
    document.getElementById('state-choose').style.display = 'none';
    document.getElementById('state-parsing').style.display = 'none';
    var loader = document.getElementById('page-loader');
    loader.classList.add('page-loader--active');
    var bar = loader.querySelector('.page-loader-bar');
    bar.style.width = '40%';

    loadDemoData().then(function () {
      bar.style.width = '90%';
      currentResults = PredictorEngine.rank(data.rankedList, data.kgTriples, data.quotas, null);
      bar.style.width = '100%';
      setTimeout(function () {
        loader.classList.remove('page-loader--active');
        loader.classList.add('page-loader--done');
        showResults('Demo dataset — ' + data.rankedList.length + ' predicted topics');
        animateTopicCards();
      }, 300);
    }).catch(handleError);
  }

  function animateTopicCards() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var cards = document.querySelectorAll('.topic-card');
    var count = Math.min(cards.length, 8);
    for (var i = 0; i < count; i++) {
      cards[i].style.opacity = '0';
      cards[i].style.transform = 'translateY(12px)';
      cards[i].style.transition = 'opacity 200ms ease, transform 200ms ease';
    }
    for (var j = 0; j < count; j++) {
      (function(el, delay) {
        setTimeout(function () { el.style.opacity = '1'; el.style.transform = 'translateY(0)'; }, delay);
      })(cards[j], 50 * j);
    }
  }

  // --- Init ---

  function init() {
    var zone = document.getElementById('upload-zone');
    var fileInput = document.getElementById('file-input');
    var demoLink = document.getElementById('demo-link');
    var startOverBtn = document.getElementById('start-over');
    var toggles = document.getElementById('view-toggles');

    zone.addEventListener('click', function () { fileInput.click(); });
    zone.addEventListener('keydown', function (e) { if (e.key === 'Enter') fileInput.click(); });
    fileInput.addEventListener('change', function () { if (fileInput.files.length > 0) startUpload(fileInput.files); });

    zone.addEventListener('dragover', function (e) { e.preventDefault(); zone.classList.add('upload-zone--active'); });
    zone.addEventListener('dragleave', function () { zone.classList.remove('upload-zone--active'); });
    zone.addEventListener('drop', function (e) {
      e.preventDefault(); zone.classList.remove('upload-zone--active');
      if (e.dataTransfer.files.length > 0) startUpload(e.dataTransfer.files);
    });

    // Secondary upload zone (below results in demo mode)
    var zone2 = document.getElementById('upload-zone-secondary');
    var fileInput2 = document.getElementById('file-input-secondary');
    if (zone2 && fileInput2) {
      zone2.addEventListener('click', function () { fileInput2.click(); });
      zone2.addEventListener('keydown', function (e) { if (e.key === 'Enter') fileInput2.click(); });
      fileInput2.addEventListener('change', function () { if (fileInput2.files.length > 0) startUpload(fileInput2.files); });
      zone2.addEventListener('dragover', function (e) { e.preventDefault(); zone2.classList.add('upload-zone--active'); });
      zone2.addEventListener('dragleave', function () { zone2.classList.remove('upload-zone--active'); });
      zone2.addEventListener('drop', function (e) {
        e.preventDefault(); zone2.classList.remove('upload-zone--active');
        if (e.dataTransfer.files.length > 0) startUpload(e.dataTransfer.files);
      });
    }


    // Tab switching
    var tabPaste = document.getElementById('tab-paste');
    var tabUpload = document.getElementById('tab-upload');
    var panePaste = document.getElementById('pane-paste');
    var paneUpload = document.getElementById('pane-upload');
    if (tabPaste && tabUpload) {
      tabPaste.addEventListener('click', function () {
        tabPaste.classList.add('active'); tabUpload.classList.remove('active');
        panePaste.style.display = 'block'; paneUpload.style.display = 'none';
      });
      tabUpload.addEventListener('click', function () {
        tabUpload.classList.add('active'); tabPaste.classList.remove('active');
        paneUpload.style.display = 'block'; panePaste.style.display = 'none';
      });
    }
    // Paste submit
    var pasteArea = document.getElementById('paste-area');
    var pasteSubmit = document.getElementById('paste-submit');
    if (pasteArea && pasteSubmit) {
      pasteSubmit.addEventListener('click', function () { startTextParse(pasteArea.value); });
    }

    demoLink.addEventListener('click', function (e) { e.preventDefault(); startDemo(); });
    startOverBtn.addEventListener('click', function () {
      if (dataSource === 'demo') {
        var invite = document.getElementById('upload-invite');
        if (invite) invite.scrollIntoView({ behavior: 'smooth' });
      } else {
        startOver();
      }
    });
    toggles.addEventListener('click', function (e) {
      var btn = e.target.closest('.view-btn');
      if (btn && btn.dataset.view) setView(btn.dataset.view);
    });

    // URL param detection: ?demo=1 skips CHOOSE state
    var params = new URLSearchParams(window.location.search);
    if (params.get('demo') === '1') {
      startDemoWithPageLoader();
    } else {
      setState(STATE.CHOOSE);
    }
  }

  document.addEventListener('DOMContentLoaded', init);

  return { toggleExclude: toggleExclude, setView: setView, startOver: startOver };
})();
