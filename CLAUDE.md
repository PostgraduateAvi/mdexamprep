# MD Exam Prep Website -- Project Root

## Status: LIVE (Mar 5, 2026 -- Sessions 1-13 complete, deployed to Vercel)

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

**Practicals** (`practicals/`) -- 2 tools live:
- Clinical Atlas: 21 cases, 4 modes (Atlas/Cross-Ref/Viva Drill/Quick Audit)
- Viva Forge: 16 cases, 110 questions, 3 modes (Practice/Stress/Dialogue)
- Placeholder cards stripped in Session 10

**Theory** (`theory/index.html`) -- 198 flashcards across 11 systems. Browse mode (grouped by system, accordion) + Quiz mode (single card, shuffle). Filter by system + difficulty. Data: `theory/data/flashcards.json`. Built in Session 7.
- Interactive Study Tools link card on theory page -> `theory/tools/index.html` (23 tools, `catalog.json`)

**Universal platform** -- engine works for ANY medicine college papers. Demo dataset (987 questions) = proof-of-concept.

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
  -> Sticky topbar: "Demo dataset -- 38 predicted topics"
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

### Root Config
```
.gitignore              31 lines  -- git exclusions (root-anchored paths)
.gitattributes           1 line   -- LF line endings (text=auto eol=lf)
README.md              149 lines  -- GitHub search-optimized project description
vercel.json             64 lines  -- Vercel deployment config + cache/security headers
```

### SEO
```
website/sitemap.xml              33 lines  -- XML sitemap for search engines
website/robots.txt                4 lines  -- crawl guidance + sitemap directive
website/favicon.svg              10 lines  -- teal crosshair on navy circle
```

### Landing
```
website/index.html              577 lines  -- Codex Futurism landing (glassmorphic header, SVG cards, OG meta, skip-nav)
website/assets/css/core.css     520 lines  -- shared styles (navy/teal palette, Plus Jakarta Sans, focus-visible)
website/assets/js/template.js    29 lines  -- sub-page back-link + footer
```

### Predictor
```
website/predictor/index.html      95 lines  -- page loader, upload invite, tab UI, OG meta, aria-live
website/predictor/predictor-ui.js 456 lines -- demo loader, card animation, tab wiring, error handling, URL param
website/predictor/predictor.css   532 lines -- page loader, upload invite, tab + textarea styles, reduced motion
website/predictor/upload-parser.js 306 lines -- PDF.js + SheetJS client-side parser
```

### Predictor Data (5 JSON files in website/predictor/data/)
```
ranked-list.json        16 KB  -- 44 topics, reason codes, scores
kg-triples.json          2 KB  -- knowledge-graph triples for boost
portfolio-quotas.json    <1 KB -- portfolio quota rules (max-per-system)
slot-template.json       1 KB  -- exam slot metadata
topic-dictionary.json  142 KB  -- 1,718 entries for upload matching (PRIMARY)
medical-synonyms.json    1 KB  -- 32 synonym pairs
system-keywords.json     2 KB  -- fallback system classifier
```
Note: `taxonomy-lite.json` and `test-fixture.json` deleted in Session 13 audit.
Note: `flashcards_clean.json` deleted in Session 9 (stale intermediate file).

### Theory
```
website/theory/index.html         110 lines  -- flashcards page + tools link card (OG meta, canonical)
website/theory/theory.css         369 lines  -- flashcard/quiz styles
website/theory/theory.js          398 lines  -- browse/quiz logic, Fisher-Yates shuffle
website/theory/tools/index.html   345 lines  -- interactive study tools hub (23 tools)
website/theory/tools/             24 HTML files -- standalone study tools (5 categories)
```

### Theory Data
```
website/theory/data/flashcards.json   -- 198 flashcards across 11 systems
website/theory/data/catalog.json      -- 23 interactive study tools manifest
```

### Practicals
```
website/practicals/index.html         168 lines -- hub with 2 live tool cards
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
- Use `topic-dictionary.json` (1,718 entries, 77.4%) as the primary topic matcher

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
| 8 | Mar 5 | Deployment: git init, GitHub repo (PostgraduateAvi/mdexamprep), Vercel production, cache headers |
| 9 | Mar 5 | Privacy cleanup: removed all institution references, deleted stale flashcards_clean.json |
| 10 | Mar 5 | Landing redesign (navy/teal), practicals cleanup, theory tools wiring, font unification, README + GitHub SEO |
| 11 | Mar 5 | Codex Futurism design polish: glassmorphic landing, SVG illustrations, restyled sub-pages |
| 12 | Mar 5 | Design rewrite: gradient tool cards, glassmorphic sub-page headers, PNG illustrations |
| 13 | Mar 5 | Full audit: stale file cleanup, security headers (CSP), SEO (sitemap/robots/favicon/OG), accessibility, error handling |
| 14 | Mar 6 | Deployment sync: committed CLAUDE.md Session 14 note, pushed c44d9c4 to origin main -- Vercel live |

---

## Known Issues and Next Steps

### Data quality
- Theory taxonomy: 62.5% (2,558 of 4,094) still classified as "General/Other" -- reclassification moved 1,536 topics but 2,558 remain
- Flashcards: DONE -- 198 cards (cleaned from 310, duplicates + low-quality removed)
- Only 2 practical tools built (placeholder cards removed Session 10)

### Completed (Session 7)
- Theory section: BUILT -- 310 flashcards, browse/quiz modes, 11 systems, 3 difficulty levels
- Trust line: FIXED -- "Built by Avinash Jothish" in blockquote + footer
- Landing theory card: LIVE -- links to `theory/index.html` with arrow

### Completed (Session 8)
- Deployment: LIVE at https://mdexamprep.vercel.app/
- Git: GitHub repo at https://github.com/PostgraduateAvi/mdexamprep
- Auto-deploy: `git push origin main` -> Vercel builds ~30s -> live
- Cache headers: 3-tier (assets 30d, data 1d, theory 1h)

### Completed (Session 9)
- Privacy: all institution-specific references removed from 3 files (6 edits)
- Cleanup: flashcards_clean.json deleted (stale intermediate file)
- Theory data: 198 flashcards (down from 310, cleanup committed prior to Session 9)
- Cache bump: theory data can now go 1h -> 1d (flashcards finalized)

### Completed (Session 10)
- Landing page redesign: Dark warm gold -> Clinical Tech navy/teal (#0A2540 + #00D4FF)
- Typography: DM Sans + Source Serif 4 -> Plus Jakarta Sans (all pages, shared CSS)
- Practicals: 6 placeholder tool cards stripped from hub page
- Theory tools: manifest renamed to catalog.json, fetch path fixed in tools/index.html
- Theory: Interactive Study Tools link card on theory/index.html
- .gitattributes: LF line endings enforced
- Feature cards: bento-box hover (translateY -4px, teal glow, top-accent border)
- Micro-badges added to feature cards (44 topics, 21 cases, 198 flashcards)
- README.md: GitHub search-optimized (149 lines, keyword-rich for MD Internal Medicine domain)
- GitHub repo: description + 10 topic tags set for search discoverability

### Completed (Session 13 -- Audit)
- Stale files deleted: taxonomy-lite.json, test-fixture.json, DEPLOY_HANDOFF.md, SESSION_10_HANDOFF.md, docs/ directory, website/toolbox/, PLAN.md
- Security: CSP header, X-Content-Type-Options, X-Frame-Options, Referrer-Policy in vercel.json
- SEO: sitemap.xml, robots.txt, favicon.svg, OG/Twitter meta tags, canonical URLs on all 4 main pages
- Accessibility: skip-nav link, aria-hidden on decorative SVGs, aria-live on status regions, focus-visible styles, contrast fixes on sepia text
- Error handling: .catch() on both Promise.all chains in predictor-ui.js
- Cache: theory data bumped 1h to 1d (flashcards finalized)
- CDN scripts: crossorigin="anonymous" on PDF.js and SheetJS

### Deferred work
- Additional practical tools (examination-guide, OSCE-suite, ECG-mastery, xray, neuro-trainer, specialty-reference)
- Theory enhancements: taxonomy browser, Harrison chapter mapping
- Mobile optimization pass
- Cache bump: theory data 1h -> 1d (flashcards now finalized -- ready to apply)

---

## Technical Notes

### CSS Variables (Clinical Tech theme)
```
--bg-deep: #0A2540 (Deep Navy)    --accent: #00D4FF (Clinical Teal)
--bg-surface: #0D2E4D             --accent-warm: #33DFFF
--bg-card: #122F4D                 --text-primary: #FFFFFF
--bg-elevated: #163554             --text-secondary: #8BA3BE
Typography: Plus Jakarta Sans (body+headings) + JetBrains Mono (stats/code)
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

### Deployment Architecture (Session 8)
- **Live URL**: https://mdexamprep.vercel.app/
- **GitHub**: https://github.com/PostgraduateAvi/mdexamprep (public, `main` branch)
- **Vercel config**: `vercel.json` at root, `outputDirectory: "website"` serves only `website/`
- **Cache tiers**: Assets `max-age=2592000,immutable` (30d), predictor/practicals data `max-age=86400,SWR=604800` (1d), theory data `max-age=86400,SWR=604800` (1d)
- **Security headers**: CSP (script-src self + cdnjs), X-Frame-Options DENY, nosniff, strict-origin referrer
- **Update workflow**: edit `website/` -> `git commit` -> `git push` -> live in ~30s
- **Rollback**: `git revert` -> push
- **Tools**: `gh` CLI (authenticated as PostgraduateAvi), Vercel CLI v50.27.1 (authenticated as postgraduateavi)
- **`_deploy/` is retired** — Vercel auto-deploys from `website/` on push. Git provides rollback.

### New Files (Session 8)
```
.gitignore     31 lines  -- root-anchored exclusions for source data, .claude/, audit, PNGs, .py
vercel.json    31 lines  -- outputDirectory: website, cleanUrls, 3-tier cache headers
.vercel/       --        -- Vercel project link (auto-generated, gitignored)
```

### Common Pitfalls (from Sessions 4-5+)
- **EEXIST errors**: Write/Edit tools fail on the project directory. Root cause unclear (possibly filesystem watcher or Cowork). Workaround: write a `.py` script to `C:\Users\AVINASH\` (home dir, not affected), run it with Python to do file I/O into the project dir, then delete the script.
- **`/tmp` is virtual**: The Write tool's `/tmp` path does NOT map to the real Windows temp dir. Files written there are invisible to Python. Always use `C:\Users\AVINASH\` as the staging location for workaround scripts.
- **Heredoc + apostrophes**: Bash heredoc (even with quoted delimiter) breaks on content containing apostrophes or nested quotes. Always use the .py file workaround instead.
- **Reason codes**: 14 codes used: Algorithm, Balance, Bridge, ConfusablePair, CoreFloor, Dose, Foil, FormatPattern, Foundation, ILD-Link, Manual, ProgramUpdate, Recency, Sleeper (all with up-arrow suffix).
- **CSS class collisions**: Use prefixed names (e.g., `.landing-stats` not `.stats-bar`)
- **Flash of wrong state**: Hide all states explicitly at start of demo flow
- **Page-loader leak**: Clean up loader classes in error handler
- **Always verify after writing**: CLAUDE.md was silently truncated to 28 lines after a failed write. Run `wc -l` after any file operation to confirm.
- **`.gitignore` path anchoring**: Use `/predictor/` (leading slash) to anchor to repo root. Without it, `predictor/` matches `website/predictor/` too — breaks deployment.
