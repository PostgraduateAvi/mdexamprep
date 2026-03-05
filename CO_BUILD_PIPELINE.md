# Co-Build Pipeline — Cowork + Claude Code Coordination

**Created**: Mar 5, 2026 (Session 4)
**Updated**: Mar 5, 2026 (Session 4c — real-time coordination upgrade)
**Purpose**: Single reference for how Cowork and Claude Code collaborate on this project. NOT project memory (that's CLAUDE.md). NOT build instructions (that's BUILD_SPEC_V2.md). This is the coordination protocol.

---

## CRITICAL: Real-Time Shared Filesystem Protocol

Both tools are **Anthropic-built AI agents running simultaneously** in the same project directory. Every file either tool reads or writes is instantly visible to the other. This creates a novel workflow with real power — but also real collision risk.

### The Golden Rules

1. **Cowork NEVER edits HTML/JS/CSS files.** It writes specs. Claude Code builds from specs. If Cowork sees a gap in Claude Code's output, it documents the gap in this file — it does NOT patch the file itself.

2. **Claude Code NEVER edits spec/coordination documents** (`CO_BUILD_PIPELINE.md`, `LANDING_PAGE_REWRITE_SPEC.md`, `UPLOAD_PARSER_SPEC.md`, `BUILD_SPEC_V2.md`). Those are Cowork's territory.

3. **Both tools read `CLAUDE.md`** but only Cowork updates it. Claude Code should re-read it at the start of each session for latest state.

4. **File ownership is absolute.** If a file is being actively edited by one tool, the other tool must NOT write to it. Read is always safe. Write requires ownership.

5. **State snapshots prevent stale assumptions.** Before Cowork writes any status update, it takes a fresh `wc -l` snapshot of all key files. If line counts changed since last check, Claude Code was working — Cowork adjusts its report to match reality.

6. **Specs are ahead-of-time, not real-time.** Cowork writes complete specs before Claude Code starts. Once Claude Code is building, Cowork's job is to verify and prepare the NEXT phase's data — not to chase the current phase.

### File Ownership Map

| File(s) | Owner | Other Tool |
|---|---|---|
| `website/**/*.html` | Claude Code | Cowork reads only |
| `website/**/*.js` | Claude Code | Cowork reads only |
| `website/**/*.css` | Claude Code | Cowork reads only |
| `website/predictor/data/*.json` | Cowork (generated) | Claude Code reads only |
| `website/practicals/data/*.json` | LOCKED | Neither modifies |
| `*.md` (specs, pipeline, CLAUDE.md) | Cowork | Claude Code reads only |
| `website/mockup-*.html` | Cowork | Claude Code reads as reference |
| `_audit/*` | Both tools | Shared verification space |
| `_deploy/*` | Cowork only | Claude Code reads only |
| `GUARDRAILS.md` | Cowork | Claude Code reads only |

### Directory Zones

| Zone | Path | Purpose | Write Access |
|---|---|---|---|
| Active Dev | `website/` | All code changes happen here | Claude Code |
| Verification | `_audit/` | Screenshots, snapshots, phase reports | Both |
| Production | `_deploy/` | Verified deploy-ready files only | Cowork (gatekeeper) |
| Source Data | `predictor/`, `theory/`, `practicals/` | Raw source material | Read-only |
| Specs | `*.md` (root) | Architecture, specs, coordination | Cowork |

**Deployment flow (Session 8+)**: Claude Code builds in `website/` -> Cowork verifies -> Claude Code commits + pushes -> Vercel auto-deploys (~30s). `_deploy/` is retired. Git provides rollback via `git revert`.

### Why This Works

Cowork excels at: auditing, data generation, spec writing, visual verification, cross-file analysis, web research, Python scripts, and project memory management.

Claude Code excels at: multi-file code generation, iterative debugging, complex JS logic, CSS authoring, terminal-native file operations, and rapid iteration cycles.

Together they cover the full build pipeline with zero overlap in write access. The user coordinates by telling each tool when to act. `_deploy/` serves as a rollback safety net — even if `website/` gets corrupted, the last verified state is preserved.

---

## Division of Labor

### Cowork Owns
- Project auditing and architecture planning
- Data preparation and generation (Python scripts, JSON pipelines)
- Spec documents with exact copy, CSS, and file paths
- Visual mockups and design references
- Post-build verification (screenshots, cross-contamination scans, data integrity)
- Updating this document, CLAUDE.md, and other spec files
- Downstream data prep while Claude Code builds the current phase

### Claude Code Owns
- All HTML/JS/CSS file creation and editing
- Multi-file builds (landing page, predictor UI, practicals polish)
- Iterative debugging (serve, test, fix, repeat)
- Git operations (commits after each phase)
- Complex JS logic (upload parser, PDF/Excel integration)

### Neither Tool Should
- Modify locked files (see Locked Files section below)
- Add cross-links between the three standalone features
- Introduce npm/webpack/vite or any build tooling
- Create server-side components
- Write to files owned by the other tool

---

## Locked Files (DO NOT MODIFY)

| File | Lines | Content | Validated |
|---|---|---|---|
| `website/assets/js/predictor-engine.js` | 234 | Ranking algorithm | Session 2 |
| `website/practicals/clinical-atlas.js` | 710 | 21 cases, 4 modes | Session 3 |
| `website/practicals/viva-forge.js` | 486 | 16 cases, 3 modes | Session 3 |
| `website/practicals/data/*.json` | 6 files, 812KB | Clinical case data | Session 3 |
| `website/predictor/data/ranked-list.json` | 44 topics | Validated rankings | Session 2 |
| `website/predictor/data/kg-triples.json` | 10 edges | Knowledge graph | Session 2 |
| `website/predictor/data/portfolio-quotas.json` | Constraints | Exam structure | Session 2 |
| `website/predictor/data/slot-template.json` | 10 slots | PIV slot defs | Session 2 |

**Integrity check command** (run anytime):
```
predictor-engine.js: 234 lines
clinical-atlas.js: 710 lines
viva-forge.js: 486 lines
```
If any number changes → something went wrong. Revert immediately.

---

## Phase Tracker

### Phase 1 — Landing Page ✅ COMPLETE
| Step | Owner | Status | Notes |
|---|---|---|---|
| Visual mockup | Cowork | DONE | `website/mockup-landing.html` |
| Rewrite `index.html` | Claude Code | DONE | 101 → 113 lines, matches mockup |
| Extend `core.css` | Claude Code | DONE | 233 → 381 lines, new landing classes |
| Simplify `template.js` | Claude Code | DONE | 58 → 29 lines, sub-page only |
| Verify output | Cowork | DONE | 29/29 landing, 16/16 predictor, 11/12 practicals |

**Verification results (Cowork, Mar 5)**:
- [x] `index.html` matches `mockup-landing.html` layout and feel
- [x] Three feature cards present — Predictor (live), Practicals (live), Theory (coming soon)
- [x] Theory card not clickable, reduced opacity
- [x] Stats bar shows 987 / 20 / 44 / 52
- [x] Hero glow animation renders (CSS-only, no JS)
- [x] Mobile layout works at 375px (cards stack, text readable)
- [x] No nav links to sub-pages in navbar (standalone architecture)
- [x] `template.js` only injects back-link + footer on sub-pages, not landing
- [x] No console errors
- [x] Locked files intact (234, 710, 486 lines confirmed)

### Phase 1b — Landing Page NARRATIVE REWRITE ✅ COMPLETE
| Step | Owner | Status | Notes |
|---|---|---|---|
| Persuasion-first spec | Cowork | DONE | `LANDING_PAGE_REWRITE_SPEC.md` — full copy, CSS, 7 sections |
| Predictor results UX spec | Cowork | DONE | `PREDICTOR_RESULTS_UX_SPEC.md` — rationale lines per topic |
| Rewrite `index.html` (narrative) | Claude Code | DONE | 113 → 129 lines, all 7 sections, copy matches spec |
| Append CSS (proof/method/trust) | Claude Code | DONE | 381 → 468 lines, all 3 new class groups added |
| Add rationale to predictor-ui.js | Claude Code | DONE | 249 → 286 lines, predictor.css now 313 lines |
| Verify narrative page | Cowork | PENDING | Next Cowork session screenshots + copy audit |

**Key design direction**: Landing page must SELL conviction, not just list features. Psychological arc: Anxiety ("students prepare 60 topics, exam tests 10") → Proof (narrative stats) → Method (3 steps) → Trust ("validated against 20 years") → Action (feature cards with persuasive copy). NO specific accuracy percentages. Soft framing only.

**Files Claude Code must read first**:
1. `CLAUDE.md` — project context
2. `LANDING_PAGE_REWRITE_SPEC.md` — PRIMARY TASK, exact copy and CSS pre-written
3. `PREDICTOR_RESULTS_UX_SPEC.md` — secondary task, rationale lines

**Do NOT modify**: `predictor-engine.js`, `clinical-atlas.js`, `viva-forge.js`, `template.js`, any JSON data files.

### Phase 2 — Predictor Upload Pipeline
| Step | Owner | Status | Notes |
|---|---|---|---|
| `topic-dictionary.json` (1,718 entries) | Cowork | DONE | 77.4% match rate tested |
| `system-keywords.json` (fallback) | Cowork | DONE | 10 systems, 100+ keywords |
| `medical-synonyms.json` (32 pairs) | Cowork | DONE | Abbreviation expansion |
| `taxonomy-lite.json` (1,536 entries) | Cowork | DONE | Superseded by topic-dictionary |
| `test-fixture.json` (7 sample Qs) | Cowork | DONE | Expected matches documented |
| `UPLOAD_PARSER_SPEC.md` | Cowork | DONE | Exact column formats, 4 Excel variants |
| Create `upload-parser.js` | Claude Code | NOT STARTED | PDF.js + SheetJS + matcher |
| Modify `predictor-ui.js` | Claude Code | NOT STARTED | Upload state machine |
| Modify `predictor/index.html` | Claude Code | NOT STARTED | CDN tags + upload UI |
| Extend `predictor.css` | Claude Code | NOT STARTED | Upload zone styles |
| Verify upload with real Excel | Cowork | WAITING | Will test Systemic_Medicine_2023.xlsx |

**Key data for Claude Code**:
- Use `topic-dictionary.json` NOT `taxonomy-lite.json` (43% → 77% accuracy difference)
- Excel files come in 4 column formats — see `UPLOAD_PARSER_SPEC.md`
- Output must match `ranked-list.json` shape to feed into `PredictorEngine.rank()`
- CDN URLs: pdf.js `3.11.174`, SheetJS `0.18.5` (both from cdnjs.cloudflare.com)

### Phase 3 — Practicals Polish
| Step | Owner | Status | Notes |
|---|---|---|---|
| Add back-navigation | Claude Code | NOT STARTED | ← Back to Home / ← Back to Practical Tools |
| Remove any cross-links | Claude Code | NOT STARTED | Scan confirmed clean currently |
| Verify practicals hub | Cowork | WAITING | 8 cards, 2 live, 6 coming soon |

### Phase 4 — Theory Section ✓ COMPLETE (Session 7)
| Step | Owner | Status | Notes |
|---|---|---|---|
| Stage `flashcards.json` (310 cards) | Cowork | DONE | Pre-generated in `website/theory/data/` |
| Create `theory/index.html` (58 lines) | Claude Code | DONE | Hero + stats + mode toggles + filter bar |
| Create `theory/theory.css` (369 lines) | Claude Code | DONE | Browse + quiz + clinical pearls + responsive |
| Create `theory/theory.js` (398 lines) | Claude Code | DONE | IIFE, filtering, browse/quiz, shuffle |
| Fix trust line in landing | Claude Code | DONE | Built by Avinash Jothish |
| Make theory card live | Claude Code | DONE | Live tag + arrow on landing |
| Verify theory page | Cowork | PENDING | Visual audit needed |

### Phase 5 — Final Verification
| Step | Owner | Status | Notes |
|---|---|---|---|
| All pages load via HTTP server | Cowork | WAITING | `python -m http.server 8000` |
| No console errors anywhere | Cowork | WAITING | All pages checked |
| Cross-contamination scan | Cowork | WAITING | grep for cross-links |
| Mobile test (375px) | Cowork | WAITING | All pages |
| Upload test with real papers | Cowork | WAITING | 3+ different format papers |
| Locked file integrity | Cowork | WAITING | Line counts match |

---

## Handoff Protocol

### When Claude Code finishes a phase:
1. User tells Cowork "Phase X done, check it"
2. Cowork runs verification checklist for that phase
3. Cowork reports: PASS (proceed to next phase) or ISSUES (list what needs fixing)
4. If ISSUES: Claude Code fixes them, user tells Cowork to re-check
5. If PASS: Claude Code starts next phase

### When Cowork prepares data for a future phase:
1. Cowork generates data files and places them in `website/predictor/data/` or `website/practicals/data/`
2. Cowork updates relevant spec file (BUILD_SPEC_V2.md or UPLOAD_PARSER_SPEC.md)
3. Cowork notes the update in this document's Phase Tracker
4. User tells Claude Code "new data ready, read UPLOAD_PARSER_SPEC.md"

### When something breaks:
1. User pastes error to whichever tool is idle
2. That tool diagnoses and either fixes (if it owns the file) or writes instructions for the other tool
3. The fix is documented in this file under the relevant phase

---

## Files Index

### Spec Documents (read before building)
| File | Purpose | Owner |
|---|---|---|
| `HOMEPAGE_PREDICTOR_SPEC.md` | **CURRENT BUILD SPEC** — homepage=predictor, upload zone, Apple simplicity | Cowork (authored) → Claude Code (executes) |
| `UPLOAD_PARSER_SPEC.md` | Exact Excel formats + matching algorithm (still valid) | Cowork (authored) → Claude Code (executes) |
| `BUILD_SPEC_V2.md` | Original 5-phase build instructions (SUPERSEDED by Session 5) | Historical reference |
| `LANDING_PAGE_REWRITE_SPEC.md` | Persuasion-first narrative (SUPERSEDED by Session 5) | Historical reference |
| `PREDICTOR_RESULTS_UX_SPEC.md` | Rationale lines per ranked topic (still valid — kept in predictor-ui.js) | Reference |
| `HANDOFF_TO_CLAUDE_CODE.md` | Initial handoff + strengths/weaknesses | Cowork (authored, one-time) |
| `CO_BUILD_PIPELINE.md` | THIS FILE — coordination protocol | Both (Cowork updates, both reference) |

### Reference Files (don't execute, just read)
| File | Purpose |
|---|---|
| `CLAUDE.md` | Project memory — architecture, decisions, lessons |
| `website/mockup-landing.html` | Visual reference for landing page |
| `MANIFEST.md` | Asset inventory |

### Data Files Generated by Cowork
| File | Size | Content | Used By |
|---|---|---|---|
| `website/predictor/data/topic-dictionary.json` | 142KB | 1,718 topic entries (enriched) | upload-parser.js |
| `website/predictor/data/system-keywords.json` | 1.6KB | Fallback system classifier | upload-parser.js |
| `website/predictor/data/medical-synonyms.json` | 1.2KB | 32 abbreviation pairs | upload-parser.js |
| `website/predictor/data/taxonomy-lite.json` | 82KB | 1,536 topics (superseded) | backup only |
| `website/predictor/data/test-fixture.json` | 1.6KB | 7 sample questions + expected | testing |

---

## Accuracy Benchmarks

### Topic Matching (tested by Cowork on all 25 papers, 226 questions)
| Paper Type | Match Rate | Notes |
|---|---|---|
| Systemic Medicine (9 papers) | 60–100% | Core use case, strong |
| Infectious Disease (5 papers) | 40–80% | Moderate, some niche topics |
| Recent Advances (4 papers) | 20–80% | Variable, cutting-edge topics hard |
| Basic Science (5 papers) | 10–78% | Improved with supplements, some abstract |
| **Overall** | **77.4%** | Acceptable for v1 launch |

### Known Weak Spots
- Single-word drug names ("Delamanid", "Daridorexant") — need exact dictionary entries
- Abstract physiology ("SA node potential and drugs acting on it") — too vague for keyword matching
- Cutting-edge topics ("CRISPR", "CAR-T cell therapy") — not in any dictionary
- **Mitigation**: System-keyword fallback ensures at least a system classification even when exact topic match fails

---

## Session Log

### Session 4a — Cowork Prep (Mar 5, 2026)
- Audited full project structure (52 tools, 6 JSONs, predictor engine intact)
- Created `BUILD_SPEC_V2.md` (5-phase build spec)
- Created `website/mockup-landing.html` (visual reference)
- Created `HANDOFF_TO_CLAUDE_CODE.md` (division of labor)
- Updated `CLAUDE.md` (new architecture: standalone features, no cross-linking)
- Generated `taxonomy-lite.json` → tested at 43% → enriched to `topic-dictionary.json` at 77.4%
- Generated `system-keywords.json`, `medical-synonyms.json`, `test-fixture.json`
- Created `UPLOAD_PARSER_SPEC.md` (4 Excel formats, matching algorithm, expected outputs)

### Session 4b — Claude Code Build (Mar 5, 2026)
- Phase 1 COMPLETE: `core.css` extended (233→381), `template.js` simplified (58→29), `index.html` rewritten (101→113)
- Cowork verified: screenshots captured, mockup comparison passed, locked files intact (234/710/486)
- HTTP server tested on user's Windows machine (port 8091) — all pages render correctly

### Session 4c — Narrative Rewrite (Mar 5, 2026)
- User audited live site in Chrome via Windows HTTP server (port 8091), approved visual design
- User requested persuasion-first narrative approach: "play to the desperate state of students who need validation"
- Key direction: no hard accuracy percentages, sell through authority and narrative proof
- Cowork created `LANDING_PAGE_REWRITE_SPEC.md` (7 sections, complete copy, CSS pre-written)
- Cowork created `PREDICTOR_RESULTS_UX_SPEC.md` (rationale lines per ranked topic)
- Claude Code executed BOTH specs in real-time while Cowork was still documenting:
  - `index.html`: 113 → 129 lines (all 7 narrative sections)
  - `core.css`: 381 → 468 lines (proof-strip, method, trust-line classes)
  - `predictor-ui.js`: 249 → 286 lines (rationale per ranked topic)
  - `predictor.css`: extended to 313 lines
- **Real-time coordination lesson**: Cowork flagged CSS as "INCOMPLETE" in pipeline doc, but Claude Code had already fixed it. This demonstrated the need for fresh `wc -l` snapshots before any status report.
- Added real-time shared filesystem protocol to this document

### Session 7 — Theory Section Build (Mar 5, 2026)
- Cowork staged flashcards.json (310 cards, 11 systems) in website/theory/data/
- Claude Code built theory/index.html + theory.css + theory.js
- Browse mode (grouped accordion) + Quiz mode (single card, shuffle)
- Trust line fixed to Built by Avinash Jothish
- Theory card on landing changed from Coming Soon to Live
- Cowork role corrected: data prep + visual verification + specs + memory ONLY

### Session 8 — Deployment to Production (Mar 5, 2026)
- Claude Code initialized git repo, created `.gitignore` (root-anchored paths) + `vercel.json` (3-tier cache)
- GitHub repo created via `gh repo create`: https://github.com/PostgraduateAvi/mdexamprep (public)
- Vercel CLI installed (v50.27.1), project linked + GitHub connected via `vercel link`
- Production deployed via `vercel deploy --prod`: https://mdexamprep.vercel.app/
- All 5 URLs verified HTTP 200: `/`, `/predictor?demo=1`, `/predictor`, `/practicals`, `/theory`
- Cache headers verified: assets 30d immutable, data 1d+SWR, theory 1h+SWR
- Auto-deploy pipeline tested: `git push` -> Vercel rebuilds ~30s -> live
- `_deploy/` workflow retired — Vercel + git provide rollback
- Tools used: `gh` CLI, Vercel CLI, Vercel MCP tools (list_teams, list_projects, web_fetch_vercel_url)

### Current State Snapshot (Mar 5, 2026 — end of Session 8)
**DEPLOYED**: https://mdexamprep.vercel.app/
```
index.html:           130 lines  (trust line fix, theory card live)
core.css:             468 lines  (proof/method/trust CSS added)
template.js:           29 lines  (sub-page only)
predictor-engine.js:  234 lines  [LOCKED]
predictor-ui.js:      452 lines  (demo loader, tabs, text paste)
predictor.css:        532 lines  (page loader, upload invite, tabs)
upload-parser.js:     306 lines  (PDF.js + SheetJS parser)
clinical-atlas.js:    710 lines  [LOCKED]
viva-forge.js:        486 lines  [LOCKED]
theory/index.html:     58 lines  (NEW Session 7)
theory/theory.css:    369 lines  (NEW Session 7)
theory/theory.js:     398 lines  (NEW Session 7)
```

### Session 5 — Homepage-as-Predictor Rebuild (Mar 5, 2026)
- User directed: homepage IS the predictor. Upload zone front and center. Apple simplicity.
- User directed: credit "Avinash Jothish" by name (solo effort, not "MD candidates")
- User directed: universal platform — any medicine college's papers, not locked to Yenepoya
- User directed: toggle buttons immediately visible after results load, no scrolling
- Cowork wrote `HOMEPAGE_PREDICTOR_SPEC.md` — complete build spec with exact HTML structure, CSS, JS API
- Cowork caught itself violating guardrails (started writing HTML) — corrected, spec-only from then on
- Session 5 SUPERSEDES Phases 2-5 from Session 4. New spec combines upload parser + homepage redesign.

### Ready for Session 5 Build (fresh Claude Code session)
1. Read `CLAUDE.md` → `CO_BUILD_PIPELINE.md` → `GUARDRAILS.md` → `HOMEPAGE_PREDICTOR_SPEC.md` → `UPLOAD_PARSER_SPEC.md`
2. Rewrite `index.html` (homepage = upload zone + inline results)
3. Rewrite `core.css` (strip dead sections, add upload zone + nav dropdown)
4. Create `assets/js/upload-parser.js` (PDF.js + SheetJS + topic-dictionary matcher)
5. Rewrite `predictor/predictor-ui.js` (CHOOSE/PARSING/RESULTS state machine)
6. Rewrite `predictor/predictor.css` (strip dead hero/methodology, keep results)
7. Replace `predictor/index.html` with redirect
8. Create `theory/index.html` (Coming Soon placeholder)
9. All data files already in `website/predictor/data/` — Cowork pre-generated

---

## Quick Reference Commands

**Check progress** (run from `website/`):
```bash
wc -l index.html assets/css/core.css assets/js/template.js predictor/index.html predictor/predictor-ui.js
```

**Check locked files**:
```bash
wc -l assets/js/predictor-engine.js practicals/clinical-atlas.js practicals/viva-forge.js
# Expected: 234, 710, 486
```

**Cross-contamination scan**:
```bash
grep -rn "practicals\|theory" predictor/*.html predictor/*.js 2>/dev/null | grep -v "//\|data/"
grep -rn "predictor\|theory" practicals/*.html practicals/*.js 2>/dev/null | grep -v "//\|data/"
```

**Serve for testing**:
```bash
cd website && python -m http.server 8000
# Then open http://localhost:8000
```
