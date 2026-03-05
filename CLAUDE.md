# MD Exam Prep Website -- Project Root

## Status: ACTIVE BUILD (Mar 5, 2026 -- Sessions 1-7 complete)

**Built by Avinash Jothish.** Free. Static HTML/JS. No framework. Client-side only.

---

## Architecture (current, post-Session 7)

**Landing page** (`index.html`) -- narrative arc: anxiety hook, proof strip (987/20/44), method steps, trust line ("Built by Avinash Jothish"), three feature cards (all Live). CTA links to `predictor/index.html?demo=1`.

**Predictor** (`predictor/index.html`) -- three states: CHOOSE / PARSING / RESULTS.
- `?demo=1` URL param skips CHOOSE, shows 38 ranked topics instantly (page loader bar, stagger animation).
- Direct nav (no param) shows CHOOSE state with tabbed input: Paste Text (default) + Upload File.
- Upload zone also appears BELOW results in demo mode (invitation to upload own papers).
- Input methods: text paste (lines -> matchTopics) + file upload (PDF.js + SheetJS). Topic-dictionary matching (1,718 entries, 77.4% match rate).
- Engine: reason-code weighting + KG boost + portfolio quota enforcement. 38 of 44 topics pass.
- Three views: Ranked / By Slot / By System. Already-studied toggle per topic.

**Practicals** (`practicals/`) -- 2 of 8 tools live:
- Clinical Atlas: 21 cases, 4 modes (Atlas/Cross-Ref/Viva Drill/Quick Audit)
- Viva Forge: 16 cases, 110 questions, 3 modes (Practice/Stress/Dialogue)
- 6 tools deferred (examination-guide, OSCE-suite, ECG-mastery, xray, neuro-trainer, specialty-reference)

**Theory** (`theory/index.html`) -- 310 flashcards across 11 systems. Browse mode (grouped by system, accordion) + Quiz mode (single card, shuffle). Filter by system + difficulty. Data: `theory/data/flashcards.json`. Built in Session 7.

**Universal platform** -- engine works for ANY medicine college papers, not locked to Yenepoya. Yenepoya data (987 questions) = demo proof-of-concept.

---

## Core Design Principle

> "Show the output first, ask for input second."

The demo results are one click from the hero -- not behind an upload wall. The upload is for returning users who trust the tool. The demo IS the product demonstration.

---

## Auto-Demo Architecture (Session 5)

Landing page CTA -> `predictor/index.html?demo=1` -> predictor detects `?demo=1` in `init()` -> fires `startDemoWithPageLoader()` -> visitor lands directly in RESULTS with 38 ranked topic cards. The CHOOSE state is never shown for first-time visitors from the landing page.

### Visitor Flow
```
Landing hero -> "Try the Predictor" button
  -> Predictor loads -> slim 2px gold bar fills (400ms)
  -> Results appear -> first 8 cards stagger in (200ms ease, 50ms apart)
  -> Sticky topbar: "Yenepoya University -- 38 predicted topics"
  -> Visitor scrolls, clicks "Already studied" on topics
  -> Below results: upload zone (invitation, not gate)
  -> Drag files -> PARSING -> results replace demo data
```

### CHOOSE state still exists for:
- Direct navigation to `predictor/index.html` (no param)
- "Start Over" after viewing results in upload mode

---

## LOCKED FILES -- DO NOT TOUCH

These files are complete and must not be modified without explicit user instruction:

| File | Lines | Purpose |
|------|-------|---------|
| `website/assets/js/predictor-engine.js` | 234 | Ranking engine (IIFE, no DOM) |
| `website/practicals/clinical-atlas.js` | 710 | Clinical Atlas tool logic |
| `website/practicals/viva-forge.js` | 486 | Viva Forge tool logic |
| All JSON in `website/predictor/data/` | -- | Predictor data pipeline |
| All JSON in `website/practicals/data/` | 812 KB | Practicals case data |

---

## File Inventory (verified Mar 5, 2026)

### Landing
```
website/index.html              130 lines  -- narrative landing page (trust line fix, theory card live)
website/assets/css/core.css     468 lines  -- shared styles
website/assets/js/template.js    29 lines  -- sub-page back-link + footer
```

### Predictor
```
website/predictor/index.html      84 lines  -- page loader, upload invite, tab UI, 3 states
website/predictor/predictor-ui.js 452 lines -- demo loader, card animation, tab wiring, text paste, URL param
website/predictor/predictor.css   532 lines -- page loader, upload invite, tab + textarea styles, reduced motion
website/predictor/upload-parser.js 306 lines -- PDF.js + SheetJS client-side parser
```

### Predictor Data (7 JSON files in website/predictor/data/)
```
ranked-list.json        16 KB  -- 44 topics, reason codes, scores
kg-triples.json          2 KB  -- knowledge-graph triples for boost
portfolio-quotas.json    <1 KB -- portfolio quota rules (max-per-system)
slot-template.json       1 KB  -- exam slot metadata
topic-dictionary.json  142 KB  -- 1,718 entries for upload matching (PRIMARY)
medical-synonyms.json    1 KB  -- 32 synonym pairs
system-keywords.json     2 KB  -- fallback system classifier
```
Note: `taxonomy-lite.json` and `test-fixture.json` removed in Session 7 cleanup (deprecated/unused).

### Practicals
```
website/practicals/index.html         222 lines -- hub with 8 tool cards
website/practicals/practicals.css     562 lines -- shared sidebar/topbar/loading
website/practicals/clinical-atlas.html  61 lines -- shell
website/practicals/clinical-atlas.js   710 lines [LOCKED]
website/practicals/viva-forge.html      60 lines -- shell
website/practicals/viva-forge.js       486 lines [LOCKED]
```

### Practicals Data (6 JSON files, 812 KB in website/practicals/data/)
```
cardiac.json        140 KB -- 6+ CVS cases
respiratory.json    132 KB -- cases + exam technique
neuro.json          130 KB -- 5 cases, 10 exam steps
gi_specialty.json    66 KB -- 3 GI cases
general_cases.json   45 KB -- cross-system
viva_forge_data.json 291 KB -- unified viva from 7 transcripts
```

---

## Build Rules

1. **Static HTML/JS only** -- no frameworks, no build tools, no server
2. **Client-side only** -- all processing happens in the browser
3. **Free forever** -- no paywall, no subscription, no login
4. **Standalone features** -- NO cross-links between predictor, practicals, theory. All paths back to landing.
5. **Two-file pattern** for tools: `tool.html` (shell) + `tool.js` (logic/data)
6. **Data loading**: `fetch()` parallel, JSON files in `/data/` directories
7. **Template injection**: `template.js` adds back-link + footer to sub-pages only, not landing

### Agent Task Sizing
- 1 case extraction: ~15-25K tokens
- 2 cases paired: ~30-40K tokens (sweet spot)
- Template creation: ~25K tokens
- Build script writing: ~30K tokens
- DO NOT use agents for large single-file generation (token limit at ~60%)
- Master files (300+ KB) are too large for agents

### Data Pipeline Rules
- Agents do DATA EXTRACTION to JSON
- Python scripts assemble HTML when needed
- `__DATA__` placeholder pattern for builds
- All case JSON must conform to `practicals/data/schema.json`
- Use `topic-dictionary.json` (1,718 entries, 77.4%) NOT `taxonomy-lite.json` (43%)

---

## Upload Parser Details

4 Excel format variants supported:
- **Simple**: columns A/B (serial, question)
- **Extended**: columns B/C with Stem
- **Combined**: with Year/Subject columns
- **Grand Master**: no serial number

Parser uses `topic-dictionary.json` for matching. Supporting data: `medical-synonyms.json` (32 pairs), `system-keywords.json` (fallback).

---

## Session History

| Session | Date | Deliverable |
|---------|------|-------------|
| 1 | Mar 4 | Data prep -- JSON pipeline, taxonomy analysis |
| 2 | Mar 4 | Predictor engine + UI + template shell |
| 3 | Mar 5 | 2 practical tools (Clinical Atlas + Viva Forge) |
| 4 | Mar 5 | Landing page rewrite + predictor rationale + upload parser |
| 5 | Mar 5 | Show Product First UX -- ?demo=1 auto-load, page loader, upload invite |
| 5+ | Mar 5 | CLAUDE.md rebuild (was broken at 28 lines), temp file cleanup |
| 6 | Mar 5 | Phase 1 redesign: trust line, demo topbar, paste/upload tab UI |
| 7 | Mar 5 | Theory section built (310 flashcards, browse/quiz). Trust line fix. Landing theory card live. |
| 7 | Mar 5 | Theory section (310 flashcards), directory cleanup (CLEANUP_SPEC), trust attribution, pilot deploy prep |

---

## Known Issues and Next Steps

### Data quality
- Theory taxonomy: 62.5% (2,558 of 4,094) still classified as "General/Other" -- reclassification moved 1,536 topics but 2,558 remain
- Flashcards: DONE -- 310 unified cards from 5 sources (92 duplicates removed)
- Only 2 of 8 practical tools built

### Completed (Session 7)
- Theory section: BUILT -- 310 flashcards, browse/quiz modes, 11 systems, 3 difficulty levels
- Trust line: FIXED -- "Built by Avinash Jothish" in blockquote + footer
- Landing theory card: LIVE -- links to `theory/index.html` with arrow

### Deferred work
- 6 practical tools: examination-guide, OSCE-suite, ECG-mastery, xray, neuro-trainer, specialty-reference
- Theory enhancements: taxonomy browser, Harrison chapter mapping
- Mobile optimization pass

---

## Technical Notes

### CSS Variables (dark warm theme)
```
--surface-primary, --surface-elevated, --text-primary, --text-secondary, --accent, --border
--accent-warm (gold spectrum for signature contexts)
```

### Key Patterns
- `dataSource` variable tracks demo vs upload vs paste mode
- Tab UI in CHOOSE state: `#tab-paste` / `#tab-upload` toggle `#pane-paste` / `#pane-upload` visibility
- `startTextParse()` splits pasted text into lines, feeds to `matchTopics()` — reuses upload pipeline
- `results--demo-mode` CSS class on `#state-results` drives conditional upload-invite visibility
- Page loader: `.page-loader--active` (visible) / `.page-loader--done` (fade out)
- `localStorage` for audit state (which cases viewed) + study toggles
- `prefers-reduced-motion: reduce` disables stagger animations
- Theory: `theory-filters` and `theory-quiz-pos` in localStorage for filter/quiz persistence
- Theory: `renderAnswer()` extracts "Clinical Pearl:" text into styled callout divs
- Theory: Fisher-Yates shuffle for quiz mode randomization

### Common Pitfalls (from Sessions 4-5+)
- **EEXIST errors**: Write/Edit tools fail on the project directory. Root cause unclear (possibly filesystem watcher or Cowork). Workaround: write a `.py` script to `C:\Users\AVINASH\` (home dir, not affected), run it with Python to do file I/O into the project dir, then delete the script.
- **`/tmp` is virtual**: The Write tool's `/tmp` path does NOT map to the real Windows temp dir. Files written there are invisible to Python. Always use `C:\Users\AVINASH\` as the staging location for workaround scripts.
- **Heredoc + apostrophes**: Bash heredoc (even with quoted delimiter) breaks on content containing apostrophes or nested quotes. Always use the .py file workaround instead.
- **Reason codes in data differ from spec**: Actual data uses `Algorithm+`, `Bridge+`, `Sleeper+` etc. (14 codes). Spec assumed `high_frequency`, `rising_trend`. Always inspect real data first.
- **CSS class collisions**: Use prefixed names (e.g., `.landing-stats` not `.stats-bar`)
- **Flash of wrong state**: Hide all states explicitly at start of demo flow
- **Page-loader leak**: Clean up loader classes in error handler
- **Always verify after writing**: CLAUDE.md was silently truncated to 28 lines after a failed write. Run `wc -l` after any file operation to confirm.
