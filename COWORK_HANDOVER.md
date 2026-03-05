# Cowork Handover — Session 8

**Date**: Mar 5, 2026
**From**: Cowork Session 7
**To**: Next Cowork session
**Context**: Claude Code has completed the theory build. All three sections are now functional. Pre-deployment verification needed.

---

## What Happened in Session 7

1. Full project audit completed (directory structure, duplicates, dead files, data pipeline)
2. `CLEANUP_SPEC.md` written — 11-step cleanup plan for Claude Code
3. `THEORY_BUILD_SPEC.md` written — 288-line build spec for theory section
4. Theory data staged: `website/theory/data/flashcards.json` (310 cards, validated)
5. `CLAUDE.md` updated to reflect Session 7 state
6. Claude Code executed: trust line fix, theory feature card activation, theory section build, predictor tab UI

## Current State of website/

All three sections are now live:

| Section | Files | Status |
|---------|-------|--------|
| Landing | `index.html` (129 lines) | Done — trust line says "Avinash Jothish", all 3 feature cards show "Live" |
| Predictor | `predictor/` (4 files) | Done — demo mode, text paste, file upload all wired |
| Practicals | `practicals/` (6 files + 6 JSON) | Done — 2 of 8 tools live (Atlas, Viva Forge) |
| Theory | `theory/` (3 files + 1 JSON) | NEW — built by Claude Code, needs visual QA |

## What Cleanup Has Been Done

Check with Claude Code whether `CLEANUP_SPEC.md` was executed. If not, tell Claude Code to execute it. Key items:
- Delete duplicate JSONs in `practicals/data/` (6 files, source copies)
- Delete `taxonomy-lite.json` and `test-fixture.json` from `website/predictor/data/`
- Delete `Gemini_Generated_Image*.png` (7.9 MB)
- Move root screenshots to `_audit/session4/`
- Move intermediate CSVs to `predictor/data/_intermediate/`

---

## Cowork's Role (Corrected)

**Cowork is NOT a builder. Cowork is a verifier and data prepper.**

### What Cowork DOES:
- **Visual QA**: Open pages in browser, take screenshots, check rendering, catch what terminal can't see
- **Data preparation**: Parse, clean, validate, stage data files for Claude Code to consume
- **Spec writing**: Architecture decisions, build specs, coordination docs
- **Project memory**: Keep CLAUDE.md, INDEX.md current
- **Dynamic verification**: After Claude Code makes changes, verify the results visually and functionally

### What Cowork does NOT do:
- Write HTML/JS/CSS code
- Deploy to Vercel (Claude Code does this — it has native terminal + git access)
- Edit files in `website/` (that's Claude Code's territory)
- Run build scripts or package installations
- Any task that Claude Code can do better (which is most technical tasks)

### The handshake pattern:
```
Cowork preps data + writes spec
  → Claude Code builds from spec
    → Cowork verifies the build visually
      → Claude Code deploys
```

---

## Immediate Next Steps for This Session

### Step 1: Visual QA (Cowork)
Start local server and check all pages:
```
http://localhost:8080                              — Landing
http://localhost:8080/predictor/index.html?demo=1  — Predictor demo
http://localhost:8080/predictor/index.html         — Predictor input
http://localhost:8080/practicals/index.html        — Practicals hub
http://localhost:8080/practicals/clinical-atlas.html — Clinical Atlas
http://localhost:8080/practicals/viva-forge.html   — Viva Forge
http://localhost:8080/theory/index.html            — Theory (NEW)
```

Check for:
- Pages load without console errors
- Theory browse mode: 11 system groups render with flashcards
- Theory quiz mode: single card view, next/prev, shuffle
- Theory filters: system and difficulty pills work
- Landing page: all 3 feature cards link correctly and show "Live"
- Trust line: "Built by Avinash Jothish" (not "MD candidate")
- Predictor: text paste tab works, demo mode works
- Mobile viewport (375px): nothing breaks

### Step 2: Report Issues (Cowork → Claude Code)
If QA finds issues, write them as a numbered list. Claude Code fixes them.

### Step 3: Deployment (Claude Code)
Once QA passes, Claude Code deploys `website/` to Vercel.

### Step 4: Post-Deploy Verification (Cowork)
Check the live Vercel URL. Confirm all pages work on public internet.

---

## Files Claude Code Should Read

1. `CLAUDE.md` — project memory (220 lines, updated Session 7)
2. `THEORY_BUILD_SPEC.md` — what was built and why (288 lines)
3. `CLEANUP_SPEC.md` — if not yet executed
