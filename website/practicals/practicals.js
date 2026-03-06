/* MBBEasy -- Practicals: browse clinical cases by system */
(function () {
  'use strict';

  var DATA_FILES = [
    { key: 'cardiac', url: '/practicals/data/cardiac.json' },
    { key: 'respiratory', url: '/practicals/data/respiratory.json' },
    { key: 'neuro', url: '/practicals/data/neuro.json' },
    { key: 'gi', url: '/practicals/data/gi_specialty.json' },
    { key: 'general', url: '/practicals/data/general_cases.json' }
  ];

  var SYSTEM_LABELS = {
    cardiac: 'Cardiac',
    respiratory: 'Respiratory',
    neuro: 'Neuro',
    gi: 'GI',
    general: 'General'
  };

  var allData = {};
  var activeSystem = null;

  function esc(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  function loadAll() {
    return Promise.all(DATA_FILES.map(function (f) {
      return fetch(f.url).then(function (r) { return r.json(); }).then(function (json) {
        allData[f.key] = json;
      });
    }));
  }

  function buildSystemButtons() {
    var container = document.getElementById('system-btns');
    if (!container) return;
    var html = '';
    DATA_FILES.forEach(function (f) {
      var label = SYSTEM_LABELS[f.key] || f.key;
      var count = getCases(f.key).length;
      html += '<button class="system-btn" data-system="' + f.key + '">' + label + ' (' + count + ')</button>';
    });
    container.innerHTML = html;
    container.addEventListener('click', function (e) {
      var btn = e.target.closest('.system-btn');
      if (!btn) return;
      selectSystem(btn.dataset.system);
    });
  }

  function getCases(key) {
    var d = allData[key];
    if (!d) return [];
    return d.cases || d.clinical_cases || [];
  }

  function selectSystem(key) {
    activeSystem = key;
    var btns = document.querySelectorAll('.system-btn');
    btns.forEach(function (b) { b.classList.toggle('active', b.dataset.system === key); });
    renderCases(key);
  }

  function renderSection(title, content) {
    if (!content) return '';
    if (typeof content === 'string') {
      return '<h4>' + esc(title) + '</h4><p>' + esc(content) + '</p>';
    }
    if (Array.isArray(content)) {
      var items = content.map(function (item) {
        if (typeof item === 'string') return '<li>' + esc(item) + '</li>';
        if (item.step || item.action) return '<li>' + esc(item.step || item.action || '') + (item.detail ? ' &mdash; ' + esc(item.detail) : '') + '</li>';
        if (item.finding) return '<li><strong>' + esc(item.finding) + '</strong>' + (item.mechanism ? ' &mdash; ' + esc(item.mechanism) : '') + '</li>';
        if (item.condition || item.diagnosis) return '<li>' + esc(item.condition || item.diagnosis || '') + (item.distinguishing_feature ? ' &mdash; ' + esc(item.distinguishing_feature) : '') + '</li>';
        if (item.drug || item.medication) return '<li>' + esc(item.drug || item.medication) + (item.dose ? ' (' + esc(item.dose) + ')' : '') + (item.indication ? ' &mdash; ' + esc(item.indication) : '') + '</li>';
        return '<li>' + esc(JSON.stringify(item)) + '</li>';
      });
      return '<h4>' + esc(title) + '</h4><ul>' + items.join('') + '</ul>';
    }
    if (typeof content === 'object') {
      var parts = '';
      Object.keys(content).forEach(function (k) {
        parts += renderSection(k.replace(/_/g, ' '), content[k]);
      });
      return parts;
    }
    return '';
  }

  function renderCases(key) {
    var container = document.getElementById('case-list');
    if (!container) return;
    var cases = getCases(key);

    if (cases.length === 0) {
      container.innerHTML = '<p class="empty-state">No cases found for this system.</p>';
      return;
    }

    var html = '';
    cases.forEach(function (c) {
      var name = c.name || c.case_name || c.condition || c.title || 'Case';
      var body = '';

      // Presentation
      if (c.presentation_script) body += renderSection('Presentation', c.presentation_script);
      if (c.presentation) body += renderSection('Presentation', c.presentation);

      // Examination technique
      if (c.examination_technique) body += renderSection('Examination Technique', c.examination_technique);
      if (c.examination_steps) body += renderSection('Examination Steps', c.examination_steps);

      // Findings
      if (c.findings_with_mechanisms) body += renderSection('Findings with Mechanisms', c.findings_with_mechanisms);
      if (c.findings) body += renderSection('Findings', c.findings);
      if (c.positive_findings) body += renderSection('Positive Findings', c.positive_findings);
      if (c.negative_findings) body += renderSection('Negative Findings', c.negative_findings);

      // Diagnosis
      if (c.diagnosis_and_differentials) body += renderSection('Diagnosis & Differentials', c.diagnosis_and_differentials);
      if (c.diagnosis) body += renderSection('Diagnosis', c.diagnosis);
      if (c.differentials || c.differential_diagnosis) body += renderSection('Differentials', c.differentials || c.differential_diagnosis);

      // Management
      if (c.management) body += renderSection('Management', c.management);
      if (c.investigations) body += renderSection('Investigations', c.investigations);

      html += '<details class="case"><summary>' + esc(name) + '</summary><div class="case-body">' + body + '</div></details>';
    });

    container.innerHTML = html;
  }

  function init() {
    loadAll().then(function () {
      buildSystemButtons();
      var first = DATA_FILES[0].key;
      selectSystem(first);
    }).catch(function (err) {
      console.error('Practicals load error:', err);
      var container = document.getElementById('case-list');
      if (container) container.innerHTML = '<p class="empty-state">Failed to load case data.</p>';
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
