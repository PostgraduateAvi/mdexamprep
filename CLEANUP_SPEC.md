# Cleanup Spec — Project Directory Optimization

**Generated**: Mar 5, 2026 by Cowork audit
**Purpose**: Remove duplicates, dead files, and organize source material. Execute top-to-bottom.
**Rule**: Do NOT touch anything in `website/` except explicitly listed deletions.

---

## 1. DELETE — Exact Duplicates (source copies, website/ is canonical)

These 6 JSON files in `practicals/data/` are byte-identical to `website/practicals/data/`. Delete the SOURCE copies only. Keep `practicals/data/schema.json` (no website copy exists).

```bash
rm practicals/data/cardiac.json
rm practicals/data/general_cases.json
rm practicals/data/gi_specialty.json
rm practicals/data/neuro.json
rm practicals/data/respiratory.json
rm practicals/data/viva_forge_data.json
```

## 2. DELETE — Renamed Duplicates in predictor/data/

These 3 files are the pre-rename originals. The website copies (with kebab-case names) are canonical.

```bash
rm predictor/data/Systemic_KG_triples.json
rm predictor/data/Systemic_Portfolio_Quotas.json
rm predictor/data/Systemic_Ranked_List.json
```

## 3. DELETE — Dead Files Shipped in website/

`taxonomy-lite.json` is deprecated (43% accuracy, CLAUDE.md says use topic-dictionary.json). Zero references in any JS file. `test-fixture.json` is also unreferenced by any JS.

```bash
rm website/predictor/data/taxonomy-lite.json
rm website/predictor/data/test-fixture.json
```

## 4. DELETE — Unused Large Files at Root

```bash
rm Gemini_Generated_Image_k8zm2lk8zm2lk8zm.png
rm screenshot-desktop-features.png
```

The Gemini image (7.9 MB) is unused anywhere. `screenshot-desktop-features.png` is byte-identical (same MD5) to `screenshot-desktop-hero.png`.

## 5. MOVE — Root Screenshots to _audit/session4/

These 6 files are Session 4 captures. Newer versions exist in `_audit/now-*` and `_audit/phase1b-*`.

```bash
mkdir -p _audit/session4
mv screenshot-desktop-full.png _audit/session4/
mv screenshot-desktop-hero.png _audit/session4/
mv screenshot-mockup-full.png _audit/session4/
mv screenshot-mobile-full.png _audit/session4/
mv screenshot-practicals.png _audit/session4/
mv screenshot-predictor.png _audit/session4/
```

## 6. MOVE — Predictor Intermediate Working Files

These CSVs and the raw KG text file are processing intermediates, not source data and not used by the website. Move to a subfolder.

```bash
mkdir -p predictor/data/_intermediate
mv predictor/data/A__Ranked_Master_List__Draft_.csv predictor/data/_intermediate/
mv predictor/data/A__Ranked_Master_List__Refined_.csv predictor/data/_intermediate/
mv predictor/data/Common_Tokens__rough_topical_signals_.csv predictor/data/_intermediate/
mv predictor/data/Item_Counts_by_Year.csv predictor/data/_intermediate/
mv predictor/data/Recent_Advances_-_Consolidated_Items.csv predictor/data/_intermediate/
mv predictor/data/Systemic_Feature_Matrix.csv predictor/data/_intermediate/
mv predictor/data/recent_advances_one_off_recent.csv predictor/data/_intermediate/
mv predictor/data/raw_kg_edges.txt predictor/data/_intermediate/
mv predictor/data/notebooklm_basic_sciences_prompt_pack_all_topics.json predictor/data/_intermediate/
```

## 7. MOVE — Legacy Study Tools

52 standalone HTML files (4.5 MB) that predate the website architecture. Not referenced by any live page. Preserve as reference for future tool builds.

```bash
mkdir -p practicals/_legacy
mv practicals/study-tools practicals/_legacy/study-tools
```

## 8. MOVE — Flashcard Raw Sources

The 5 raw source files have been deduplicated into `unified_flashcards.json`. Archive them for provenance.

```bash
mkdir -p theory/flashcards/_raw
mv "theory/flashcards/Flash cards continued.txt" theory/flashcards/_raw/
mv "theory/flashcards/Full flashcards.txt" theory/flashcards/_raw/
mv theory/flashcards/flashcards.csv theory/flashcards/_raw/
mv theory/flashcards/Flashcards_Merged_GDocs.md theory/flashcards/_raw/
mv theory/flashcards/MD_Exam_Flashcards.tsv theory/flashcards/_raw/
```

## 9. DELETE — Orphaned ClinicalExamPrep/ Folder

Contains exactly 1 file that is a duplicate of `practicals/spec/COWORK_CONSOLIDATION_INSTRUCTIONS.md`.

```bash
rm -rf ClinicalExamPrep/
```

## 10. FIX — Stale INDEX.md References

Remove the 3 rows in the root file table (Section 1) that reference deleted methodology MDs:

- Delete the rows for `prediction_system_data_report.md`, `MD_PII_Prediction_Process_Complete.md`, `PIV_Prediction_Methodology_DataBrief.md` from the root table
- Update line that says `COLD_START_INSTRUCTIONS.md` is at root — it's actually in `docs/archive/`
- Update total file count after cleanup

## 11. ARCHIVE — Superseded Docs

Move `docs/archive/MANIFEST.md` deeper or add a note that INDEX.md supersedes it. Low priority — it's already in an archive folder.

---

## Verification After Cleanup

Run these checks after executing all steps:

```bash
# Confirm no broken references in website JS
grep -rn 'taxonomy-lite\|test-fixture' website/
# Expected: empty

# Confirm website JSON files all still exist
ls website/predictor/data/*.json | wc -l
# Expected: 7 (was 9, minus taxonomy-lite and test-fixture)

ls website/practicals/data/*.json | wc -l
# Expected: 6 (unchanged)

# Confirm practicals/data/ only has schema.json left
ls practicals/data/
# Expected: schema.json only

# Total file count reduction
find . -not -path './.git/*' -not -path './.claude/*' -not -path './.skills/*' -not -path './.local-plugins/*' -type f | wc -l
# Expected: ~230 (down from 253)

# Size check
du -sh . --exclude=.git --exclude=.claude --exclude=.skills --exclude=.local-plugins
# Expected: ~20MB (down from ~28MB, mainly from Gemini PNG deletion)
```

---

## What This Does NOT Touch

- All files in `website/` except the 2 dead JSON deletions (Steps 3)
- All LOCKED files (predictor-engine.js, clinical-atlas.js, viva-forge.js)
- All Excel source papers in `predictor/data/excel-papers/`
- ECG images in `practicals/ecg-images/` (source material for future tool)
- Harrison reference data in `theory/reference/` (needed for theory build)
- All root coordination MDs (CLAUDE.md, CO_BUILD_PIPELINE.md, GUARDRAILS.md, etc.)
- `_deploy/` folder structure
