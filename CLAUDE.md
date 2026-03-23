# MBBEasy — Project Root

## Status: LIVE (Mar 23, 2026 — Session 29: Architecture reset)

**Brand**: MBBEasy — "Clinical medicine, decoded."
**Built by Avinash Jothish.** Free. Static HTML/JS. No framework. Client-side only.

---

## Architecture (Session 29)

Stripped to two sections: **Theory** + **Practicals**. All prior complexity removed (Learn page, MCQs, flashcards, spaced repetition, knowledge graphs, 32 study tools).

Single CSS file (`style.css`). "Warm Indigo" design system with glass morphism (indigo `#818cf8` + violet `#c084fc` accents on warm dark `#0f1117`). Self-hosted fonts (DM Sans body + Source Serif 4 headings). PWA with offline support (SW v18 + auto-reload on update).

**Landing** (`index.html`) — Gradient hero + two glass cards (Theory / Practicals) + footer.

**Theory** (`theory/index.html`) — System browser with accordion topics.
- 7 systems: Cardiology, Respiratory, Neurology, Nephrology, Gastroenterology, Hematology, Endocrinology.
- Content loaded from `theory/data/{system}.json` per system.
- Empty systems show "Coming soon" placeholder.
- URL param: `?system=X` (auto-select system).
- Content built by co-work agents parsing textbooks → placed as JSON files.

**Practicals** (`practicals/index.html`) — Clinical case browser.
- 5 system buttons (Cardiac, Respiratory, Neuro, GI, General), 21 cases total.
- Cases rendered as `<details>` accordions.

---

## Directory Structure

```
MDExamPrep/
├── _source/                  (gitignored — raw inputs, build scripts)
│   ├── practicals/           (ECG images, viva audio, build scripts)
│   └── theory/               (textbook references)
├── website/                  (THE DEPLOYED SITE — git-tracked)
│   ├── index.html, style.css, favicon.svg, robots.txt, sitemap.xml, manifest.json, sw.js, og-image.png
│   ├── assets/js/            (template.js)
│   ├── assets/fonts/         (DMSans-Variable.woff2, SourceSerif4-Variable.woff2)
│   ├── assets/icons/         (icon-192.png, icon-512.png)
│   ├── theory/               (index.html, theory.js, data/*.json)
│   └── practicals/           (index.html, practicals.js, data/*.json)
├── CLAUDE.md, README.md, vercel.json, .gitignore, .gitattributes
```

---

## LOCKED FILES

| File | Purpose |
|------|---------|
| All JSON in `website/practicals/data/` | Practicals case data (812 KB) |

---

## Theory Content Pipeline

Co-work agents parse textbooks from `~/Downloads/textbooks/` → produce JSON per system → place in `website/theory/data/`. Schema:

```json
{
  "system": "Cardiology",
  "topics": [
    {
      "id": "topic-id",
      "title": "Topic Title",
      "content": "<p>Pre-formatted HTML content</p>",
      "source": "Harrison's Ch X",
      "tags": ["high-yield"]
    }
  ]
}
```

When a system JSON is placed, commit + push → auto-deploys. No code changes needed.

---

## Build Rules

1. **Static HTML/JS only** — no frameworks, no build tools, no server
2. **Client-side only** — all processing in browser
3. **Free forever** — no paywall, no login
4. **Single CSS** — all styles in `style.css`, no per-page CSS files
5. **Self-hosted fonts** — DM Sans (body) + Source Serif 4 (headings), no CDN
6. **Data loading**: `fetch()`, JSON files in `/data/` directories
7. **Template injection**: `template.js` adds nav + footer to sub-pages

---

## Deployment

- **Live URL**: https://mdexamprep.vercel.app/
- **GitHub**: https://github.com/PostgraduateAvi/mdexamprep (public, `main` branch)
- **Auto-deploy**: `git push origin main` → Vercel builds ~30s → live
- **Redirects**: /learn → /theory/, /mcqs → /, /predictor → /theory/, /theory/tools/* → /theory/ (all 301)
- **Security headers**: CSP (script-src self + unsafe-inline), X-Frame-Options DENY, nosniff
- **Cache**: Fonts 30d immutable, data JSON 1d+SWR, JS 1h+SWR, sw.js no-cache, manifest 1d
- **PWA**: SW v18 (precache shell, SWR data, network-first HTML), auto-reload on SW update
- **OG tags**: All pages have og:title/description/image + twitter:card

---

## Session History

| Session | Date | Deliverable |
|---------|------|-------------|
| 1-13 | Mar 4-5 | Full build: data pipeline, predictor, practicals, theory, landing, deploy, audit |
| 14-20 | Mar 6 | Deployment sync, simplification, directory reorg, design upgrades, PWA, rebrand to MBBEasy |
| 21-28 | Mar 22-23 | Learn page, MCQs, flashcards, SR, knowledge graph, study tools, accessibility, Warm Indigo redesign, data pipeline |
| 29 | Mar 23 | **Architecture reset**: stripped to Theory + Practicals. Removed Learn, MCQs, 32 study tools, flashcards, SR, knowledge graph. Glass morphism redesign. Theory content pipeline for co-work agents. SW v18. |

---

## Common Pitfalls

- **EEXIST errors**: Write/Edit tools fail on project dir. Workaround: write .py to home dir, run with Python.
- **Heredoc + apostrophes**: Use .py workaround instead.
- **macOS Python**: `python3` via Homebrew
