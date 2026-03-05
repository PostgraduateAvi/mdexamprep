# Homepage-as-Predictor Rebuild Spec

**Author**: Cowork (Session 5 — Mar 5, 2026)
**Executor**: Claude Code
**Purpose**: Merge landing page + predictor into a single page. The homepage IS the product. Upload zone front and center. Apple-level simplicity.

---

## Design Direction

**Aesthetic**: "Quiet authority" — generous whitespace, one clear action, the product speaks for itself. Think Apple product page: no clutter, no feature lists, no proof sections. The upload zone IS the pitch.

**Credit**: "Built by Avinash Jothish" — this is a solo effort, not a team project. Use the creator's name everywhere previously said "MD candidates" or "students."

**Narrative shift**: From "look what we discovered" → "upload your papers, get your ranked list." The user is the subject. The platform adapts to ANY medicine college's papers.

---

## Architecture Change

### Before (Session 4):
```
index.html → 3 feature cards → predictor/index.html (ranked list)
                              → practicals/index.html (hub)
                              → theory/ (coming soon)
```

### After (Session 5):
```
index.html = THE PREDICTOR (upload zone + results render here)
  └── Nav dropdown "Tools ▾" → practicals/index.html
                              → theory/index.html (coming soon)
predictor/index.html → redirect to index.html (backward compat)
```

The homepage IS the predictor. No separate predictor page. Practicals and Theory are accessible from a nav dropdown but do not compete with the core action.

---

## File Changes Summary

| File | Action | Owner |
|---|---|---|
| `website/index.html` | **REWRITE** (~100 lines) | Claude Code |
| `website/assets/css/core.css` | **REWRITE** (~300 lines) | Claude Code |
| `website/assets/js/upload-parser.js` | **CREATE** (new file) | Claude Code |
| `website/predictor/predictor-ui.js` | **REWRITE** for homepage context | Claude Code |
| `website/predictor/predictor.css` | **REWRITE** for homepage context | Claude Code |
| `website/predictor/index.html` | **REPLACE** with redirect | Claude Code |
| `website/assets/js/template.js` | **MODIFY** (nav dropdown) | Claude Code |

### DO NOT TOUCH:
- `website/assets/js/predictor-engine.js` (234 lines, LOCKED)
- `website/practicals/clinical-atlas.js` (710 lines, LOCKED)
- `website/practicals/viva-forge.js` (486 lines, LOCKED)
- `website/practicals/data/*.json` (6 files, LOCKED)
- `website/predictor/data/*.json` (all data files — READ ONLY)
- `website/practicals/index.html` (hub page — unchanged)
- `website/practicals/practicals.css` (unchanged)
- `website/practicals/clinical-atlas.html` (unchanged)
- `website/practicals/viva-forge.html` (unchanged)

---

## 1. `website/index.html` — The Homepage

### Structure (top to bottom, every element specified):

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MD Exam Prep — Know exactly what to study</title>
  <meta name="description" content="Upload your college's past papers. Get ranked preparation priorities. Free, universal, built on 20 years of exam pattern analysis.">
  <link rel="stylesheet" href="assets/css/core.css">
  <link rel="stylesheet" href="predictor/predictor.css">
</head>
<body>

  <!-- Navbar -->
  <header class="navbar">
    <div class="container">
      <a href="index.html" class="site-logo">MD Exam Prep</a>
      <nav class="nav-tools">
        <div class="nav-dropdown">
          <button class="nav-dropdown-btn">Tools <svg ...chevron-down.../></button>
          <div class="nav-dropdown-menu">
            <a href="practicals/index.html">Practical Exam Tools</a>
            <a href="theory/index.html" class="nav-item--disabled">Theory Tools <span class="tag tag-muted">Soon</span></a>
          </div>
        </div>
      </nav>
    </div>
  </header>

  <!-- Hero — one line, maximum impact -->
  <section class="hero">
    <div class="container hero-content">
      <h1>Know exactly what to study.</h1>
      <p class="hero-sub">Upload your college's past papers. The engine finds the patterns examiners follow and ranks what matters most.</p>
    </div>
  </section>

  <!-- Upload Zone — THE core interaction -->
  <section id="upload-section" class="upload-section">
    <div class="container">
      <div id="upload-zone" class="upload-zone">
        <div class="upload-zone-content">
          <svg class="upload-icon" ...upload icon (24x24)... />
          <p class="upload-label">Drop your past papers here</p>
          <p class="upload-hint">PDF or Excel — any college, any subject</p>
          <input type="file" id="file-input" accept=".pdf,.xlsx,.xls,.csv" multiple hidden>
          <button class="btn btn-primary upload-browse-btn" onclick="document.getElementById('file-input').click()">Browse Files</button>
        </div>
      </div>
      <!-- File chips appear here after upload -->
      <div id="file-chips" class="file-chips"></div>
      <!-- Progress bar during parsing -->
      <div id="parse-progress" class="parse-progress" style="display:none;">
        <div class="parse-progress-bar"><div class="parse-progress-fill" id="progress-fill"></div></div>
        <p class="parse-status" id="parse-status">Analyzing papers...</p>
      </div>
      <!-- Demo data link -->
      <p class="demo-link">
        or <a href="#" id="demo-trigger">explore with demo data</a>
        <span class="demo-hint">— 987 questions from Yenepoya University (2006–2025)</span>
      </p>
    </div>
  </section>

  <!-- Results Section (hidden until upload or demo) -->
  <section id="results-section" class="results-section" style="display:none;">
    <div class="container">
      <!-- Controls — IMMEDIATELY above results, no gap -->
      <div class="controls-bar">
        <div class="view-toggles">
          <button class="btn btn-sm view-btn active" data-view="ranked" onclick="PredictorUI.setView('ranked')">Ranked</button>
          <button class="btn btn-sm view-btn" data-view="slots" onclick="PredictorUI.setView('slots')">By Slot</button>
          <button class="btn btn-sm view-btn" data-view="systems" onclick="PredictorUI.setView('systems')">By System</button>
        </div>
        <div id="predictor-stats" class="stats-bar"></div>
      </div>
      <!-- Results header -->
      <p id="results-header" class="results-header"></p>
      <!-- Results grid -->
      <div id="predictor-results" class="results-grid"></div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="site-footer">
    <div class="container">
      <p class="footer-text">Built by Avinash Jothish &middot; Validated on 20 years of real exam data &middot; Free forever</p>
    </div>
  </footer>

  <!-- Scripts -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
  <script src="assets/js/predictor-engine.js"></script>
  <script src="assets/js/upload-parser.js"></script>
  <script src="predictor/predictor-ui.js"></script>
</body>
</html>
```

### Key design notes:
- **NO proof strip, NO method section, NO trust line, NO feature cards grid.** All of that is dead. The product IS the proof.
- **Hero is 2 lines** — heading + one paragraph. That's it.
- **Upload zone is the first interactive element** — large, centered, obvious.
- **"Explore with demo data"** is a text link below the upload zone — clearly secondary.
- **Toggle buttons appear ONLY after results load** — directly above the result cards, zero gap.
- **Footer credits Avinash Jothish by name.**
- **CDN scripts for pdf.js and SheetJS** loaded at bottom of body.

---

## 2. `website/assets/css/core.css` — Streamlined

### REMOVE these class groups entirely (dead after rewrite):
- `.proof-strip`, `.proof-grid`, `.proof-block`, `.proof-number`, `.proof-text`
- `.method`, `.method-steps`, `.method-step`, `.step-label`, `.step-text`
- `.trust-line`, `.trust-line blockquote`, `.trust-line .trust-meta`
- `.features`, `.features-header`, `.features-grid`
- `.feature-card`, `.feature-card--disabled`, `.feature-num`, `.feature-meta`, `.feature-arrow`
- `.landing-stats`, `.landing-stats .stats-row`
- `.hero-badge`

### KEEP these (still used by sub-pages or the new homepage):
- All `:root` variables
- `html`, `body`, heading styles, `a`, `.container`
- `.navbar`, `.site-logo`, `.nav-badge`
- `.hero` (modify: remove `min-height: 85dvh`, reduce to `padding: 80px 0 40px`)
- `.hero-content`, `.hero h1`, `.hero-sub`
- `.hero::before` glow animation (KEEP — signature element)
- `.hero-cta` (may still use on sub-pages)
- `.site-footer`, `.footer-text`
- `.card`, `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-sm`
- `.tag`, `.tag-gold`, `.tag-muted`, `.tag-blue`
- `.back-home`
- `.text-secondary`, `.text-muted`, `.text-accent`
- All responsive media queries (adapt as needed)

### ADD these new classes:

```css
/* ========== NAV DROPDOWN ========== */
.nav-tools {
  display: flex;
  align-items: center;
}

.nav-dropdown {
  position: relative;
}

.nav-dropdown-btn {
  background: none;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-family: 'DM Sans', sans-serif;
  font-size: 0.875rem;
  padding: 6px 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: border-color 150ms ease, color 150ms ease;
}
.nav-dropdown-btn:hover {
  border-color: var(--border-accent);
  color: var(--text-primary);
}
.nav-dropdown-btn svg {
  width: 14px;
  height: 14px;
  transition: transform 150ms ease;
}
.nav-dropdown.open .nav-dropdown-btn svg {
  transform: rotate(180deg);
}

.nav-dropdown-menu {
  display: none;
  position: absolute;
  right: 0;
  top: calc(100% + 8px);
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 8px;
  min-width: 200px;
  z-index: 100;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}
.nav-dropdown.open .nav-dropdown-menu {
  display: block;
}

.nav-dropdown-menu a {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  color: var(--text-primary);
  transition: background 150ms ease;
}
.nav-dropdown-menu a:hover {
  background: var(--bg-elevated);
  color: var(--accent);
}

.nav-item--disabled {
  opacity: 0.45;
  pointer-events: none;
}

/* ========== UPLOAD ZONE ========== */
.upload-section {
  padding: 0 0 40px;
}

.upload-zone {
  border: 2px dashed var(--border-accent);
  border-radius: var(--radius-lg);
  padding: 48px 24px;
  text-align: center;
  transition: border-color 250ms ease, background 250ms ease;
  cursor: pointer;
  position: relative;
}
.upload-zone:hover,
.upload-zone.drag-over {
  border-color: var(--accent);
  background: var(--accent-glow);
}
.upload-zone.drag-over {
  border-style: solid;
}

.upload-zone-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.upload-icon {
  width: 32px;
  height: 32px;
  color: var(--accent);
  opacity: 0.7;
}

.upload-label {
  font-family: 'Source Serif 4', serif;
  font-size: 1.125rem;
  font-weight: 500;
  color: var(--text-primary);
}

.upload-hint {
  font-size: 0.8125rem;
  color: var(--text-muted);
}

.upload-browse-btn {
  margin-top: 8px;
}

/* File chips */
.file-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}
.file-chips:empty {
  display: none;
}

.file-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 100px;
  font-size: 0.8125rem;
  color: var(--text-secondary);
}
.file-chip .remove-file {
  cursor: pointer;
  color: var(--text-muted);
  font-size: 1rem;
  line-height: 1;
  transition: color 150ms ease;
}
.file-chip .remove-file:hover {
  color: var(--color-warning);
}

/* Parse progress */
.parse-progress {
  margin-top: 24px;
  text-align: center;
}
.parse-progress-bar {
  height: 3px;
  background: var(--bg-elevated);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 12px;
}
.parse-progress-fill {
  height: 100%;
  width: 0%;
  background: linear-gradient(90deg, var(--accent), var(--accent-warm));
  border-radius: 2px;
  transition: width 300ms ease;
}
.parse-status {
  font-size: 0.8125rem;
  color: var(--text-secondary);
}

/* Demo link */
.demo-link {
  text-align: center;
  margin-top: 20px;
  font-size: 0.875rem;
  color: var(--text-muted);
}
.demo-link a {
  color: var(--accent);
  text-decoration: underline;
  text-underline-offset: 2px;
}
.demo-hint {
  font-size: 0.75rem;
  color: var(--text-muted);
}

/* ========== RESULTS SECTION ========== */
.results-section {
  padding: 40px 0 80px;
  border-top: 1px solid var(--border);
}

/* Change papers link (replaces upload zone after results) */
.change-papers {
  text-align: center;
  margin-bottom: 24px;
  font-size: 0.8125rem;
}
.change-papers a {
  color: var(--text-secondary);
}
.change-papers a:hover {
  color: var(--accent);
}
```

### MODIFY `.hero`:
```css
/* Change from current: */
.hero {
  min-height: 85dvh;  /* REMOVE — too much whitespace */
  padding: 80px 0 60px;
}

/* To: */
.hero {
  padding: 80px 0 40px;
  position: relative;
  overflow: hidden;
}
```

Keep the `::before` glow animation — it's the signature.

### Responsive updates:
```css
@media (max-width: 639px) {
  .hero { padding: 48px 0 24px; }
  .upload-zone { padding: 32px 16px; }
  .nav-dropdown-menu { right: -20px; min-width: 180px; }
}
```

---

## 3. `website/assets/js/upload-parser.js` — NEW FILE

Create this file following the parsing logic from `UPLOAD_PARSER_SPEC.md` (read that file for exact column formats, matching algorithm, and output shape).

### Key requirements:
- Uses `pdfjsLib` (loaded from CDN) for PDF text extraction
- Uses `XLSX` (loaded from CDN) for Excel parsing
- Loads `topic-dictionary.json`, `system-keywords.json`, `medical-synonyms.json` via fetch()
- Exposes `UploadParser.parse(files)` which returns a Promise resolving to an array matching `ranked-list.json` shape
- Data path: `predictor/data/` (relative to the homepage)

### Exposed API:
```javascript
var UploadParser = (function() {
  'use strict';

  var dictData = null;  // topic-dictionary.json
  var sysKeys = null;   // system-keywords.json
  var synonyms = null;  // medical-synonyms.json

  function loadDictionaries() { /* fetch all 3 JSONs */ }

  function parseExcel(arrayBuffer) { /* XLSX → questions array */ }
  function parsePDF(arrayBuffer) { /* pdf.js → questions array */ }

  function extractTopicKeywords(questionText) { /* strip boilerplate, return topic strings */ }
  function matchTopic(topicString) { /* exact substring → keyword overlap → synonym expand */ }

  function parse(files) {
    // Returns Promise<Array> in ranked-list.json shape
    // 1. loadDictionaries() if not cached
    // 2. For each file: detect type, parse, extract questions
    // 3. For each question: extract keywords, match to dictionary
    // 4. Aggregate: count frequency per topic, sort, assign ranks
    // 5. Return array matching ranked-list.json shape
  }

  return { parse: parse };
})();
```

### CRITICAL: Output shape must match PredictorEngine.rank() input:
```json
[{
  "rank": 1,
  "canonical_topic": "Aortic Dissection",
  "system": "Cardiology",
  "reason_codes": ["Algorithm↑", "Recency↑"],
  "anchor_pages": [],
  "what_to_memorize": "Matched from uploaded papers — appeared in 3 papers (2020, 2022, 2023)"
}]
```

See `UPLOAD_PARSER_SPEC.md` for complete matching algorithm, Excel format detection, scoring rules, and test expectations.

---

## 4. `website/predictor/predictor-ui.js` — REWRITE

### New state machine (3 states):

```
CHOOSE → user sees upload zone + demo link
PARSING → user sees progress bar + file chips
RESULTS → user sees toggle buttons + ranked list
```

### State transitions:
- **Page load** → CHOOSE state (upload zone visible, results hidden)
- **Files dropped/selected** → PARSING state (upload zone collapses, progress bar appears)
- **Parsing complete** → RESULTS state (progress hides, controls + results appear, scroll to results)
- **"Explore demo data" clicked** → loads existing ranked-list.json data, goes straight to RESULTS
- **"Change papers" clicked** → back to CHOOSE state (clear results, show upload zone)

### Key changes from current version:
- Remove `document.addEventListener('DOMContentLoaded', init)` that auto-loads data
- Add state management: `setState('CHOOSE' | 'PARSING' | 'RESULTS')`
- Demo trigger loads data via existing `loadData()` then calls `recompute()`
- Upload trigger calls `UploadParser.parse(files)` then feeds result to `PredictorEngine.rank()`
- Toggle buttons + stats bar stay exactly as they are (same rendering logic)
- All 3 views (ranked, slots, systems) unchanged
- The "Already studied" toggle per topic stays

### DOM element IDs referenced:
```
#upload-zone          — the drop zone
#file-input           — hidden file input
#file-chips           — container for file name chips
#parse-progress       — progress section
#progress-fill        — the animated bar
#parse-status         — status text
#demo-trigger         — the "explore demo data" link
#upload-section       — the whole upload section
#results-section      — the whole results section
#predictor-results    — results grid
#predictor-stats      — stats bar
#results-header       — header text above results
```

### KEEP all existing rendering functions:
- `renderRankedView(container, results)` — unchanged
- `renderSlotView(container, results)` — unchanged
- `renderSystemView(container, results)` — unchanged
- `renderStats(results)` — unchanged
- `buildRationale(reasonCodes)` — unchanged
- `REASON_NARRATIVES` object — unchanged

### ADD:
- `setState(state)` — shows/hides sections based on state
- `handleFiles(fileList)` — drag-drop and input change handler
- `handleDemoClick()` — loads demo data
- `handleChangePapers()` — resets to CHOOSE state
- File drag-and-drop event listeners on `#upload-zone`
- File input change listener on `#file-input`
- Click listener on `#demo-trigger`
- Nav dropdown toggle (click `.nav-dropdown-btn` toggles `.open` class)

### Scroll behavior:
When transitioning to RESULTS state, smooth-scroll to `#results-section` so the toggle buttons are immediately visible without user scrolling.

---

## 5. `website/predictor/predictor.css` — MODIFY

### REMOVE:
- `.predictor-hero` (hero is now in index.html, styled by core.css)
- `.methodology-card`, `.methodology-content` (methodology is gone)
- `.loading-state`, `.loading-spinner`, `@keyframes spin` (replaced by parse-progress in core.css)

### KEEP:
- `.controls-bar`, `.view-toggles`, `.view-btn`, `.view-btn.active`
- `.stats-bar`, `.stat .mono`
- `.results-grid`
- `.topic-card`, `.topic-card.excluded`, `.topic-header`, `.topic-rank`, `.topic-name`, `.topic-system`
- `.topic-reasons`, `.topic-score-bar`, `.score-fill`
- `.topic-detail`, `.topic-actions`
- `.slot-card`, `.slot-header`, `.slot-number`, `.slot-topics`, `.slot-topic-item`, `.empty-slot`
- `.system-header`, `.system-count`, `.system-topic`
- `.topic-rationale`, `.results-header`
- Responsive section

---

## 6. `website/predictor/index.html` — REDIRECT

Replace entire file with:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0; url=../index.html">
  <title>Redirecting...</title>
</head>
<body>
  <p>Redirecting to <a href="../index.html">MD Exam Prep</a>...</p>
</body>
</html>
```

---

## 7. `website/assets/js/template.js` — MODIFY

Current: 29 lines, injects back-link + footer on sub-pages.

### Changes:
- **Keep** the back-link injection for sub-pages (practicals, theory)
- **Keep** footer injection for sub-pages
- **Add** nav dropdown toggle logic (since it's shared):

```javascript
// Nav dropdown toggle (add to template.js or inline in index.html)
document.addEventListener('click', function(e) {
  var btn = e.target.closest('.nav-dropdown-btn');
  var dropdown = document.querySelector('.nav-dropdown');
  if (btn && dropdown) {
    dropdown.classList.toggle('open');
    e.stopPropagation();
  } else if (dropdown) {
    dropdown.classList.remove('open');
  }
});
```

Actually — since template.js is for sub-pages and the nav dropdown only appears on the homepage, put the dropdown toggle logic in `predictor-ui.js` instead. template.js stays as-is (29 lines).

**REVISED: template.js stays UNCHANGED at 29 lines.**

---

## 8. Theory placeholder

Create `website/theory/index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Theory Tools — MD Exam Prep</title>
  <link rel="stylesheet" href="../assets/css/core.css">
</head>
<body>
  <div id="site-nav"></div>
  <main class="container" style="padding: 80px 0; text-align: center;">
    <h1>Theory Study Tools</h1>
    <p class="text-secondary" style="margin: 16px 0 32px;">4,094 indexed topics. Flashcards. Pathophysiology chains. Coming soon.</p>
    <a href="../index.html" class="btn btn-secondary">Back to Home</a>
  </main>
  <div id="site-footer"></div>
  <script src="../assets/js/template.js"></script>
</body>
</html>
```

---

## Verification Checklist (for Cowork to run after build)

### Landing / Homepage:
- [ ] Page loads with upload zone visible, no ranked list on first load
- [ ] "Avinash Jothish" appears in footer
- [ ] No mention of "MD candidates" or "students" as builders
- [ ] Hero heading is "Know exactly what to study."
- [ ] Upload zone accepts drag-and-drop
- [ ] Upload zone has "Browse Files" button
- [ ] "Explore with demo data" link visible below upload zone
- [ ] Clicking demo link loads ranked list
- [ ] Toggle buttons (Ranked / By Slot / By System) appear directly above results
- [ ] No scrolling needed to reach toggles after results load
- [ ] Nav dropdown shows "Tools" with Practicals + Theory links
- [ ] Theory link is dimmed with "Soon" tag
- [ ] No proof strip, no method section, no trust line, no feature cards
- [ ] Glow animation on hero still works

### Upload flow:
- [ ] Dropping an Excel file triggers parsing
- [ ] File chip appears showing filename
- [ ] Progress bar animates during parsing
- [ ] Results appear after parsing completes
- [ ] "Change papers" link visible in results state

### Predictor results (unchanged logic):
- [ ] 3 views work: Ranked, By Slot, By System
- [ ] "Already studied" toggle works
- [ ] Rationale lines appear per topic
- [ ] Stats bar shows topic count + system count

### Sub-pages:
- [ ] practicals/index.html still works (back-link to home)
- [ ] predictor/index.html redirects to homepage
- [ ] theory/index.html shows "Coming soon" placeholder

### Locked file integrity:
- [ ] predictor-engine.js: 234 lines
- [ ] clinical-atlas.js: 710 lines
- [ ] viva-forge.js: 486 lines

### Console:
- [ ] Zero errors on homepage
- [ ] Zero errors on practicals
- [ ] Zero errors during upload flow

---

## Cold Start Instructions for Claude Code

Paste this as your first message in a fresh Claude Code session:

```
Read these files IN ORDER before doing anything:

1. CLAUDE.md (project memory)
2. CO_BUILD_PIPELINE.md (coordination protocol)
3. GUARDRAILS.md (role boundaries — Zone A only)
4. HOMEPAGE_PREDICTOR_SPEC.md (THIS IS YOUR BUILD SPEC — execute it)
5. UPLOAD_PARSER_SPEC.md (parsing algorithm details for upload-parser.js)

After reading all five, confirm:
- You understand the homepage IS the predictor (no separate predictor page)
- You will credit "Avinash Jothish" (not "MD candidates")
- You will NOT touch locked files
- You will create upload-parser.js as a new file
- You will rewrite index.html, core.css, predictor-ui.js, predictor.css
- You will create theory/index.html placeholder
- You will redirect predictor/index.html to homepage

Then build. Start with index.html, then core.css, then upload-parser.js, then predictor-ui.js, then predictor.css, then the redirect + theory placeholder.

CRITICAL RULES:
- You ONLY write to website/ (Zone A)
- You NEVER touch _deploy/, _audit/, spec docs, CLAUDE.md
- LOCKED: predictor-engine.js (234), clinical-atlas.js (710), viva-forge.js (486)
- LOCKED: ALL JSON data files in predictor/data/ and practicals/data/
- Before starting, run: wc -l website/index.html website/assets/css/core.css website/assets/js/template.js website/assets/js/predictor-engine.js website/predictor/predictor-ui.js website/predictor/predictor.css website/practicals/clinical-atlas.js website/practicals/viva-forge.js
- template.js stays at 29 lines — DO NOT MODIFY
```
