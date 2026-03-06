# MD Exam Prep Website -- Project Root

## Status: LIVE (Mar 6, 2026 -- Simplified, deployed to Vercel)

**Built by Avinash Jothish.** Free. Static HTML/JS. No framework. Client-side only.

---

## Architecture (post-simplification, Session 15)

Single CSS file (`style.css`, 290 lines). System-ui font. No glassmorphism, no animations, no Google Fonts.

**Landing** (`index.html`, 47 lines) -- 3 feature cards linking to Predictor, Practicals, Theory.

**Predictor** (`predictor/index.html`) -- CHOOSE / PARSING / RESULTS states.
- Input: paste text or upload files (PDF.js + SheetJS).
- Engine: reason-code weighting + KG boost + portfolio quota. 38 of 44 topics pass.
- Three views: Ranked / By Slot / By System. Already-studied toggle.
- Demo link on CHOOSE page (no auto-demo, no page loader).

**Practicals** (`practicals/index.html`) -- single-page case browser.
- 5 system buttons (Cardiac, Respiratory, Neuro, GI, General), 21 cases total.
- Cases rendered as `<details>` accordions with presentation, exam technique, findings, diagnosis, management.

**Theory** (`theory/index.html`) -- two sections on one page:
1. Flashcards: 198 cards, filter by system, click to reveal answers (no quiz mode).
2. Study Tools: 23 tools listed inline from `catalog.json`.

---

## Directory Structure

```
MDExamPrep/
+-- _source/                  (gitignored -- raw inputs, build scripts, audit)
|   +-- predictor/            (excel papers, intermediate data, methodology, scripts)
|   +-- practicals/           (ECG images, viva audio, build scripts, templates)
|   +-- theory/               (flashcard sources, Harrison's ref, taxonomy)
|   +-- audit/                (screenshots, reports)
+-- website/                  (THE DEPLOYED SITE -- git-tracked)
|   +-- index.html, style.css, favicon.svg, robots.txt, sitemap.xml
|   +-- assets/js/            (template.js, predictor-engine.js)
|   +-- practicals/           (index.html, practicals.js, data/*.json)
|   +-- predictor/            (index.html, predictor-ui.js, upload-parser.js, data/*.json)
|   +-- theory/               (index.html, theory.js, data/*.json, tools/**)
+-- CLAUDE.md, README.md, vercel.json, .gitignore, .gitattributes
```

---

## LOCKED FILES

| File | Lines | Purpose |
|------|-------|---------|
| `website/assets/js/predictor-engine.js` | 234 | Ranking engine (IIFE, no DOM) |
| All JSON in `website/predictor/data/` | -- | Predictor data pipeline |
| All JSON in `website/practicals/data/` | 812 KB | Practicals case data |
| All 23 HTML files in `website/theory/tools/` | -- | Standalone study tools |

---

## Build Rules

1. **Static HTML/JS only** -- no frameworks, no build tools, no server
2. **Client-side only** -- all processing in browser
3. **Free forever** -- no paywall, no login
4. **Single CSS** -- all styles in `style.css`, no per-page CSS files
5. **`system-ui` font** -- no Google Fonts, no font loading
6. **Data loading**: `fetch()` parallel, JSON files in `/data/` directories
7. **Template injection**: `template.js` adds nav + footer to sub-pages

---

## Deployment

- **Live URL**: https://mdexamprep.vercel.app/
- **GitHub**: https://github.com/PostgraduateAvi/mdexamprep (public, `main` branch)
- **Auto-deploy**: `git push origin main` -> Vercel builds ~30s -> live
- **Security headers**: CSP (script-src self + cdnjs), X-Frame-Options DENY, nosniff
- **Cache**: Assets 30d immutable, data JSON 1d with SWR

---

## Session History

| Session | Date | Deliverable |
|---------|------|-------------|
| 1-13 | Mar 4-5 | Full build: data pipeline, predictor, practicals, theory, landing, deploy, audit |
| 14 | Mar 6 | Deployment sync |
| 15 | Mar 6 | Complete simplification: 4 clean pages, single CSS, ~7,900 lines deleted |
| 16 | Mar 6 | Directory reorganization: _source/ consolidation, orphan cleanup, ~14.5 MB reclaimed |

---

## Common Pitfalls

- **EEXIST errors**: Write/Edit tools fail on project dir. Workaround: write .py to home dir, run with Python.
- **Heredoc + apostrophes**: Use .py workaround instead.
- **Windows Python**: `/c/Users/AVINASH/AppData/Local/Programs/Python/Python312/python`
