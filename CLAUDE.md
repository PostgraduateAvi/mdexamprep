# MBBEasy (formerly MD Exam Prep) -- Project Root

## Status: LIVE (Mar 6, 2026 -- Rebranded to MBBEasy)

**Brand**: MBBEasy — "Clinical medicine, decoded."
**Built by Avinash Jothish.** Free. Static HTML/JS. No framework. Client-side only.

---

## Architecture (post-PWA-upgrade, Session 18)

Single CSS file (`style.css`, ~510 lines). "Warm Authority" design system. Self-hosted fonts (DM Sans body + Source Serif 4 headings, ~185KB WOFF2 in `/assets/fonts/`). Sticky glass nav, amber clinical pearls, stagger card animations. PWA with offline support (service worker + manifest). OG meta tags for social sharing.

**Landing** (`index.html`, ~54 lines) -- Hero with eyebrow + 3 numbered tool cards with stagger animation.

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
|   +-- index.html, style.css, favicon.svg, robots.txt, sitemap.xml, manifest.json, sw.js, og-image.png
|   +-- assets/js/            (template.js, predictor-engine.js)
|   +-- assets/fonts/         (DMSans-Variable.woff2, SourceSerif4-Variable.woff2)
|   +-- assets/icons/         (icon-192.png, icon-512.png)
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
5. **Self-hosted fonts** -- DM Sans (body) + Source Serif 4 (headings) in `/assets/fonts/`, no CDN
6. **Data loading**: `fetch()` parallel, JSON files in `/data/` directories
7. **Template injection**: `template.js` adds nav + footer to sub-pages

---

## Deployment

- **Live URL**: https://mdexamprep.vercel.app/
- **GitHub**: https://github.com/PostgraduateAvi/mdexamprep (public, `main` branch)
- **Auto-deploy**: `git push origin main` -> Vercel builds ~30s -> live
- **Security headers**: CSP (script-src self + cdnjs, font-src self), X-Frame-Options DENY, nosniff
- **Cache**: Fonts 30d immutable, data JSON 1d+SWR, JS 1h+SWR, sw.js no-cache, manifest 1d
- **PWA**: Service worker (precache shell, SWR data, network-first HTML), installable manifest
- **OG tags**: All 4 pages have og:title/description/image + twitter:card for social previews

---

## Session History

| Session | Date | Deliverable |
|---------|------|-------------|
| 1-13 | Mar 4-5 | Full build: data pipeline, predictor, practicals, theory, landing, deploy, audit |
| 14 | Mar 6 | Deployment sync |
| 15 | Mar 6 | Complete simplification: 4 clean pages, single CSS, ~7,900 lines deleted |
| 16 | Mar 6 | Directory reorganization: _source/ consolidation, orphan cleanup, ~14.5 MB reclaimed |
| 17 | Mar 6 | "Warm Authority" design upgrade: self-hosted fonts, glass nav, amber pearls, card animations |
| 18 | Mar 6 | PWA (service worker + manifest + icons), OG meta tags, granular Vercel cache headers |
| 20 | Mar 6 | Rebrand: MD Exam Prep → MBBEasy (all copy, meta, manifest, OG image, SW cache bump) |

---

## Common Pitfalls

- **EEXIST errors**: Write/Edit tools fail on project dir. Workaround: write .py to home dir, run with Python.
- **Heredoc + apostrophes**: Use .py workaround instead.
- **Windows Python**: `/c/Users/AVINASH/AppData/Local/Programs/Python/Python312/python`
