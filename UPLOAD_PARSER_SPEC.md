# Upload Parser Specification — Exact Column Mappings

## Purpose
This document tells Claude Code EXACTLY what the Excel/PDF files look like so `upload-parser.js` doesn't have to guess.

---

## Excel Format Analysis (25 sample papers analyzed)

### Format A — Simple (most common, 20 of 25 files)
```
Column A: "serial number" (integer 1-10)
Column B: "question" (full text string)
```
- Header row always present (row 0)
- Usually 10 rows of data (7 long essays + 3 short, or 10 total)
- Sheet name varies: paper name + year (e.g., "Systemic Medicine-2023", "Recent advances -2022")
- Some files have extra empty sheets (ignore them)

### Format B — Extended (5 of 25 files, e.g., Basic Science papers)
```
Column A: "Question_ID" (often empty)
Column B: "Serial_Number" (integer 1-10)
Column C: "Stem" (full question text)
Column D: "Tags" (often empty)
```
- Header row always present
- The actual question text is in the "Stem" column, NOT column B

### Format C — Combined/Consolidated files
```
Column A: "serial number" (integer)
Column B: "question" (text)
Column C: "Year" (integer like 2021)
Column D: "Subject" (like "Systemic Examination")
Column E: "SourceFile" (original filename)
Column F: "SourceSheet" (sheet name)
```
- These have many more rows (60-100+)
- Year and Subject columns are bonus data for frequency analysis

### Format D — Grand Questions Master Bank
```
Column A: "Question" (full text — NO serial number column)
Column B: "Subject" (e.g., "Basic Science", "Systemic Medicine")
Column C: "Year" (integer)
Column D: "SourceFile"
Column E: "SourceSheet"
```
- 226+ rows
- Has a README sheet (skip it)
- Main data on "Questions" sheet

---

## Parsing Rules for upload-parser.js

### Detection Logic (run in this order):

1. **Read all sheets. Skip any sheet named "README" or with 0 data rows.**

2. **Read header row (row 0). Detect format by header keywords:**
   - If headers include "question" (case-insensitive) → question column = that column
   - If headers include "stem" (case-insensitive) → question column = that column
   - If headers include "Question" and no serial number → Format D (master bank)
   - If neither found → treat column B (index 1) as question text, fallback to column A

3. **Extract year if available:**
   - If "Year" column exists → use it
   - Else → try to extract year from sheet name or filename using regex `/20\d{2}/`
   - Else → mark as "Unknown Year"

4. **Extract subject if available:**
   - If "Subject" column exists → use it
   - Else → try to extract from filename (e.g., "Systemic medicine-2023.xlsx" → "Systemic Medicine")

5. **For each row after the header:**
   - Read question text from the detected question column
   - Skip rows where question text is empty or less than 5 characters
   - Strip leading/trailing whitespace
   - Strip marks allocation patterns: `(10 marks)`, `(5+5)`, `10M`, etc.
   - Strip question numbering: leading `1.`, `Q1`, `1)`, `i.`, `a.`, etc.

---

## Question Text Patterns (for topic extraction)

Medical exam questions follow predictable patterns. The parser should extract **topic keywords** from these patterns:

### Pattern 1 — "Discuss X" (most common)
```
"Discuss aetiology, clinical features, investigations, and management in a case of Aortic dissection"
→ Topic keywords: ["Aortic dissection"]
```

### Pattern 2 — "Classify X. Discuss Y" (compound)
```
"Classify Haemolytic Anaemia. Discuss in detail Hereditary Spherocytosis"
→ Topic keywords: ["Haemolytic Anaemia", "Hereditary Spherocytosis"]
```

### Pattern 3 — Short topic name only
```
"Osteoporosis"
"Psoriatic Arthropathy"
"Delamanid"
→ Topic keywords: ["Osteoporosis"], ["Psoriatic Arthropathy"], ["Delamanid"]
```

### Pattern 4 — "Approach to X" / "Management of X"
```
"Approach to the patient with Acute Febrile illness"
→ Topic keywords: ["Acute Febrile illness"]
```

### Extraction Heuristic (simple, good enough):
1. Remove boilerplate prefixes: "Discuss", "Describe", "Classify", "Enumerate", "Define", "What are", "How will you", "List the", "Write a note on", "Short note on"
2. Remove boilerplate suffixes: "discuss", "describe its management", "with management", "and treatment"
3. Split on sentence boundaries (`.` followed by uppercase)
4. The remaining text chunks are your topic keyword strings
5. Each chunk gets fuzzy-matched against taxonomy-lite.json

---

## IMPORTANT: Use topic-dictionary.json, NOT taxonomy-lite.json

Cowork pre-tested the matching and found that `taxonomy-lite.json` alone gives only 43% accuracy (it's 90% Neurology entries). Instead, use **`website/predictor/data/topic-dictionary.json`** which is an enriched dictionary combining:
- 44 ranked list topics (exam-validated)
- 91 supplementary basic science topics (anatomy, physiology, pharmacology)
- 100+ supplementary clinical topics (common exam diseases)
- 1,513 taxonomy entries (filtered, >6 chars)
- **Total: 1,718 entries, 142KB, tested at 77.4% match rate across all 25 papers**

Also available: `website/predictor/data/system-keywords.json` — fallback system classifier for unmatched questions.
Also available: `website/predictor/data/medical-synonyms.json` — 32 abbreviation→full name pairs.

## Fuzzy Matching Spec

For each extracted question/topic string, match against topic-dictionary.json (1,718 entries):

### Step 1 — Exact substring (case-insensitive)
Does any taxonomy topic appear as a substring in the question text?
```
Question: "Discuss management of Autoimmune Hepatitis"
Taxonomy entry: "Autoimmune hepatitis" → MATCH
```

### Step 2 — Keyword overlap (Jaccard on word tokens)
Tokenize both strings into words (lowercase, remove stopwords like "the", "of", "and", "in", "a").
Compute overlap: `|intersection| / |union|`
Threshold: >= 0.3

```
Question tokens: ["management", "alcohol", "related", "nutritional", "deficiencies"]
Taxonomy tokens: ["nutritional", "deficiency"]
Overlap: 1 shared / 6 union = 0.17 → NO MATCH (below threshold)
```

### Step 3 — Medical synonym awareness (optional enhancement)
Common synonyms to normalize before matching:
- "DM" ↔ "Diabetes Mellitus"
- "HTN" ↔ "Hypertension"
- "CAD" ↔ "Coronary Artery Disease"
- "CKD" ↔ "Chronic Kidney Disease"
- "AKI" ↔ "Acute Kidney Injury"
- "TB" ↔ "Tuberculosis"
- "SLE" ↔ "Systemic Lupus Erythematosus"
- "RA" ↔ "Rheumatoid Arthritis"
- "COPD" ↔ "Chronic Obstructive Pulmonary Disease"
- "MI" ↔ "Myocardial Infarction"
- "GBS" ↔ "Guillain-Barre Syndrome"
- "DVT" ↔ "Deep Vein Thrombosis"
- "PE" ↔ "Pulmonary Embolism"
- "ILD" ↔ "Interstitial Lung Disease"

---

## Output Format

The parser must output an array in the SAME shape as `ranked-list.json` so it feeds directly into `PredictorEngine.rank()`:

```json
[
  {
    "rank": 1,
    "canonical_topic": "Aortic Dissection",
    "system": "Cardiology",
    "reason_codes": ["Algorithm↑", "Recency↑"],
    "anchor_pages": [],
    "what_to_memorize": "Matched from uploaded papers — appeared in 3 papers (2020, 2022, 2023)"
  }
]
```

### Scoring rules for reason_codes:
- Appeared in 3+ papers → `["Algorithm↑", "Recency↑"]`
- Appeared in 2 papers → `["Algorithm↑"]`
- Appeared in 1 paper, most recent year → `["Recency↑"]`
- Appeared in 1 paper, older year → `["Foundation↑"]`

### Rank assignment:
- Sort by frequency descending, then recency descending
- Assign rank 1, 2, 3... sequentially

### what_to_memorize field:
- Generate from matched data: `"Matched from uploaded papers — appeared in {count} paper(s) ({years joined by comma})"`

---

## Test File for Verification

Use `predictor/data/excel-papers/Systemic_Medicine_2023.xlsx` as the primary test case.

Expected output (7 questions → should match at least 5 topics):
1. "Aortic dissection" → Cardiology
2. "Interstitial lung disease" → Respiratory
3. "Hypertensive Emergencies" → Cardiology
4. "Haemolytic Anaemia" / "Hereditary Spherocytosis" → Hematology
5. "SGLT-2 inhibitors" → Endocrinology (may need synonym matching)
6. "Autoimmune Hepatitis" → Gastrointestinal
7. "Psoriatic Arthropathy" → Rheumatology
