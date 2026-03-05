# Cowork Handover — Session 9

**Date**: Mar 5, 2026
**From**: Claude Code Session 8
**To**: Next Cowork session
**Context**: Site is LIVE at https://mdexamprep.vercel.app/. All 3 features deployed. Auto-deploy pipeline active.

---

## What Happened in Session 8

1. Git initialized in project root
2. `.gitignore` created with root-anchored paths (critical: `/predictor/` not `predictor/`)
3. `vercel.json` created with 3-tier cache headers
4. GitHub repo created: https://github.com/PostgraduateAvi/mdexamprep (public)
5. Branch set to `main` (default), old `master` deleted
6. Vercel CLI installed (v50.27.1), project linked + GitHub connected
7. Production deployed via `vercel deploy --prod`
8. All 5 URLs verified HTTP 200, all cache headers verified correct
9. Auto-deploy pipeline tested (push -> live in ~30s)
10. All coordination docs updated (CLAUDE.md, INDEX.md, CO_BUILD_PIPELINE.md, GUARDRAILS.md, MEMORY.md)

## What's Live

| URL | Page | Status |
|-----|------|--------|
| https://mdexamprep.vercel.app/ | Landing | 200 OK |
| https://mdexamprep.vercel.app/predictor?demo=1 | Predictor demo | 200 OK |
| https://mdexamprep.vercel.app/predictor | Predictor input | 200 OK |
| https://mdexamprep.vercel.app/practicals | Practicals hub | 200 OK |
| https://mdexamprep.vercel.app/theory | Theory flashcards | 200 OK |

## Current Deployment Workflow

```
Claude Code edits website/
  -> git add + commit + push
    -> Vercel auto-deploys (~30s)
      -> Live at mdexamprep.vercel.app
```

`_deploy/` folder is RETIRED. Git provides rollback via `git revert`.

---

## Immediate Next Steps for Cowork

### Step 1: Visual QA on LIVE site (not localhost)
Open these in Chrome and verify:
- https://mdexamprep.vercel.app/ — Landing renders, trust line correct, all 3 cards link correctly
- https://mdexamprep.vercel.app/predictor?demo=1 — 38 topic cards load, stagger animation works
- https://mdexamprep.vercel.app/predictor — CHOOSE state with paste/upload tabs
- https://mdexamprep.vercel.app/practicals — Hub with 8 cards (2 live, 6 coming soon)
- https://mdexamprep.vercel.app/theory — Browse mode loads, quiz mode works, filters work
- Mobile viewport (375px) — nothing breaks on any page

### Step 2: Flashcard Data Decision
Two files exist in `website/theory/data/`:
- `flashcards.json` (310 cards) — original, used by theory.js
- `flashcards_clean.json` — Cowork's cleaned version

**Decision needed**: Is `flashcards_clean.json` ready to replace `flashcards.json`?
If yes: Claude Code swaps the file, updates card count if changed, commits + pushes.
Theory data cache is 1h, so users see update within the hour.

### Step 3: Cleanup (deferred from Session 7)
These files still exist in `website/predictor/data/` despite CLAUDE.md saying they were removed:
- `taxonomy-lite.json` (superseded by topic-dictionary.json)
- `test-fixture.json` (test data, not needed in production)

**Decision needed**: Safe to delete from git? They're being served publicly.

### Step 4: Theory Study Tools Evaluation
24 standalone HTML tools are in `website/theory/tools/` and being served:
- `paper-1/` and `paper-3/` contain exam-specific dashboards
- Should these be on the public site or removed?

---

## Files Claude Code Should Read in Next Session

1. `CLAUDE.md` — updated with Session 8 deployment architecture
2. `INDEX.md` — updated with deployment section + theory tools inventory
3. This file — for immediate context
