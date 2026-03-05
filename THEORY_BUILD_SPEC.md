# Theory Section Build Spec

**Written by**: Cowork (Mar 5, 2026)
**For**: Claude Code execution
**Priority**: Pilot deployment blocker
**Constraint**: Static HTML/JS only. No framework. Must match existing design system in `core.css`.

---

## What to Build

Two files following the two-file pattern:

```
website/theory/index.html    -- page shell
website/theory/theory.js     -- logic + rendering
```

Plus one data file copied from source:

```
website/theory/data/flashcards.json   -- copy of theory/flashcards/unified_flashcards.json
```

---

## Data Shape (READ THIS FIRST)

`unified_flashcards.json` is a JSON array of 310 objects. Each object:

```json
{
  "id": "fc_0001",
  "question": "Sacubitril / Valsartan combination ( ARNI )",
  "answer": "Why: ACE inhibitors and ARBs have limitations in heart failure → What: Neprilysin inhibitor (sacubitril) combined with ARB (valsartan) → How: Neprilysin breaks down natriuretic peptides...",
  "system": "CVS",
  "topic": "ARNI (Sacubitril/Valsartan)",
  "difficulty": "basic" | "intermediate" | "advanced",
  "source": "flashcards.csv",
  "also_from": ["Flash cards continued.txt"]   // optional
}
```

### System distribution (11 systems)
```
Neuro: 74, Endocrine: 43, Renal: 42, General: 37, CVS: 36,
ID: 29, Rheum: 17, Heme: 12, GI: 9, RS: 8, Derm: 3
```

### Difficulty distribution
```
basic: 90, intermediate: 162, advanced: 58
```

### Answer characteristics
- Average length: 260 chars
- Range: 3 to 1,103 chars
- 140 cards have answers > 200 chars (substantial)
- 18 cards have answers < 50 chars (terse)
- Answers use `→` arrows for causal chains, `\n` for sections
- Some answers contain "Clinical Pearl:" callouts

---

## Page Architecture

### Layout
Same pattern as practicals hub (`practicals/index.html`):
- `template.js` injects nav + footer (back-link to landing)
- Hero section with title + description + stats row
- Main content area with flashcard deck

### Three Modes

**1. Browse Mode** (default)
- Cards displayed in a scrollable list grouped by system
- System headers act as collapsible accordion sections
- Each card shows: question (visible), answer (hidden behind reveal button)
- Click "Show Answer" → answer slides open
- Click again → collapses

**2. Quiz Mode**
- Single card at a time, centered
- Question displayed, answer hidden
- Three buttons: "Show Answer", "Next", "Previous"
- Progress indicator: "Card 14 of 310"
- Shuffle option (button in toolbar)

**3. Filter Bar** (persistent across modes)
- System filter: dropdown or pill buttons for 11 systems + "All"
- Difficulty filter: 3 toggle pills (Basic / Intermediate / Advanced)
- Filters are combinable: e.g., "CVS" + "Advanced" = 2 cards
- Active filter count shown: "Showing 36 of 310"

### Stats Row (below hero, above content)
```
310 flashcards  ·  11 systems  ·  3 difficulty levels
```

---

## HTML Shell (`theory/index.html`)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Theory Study Tools — MD Exam Prep</title>
  <meta name="description" content="310 flashcards across 11 medical systems. Browse, filter, and quiz yourself on MD Internal Medicine theory topics.">
  <link rel="stylesheet" href="../assets/css/core.css">
  <link rel="stylesheet" href="theory.css">
</head>
<body>
  <div id="site-nav"></div>
  <main class="container">
    <!-- Hero -->
    <!-- Stats row -->
    <!-- Mode toggle: Browse | Quiz -->
    <!-- Filter bar: system pills + difficulty pills -->
    <!-- Filter status: "Showing X of 310" -->
    <!-- Content area: #flashcard-deck -->
  </main>
  <div id="site-footer"></div>
  <script src="../assets/js/template.js"></script>
  <script src="theory.js"></script>
</body>
</html>
```

Claude Code: flesh this out with actual HTML. Follow the structure comments above. The hero section should mirror practicals hub style (see `practicals/index.html` lines 116-140 for reference).

---

## CSS (`theory/theory.css`)

Create a new file. Use existing CSS variables from `core.css`. Key classes needed:

```
.theory-hero          -- same padding as .practicals-hero
.mode-toggles         -- horizontal button group (reuse .view-toggles pattern from predictor)
.filter-bar           -- horizontal row of pills, wraps on mobile
.filter-pill           -- small toggleable button
.filter-pill.active   -- accent border + accent-dim background
.flashcard-group      -- system section with collapsible header
.flashcard-group-header  -- system name + count, clickable to collapse
.flashcard            -- single card (reuse .card class from core.css)
.flashcard-question   -- question text, always visible
.flashcard-answer     -- answer text, hidden by default
.flashcard-answer.revealed  -- visible state
.flashcard-meta       -- difficulty tag + system tag row
.flashcard-reveal-btn -- "Show Answer" / "Hide Answer" toggle
.quiz-container       -- centered single-card view for quiz mode
.quiz-nav             -- prev/next/shuffle buttons
.quiz-progress        -- "Card X of Y" indicator
```

Responsive: stack filter pills vertically at < 640px. Cards full-width on mobile.

---

## JS Logic (`theory/theory.js`)

IIFE pattern matching `predictor-ui.js` style:

```javascript
var TheoryUI = (function () {
  'use strict';

  var MODE = { BROWSE: 'browse', QUIZ: 'quiz' };
  var currentMode = MODE.BROWSE;
  var allCards = [];
  var filteredCards = [];
  var activeSystem = 'all';
  var activeDifficulties = { basic: true, intermediate: true, advanced: true };
  var quizIndex = 0;
  var isShuffled = false;

  // Systems in display order (by count descending)
  var SYSTEM_ORDER = ['Neuro','Endocrine','Renal','General','CVS','ID','Rheum','Heme','GI','RS','Derm'];

  function init() {
    fetch('data/flashcards.json')
      .then(function(r) { return r.json(); })
      .then(function(cards) {
        allCards = cards;
        applyFilters();
        renderBrowseView();
        wireEvents();
      });
  }

  function applyFilters() { /* filter allCards by activeSystem + activeDifficulties */ }
  function renderBrowseView() { /* grouped by system, accordion sections */ }
  function renderQuizView() { /* single card, centered */ }
  function toggleAnswer(cardId) { /* show/hide answer */ }
  function nextCard() { /* quiz mode navigation */ }
  function prevCard() { /* quiz mode navigation */ }
  function shuffleCards() { /* Fisher-Yates shuffle on filteredCards */ }
  function setMode(mode) { /* switch between browse and quiz */ }
  function setSystemFilter(system) { /* 'all' or specific system */ }
  function toggleDifficulty(diff) { /* toggle basic/intermediate/advanced */ }
  function updateFilterStatus() { /* "Showing X of 310" */ }
  function wireEvents() { /* event delegation for all buttons */ }

  document.addEventListener('DOMContentLoaded', init);
  return { toggleAnswer: toggleAnswer };
})();
```

Claude Code: implement all functions. Key behaviors:

1. **Browse view**: Group cards by system using `SYSTEM_ORDER`. Each group is a collapsible section. Default: all expanded. Click header to toggle.

2. **Quiz view**: Show one card at a time. "Show Answer" reveals answer with slide-down animation. "Next" advances (wraps to first). Progress bar shows position.

3. **Filters**: System pills highlight on click (only one active, or "All"). Difficulty pills are multi-select toggles. Both update `filteredCards` and re-render current view.

4. **Answer rendering**: Answers may contain `\n` — convert to `<br>`. Look for "Clinical Pearl:" prefix and wrap in a styled callout `<div class="clinical-pearl">`.

5. **localStorage**: Save filter state and quiz position so returning users resume where they left off. Key: `theory-filters` and `theory-quiz-pos`.

---

## Data File Setup

```bash
mkdir -p website/theory/data
cp theory/flashcards/unified_flashcards.json website/theory/data/flashcards.json
```

---

## Landing Page Update

In `website/index.html`, the Theory feature card (lines 109-116) currently shows "Coming Soon":

```html
<div class="feature-card feature-card--disabled">
```

Change to a live link:

```html
<a href="theory/index.html" class="feature-card">
```

And change the tag from `tag-muted` "Coming Soon" to `tag-gold` "Live" with an arrow:

```html
<div class="feature-meta">
  <span class="tag tag-gold">Live</span>
  <span class="feature-arrow">&rarr;</span>
</div>
```

---

## What NOT to Do

- Do NOT modify `core.css` — create `theory.css` for all new styles
- Do NOT modify any LOCKED files
- Do NOT add cross-links to predictor or practicals from theory
- Do NOT fetch from external APIs — all data is local JSON
- Do NOT use any framework or build tool

---

## Verification Checklist

After building, confirm:

```bash
# Files created
ls -la website/theory/index.html website/theory/theory.js website/theory/theory.css website/theory/data/flashcards.json

# Line counts reasonable
wc -l website/theory/index.html website/theory/theory.js website/theory/theory.css

# No console errors (run local server and check)
# Browse mode: 11 system groups visible, cards render
# Quiz mode: single card, next/prev work, shuffle works
# Filters: system filter reduces card count, difficulty toggles work
# Answer reveal: click shows answer, click again hides
# Landing page: Theory card now shows "Live" and links to theory/index.html
# Back-link: template.js injects "← MD Exam Prep" link at top
```
