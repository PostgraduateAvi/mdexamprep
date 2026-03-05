/* MD Exam Prep — Upload Parser
   Client-side PDF/Excel parsing + topic matching.
   Depends on: pdf.js (CDN), SheetJS (CDN) */

var UploadParser = (function () {
  'use strict';

  var BOILERPLATE_PREFIX = /^(?:discuss|describe|classify|enumerate|define|what\s+are|how\s+will\s+you|list\s+the|write\s+(?:a\s+)?(?:short\s+)?note\s+on|short\s+note\s+on|explain|outline|mention)\s+/i;
  var BOILERPLATE_SUFFIX = /\s+(?:discuss|describe\s+its\s+management|with\s+management|and\s+treatment|in\s+detail|in\s+brief|briefly)\.?$/i;
  var MARKS_PATTERN = /\s*\(?\d+\s*(?:marks?|M)\)?|\s*\(\d+\+\d+\)/gi;
  var QUESTION_NUM = /^(?:Q?\d+[\.\)\:]|[ivxlc]+[\.\)]|[a-f][\.\)])\s*/i;
  var YEAR_RE = /20\d{2}/;
  var MIN_Q_LEN = 5;
  var JACCARD_THRESHOLD = 0.3;

  var STOPWORDS = {};
  'the of and in a an to is for with on by its it as at or are be from that this was were has have had not but which their they them what how can will may should would could all each both most some any into over after before between through during about than very also been being those these other only such when where while under above below against without'
    .split(' ').forEach(function (w) { STOPWORDS[w] = 1; });

  // --- File orchestrator ---

  function parseFiles(files, onProgress) {
    var fileArr = [];
    for (var i = 0; i < files.length; i++) fileArr.push(files[i]);
    var allQuestions = [];
    var idx = 0;

    function next() {
      if (idx >= fileArr.length) return Promise.resolve(allQuestions);
      var file = fileArr[idx];
      var ext = file.name.split('.').pop().toLowerCase();
      var p;

      if (ext === 'pdf') {
        p = parsePDF(file, function (pct) {
          if (onProgress) onProgress('Reading files...', file.name, 10 + Math.round(40 * (idx + pct / 100) / fileArr.length));
        });
      } else if (ext === 'xlsx' || ext === 'xls') {
        p = parseExcel(file);
      } else {
        idx++;
        return next();
      }

      return p.then(function (qs) {
        allQuestions = allQuestions.concat(qs);
        idx++;
        if (onProgress) onProgress('Extracting questions...', idx + ' of ' + fileArr.length + ' files', 10 + Math.round(50 * idx / fileArr.length));
        return next();
      });
    }
    return next();
  }

  // --- PDF parsing ---

  function parsePDF(file, onPageProgress) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onerror = function () { reject(new Error('Could not read: ' + file.name)); };
      reader.onload = function () {
        if (typeof pdfjsLib === 'undefined') {
          reject(new Error('PDF.js not loaded. Check your connection.'));
          return;
        }
        pdfjsLib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        var typedArray = new Uint8Array(reader.result);
        pdfjsLib.getDocument(typedArray).promise.then(function (pdf) {
          var pages = [];
          var total = pdf.numPages;
          function getPage(n) {
            if (n > total) {
              resolve(questionsFromText(pages.join('\n'), file.name));
              return;
            }
            pdf.getPage(n).then(function (page) {
              page.getTextContent().then(function (content) {
                pages.push(content.items.map(function (it) { return it.str; }).join(' '));
                if (onPageProgress) onPageProgress(Math.round(n / total * 100));
                getPage(n + 1);
              });
            }).catch(function () { getPage(n + 1); });
          }
          getPage(1);
        }).catch(reject);
      };
      reader.readAsArrayBuffer(file);
    });
  }

  function questionsFromText(text, filename) {
    var chunks = text.split(/(?:(?:\n\s*){2,})|(?=Q?\d+[\.\)\:])/i);
    var year = null;
    var ym = filename.match(YEAR_RE);
    if (ym) year = parseInt(ym[0], 10);
    return chunks
      .map(function (c) { return cleanQ(c.trim()); })
      .filter(function (c) { return c.length >= MIN_Q_LEN; })
      .map(function (t) { return { text: t, year: year, subject: null }; });
  }

  // --- Excel parsing ---

  function parseExcel(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onerror = function () { reject(new Error('Could not read: ' + file.name)); };
      reader.onload = function () {
        if (typeof XLSX === 'undefined') {
          reject(new Error('SheetJS not loaded. Check your connection.'));
          return;
        }
        try {
          var wb = XLSX.read(reader.result, { type: 'array' });
          var questions = [];
          wb.SheetNames.forEach(function (name) {
            if (name.toLowerCase() === 'readme') return;
            var rows = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1 });
            if (rows.length < 2) return;
            var headers = (rows[0] || []).map(function (h) { return String(h || '').toLowerCase().trim(); });
            var qCol = detectQCol(headers);
            var yearCol = colIndex(headers, ['year']);
            var subCol = colIndex(headers, ['subject']);
            var sheetYear = extractYear(name) || extractYear(file.name);
            for (var r = 1; r < rows.length; r++) {
              var row = rows[r];
              var raw = qCol >= 0 && row[qCol] ? String(row[qCol]).trim() : '';
              if (raw.length < MIN_Q_LEN) continue;
              questions.push({
                text: cleanQ(raw),
                year: (yearCol >= 0 && row[yearCol]) ? parseInt(row[yearCol], 10) : sheetYear,
                subject: (subCol >= 0 && row[subCol]) ? String(row[subCol]).trim() : null
              });
            }
          });
          resolve(questions);
        } catch (e) {
          reject(new Error('Could not parse: ' + file.name));
        }
      };
      reader.readAsArrayBuffer(file);
    });
  }

  function detectQCol(headers) {
    for (var i = 0; i < headers.length; i++) {
      if (headers[i].indexOf('stem') !== -1) return i;
    }
    for (var i = 0; i < headers.length; i++) {
      if (headers[i].indexOf('question') !== -1) return i;
    }
    return headers.length > 1 ? 1 : 0;
  }

  function colIndex(headers, keywords) {
    for (var i = 0; i < headers.length; i++) {
      for (var k = 0; k < keywords.length; k++) {
        if (headers[i].indexOf(keywords[k]) !== -1) return i;
      }
    }
    return -1;
  }

  function extractYear(str) {
    var m = str.match(YEAR_RE);
    return m ? parseInt(m[0], 10) : null;
  }

  function cleanQ(text) {
    return text
      .replace(MARKS_PATTERN, '')
      .replace(QUESTION_NUM, '')
      .replace(BOILERPLATE_PREFIX, '')
      .replace(BOILERPLATE_SUFFIX, '')
      .trim();
  }

  // --- Topic matching ---

  function tokenize(str) {
    return str.toLowerCase().split(/[\s\-\/\(\)\,\.\;\:]+/).filter(function (w) {
      return w.length > 2 && !STOPWORDS[w];
    });
  }

  function jaccard(a, b) {
    var setA = {};
    a.forEach(function (w) { setA[w] = 1; });
    var inter = 0;
    b.forEach(function (w) { if (setA[w]) inter++; });
    var unionSet = {};
    a.concat(b).forEach(function (w) { unionSet[w] = 1; });
    var union = Object.keys(unionSet).length;
    return union === 0 ? 0 : inter / union;
  }

  function expandSynonyms(text, synonyms) {
    var lower = text.toLowerCase();
    var extra = '';
    for (var abbr in synonyms) {
      if (synonyms.hasOwnProperty(abbr)) {
        if (lower.indexOf(abbr.toLowerCase()) !== -1) {
          extra += ' ' + synonyms[abbr];
        }
      }
    }
    return lower + extra;
  }

  function matchTopics(questions, topicDict, synonyms, systemKeywords) {
    var counts = {};
    for (var q = 0; q < questions.length; q++) {
      var expanded = expandSynonyms(questions[q].text, synonyms || {});
      var tokens = tokenize(expanded);
      var matched = false;

      // Step 1: exact substring
      for (var i = 0; i < topicDict.length; i++) {
        if (expanded.indexOf(topicDict[i].key) !== -1) {
          record(counts, topicDict[i], questions[q].year);
          matched = true;
          break;
        }
      }

      // Step 2: Jaccard
      if (!matched) {
        var bestScore = 0, bestEntry = null;
        for (var i = 0; i < topicDict.length; i++) {
          var entryTokens = tokenize(topicDict[i].key);
          var score = jaccard(tokens, entryTokens);
          if (score > bestScore) { bestScore = score; bestEntry = topicDict[i]; }
        }
        if (bestScore >= JACCARD_THRESHOLD && bestEntry) {
          record(counts, bestEntry, questions[q].year);
          matched = true;
        }
      }

      // Step 3: system-keyword fallback
      if (!matched && systemKeywords) {
        var sys = classifySystem(questions[q].text, systemKeywords);
        if (sys) {
          var label = questions[q].text.substring(0, 60);
          record(counts, { key: label, topic: label, system: sys }, questions[q].year);
        }
      }
    }
    return buildRankedList(counts);
  }

  function record(counts, entry, year) {
    var key = entry.topic;
    if (!counts[key]) counts[key] = { topic: entry.topic, system: entry.system, count: 0, years: [] };
    counts[key].count++;
    if (year && counts[key].years.indexOf(year) === -1) counts[key].years.push(year);
  }

  function classifySystem(text, systemKeywords) {
    var lower = text.toLowerCase();
    var systems = Object.keys(systemKeywords);
    for (var i = 0; i < systems.length; i++) {
      var kws = systemKeywords[systems[i]];
      for (var j = 0; j < kws.length; j++) {
        if (lower.indexOf(kws[j]) !== -1) return systems[i];
      }
    }
    return null;
  }

  function buildRankedList(counts) {
    var entries = [];
    for (var key in counts) {
      if (counts.hasOwnProperty(key)) entries.push(counts[key]);
    }
    entries.sort(function (a, b) {
      if (b.count !== a.count) return b.count - a.count;
      var maxA = a.years.length ? Math.max.apply(null, a.years) : 0;
      var maxB = b.years.length ? Math.max.apply(null, b.years) : 0;
      return maxB - maxA;
    });
    return entries.map(function (e, i) {
      var codes = [];
      var maxYear = e.years.length ? Math.max.apply(null, e.years) : null;
      if (e.count >= 3) { codes.push('Algorithm\u2191'); codes.push('Recency\u2191'); }
      else if (e.count === 2) { codes.push('Algorithm\u2191'); }
      else if (maxYear && maxYear >= 2022) { codes.push('Recency\u2191'); }
      else { codes.push('Foundation\u2191'); }
      var yearStr = e.years.sort().join(', ');
      return {
        rank: i + 1,
        canonical_topic: e.topic,
        system: e.system,
        reason_codes: codes,
        anchor_pages: [],
        what_to_memorize: 'Matched from uploaded papers \u2014 appeared in ' + e.count + ' question(s)' + (yearStr ? ' (' + yearStr + ')' : '')
      };
    });
  }

  return {
    parseFiles: parseFiles,
    matchTopics: matchTopics
  };
})();
