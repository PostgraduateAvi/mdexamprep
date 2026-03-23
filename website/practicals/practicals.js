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

  var TITLE_MAP = {
    'gpe_findings': 'General Physical Examination',
    'hpi': 'History of Present Illness',
    'system_findings': 'System Examination Findings',
    'presentation_script': 'Presentation',
    'case_scenario': 'Case Scenario',
    'diagnosis_statement': 'Diagnosis',
    'findings_with_mechanisms': 'Findings & Mechanisms',
    'diagnosis_and_differentials': 'Diagnosis & Differentials',
    'clinical_summary': 'Clinical Summary',
    'cross_case_differentials': 'Cross-Case Comparisons',
    'examination_technique': 'Examination Technique',
    'mechanism_chain': 'Mechanism',
    'supporting_evidence': 'Supporting Evidence',
    'points_for': 'Points in Favour',
    'why_not': 'Points Against',
    'this_patient': 'Plan for This Patient',
    'follow_up': 'Follow-up Plan',
    'drug_history': 'Drug History',
    'past_history': 'Past History',
    'family_history': 'Family History',
    'social_history': 'Social History',
    'chief_complaint': 'Chief Complaint',
    'findings_in_this_case': 'Findings in This Case'
  };

  /* Case ID → theory topic mapping (reverse of theory's TOPIC_CASE_MAP) */
  var CASE_TOPIC_MAP = {
    'mitral_stenosis': { id: 'mitral-stenosis', label: 'Mitral Stenosis', system: 'cardiology' },
    'mitral_regurgitation': { id: 'mitral-regurgitation', label: 'Mitral Regurgitation', system: 'cardiology' },
    'aortic_stenosis': { id: 'aortic-stenosis', label: 'Aortic Stenosis', system: 'cardiology' },
    'aortic_regurgitation': { id: 'aortic-regurgitation', label: 'Aortic Regurgitation', system: 'cardiology' },
    'infective_endocarditis': { id: 'infective-endocarditis', label: 'Infective Endocarditis', system: 'cardiology' },
    'pleural_effusion': { id: 'pleural-effusion', label: 'Pleural Effusion', system: 'respiratory' },
    'pneumothorax': { id: 'pneumothorax', label: 'Pneumothorax', system: 'respiratory' },
    'consolidation': { id: 'pneumonia', label: 'Pneumonia / Consolidation', system: 'respiratory' },
    'bronchial_asthma': { id: 'bronchial-asthma', label: 'Bronchial Asthma', system: 'respiratory' },
    'copd_cor_pulmonale': { id: 'copd', label: 'COPD', system: 'respiratory' },
    'copd_mastery': { id: 'copd', label: 'COPD', system: 'respiratory' },
    'hemiplegia': { id: 'ischemic-stroke', label: 'Ischemic Stroke', system: 'neurology' },
    'paraplegia': { id: 'spinal-cord-lesions', label: 'Spinal Cord Lesions', system: 'neurology' },
    'gbs': { id: 'guillain-barre-syndrome', label: 'Guillain-Barr\u00e9 Syndrome', system: 'neurology' },
    'parkinsons': { id: 'parkinsons-disease', label: "Parkinson's Disease", system: 'neurology' },
    'cirrhosis_alcoholic': { id: 'cirrhosis', label: 'Cirrhosis', system: 'gastro' },
    'dermatomyositis_long_case': { id: 'dermatomyositis', label: 'Dermatomyositis', system: 'gastro' }
  };

  var allData = {};
  var activeSystem = null;
  var vivaForgeData = null;
  var vivaForgeLoading = false;

  function esc(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  function formatTitle(key) {
    if (TITLE_MAP[key]) return TITLE_MAP[key];
    return key.replace(/_/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); });
  }

  function loadAll() {
    var dataPromises = DATA_FILES.map(function (f) {
      return fetch(f.url).then(function (r) { return r.json(); }).then(function (json) {
        allData[f.key] = json;
      });
    });
    return Promise.all(dataPromises);
  }

  /* ---------- Viva Forge ---------- */

  function loadVivaForge(callback) {
    if (vivaForgeData) { callback(vivaForgeData); return; }
    if (vivaForgeLoading) return;
    vivaForgeLoading = true;
    fetch('/practicals/data/viva_forge_data.json')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        vivaForgeData = data;
        vivaForgeLoading = false;
        callback(data);
      })
      .catch(function () { vivaForgeLoading = false; });
  }

  function findVivaForgeQuestions(caseName) {
    if (!vivaForgeData) return [];
    var cases = vivaForgeData.cases || vivaForgeData;
    if (!Array.isArray(cases)) return [];
    var name = caseName.toLowerCase().replace(/[^a-z0-9]/g, '');
    var matches = [];
    cases.forEach(function (c) {
      var cName = (c.name || c.case_name || c.condition || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      if (cName.indexOf(name) !== -1 || name.indexOf(cName) !== -1) {
        var qs = c.vivas || c.questions || c.viva_questions || [];
        matches = matches.concat(qs);
      }
    });
    return matches;
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

  function renderItem(item) {
    if (typeof item === 'string') return '<li>' + esc(item) + '</li>';

    // Phase/step with actions
    if (item.phase) {
      var ph = '<li><strong>' + esc(item.phase) + '</strong>';
      if (item.actions && item.actions.length) {
        ph += '<ul>' + item.actions.map(function (a) { return renderItem(a); }).join('') + '</ul>';
      }
      if (item.findings_in_this_case && item.findings_in_this_case.length) {
        ph += '<div class="findings-this-case"><em>Findings in this case:</em> ' + item.findings_in_this_case.map(function (f) { return esc(f); }).join('; ') + '</div>';
      }
      ph += '</li>';
      return ph;
    }

    // Step/action items
    if (item.step || item.action) return '<li>' + esc(item.step || item.action || '') + (item.detail ? ' &mdash; ' + esc(item.detail) : '') + '</li>';

    // Clinical summary: area + finding + detail + significance
    if (item.area && item.detail) {
      var present = item.present !== false ? '' : ' <span class="absent-tag">absent</span>';
      return '<li><strong>[' + esc(item.area) + '] ' + esc(item.finding || '') + '</strong>' + present
        + ': ' + esc(item.detail)
        + (item.significance ? ' &mdash; <em>' + esc(item.significance) + '</em>' : '')
        + '</li>';
    }

    // Finding with mechanism (enriched)
    if (item.finding) {
      var f = '<li><strong>' + esc(item.finding) + '</strong>';
      if (item.mechanism) f += ' &mdash; ' + esc(item.mechanism);
      if (item.detail) f += ' &mdash; ' + esc(item.detail);
      if (item.significance) f += ' <em>(' + esc(item.significance) + ')</em>';
      if (item.grading) f += '<br><small class="mechanism-chain">Grading: ' + esc(item.grading) + '</small>';
      if (item.mechanism_chain) f += '<br><small class="mechanism-chain">' + esc(item.mechanism_chain) + '</small>';
      if (item.caveat) f += '<br><small class="caveat">' + esc(item.caveat) + '</small>';
      f += '</li>';
      return f;
    }

    // Investigation
    if (item.test) {
      return '<li><strong>' + esc(item.test) + '</strong>'
        + (item.priority ? ' <span class="priority-tag priority-' + esc(item.priority) + '">' + esc(item.priority) + '</span>' : '')
        + ': ' + esc(item.expected || '')
        + (item.why ? ' &mdash; <em>' + esc(item.why) + '</em>' : '')
        + '</li>';
    }

    // Complication
    if (item.complication) {
      return '<li><strong>' + esc(item.complication) + '</strong>: '
        + esc(item.mechanism || '')
        + (item.presentation ? '<br><em>Presentation:</em> ' + esc(item.presentation) : '')
        + (item.management ? '<br><em>Management:</em> ' + esc(item.management) : '')
        + '</li>';
    }

    // Management intervention
    if (item.intervention) {
      return '<li><strong>' + esc(item.intervention) + '</strong>: '
        + esc(item.rationale || '')
        + (item.specifics ? '<br><small>' + esc(item.specifics) + '</small>' : '')
        + '</li>';
    }

    // Viva Q&A
    if (item.question) {
      var qa = '<li class="viva-item"><strong>Q:</strong> ' + esc(item.question)
        + '<br><strong>A:</strong> ' + esc(item.answer || '');
      if (item.follow_ups && item.follow_ups.length) {
        qa += '<br><em>Follow-ups:</em> ' + item.follow_ups.map(function (fu) {
          if (typeof fu === 'string') return esc(fu);
          if (fu.q) return esc(fu.q) + (fu.a ? ' &mdash; ' + esc(fu.a) : '');
          return esc(JSON.stringify(fu));
        }).join('; ');
      }
      if (item.examiner) qa += '<br><small class="mechanism-chain">Examiner note: ' + esc(item.examiner) + '</small>';
      qa += '</li>';
      return qa;
    }

    // Cross-case differential feature row
    if (item.feature && item.values) {
      return '<li><strong>' + esc(item.feature) + '</strong>: ' + item.values.map(function (v) { return esc(v); }).join(' / ') + '</li>';
    }

    // Differential with reasoning
    if (item.points_for || item.why_not) {
      return '<li><strong>' + esc(item.condition || item.diagnosis || '') + '</strong>'
        + (item.points_for ? '<br><em>For:</em> ' + esc(item.points_for) : '')
        + (item.why_not ? '<br><em>Against:</em> ' + esc(item.why_not) : '')
        + '</li>';
    }

    // Condition/diagnosis (simple)
    if (item.condition || item.diagnosis) return '<li>' + esc(item.condition || item.diagnosis || '') + (item.distinguishing_feature ? ' &mdash; ' + esc(item.distinguishing_feature) : '') + '</li>';

    // Drug/medication
    if (item.drug || item.medication) return '<li>' + esc(item.drug || item.medication) + (item.dose ? ' (' + esc(item.dose) + ')' : '') + (item.indication ? ' &mdash; ' + esc(item.indication) : '') + '</li>';

    // Cross-case comparison (with conditions array)
    if (item.comparison && item.conditions && item.features) {
      return '<li>' + renderComparisonTable(item) + '</li>';
    }

    // Generic object fallback: render all key-value pairs
    var keys = Object.keys(item);
    if (keys.length) {
      var parts = keys.map(function (k) {
        var v = item[k];
        if (typeof v === 'boolean') return v ? esc(formatTitle(k)) : null;
        if (typeof v === 'string') return '<strong>' + esc(formatTitle(k)) + ':</strong> ' + esc(v);
        if (Array.isArray(v)) return '<strong>' + esc(formatTitle(k)) + ':</strong> ' + v.map(function (vi) { return typeof vi === 'string' ? esc(vi) : esc(JSON.stringify(vi)); }).join(', ');
        return null;
      }).filter(Boolean);
      return '<li>' + parts.join('<br>') + '</li>';
    }

    return '<li>' + esc(JSON.stringify(item)) + '</li>';
  }

  function renderSection(title, content) {
    if (!content) return '';
    if (typeof content === 'string') {
      return '<h4>' + esc(title) + '</h4><p>' + esc(content) + '</p>';
    }
    if (Array.isArray(content)) {
      var items = content.map(renderItem);
      return '<h4>' + esc(title) + '</h4><ul>' + items.join('') + '</ul>';
    }
    if (typeof content === 'object') {
      var parts = '';
      Object.keys(content).forEach(function (k) {
        parts += renderSection(formatTitle(k), content[k]);
      });
      return parts;
    }
    return '';
  }

  function renderComparisonTable(diff) {
    var html = '<details class="comparison"><summary>' + esc(diff.comparison) + '</summary>'
      + '<div class="table-wrap"><table class="comparison-table"><thead><tr><th>Feature</th>';
    diff.conditions.forEach(function (c) { html += '<th>' + esc(c) + '</th>'; });
    html += '</tr></thead><tbody>';
    diff.features.forEach(function (f) {
      html += '<tr><td><strong>' + esc(f.feature) + '</strong></td>';
      f.values.forEach(function (v) { html += '<td>' + esc(v) + '</td>'; });
      html += '</tr>';
    });
    html += '</tbody></table></div></details>';
    return html;
  }

  function buildTheoryLinks(caseId) {
    var match = CASE_TOPIC_MAP[caseId];
    if (!match) return '';
    return '<div class="cross-links">' +
      '<span class="cross-links-label">Theory:</span>' +
      '<a class="cross-link cross-link--theory" href="/theory/?system=' + match.system + '#topic-' + match.id + '">' +
      esc(match.label) +
      '</a></div>';
  }

  function renderCases(key) {
    var container = document.getElementById('case-list');
    if (!container) return;
    var d = allData[key];
    var cases = getCases(key);

    if (cases.length === 0) {
      container.innerHTML = '<p class="empty-state">No cases found for this system.</p>';
      return;
    }

    var html = '';

    // System-level sections
    if (d.system_examination_technique) {
      html += '<details class="case system-technique"><summary>System Examination Technique</summary><div class="case-body">'
        + renderSection('Examination Technique', d.system_examination_technique)
        + '</div></details>';
    }

    if (d.cross_case_differentials && d.cross_case_differentials.length) {
      var tables = d.cross_case_differentials.map(renderComparisonTable).join('');
      html += '<details class="case cross-case"><summary>Cross-Case Comparisons (' + d.cross_case_differentials.length + ')</summary><div class="case-body">'
        + tables
        + '</div></details>';
    }

    // Individual cases
    cases.forEach(function (c) {
      var name = c.name || c.case_name || c.condition || c.title || 'Case';
      var caseId = c.id || name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      var body = '';

      // Theory cross-links
      body += buildTheoryLinks(caseId);

      // Presentation
      if (c.presentation_script) body += renderSection('Presentation', c.presentation_script);
      if (c.presentation) body += renderSection('Presentation', c.presentation);

      // Case scenario
      if (c.case_scenario) body += renderSection('Case Scenario', c.case_scenario);

      // Clinical summary
      if (c.clinical_summary) body += renderSection('Clinical Summary', c.clinical_summary);

      // Examination technique
      if (c.examination_technique) body += renderSection('Examination Technique', c.examination_technique);
      if (c.examination_steps) body += renderSection('Examination Steps', c.examination_steps);

      // Findings
      if (c.findings_with_mechanisms) body += renderSection('Findings & Mechanisms', c.findings_with_mechanisms);
      if (c.findings) body += renderSection('Findings', c.findings);
      if (c.positive_findings) body += renderSection('Positive Findings', c.positive_findings);
      if (c.negative_findings) body += renderSection('Negative Findings', c.negative_findings);

      // Diagnosis
      if (c.diagnosis_and_differentials) body += renderSection('Diagnosis & Differentials', c.diagnosis_and_differentials);
      if (c.diagnosis) body += renderSection('Diagnosis', c.diagnosis);
      if (c.differentials || c.differential_diagnosis) body += renderSection('Differentials', c.differentials || c.differential_diagnosis);

      // Investigations
      if (c.investigations) body += renderSection('Investigations', c.investigations);

      // Management
      if (c.management) body += renderSection('Management', c.management);

      // Complications
      if (c.complications) body += renderSection('Complications', c.complications);

      // Vivas
      if (c.vivas) body += renderSection('Viva Questions', c.vivas);

      // Viva Forge trigger
      body += '<div class="viva-forge-slot" data-case-name="' + esc(name) + '"></div>';

      html += '<details class="case" id="case-' + esc(caseId) + '"><summary>' + esc(name) + '</summary><div class="case-body">' + body + '</div></details>';
    });

    container.innerHTML = html;

    // Setup Viva Forge lazy-load triggers
    setupVivaForgeSlots();

    // Handle hash navigation (from theory cross-links)
    handleHashNavigation();

    // Setup table scroll indicators
    setupTableScrollIndicators();
  }

  function setupVivaForgeSlots() {
    var slots = document.querySelectorAll('.viva-forge-slot');
    slots.forEach(function (slot) {
      var caseName = slot.dataset.caseName;
      var btn = document.createElement('button');
      btn.className = 'viva-forge-trigger';
      btn.textContent = 'Load more viva questions';
      btn.addEventListener('click', function () {
        btn.textContent = 'Loading...';
        btn.disabled = true;
        loadVivaForge(function () {
          var questions = findVivaForgeQuestions(caseName);
          if (questions.length > 0) {
            slot.innerHTML = renderSection('More Viva Questions', questions);
          } else {
            slot.innerHTML = '<p style="font-size:0.85rem;color:var(--text-muted);margin-top:12px;">No additional viva questions found for this case.</p>';
          }
        });
      });
      slot.appendChild(btn);
    });
  }

  function handleHashNavigation() {
    var hash = window.location.hash;
    if (!hash) return;
    var target = document.getElementById(hash.substring(1));
    if (target && target.tagName === 'DETAILS') {
      target.open = true;
      setTimeout(function () { target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 100);
    }
  }

  function setupTableScrollIndicators() {
    document.querySelectorAll('.table-wrap').forEach(function (wrap) {
      if (wrap.scrollWidth > wrap.clientWidth) {
        wrap.classList.add('has-overflow');
        wrap.addEventListener('scroll', function () {
          var atEnd = wrap.scrollLeft + wrap.clientWidth >= wrap.scrollWidth - 4;
          wrap.classList.toggle('scrolled-end', atEnd);
        });
      }
    });
  }

  function init() {
    loadAll().then(function () {
      buildSystemButtons();

      // Check URL for system param
      var params = new URLSearchParams(window.location.search);
      var sys = params.get('system');
      var valid = DATA_FILES.some(function (f) { return f.key === sys; });
      selectSystem(valid ? sys : DATA_FILES[0].key);
    }).catch(function (err) {
      console.error('Practicals load error:', err);
      var container = document.getElementById('case-list');
      if (container) container.innerHTML = '<p class="empty-state">Failed to load case data.</p>';
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
