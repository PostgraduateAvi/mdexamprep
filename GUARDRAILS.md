# Guardrails — Cowork + Claude Code Dual-Agent Failsafes

**Purpose**: Prevent cascading errors by clearly separating roles, playing to each tool's strengths, avoiding each tool's weaknesses, and establishing physical directory boundaries.

---

## 1. Tool Profiles

### Cowork (Desktop Agent — Cowork mode)

**Strengths:**
- Visual verification (Playwright screenshots, side-by-side mockup comparison)
- Web research and data gathering (WebSearch, WebFetch)
- Python data processing (JSON generation, fuzzy matching, taxonomy enrichment)
- Project-level auditing (cross-file analysis, cross-contamination scans)
- Spec writing with exact copy, CSS, and verification checklists
- Windows desktop interaction (PowerShell, Chrome, file explorer)
- MCP tool access (Supabase, Vercel, Gmail, Windows)
- Long-form strategic thinking (architecture, narrative design, persuasion copy)
- Memory management (CLAUDE.md, CO_BUILD_PIPELINE.md)

**Weaknesses:**
- Token limit failures on large single-file generation (breaks at ~60% of big files)
- Cannot reliably create 200+ line HTML/JS/CSS files in one pass
- Linux VM sandbox cannot serve HTTP to user's Windows Chrome directly
- File edits are string-replacement based — fragile on large files with repeated patterns
- Cannot run multi-file iterative debug cycles (change file A, test, change file B)

**NEVER DO:**
- Write or edit HTML/JS/CSS files in `website/`
- Generate files over 100 lines in a single Write call
- Try to serve websites to user's browser from VM localhost
- Touch locked files under any circumstances
- Assume Claude Code hasn't changed a file — always snapshot first
- Handle Vercel deployment or deployment config (that is Claude Code's job)
- Drift into Claude Code's lane on any code-touching task

---

### Claude Code (Terminal Agent — Claude Code mode)

**Strengths:**
- Multi-file code generation (HTML + JS + CSS coordinated edits)
- Iterative debug loops (edit → serve → test → fix → repeat)
- Complex JavaScript logic (parsers, state machines, DOM manipulation)
- CSS authoring from design specs
- Terminal-native operations (git, npm, python, file I/O)
- Can handle 500+ line files reliably
- Fast execution (no UI overhead, direct filesystem access)
- Deployment (Vercel config, production push, deployment verification)

**Weaknesses:**
- No visual verification (cannot see what the page looks like)
- No web search or research capability
- No Windows desktop interaction
- No MCP tools (Supabase, Vercel, Gmail)
- Cannot run Playwright for screenshots
- No access to user's Chrome browser
- Cannot independently validate "does this match the mockup?"
- Limited project-level strategic thinking (works file-by-file, not system-wide)

**NEVER DO:**
- Edit spec documents, pipeline docs, or CLAUDE.md
- Write to `_deploy/` folder (that's Cowork's gatekeeper role)
- Write to `_audit/` folder (that's shared but Cowork manages verification)
- Modify locked files (predictor-engine.js, clinical-atlas.js, viva-forge.js)
- Modify JSON data files in `website/predictor/data/` or `website/practicals/data/`
- Add cross-links between standalone features
- Make architectural decisions without a spec from Cowork

---

## 2. Directory Structure — Physical Boundaries

```
MDExamPrep/
├── _audit/                    ← SHARED READ/WRITE (both tools)
│   ├── README.md              │  Verification artifacts, screenshots,
│   ├── snapshot-*.txt         │  state snapshots, phase reports
│   └── phase*-report.md      │
│
├── _deploy/                   ← COWORK WRITE ONLY (deploy-ready)
│   ├── README.md              │  Only verified, production-ready files
│   └── (mirrors website/)     │  Cowork copies here after PASS verdict
│
├── website/                   ← CLAUDE CODE WRITE (active workspace)
│   ├── index.html             │  All HTML/JS/CSS development happens here
│   ├── assets/                │  Claude Code's build territory
│   ├── predictor/             │
│   ├── practicals/            │
│   └── theory/                │
│
├── predictor/                 ← READ ONLY (source data, methodology)
├── theory/                    ← READ ONLY (taxonomy, flashcards)
├── practicals/                ← READ ONLY (source tools, raw data)
│
├── CLAUDE.md                  ← COWORK WRITE (project memory)
├── CO_BUILD_PIPELINE.md       ← COWORK WRITE (coordination)
├── GUARDRAILS.md              ← COWORK WRITE (THIS FILE)
├── BUILD_SPEC_V2.md           ← COWORK WRITE (build instructions)
├── UPLOAD_PARSER_SPEC.md      ← COWORK WRITE (parser spec)
├── LANDING_PAGE_REWRITE_SPEC.md ← COWORK WRITE (narrative spec)
├── PREDICTOR_RESULTS_UX_SPEC.md ← COWORK WRITE (predictor UX spec)
└── HANDOFF_TO_CLAUDE_CODE.md  ← COWORK WRITE (initial handoff)
```

---

## 3. The Three Zones

### Zone A: Active Development (`website/`)
- **Who writes**: Claude Code only
- **Who reads**: Both tools
- **What happens**: All code changes, new files, CSS edits, JS logic
- **Risk**: This is where collisions would happen if both tools wrote. Cowork NEVER touches this zone.

### Zone B: Verification (`_audit/`)
- **Who writes**: Both tools (Cowork writes reports, Claude Code can write test outputs)
- **Who reads**: Both tools
- **What happens**: Screenshots, state snapshots, verification reports, test results
- **Risk**: Low — these are artifacts, not source code. Overwriting a screenshot is harmless.

### Zone C: Production (`_deploy/`)
- **Who writes**: Cowork only, and ONLY after verification passes
- **Who reads**: Both tools (and user for deployment)
- **What happens**: Verified files are promoted from `website/` to `_deploy/`
- **Risk**: None if the rule is followed. This zone is the safety net — even if `website/` gets corrupted, `_deploy/` holds the last known good state.

---

## 4. Failsafe Protocols

### Failsafe 1: Snapshot Before Status
Before Cowork writes any status update or verification report, it runs:
```bash
wc -l website/index.html website/assets/css/core.css website/assets/js/template.js website/assets/js/predictor-engine.js website/predictor/predictor-ui.js website/predictor/predictor.css website/practicals/clinical-atlas.js website/practicals/viva-forge.js
```
If line counts differ from the last known snapshot, Claude Code was working. Cowork adjusts its report to match reality.

### Failsafe 2: Locked File Integrity Check
After every phase, verify locked files haven't changed:
```
predictor-engine.js:  234 lines
clinical-atlas.js:    710 lines
viva-forge.js:        486 lines
```
If ANY number changes → STOP. Something went wrong. Revert the file.

### Failsafe 3: Cross-Contamination Scan
After every phase, verify features remain standalone:
```bash
grep -rn "practicals\|theory" website/predictor/*.html website/predictor/*.js 2>/dev/null | grep -v "//\|data/"
grep -rn "predictor\|theory" website/practicals/*.html website/practicals/*.js 2>/dev/null | grep -v "//\|data/"
```
Any matches → feature isolation is broken. Fix immediately.

### Failsafe 4: Deploy Promotion Gate
Files only enter `_deploy/` when:
1. Phase verification report in `_audit/` says PASS
2. Locked file integrity confirmed
3. Cross-contamination scan clean
4. HTTP server test shows no console errors
5. Mobile layout verified at 375px

### Failsafe 5: Rollback Path
If `website/` is corrupted:
1. `_deploy/` contains the last verified state — copy back
2. Locked files have known line counts — verify or restore from git
3. Data JSONs are Cowork-generated and can be regenerated from source

---

## 5. Communication Protocol

### User → Cowork
- "Audit phase X" → Cowork takes snapshot, runs verification, writes report
- "Prepare data for phase X" → Cowork generates JSON/specs, updates pipeline
- "Show me the site" → Cowork starts Windows HTTP server, opens Chrome
- "Update the docs" → Cowork updates CLAUDE.md and CO_BUILD_PIPELINE.md

### User → Claude Code
- "Build phase X" → Claude Code reads specs, builds in `website/`
- "Fix [specific issue]" → Claude Code edits relevant file
- "Read [spec file]" → Claude Code reads Cowork's spec and executes

### Cowork → Claude Code (via spec documents)
- Cowork writes spec → User tells Claude Code to read it → Claude Code builds
- Cowork flags gap in pipeline doc → User tells Claude Code to fix → Claude Code fixes

### Claude Code → Cowork (via _audit/ and file state)
- Claude Code finishes → line counts change → Cowork snapshots and verifies
- Claude Code writes test output to `_audit/` → Cowork reviews

---

## 6. Phase Completion Checklist Template

For each phase, Cowork writes a `_audit/phaseX-report.md` with:

```markdown
# Phase X Verification Report
Date: YYYY-MM-DD HH:MM
Tool: Cowork

## File State Snapshot
[wc -l output for all key files]

## Locked File Integrity
predictor-engine.js: [X] lines — [PASS/FAIL]
clinical-atlas.js: [X] lines — [PASS/FAIL]
viva-forge.js: [X] lines — [PASS/FAIL]

## Cross-Contamination Scan
[grep results — should be empty]

## Visual Verification
[screenshot filenames in _audit/]

## Console Errors
[none / list]

## Mobile Layout
[375px test — PASS/FAIL]

## VERDICT: PASS / ISSUES
[If PASS → files promoted to _deploy/]
[If ISSUES → list specific issues for Claude Code to fix]
```
