# MBBEasy — Project Root

## Status: LIVE (Mar 23, 2026 — Session 30: First content insertion)

**Brand**: MBBEasy — "Clinical medicine, decoded."
**Built by Avinash Jothish.** Free. Static HTML/JS. No framework. Client-side only.

---

## Architecture (Session 30)

Two sections: **Theory** + **Practicals**. Session 29 stripped all prior complexity (Learn page, MCQs, flashcards, SR, knowledge graphs, 32 study tools). Session 30 inserted the first real content (Cardiology) and established the content pipeline.

Single CSS file (`style.css`). "Warm Indigo" design system with glass morphism (indigo `#818cf8` + violet `#c084fc` accents on warm dark `#0f1117`). Self-hosted fonts (DM Sans body + Source Serif 4 headings). PWA with offline support (SW v21 + auto-reload on update).

**Landing** (`index.html`) — Gradient hero + two glass cards (Theory / Practicals) + footer.

**Theory** (`theory/index.html`) — System browser with accordion topics.
- 7 systems: Cardiology, Respiratory, Neurology, Nephrology, Gastroenterology, Hematology, Endocrinology.
- Content loaded from `theory/data/{system}.json` per system.
- **Cardiology**: 51 topics from Harrison's 21e, 28 high-yield. First system with real content.
- Empty systems show "Coming soon" placeholder.
- URL param: `?system=X` (auto-select system).

**Practicals** (`practicals/index.html`) — Clinical case browser.
- 5 system buttons (Cardiac, Respiratory, Neuro, GI, General), 21 cases total.
- Cases rendered as `<details>` accordions.

---

## Theory Content Pipeline

### Conversion Process
1. Source markdown in project root or `~/Downloads/textbooks/` (Harrison's 21e per system)
2. Python conversion script (`~/convert_{system}.py`) parses `### X.X Title (Chapter Y)` sections
3. Converts markdown → HTML: headers, lists, tables, bold/italic, clinical pearls, HR dividers
4. Outputs JSON to `website/theory/data/{system}.json`
5. Commit + push → auto-deploys. No code changes needed.

### JSON Schema
```json
{
  "system": "Cardiology",
  "topics": [
    {
      "id": "topic-slug",
      "title": "Topic Title",
      "content": "<p>Pre-formatted HTML content</p>",
      "source": "Harrison's 21e, Ch X",
      "tags": ["high-yield"]
    }
  ]
}
```

### Content CSS Classes (in `style.css`, `.content-html` scope)
- `.clinical-pearl` — Amber left-border callout for KEY/NOTE/AVOID/IMPORTANT statements
- `.table-wrap` — Horizontal scroll wrapper for mobile-friendly tables
- `.content-divider` — Subtle `<hr>` between content sections
- `ol/li` — Styled ordered lists

### Content Status
| System | Status | Topics | Source |
|--------|--------|--------|--------|
| Cardiology | DONE | 51 (28 high-yield) | Harrison's 21e |
| Respiratory | Placeholder | 0 | — |
| Neurology | Placeholder | 0 | — |
| Nephrology | Placeholder | 0 | — |
| Gastroenterology | Placeholder | 0 | — |
| Hematology | Placeholder | 0 | — |
| Endocrinology | DONE | 57 (33 high-yield) | Harrison's 21e + ADA 2025 |

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
- **Cache**: Fonts 30d immutable, data JSON 1d, JS 1h+SWR, sw.js no-cache, manifest 1d

---

## PWA & Service Worker (v20)

- **Precache**: App shell (HTML pages, CSS, template.js, fonts, favicon, manifest)
- **Fonts**: Cache-first (immutable binary)
- **JS assets**: Stale-while-revalidate (versioned via query param)
- **Data JSON**: Network-first with cache fallback (content changes without URL changes)
- **HTML/navigation**: Network-first with cache fallback
- **Auto-reload**: `controllerchange` listener on all pages + `skipWaiting()` + `clients.claim()`
- **Cache cleanup**: Old version caches deleted on activate

**CRITICAL**: Always bump `CACHE_VERSION` in `sw.js` when deploying ANY frontend change. Data JSON uses network-first so new content appears immediately without SW bump, but SW bump ensures old caches are purged.

---

## Session History

| Session | Date | Deliverable |
|---------|------|-------------|
| 1-13 | Mar 4-5 | Full build: data pipeline, predictor, practicals, theory, landing, deploy, audit |
| 14-20 | Mar 6 | Deployment sync, simplification, directory reorg, design upgrades, PWA, rebrand to MBBEasy |
| 21-28 | Mar 22-23 | Learn page, MCQs, flashcards, SR, knowledge graph, study tools, accessibility, Warm Indigo redesign, data pipeline |
| 29 | Mar 23 | Architecture reset: stripped to Theory + Practicals. Glass morphism redesign. SW v18. |
| 30 | Mar 23 | First content insertion: Cardiology (51 topics). Content CSS. SW data strategy fix (SWR → network-first). SW v20. |
| 30b | Mar 23 | Endocrinology content (57 topics, 33 high-yield). SW v21. |

---

## Common Pitfalls

- **EEXIST errors**: Write/Edit tools fail on project dir. Workaround: write .py to home dir, run with Python.
- **Heredoc + apostrophes**: Use .py workaround instead.
- **macOS Python**: `python3` via Homebrew
- **SW data caching**: Data JSON MUST use network-first strategy, not SWR. SWR serves stale cached content (e.g., empty placeholder) even after new content is deployed.
- **zsh URL globbing**: Quote URLs with `?` params in shell commands (zsh treats `?` as glob).
