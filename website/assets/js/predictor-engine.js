/* MD Exam Prep — Predictor Engine
   Pure data logic. No DOM access. Takes ranked list + KG + quotas,
   returns scored + filtered topic list.

   Design: The Ranked List IS the truth (produced by validated PI system).
   This engine re-ranks via reason-code weighting, KG relationship boosts,
   and portfolio quota enforcement. It does NOT attempt to recompute the
   full scoring formula (Feature Matrix is 65% gaps). */

var PredictorEngine = (function () {
  'use strict';

  // --- Reason code weights (additive boost per signal) ---
  var REASON_WEIGHTS = {
    'Bridge':         0.04,
    'Manual':         0.03,
    'Algorithm':      0.03,
    'Recency':        0.03,
    'ConfusablePair': 0.03,
    'Dose':           0.02,
    'ProgramUpdate':  0.02,
    'Sleeper':        0.02,
    'Foundation':     0.01,
    'Balance':        0.01,
    'Foil':           0.01,
    'FormatPattern':  0.01,
    'CoreFloor':      0.01,
    'ILD-Link':       0.01
  };

  // --- KG relation boost values ---
  var RELATION_BOOST = {
    'bridges_to':      0.02,
    'nudges':          0.015,
    'echoes_as':       0.015,
    'co_occurs_with':  0.01,
    'confusable_with': 0.01,
    'linked_with':     0.01
  };

  // --- Helpers ---

  function normalizeRank(rank, total) {
    return 1 - ((rank - 1) / (total - 1));
  }

  function parseReasonCode(code) {
    // "Bridge↑" → "Bridge", "ILD-Link↑" → "ILD-Link"
    return code.replace(/[^a-zA-Z\-]/g, '');
  }

  function computeReasonBoost(reasonCodes) {
    var boost = 0;
    for (var i = 0; i < reasonCodes.length; i++) {
      var key = parseReasonCode(reasonCodes[i]);
      if (REASON_WEIGHTS[key]) boost += REASON_WEIGHTS[key];
    }
    return boost;
  }

  function simplifyKGLabel(label) {
    // "Basic: Calcium homeostasis/Vitamin D" → "calcium homeostasis vitamin d"
    return label
      .replace(/^(Basic|Systemic|ID):\s*/i, '')
      .replace(/[\/\-\(\)]/g, ' ')
      .toLowerCase()
      .trim();
  }

  function topicMatchesKG(topicName, kgLabel) {
    var simplified = simplifyKGLabel(kgLabel);
    var topic = topicName.toLowerCase();
    // Check if key terms overlap
    var kgWords = simplified.split(/\s+/).filter(function (w) { return w.length > 3; });
    var matchCount = 0;
    for (var i = 0; i < kgWords.length; i++) {
      if (topic.indexOf(kgWords[i]) !== -1) matchCount++;
    }
    return matchCount >= 1 && matchCount >= kgWords.length * 0.3;
  }

  function computeKGBoost(topic, kgTriples, topTopicNames) {
    var boost = 0;
    for (var i = 0; i < kgTriples.length; i++) {
      var triple = kgTriples[i];
      var matchesSubject = topicMatchesKG(topic.canonical_topic, triple.subject);
      var matchesObject = topicMatchesKG(topic.canonical_topic, triple.object);

      if (matchesSubject || matchesObject) {
        // Check if the connected side is in the top topics
        var connectedLabel = matchesSubject ? triple.object : triple.subject;
        for (var j = 0; j < topTopicNames.length; j++) {
          if (topicMatchesKG(topTopicNames[j], connectedLabel)) {
            boost += RELATION_BOOST[triple.relation] || 0.01;
            break;
          }
        }
      }
    }
    return boost;
  }

  // --- Reason code category detection ---

  function hasReasonCode(codes, keyword) {
    for (var i = 0; i < codes.length; i++) {
      if (codes[i].indexOf(keyword) !== -1) return true;
    }
    return false;
  }

  // --- Portfolio quota enforcement ---

  function enforceQuotas(topics, quotas) {
    var result = [];
    var systemCounts = {};
    var categoryCounts = {
      algorithmic: 0,
      dose: 0,
      programUpdate: 0,
      confusable: 0
    };

    for (var i = 0; i < topics.length; i++) {
      var t = topics[i];
      // Normalize system for counting (take first word before / or space-heavy compound)
      var sys = t.system.split('/')[0].trim();
      var count = systemCounts[sys] || 0;

      if (count >= quotas.max_per_system) continue;

      systemCounts[sys] = count + 1;
      result.push(t);

      if (hasReasonCode(t.reason_codes, 'Algorithm')) categoryCounts.algorithmic++;
      if (hasReasonCode(t.reason_codes, 'Dose')) categoryCounts.dose++;
      if (hasReasonCode(t.reason_codes, 'ProgramUpdate')) categoryCounts.programUpdate++;
      if (hasReasonCode(t.reason_codes, 'ConfusablePair')) categoryCounts.confusable++;
    }

    return {
      topics: result,
      categoryCounts: categoryCounts,
      systemCounts: systemCounts
    };
  }

  // --- User adjustments ---

  function applyUserAdjustments(topics, adjustments) {
    if (!adjustments) return topics;
    var excluded = adjustments.excluded || [];

    return topics.filter(function (t) {
      return excluded.indexOf(t.canonical_topic) === -1;
    });
  }

  // --- Main ranking function ---

  function rank(rankedList, kgTriples, quotas, userAdjustments) {
    var total = rankedList.length;

    // Step 1: Compute composite score
    var scored = rankedList.map(function (topic) {
      var baseScore = normalizeRank(topic.rank, total);
      var reasonBoost = computeReasonBoost(topic.reason_codes);
      return Object.assign({}, topic, {
        _score: baseScore + reasonBoost,
        _baseScore: baseScore,
        _reasonBoost: reasonBoost,
        _kgBoost: 0,
        _signalCount: topic.reason_codes.length
      });
    });

    // Step 2: Sort by score
    scored.sort(function (a, b) { return b._score - a._score; });

    // Step 3: KG boost — topics connected to top-15 get a small uplift
    var topNames = scored.slice(0, 15).map(function (t) { return t.canonical_topic; });
    for (var i = 0; i < scored.length; i++) {
      var kgBoost = computeKGBoost(scored[i], kgTriples, topNames);
      scored[i]._kgBoost = kgBoost;
      scored[i]._score += kgBoost;
    }
    scored.sort(function (a, b) { return b._score - a._score; });

    // Step 4: User adjustments (exclusions)
    var adjusted = applyUserAdjustments(scored, userAdjustments);

    // Step 5: Portfolio quota enforcement
    return enforceQuotas(adjusted, quotas);
  }

  // --- Slot template analysis ---

  function analyzeSlots(slotTemplate, topics) {
    return slotTemplate.map(function (slot) {
      var matched = topics.filter(function (t) {
        var sys = t.system.toLowerCase();
        return slot.systems.some(function (s) {
          return sys.indexOf(s.toLowerCase()) !== -1;
        });
      });
      return Object.assign({}, slot, { matchedTopics: matched });
    });
  }

  // --- System grouping ---

  function groupBySystems(topics) {
    var groups = {};
    for (var i = 0; i < topics.length; i++) {
      var sys = topics[i].system.split('/')[0].trim();
      if (!groups[sys]) groups[sys] = [];
      groups[sys].push(topics[i]);
    }
    // Sort groups by count descending
    var sorted = Object.keys(groups).sort(function (a, b) {
      return groups[b].length - groups[a].length;
    });
    return sorted.map(function (key) {
      return { system: key, topics: groups[key] };
    });
  }

  // Public API
  return {
    rank: rank,
    analyzeSlots: analyzeSlots,
    groupBySystems: groupBySystems
  };
})();
