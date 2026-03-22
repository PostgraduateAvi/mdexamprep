# MBBEasy (formerly MD Exam Prep) -- Project Root

## Status: LIVE (Mar 23, 2026 -- Session 26: Data-driven learning system restructuring)

**Brand**: MBBEasy — "Clinical medicine, decoded."
**Built by Avinash Jothish.** Free. Static HTML/JS. No framework. Client-side only.

---

## Architecture (Session 26)

Single CSS file (`style.css`). "Warm Indigo" design system (indigo `#818cf8` + violet `#c084fc` accents on warm dark `#0f1117`). Self-hosted fonts (DM Sans body + Source Serif 4 headings, ~185KB WOFF2 in `/assets/fonts/`). Sticky glass nav, amber clinical pearls, stagger card animations. PWA with offline support (service worker v14 + auto-reload on update + manifest). OG meta tags for social sharing. Knowledge graph layer (`graph.json`) connecting topics ↔ tools ↔ related topics + prerequisites. Data-driven learning system: difficulty-stratified MCQs, Bloom's taxonomy tags, yield scoring, cross-linked topics↔MCQs↔flashcards, study path view, 5-bucket spaced repetition.

**Landing** (`index.html`) -- Full-height gradient hero + CTA buttons + 3-column feature grid (SVG icons) + returning-user dashboard + footer CTA band.
- Dashboard: MCQ progress ring, streak counter, flashcards due, suggested next system.
- Only renders for returning users (localStorage keys present).

**Learn** (`learn/index.html`) -- Topic browser + Study Path + inline flashcards + spaced repetition.
- 397 curated topics across 12 systems, yield-scored (72 high, 40 medium, 285 low).
- Two view modes: Browse (grouped by system, expandable cards) and Study Path (topological sort by prerequisites + yield priority).
- Expanded: prerequisites box, study hints (amber), yield/MCQ count/card count badges, inline flashcards (539 cards), linked study tools, related topics (clickable pills), "Practice N MCQs" button (links to topic-filtered MCQ page).
- Spaced repetition: 5-bucket Leitner (New/Learning/Familiar/Confident/Mastered), intervals 0/1/3/7/14 days, progress bar + session summary in review overlay.
- Yield filter toggle: "High-yield only" button.
- Search filter + system filter buttons + localStorage persistence.
- URL params: `?system=X` (filter), `?highlight=topic-id` (scroll + expand), `?review=true` (open SR overlay).
- Study Tools catalog at bottom (23 tools in 6 categories). Filters contextually when system filter is active.
- Knowledge graph: `graph.json` maps 161 topic↔topic edges, 37 prerequisite edges, 129 related_topics, 21 tool→topic mappings.

**MCQs** (`mcqs/index.html`) -- Practice page with difficulty filters + persistent scoring + quiz modes.
- 1,000 AIIMS/NEET PG MCQs with difficulty (300 easy / 450 medium / 250 hard), Bloom's taxonomy (recall/understand/apply/analyze), and topic_id cross-links (397 linked).
- Difficulty filter row (Easy/Medium/Hard pills) + system filter.
- Each MCQ shows difficulty badge + Bloom's level tag.
- Topic cross-link: "Study [Topic] →" in explanation (uses topic_id for direct linking).
- Persistent localStorage progress: answered state, correct/incorrect, streak, best streak.
- Quiz modes: Practice (default), Quick 20 (random subset), Timed Exam (50 MCQs, 60-min timer).
- URL params: `?system=X`, `?topic_id=X` (filter by topic), `?difficulty=X` (filter by difficulty).
- System filter buttons + paginated 20/page (Practice mode) or all-at-once (quiz modes).

**localStorage keys**:
- `mbbeasy-mcq-progress`: MCQ answers, scores, streak.
- `mbbeasy-flashcard-sr`: Spaced repetition bucket state per flashcard.
- `learn-filters`, `mcq-filters`: Filter selections.

**Practicals** (`practicals/index.html`) -- single-page case browser.
- 5 system buttons (Cardiac, Respiratory, Neuro, GI, General), 21 cases total.
- Cases rendered as `<details>` accordions.

---

## Directory Structure

```
MDExamPrep/
+-- _source/                  (gitignored -- raw inputs, build scripts)
|   +-- build_topics.py       (topic deduplication script)
|   +-- build_topic_graph.py  (topic↔topic + prerequisite edge builder)
|   +-- tag_difficulty.py     (MCQ difficulty classification — heuristic scoring)
|   +-- link_mcq_topics.py    (MCQ↔topic cross-linking — fuzzy match)
|   +-- fix_fc_mapping.py     (flashcard↔topic name resolution)
|   +-- score_topics.py       (yield scoring + Bloom's classification)
|   +-- practicals/           (ECG images, viva audio, build scripts, templates)
|   +-- theory/               (flashcard sources, Harrison's ref, taxonomy)
+-- website/                  (THE DEPLOYED SITE -- git-tracked)
|   +-- index.html, style.css, favicon.svg, robots.txt, sitemap.xml, manifest.json, sw.js, og-image.png
|   +-- assets/js/            (template.js)
|   +-- assets/fonts/         (DMSans-Variable.woff2, SourceSerif4-Variable.woff2)
|   +-- assets/icons/         (icon-192.png, icon-512.png)
|   +-- learn/                (index.html, learn.js, data/topics.json + flashcards.json + catalog.json + graph.json)
|   +-- mcqs/                 (index.html, mcqs.js, data/mcqs.json)
|   +-- practicals/           (index.html, practicals.js, data/*.json)
|   +-- theory/tools/         (23 HTML study tools -- anatomy, pharma, micro, pulm, genetics, study-skills)
+-- CLAUDE.md, README.md, vercel.json, .gitignore, .gitattributes
```

---

## LOCKED FILES

| File | Purpose |
|------|---------|
| All JSON in `website/practicals/data/` | Practicals case data (812 KB) |
| All 23 HTML files in `website/theory/tools/` | Study tools (being consolidated into 6 hub pages in future sessions) |

---

## Build Rules

1. **Static HTML/JS only** -- no frameworks, no build tools, no server
2. **Client-side only** -- all processing in browser
3. **Free forever** -- no paywall, no login
4. **Single CSS** -- all styles in `style.css`, no per-page CSS files
5. **Self-hosted fonts** -- DM Sans (body) + Source Serif 4 (headings) in `/assets/fonts/`, no CDN
6. **Data loading**: `fetch()` parallel, JSON files in `/data/` directories
7. **Template injection**: `template.js` adds nav + footer to sub-pages
8. **Topic data**: generated by `_source/build_topics.py` from dictionary + ranked-list + flashcards

---

## Deployment

- **Live URL**: https://mdexamprep.vercel.app/
- **GitHub**: https://github.com/PostgraduateAvi/mdexamprep (public, `main` branch)
- **Auto-deploy**: `git push origin main` -> Vercel builds ~30s -> live
- **Redirects**: /predictor → /learn/, /theory → /learn/ (301 permanent)
- **Security headers**: CSP (script-src self + cdnjs, font-src self), X-Frame-Options DENY, nosniff
- **Cache**: Fonts 30d immutable, data JSON 1d+SWR, JS 1h+SWR, sw.js no-cache, manifest 1d
- **PWA**: Service worker v13 (precache shell, SWR data, network-first HTML), auto-reload on SW update via controllerchange listener, installable manifest
- **OG tags**: All pages have og:title/description/image + twitter:card for social previews

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
| 21 | Mar 22 | Major restructure: removed Predictor, added Learn (397 topics + inline flashcards), separated MCQs, 301 redirects |
| 22 | Mar 22 | Feature burst: persistent MCQ scoring, 3 quiz modes, cross-page navigation, spaced repetition (3-bucket Leitner), study dashboard, MCQ bank expanded 500→1000 from HuggingFace medmcqa |
| 23 | Mar 22 | Knowledge graph layer: graph.json (tool↔topic + topic↔topic connections), 95 topics enriched with tool_ids (up from 8), catalog restructured (paper-1/paper-3 → study-skills/genetics), related-topics pills, contextual tool filtering, SW v10 |
| 24 | Mar 23 | WCAG AA accessibility audit: touch targets ≥48px, contrast fixes (--text-muted bumped), font-size minimums, design-sight structural verification across all pages, SW v11 |
| 25 | Mar 23 | "Warm Indigo" redesign: new color palette (indigo/violet replacing sky-blue), landing page rework (gradient hero, 3-column feature grid, section transitions), sub-page headers, SW auto-reload on update (controllerchange listener — no more hard-refresh needed on mobile), SW v13 |
| 26 | Mar 23 | Data-driven learning system: MCQ difficulty tags (30/45/25 easy/medium/hard), MCQ↔topic cross-links (397/1000 linked), Bloom's taxonomy classification (recall/understand/apply/analyze), topic yield scoring (72 high/40 medium/285 low), knowledge graph (161 topic↔topic edges, 37 prerequisite edges), flashcard↔topic fix (115→191), Study Path view (topological sort by prereqs + yield), difficulty filter on MCQs, 5-bucket SR (migrated from 3-bucket), SW v14 |

---

## Common Pitfalls

- **EEXIST errors**: Write/Edit tools fail on project dir. Workaround: write .py to home dir, run with Python.
- **Heredoc + apostrophes**: Use .py workaround instead.
- **macOS Python**: `python3` via Homebrew
