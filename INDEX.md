# MDExamPrep — Master File Index

**Last verified**: 2026-03-05 12:30 (automated scan, every entry confirmed against filesystem)
**Total files**: 253 (excluding .git, .claude, .skills, .local-plugins)
**Total size**: ~20MB (cleaned Session 6)

**READ THIS FIRST in any cold session.** This file eliminates the need to search for anything.

---

## How to Use This Index

1. **Need project context?** Read `CLAUDE.md` (400 lines) — it has architecture, decisions, build lessons, file state snapshot.
2. **Need build status?** Read `CO_BUILD_PIPELINE.md` (362 lines) — phase tracker, what's done, what's next.
3. **Need role boundaries?** Read `GUARDRAILS.md` (225 lines) — who writes what, locked files, failsafes.
4. **Need a specific file?** Use the tables below — every file is listed with its purpose, size, and line count.

---

## 1. Root — Coordination Documents (7 files, ~100KB)

These are the project's brain. Read them in order of priority.

| File | Lines | Size | Purpose | Read Priority |
|------|-------|------|---------|---------------|
| `CLAUDE.md` | 400 | 27KB | **Project memory**: architecture, all decisions, build lessons 1-36, file state snapshot, directory structure, scoring formula, design system, data metrics | 1st — ALWAYS |
| `CO_BUILD_PIPELINE.md` | 362 | 19KB | **Phase tracker**: Session log, phase status (1-5), file ownership map, real-time coordination protocol | 2nd — for build context |
| `GUARDRAILS.md` | 225 | 9KB | **Role boundaries**: Cowork vs Claude Code strengths/weaknesses, 3-zone directory model, 5 failsafe protocols, file ownership | 3rd — before writing anything |
| `INDEX.md` | — | — | **THIS FILE**: Complete inventory of every file with purpose and metrics | Reference |
| `HOMEPAGE_PREDICTOR_SPEC.md` | 758 | 25KB | **Phase 2 build spec**: Homepage-as-predictor architecture, upload zone UI, state machine, all copy, CSS, verification checklist | Build spec |
| `UPLOAD_PARSER_SPEC.md` | 221 | 8KB | **Parser algorithm**: PDF.js + SheetJS column mapping, topic-dictionary matching, system detection | Build spec |
| `CLEANUP_SPEC.md` | — | — | Cleanup execution spec (historical — executed Session 6) | Historical |

---

## 2. `website/` — Live Website (Zone A — Claude Code writes) (~920KB code + 812KB data)

This is the deployable website. Static HTML/JS/CSS, no framework, no build step.

### 2a. Landing Page

| File | Lines | Size | Purpose |
|------|-------|------|---------|
| `website/index.html` | 130 | 6KB | **Landing page**: 7 narrative sections. Trust line: "Built by Avinash Jothish". All 3 feature cards Live. |
| `website/assets/css/core.css` | 468 | 12KB | **Design system**: All CSS. Variables, navbar, hero+glow, proof-strip, method, trust-line, features, footer, sub-page utilities, responsive breakpoints (640px/960px). |
| `website/assets/js/template.js` | 29 | 1KB | **Sub-page injection**: Back-link + footer for predictor/practicals pages. NOT used on landing page. |
| `website/mockup-landing.html` | 434 | 13KB | Design mockup reference (Session 4). Not served to users. |

### 2b. Predictor Feature (`website/predictor/`)

| File | Lines | Size | Purpose | Status |
|------|-------|------|---------|--------|
| `predictor/index.html` | 60 | 3KB | Predictor page shell. Has CDN tags for pdf.js + SheetJS. Upload zone + results container. | Built (Session 5) |
| `predictor/predictor-ui.js` | 286 | 11KB | UI controller: CHOOSE/PARSING/RESULTS state machine, data loading, rendering, rationale per topic, "Already studied" toggle. | Built |
| `predictor/predictor.css` | 313 | 6KB | Predictor-specific styles: upload zone, progress bar, results cards, slot/system views. | Built |
| `predictor/upload-parser.js` | 306 | 11KB | **Upload parser**: PDF.js text extraction + SheetJS Excel parsing + topic-dictionary matching + system detection. | Built (Session 5) |

### 2c. Predictor Data (`website/predictor/data/`) — READ ONLY

| File | Size | Entries | Purpose |
|------|------|---------|---------|
| `ranked-list.json` | 16KB | 44 topics | Ranked preparation priorities with reason codes, scores, systems |
| `topic-dictionary.json` | 146KB | 1,718 entries | Enriched topic→system mapping for upload parser matching (77.4% match rate) |
| `taxonomy-lite.json` | 84KB | 1,536 entries | System-classified subset of 4,094 topics |
| `kg-triples.json` | 2KB | 10 edges | Knowledge graph relationships (5 types) |
| `portfolio-quotas.json` | 0.2KB | 1 object | Exam structure constraints (max per system, category minimums) |
| `slot-template.json` | 1.4KB | 10 slots | PIV slot definitions (structural exam framework) |
| `system-keywords.json` | 2KB | 10 systems | System detection keyword patterns (100+ keywords) |
| `medical-synonyms.json` | 1KB | 32 pairs | Abbreviation expansion (DM→Diabetes, HTN→Hypertension, etc.) |
| `test-fixture.json` | 2KB | 7 questions | Test data for parser validation |

### 2d. Practicals Feature (`website/practicals/`)

| File | Lines | Size | Purpose | Status |
|------|-------|------|---------|--------|
| `practicals/index.html` | 222 | 7KB | Practicals hub: 8 tool cards (2 live, 6 coming soon), stats row | Built (Session 3) |
| `practicals/practicals.css` | 562 | 20KB | Shared sidebar+topbar layout, loading screen, responsive, tool- prefixed classes | Built |
| `practicals/clinical-atlas.html` | 61 | 2KB | Tool shell: topbar, sidebar, content divs | Built |
| `practicals/clinical-atlas.js` | 710 | 26KB | **LOCKED**. 21 cases, 4 modes (Atlas/XRef/Viva/Audit). Renders presentation scripts, exam technique, differentials, management. localStorage for audit state. | LOCKED |
| `practicals/viva-forge.html` | 60 | 2KB | Tool shell: topbar, sidebar, content divs | Built |
| `practicals/viva-forge.js` | 486 | 18KB | **LOCKED**. 16 cases (110 vivas + 33 curveballs), 3 modes (Practice/Stress/Dialogue). 2-min countdown timer, keyboard shortcuts. | LOCKED |

### 2e. Practicals Data (`website/practicals/data/`) — READ ONLY, copied from `practicals/data/`

| File | Size | Content |
|------|------|---------|
| `cardiac.json` | 140KB | 5 cases: MS, MR, AR, AS, IE |
| `respiratory.json` | 132KB | 6 cases: Pleural effusion, consolidation, pneumothorax, hydropneumothorax, COPD, asthma |
| `neuro.json` | 130KB | 5 cases: Hemiplegia, paraplegia, GBS, transverse myelitis, stroke in young |
| `gi_specialty.json` | 66KB | 3 cases: Cirrhosis, hepatosplenomegaly, DM long case |
| `general_cases.json` | 45KB | 2 cases: VHD reference, COPD |
| `viva_forge_data.json` | 291KB | 16 cases, 110 viva questions, 33 curveballs |

### 2f. Theory Feature (`website/theory/`) -- Built Session 7

| File | Lines | Size | Purpose | Status |
|------|-------|------|---------|--------|
| `theory/index.html` | 58 | 2KB | Theory page shell: hero, stats, mode toggles, filter bar, deck | Built (Session 7) |
| `theory/theory.css` | 369 | 10KB | Browse cards, quiz mode, clinical pearl callouts, filter pills, responsive | Built (Session 7) |
| `theory/theory.js` | 398 | 13KB | IIFE: data loading, filter persistence (localStorage), browse/quiz, Fisher-Yates shuffle | Built (Session 7) |

### 2g. Theory Data (`website/theory/data/`)

| File | Size | Content |
|------|------|--------|
| `flashcards.json` | ~170KB | 310 flashcards, 11 systems, 3 difficulties |

### 2h. Predictor Engine (`website/assets/js/`)

| File | Lines | Size | Purpose | Status |
|------|-------|------|---------|--------|
| `predictor-engine.js` | 234 | 7KB | **LOCKED**. Core scoring: rank(), analyzeSlots(), groupBySystems(). Reason-code weighting + KG boost + quota enforcement. 38 of 44 topics pass quota filter. | LOCKED |

---

## 3. `predictor/` — Source Data & Methodology (PILLAR 1)

### 3a. Methodology Docs (`predictor/methodology/`) — 6 files, ~110KB

These explain HOW the prediction system works. Read before modifying engine logic.

| File | Lines | Size | Purpose |
|------|-------|------|---------|
| `prediction_system_data_report.md` | 460 | 26KB | PI system + post-exam validation (87.5% family-level accuracy). **Most important methodology doc.** |
| `MD_PII_Prediction_Process_Complete.md` | 531 | 34KB | 5-pillar architecture: Historical Frequency, Recency, Cross-Paper Signals, Centrality, Blueprint Weight |
| `PIV_Prediction_Methodology_DataBrief.md` | 412 | 23KB | PIV slot template: 10 structural slots, slot-level predictions, results |
| `AI_Contest_Systemic_Medicine_Prediction.md` | 32 | 10KB | Full methodology narrative |
| `yenepoya_md_medicine_predictor_gpt_blueprint_2014_2025.md` | 227 | 12KB | GPT-based blueprint (2014-2025 data) |
| `NotebookLM_Systemic_Prediction_Pack_README.txt` | 50 | 4KB | NotebookLM prompt pack usage guide |

### 3b. Structured Data (`predictor/data/`) — Source of truth

| File | Size | Content |
|------|------|---------|
| `_intermediate/` | ~1.3MB | 13 working files moved here: 7 CSVs, 5 XLSX, raw_kg_edges.txt, notebooklm JSON |

### 3c. Individual Exam Papers (`predictor/data/excel-papers/`) — 25 files, ~244KB

Papers from 2014-2025 across 4 subjects: Basic Science, Infectious Diseases, Recent Advances, Systemic Medicine. Each is an Excel file with question-level data.

### 3d. Python Scripts (`predictor/scripts/`) — 6 files

| File | Lines | Purpose |
|------|-------|---------|
| `script.py` | 88 | Data processing pipeline (original) |
| `script_1.py` through `script_5.py` | 45-131 each | Incremental analysis scripts |

---

## 4. `practicals/` — Source Data & Build Tools (PILLAR 3)

### 4a. Legacy Study Tools (`practicals/_legacy/`) — 52 HTML files, ~4.5MB total

Self-contained clinical exam study tools (Design v2). Moved from `study-tools/` during cleanup. Each is a standalone HTML page with embedded CSS/JS.

**By category:**
- **System examinations** (8): GPE, Motor, Sensory, Reflexes/Plantar, Cranial Nerves, Cerebellar/Gait, Clinical Synthesis, Peripheral Neuropathy
- **Clinical cases** (16): MS, MR, AR, AS, IE, Bronchial Asthma, COPD/Cor Pulmonale, Consolidation, Pleural Effusion, Pneumothorax, Hydropneumothorax, Cirrhosis, Hemiplegia, Paraplegia, GBS, Transverse Myelitis, CVD/Stroke in Young
- **Comprehensive tools** (10): Clinical Exam Master (344KB — largest), Exam Rapid Revision (212KB), history-taking-mastery, Ward Round Simulator, Clinical Navigation Hub, Case Proforma Master, DM Long Case Master, Drug/Instrument Arsenal
- **OSCE tools** (4): OSCE Command Center, OSCE Mastery Tool, OSCE Station Bank, SYSTEM BRANCHES 4 SECTIONS
- **Specialty** (6): ECG Mastery, Xray Investigation, Neuro Localization Trainer, Neuro ROI Engine, GI HSM Compendium, Valvular Heart Disease Mastery
- **Viva tools** (5): Viva Forge (313KB), Viva Stress Simulator, Viva Transcript Pleural Effusion, Viva Voice Companion, Exam Video Resources
- **Reference** (3): CVS Mastery (115KB), RS Mastery (96KB), COPD Mastery (87KB), History Taking (83KB)

### 4b. Source JSON Data (`practicals/data/`)

| File | Size | Content |
|------|------|---------|
| `schema.json` | 9KB | Data contract for all case JSONs (230 lines) |

Note: 6 source JSON copies removed — canonical copies live in `website/practicals/data/`.

### 4c. ECG Images (`practicals/ecg-images/`) — 43 JPG files, ~9.4MB

ECG tracings: `IMG-20250823-WA0019.jpg` through `IMG-20250823-WA0062.jpg`

### 4d. Viva Audio Transcripts (`practicals/viva-audio/`) — 7 TXT files, ~36KB

| File | Lines | Topic |
|------|-------|-------|
| `cerebellar_transcript.txt` | 130 | Cerebellar examination viva |
| `copd_transcript.txt` | 125 | COPD/Cor Pulmonale viva |
| `dermatomyositis_transcript.txt` | 145 | Dermatomyositis viva |
| `effusion_transcript.txt` | 135 | Pleural effusion viva |
| `hepatosplenomegaly_transcript.txt` | 125 | Hepatosplenomegaly viva |
| `parkinsons_transcript.txt` | 160 | Parkinson's disease viva |
| `short_stature_effusion_transcript.txt` | 110 | Short stature + effusion combined |

### 4e. Build Scripts & Templates (`practicals/`)

| File | Lines | Purpose |
|------|-------|---------|
| `build.py` | 418 | Main HTML builder — JSON→HTML with `__DATA__` injection |
| `build_master.py` | 347 | Master builder for comprehensive tools |
| `build_viva_forge.py` | 32 | Viva Forge HTML generator |
| `harvest_phase_a.py` | 511 | Phase A content harvester |
| `template.html` | 1132 | HTML template with `__DATA__` placeholder |
| `viva_forge_template.html` | 1026 | Viva Forge HTML template |

### 4f. Specs (`practicals/spec/`)

| File | Lines | Purpose |
|------|-------|---------|
| `VIVA_TOOL_SPEC.md` | 566 | Viva tool design specification |
| `COWORK_CONSOLIDATION_INSTRUCTIONS.md` | 312 | Merge 52 tools → 8 consolidated tools (deferred) |

---

## 5. `theory/` — Theory Data (PILLAR 2)

### 5a. Taxonomy (`theory/taxonomy/`)

| File | Size | Content |
|------|------|---------|
| `MD_Practicals_Gospel_Topics.json` | 1.0MB | **4,094 canonical topics** — 1,536 system-classified, 2,558 General/Other |
| `reclassification_log.json` | 12KB | Audit log of keyword-based system reclassification |

### 5b. Flashcards (`theory/flashcards/`)

| File | Size | Content |
|------|------|---------|
| `unified_flashcards.json` | 167KB | **310 deduplicated cards**, system-classified, difficulty-tagged |
| `FLASHCARD_STATS.md` | 3KB | Merge statistics |
| `_raw/flashcards.csv` | 14KB | Source: CSV format |
| `_raw/MD_Exam_Flashcards.tsv` | 10KB | Source: TSV format |
| `_raw/Flashcards_Merged_GDocs.md` | 35KB | Source: Google Docs merge |
| `_raw/Full flashcards.txt` | 254KB | Source: full text dump |
| `_raw/Flash cards continued.txt` | 9KB | Source: continuation |

### 5c. Harrison's Reference (`theory/reference/`)

| File | Size | Content |
|------|------|---------|
| `Harrison_Index_FULL.jsonl` | 2.7MB | **24,949 Harrison's Principles entries** (JSONL, one per line) |
| `harrison_topic_map.json` | 1.3MB | **7,045 Harrison→taxonomy mappings** (29.7% match rate) |
| `HARRISON_MATCH_STATS.md` | 0.3KB | Match statistics summary |

### 5d. Python Scripts (`theory/scripts/`)

| File | Lines | Purpose |
|------|-------|---------|
| `reclassify_taxonomy.py` | 335 | Keyword-based system classification (phrase rules first, word rules second) |
| `harrison_fuzzy_match.py` | 224 | Exact + substring + Jaccard matching pipeline |

---

## 6. `_audit/` — Shared Verification Space (both tools read/write)

| File | Size | Purpose |
|------|------|---------|
| `README.md` | 1.5KB | Rules and naming conventions |
| `phase1b-report.md` | 6.5KB | Phase 1b verification: 21/21 copy checks PASS, CSS PASS, mobile PASS |
| `phase5-report.md` | 3.3KB | Phase 5 report |
| `snapshot-20260305-1130.txt` | 1.3KB | File state snapshot (8 key files, line counts) |
| `topic-dictionary-coverage-audit.md` | 3.2KB | Topic dictionary quality audit |
| `phase1b-desktop-full.png` | 226KB | Desktop screenshot (1280px, full page) |
| `phase1b-desktop-hero.png` | 87KB | Desktop hero viewport screenshot |
| `phase1b-mobile-full.png` | 196KB | Mobile screenshot (375px, full page) |
| `session4/*.png` | 7 files, ~1MB | Session 4 screenshots (moved from root) |

---

## 7. `_deploy/` — Production-Ready Files (Cowork writes only)

| File | Lines | Size | Promoted From |
|------|-------|------|---------------|
| `index.html` | 129 | 6KB | Phase 1b PASS |
| `assets/css/core.css` | 468 | 12KB | Phase 1b PASS |
| `assets/js/template.js` | 29 | 1KB | Phase 1b PASS |

---

## 8. `docs/` — Documentation Archive

| File | Lines | Purpose |
|------|-------|---------|
| `SOURCE_MD_PREP_CLAUDE.md` | 267 | Original CLAUDE.md from pre-website phase |
| `md-exam-website-insights.md` | 248 | Website design insights and decisions |

---

## 9. `docs/archive/` — Historical Documents

Specs and docs from earlier sessions, archived after implementation.

| File | Lines | Purpose |
|------|-------|---------|
| `COLD_START_INSTRUCTIONS.md` | 97 | Copy-paste bootstrap for fresh sessions |
| `BUILD_SPEC_V2.md` | 297 | Original rebuild spec (Phases 1-5) — superseded |
| `HANDOFF_TO_CLAUDE_CODE.md` | 124 | Initial handoff instructions |
| `LANDING_PAGE_REWRITE_SPEC.md` | 338 | Phase 1b narrative spec — implemented |
| `PREDICTOR_RESULTS_UX_SPEC.md` | 100 | Phase 1b rationale spec — implemented |
| `MANIFEST.md` | 206 | Early asset inventory — superseded by this INDEX |

---

## Quick Lookups

### "Where is the scoring formula?"
`CLAUDE.md` line ~173 (Scoring Formula section) and `predictor/methodology/prediction_system_data_report.md`

### "Where is the design system?"
`CLAUDE.md` line ~200 (CSS variables, fonts, theme) and `website/assets/css/core.css` (full implementation)

### "Where are the locked files?"
3 files, never modify: `predictor-engine.js` (234L), `clinical-atlas.js` (710L), `viva-forge.js` (486L)

### "Where is the case data?"
`practicals/data/` (source) = `website/practicals/data/` (web copy). 21 cases across 5 JSON files + 16-case viva forge.

### "Where are the build specs?"
`HOMEPAGE_PREDICTOR_SPEC.md` (current Phase 2) + `UPLOAD_PARSER_SPEC.md` (parser algorithm). Historical: `BUILD_SPEC_V2.md`, `LANDING_PAGE_REWRITE_SPEC.md`, `PREDICTOR_RESULTS_UX_SPEC.md`.

### "What's the current file state?"
```
index.html:           130 lines
core.css:             468 lines
template.js:           29 lines
predictor-engine.js:  234 lines  [LOCKED]
predictor-ui.js:      452 lines
predictor.css:        532 lines
upload-parser.js:     306 lines
clinical-atlas.js:    710 lines  [LOCKED]
viva-forge.js:        486 lines  [LOCKED]
theory/index.html:     58 lines  (NEW Session 7)
theory/theory.css:    369 lines  (NEW Session 7)
theory/theory.js:     398 lines  (NEW Session 7)
```

### "What data is available for the predictor?"
987 questions (2006-2025), 44 ranked topics, 10 KG edges, 10 slot definitions, 1,718 topic-dictionary entries, 1,536 taxonomy-lite entries, 32 synonym pairs, 100+ system keywords. All in `website/predictor/data/`.

### "What's built vs. what's pending?"
Built: Landing page (trust line fixed Session 7), Predictor engine + UI + upload parser, Practicals hub + 2 tools (Atlas, Viva Forge), Theory section (310 flashcards, browse/quiz, Session 7).
Pending: 6 more practical tools, mobile optimization pass, deployment.
