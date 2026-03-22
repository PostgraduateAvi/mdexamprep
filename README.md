# MBBEasy

**Free, open-source exam preparation tools for MD Internal Medicine (General Medicine).**

Built on 987 real exam questions spanning 20 years of university papers. No login. No paywall. Runs entirely in your browser.

**Live at [mdexamprep.vercel.app](https://mdexamprep.vercel.app/)**

---

## What This Is

MBBEasy is a static website that helps postgraduate medical students prepare for their MD Internal Medicine (General Medicine) theory and practical examinations. It uses structural pattern analysis on past exam papers to predict which topics are most likely to appear next.

This is not a question bank. It is a **preparation strategy tool** -- it tells you *what to study* based on evidence, not guesswork.

---

## Tools

### Prediction Engine

Upload your university's past papers (PDF or Excel) and get a ranked list of the 44 most important topics to prepare. Each topic is scored using:

- **Historical frequency** across 20 years of papers
- **Recency weighting** (recent appearances count more)
- **Cross-paper convergence** (topics appearing across multiple paper types)
- **Slot-structure analysis** (the hidden framework examiners build papers around)
- **Knowledge-graph boosting** (clinically related topic clusters)

The engine works with any Indian medical university's MD Internal Medicine papers. A demo dataset (987 questions) is included to try instantly.

### Clinical Atlas

21 clinical cases across 5 body systems (Cardiovascular, Respiratory, Neurology, GI, General). Four study modes:

- **Atlas Mode** -- browse case presentations, examination findings, and differentials
- **Cross-Reference** -- compare similar cases side by side
- **Viva Drill** -- practice answering examiner questions with reveal-to-check
- **Quick Audit** -- track which cases you have reviewed

### Viva Forge

110 viva questions across 16 clinical cases, sourced from real examiner transcripts. Three modes:

- **Practice Mode** -- work through questions at your own pace
- **Stress Mode** -- countdown timer simulating exam pressure
- **Dialogue Mode** -- read full examiner-candidate transcripts

### Theory Flashcards

198 flashcards across 11 body systems with three difficulty levels. Browse by system or quiz yourself with Fisher-Yates shuffle randomization. Clinical Pearls are highlighted for quick revision.

### Interactive Study Tools

23 standalone study tools including drawable anatomy diagrams, pharmacology drills, investigation algorithms, and visual imprint exercises.

---

## Who This Is For

- **MD Internal Medicine / General Medicine** postgraduate students (Indian universities -- NMC/MCI curriculum)
- Students preparing for **theory papers** (Paper I, Paper II, Paper III, Paper IV)
- Students preparing for **practical/clinical examinations** and **viva voce**
- Anyone studying internal medicine who wants evidence-based study prioritization

---

## How the Prediction Engine Works

```
Past exam papers (PDF/Excel)
        |
        v
  Topic Dictionary (1,718 entries)
        |
        v
  Structural Slot Detection
        |
        v
  Multi-signal Convergence Scoring
  (frequency + recency + cross-paper + clinical relevance)
        |
        v
  Knowledge Graph Boosting
        |
        v
  Portfolio Quota Enforcement (max 4 per system)
        |
        v
  Ranked output: 38 predicted topics with rationale
```

All processing happens client-side in your browser. No data is uploaded to any server.

---

## Technical Details

- **Pure static site** -- HTML, CSS, and vanilla JavaScript. No frameworks, no build tools, no server.
- **Client-side processing** -- PDF parsing (PDF.js), Excel parsing (SheetJS), and topic matching all run in the browser.
- **Privacy-first** -- no analytics, no cookies, no tracking, no server-side processing. Your exam papers never leave your device.
- **Mobile-responsive** -- designed for the phone in your pocket during ward rounds.
- **Deployed on Vercel** -- fast global CDN, auto-deploys from this repo.

---

## Related Topics

This project covers content relevant to:

- MD Internal Medicine exam preparation (Indian universities)
- MD General Medicine theory and practicals
- DM entrance preparation (internal medicine foundation)
- MRCP-adjacent clinical reasoning (case-based learning)
- NMC/MCI postgraduate medical education curriculum
- Clinical case presentations for bedside examinations
- Viva voce preparation for postgraduate medicine
- Medical education technology (MedEdTech)
- Evidence-based study planning for medical exams
- Cardiovascular, Respiratory, Neurology, GI, Endocrinology, Nephrology, Hematology, Rheumatology, Infectious Disease, Dermatology, Psychiatry clinical cases

---

## Project Structure

```
website/
  index.html                  -- Landing page
  assets/css/core.css          -- Design system (Clinical Tech theme)
  assets/js/template.js        -- Shared navigation
  predictor/                   -- Prediction engine (UI + parser + data)
  practicals/                  -- Clinical Atlas + Viva Forge
  theory/                      -- Flashcards + Interactive study tools
```

---

## License

This project is provided free for educational use. No warranty. Not a substitute for clinical judgment or comprehensive study.

---

## Author

**Avinash Jothish** -- MD Internal Medicine postgraduate. Built this because exam preparation should be guided by evidence, not anxiety.

[Try it now](https://mdexamprep.vercel.app/) -- it takes 10 seconds.
