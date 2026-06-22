# Handoff: fix·your·skills

## Overview
**fix-your-skills** is a single-user web app: a personal training gym for coding *judgment*. The user
configures their stack, generates a coding practice task scoped to it, solves it in an in-browser
editor, gets an AI **review** (score + verdict + teaching), and every review is distilled into a
searchable **note**. Weak areas feed back into the profile so the next task is smarter.

This handoff covers the **complete visual design + all four screens + the full core loop**, in a
dark-first "warm slate" theme.

Core loop:
```
Profile → Generate task → Solve in editor → AI review → Note saved → Weak areas update → next task smarter
```

## About the Design Files
The file in this bundle — `fix-your-skills.prototype.html` — is a **design reference created in
HTML**. It is an interactive prototype showing intended look, layout, and behavior. **It is not
production code to copy directly.** The inline styles, the hand-rolled markdown renderer, and the
mock code-editor (a textarea + line-number gutter) exist only to make the prototype self-contained.

Your task is to **recreate this design in the target codebase** — Next.js (App Router) + React +
**Tailwind CSS v4** — using its established patterns:
- Replace the prototype's mock editor with a real **Monaco** editor (`@monaco-editor/react`).
- Replace the prototype's markdown parser with **`react-markdown` + `remark-gfm`**.
- Translate inline styles into Tailwind utilities driven by the design tokens below.

Open the prototype in a browser to feel the interactions; use this README as the source of truth
for exact values.

## Fidelity
**High-fidelity (hifi).** Final colors, typography, spacing, radii, and interactions are decided.
Recreate the UI pixel-faithfully using the codebase's libraries. The numbers in this README are the
spec.

---

## Design Tokens

Put these in `app/globals.css` under Tailwind v4 `@theme` so every utility (`bg-surface`,
`text-accent`, `border-border`…) is generated:

```css
@theme {
  /* surfaces (warm-slate dark) */
  --color-bg:          #1a1817;  /* page background */
  --color-surface:     #1e1b19;  /* cards: statement, constraints, notes, task rows */
  --color-raised:      #211e1b;  /* profile summary card, generate cards */
  --color-code:        #121117;  /* code surfaces (fenced blocks, editor body) */
  --color-code-gutter: #15140f;  /* editor line-number gutter */

  /* borders */
  --color-border:      #2e2a25;  /* default card border */
  --color-border-soft: #2a2722;  /* dividers, nav border, row separators */
  --color-border-2:    #322e29;  /* raised card border */
  --color-input-border:#34302c;  /* inputs, chips, segmented control */

  /* text */
  --color-text:    #edeae4;  /* primary */
  --color-text-2:  #948e83;  /* secondary / meta */
  --color-muted:   #8a8378;  /* labels, uppercase eyebrows */
  --color-prose:   #d7d2c9;  /* markdown body text */

  /* accent (violet) */
  --color-accent:      #7c6cff;  /* primary buttons, links, active states, list markers */
  --color-accent-hi:   #9486ff;  /* hover, link text */
  --color-accent-soft: #c9a9f0;  /* text on accent-tinted chips */

  /* semantic */
  --color-pos:     #59c2a0;  /* pass / reviewed / auto-testable (green) */
  --color-caution: #e3a857;  /* needs-work / major (amber) */
  --color-neg:     #e0746e;  /* fail / blocker (red) */

  /* type */
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;
}
```

**Accent-tinted chip recipe** (weak-area tags, meta chips): bg `rgba(124,108,255,0.10)`, border
`rgba(124,108,255,0.26)`, text `#c9a9f0`.

### Typography
- **UI:** Inter. Weights used: 400 / 450 / 500 / 600 / 700.
- **Code & data:** JetBrains Mono (weights 400 / 500 / 600). Also used for the wordmark, stack value,
  meta lines, scores, dates, all chips/badges, file names, line numbers.
- Load both from Google Fonts.
- Headings use `letter-spacing: -0.01em` to `-0.02em`. Body line-height ~1.5–1.7; prose 1.72.

Type scale (px): page H1 24–25 / section H2 18 / card title 14.5–16 / body 14–15 / meta & chips 11–13 /
eyebrow labels 11 uppercase `letter-spacing:0.09em`. Big score number 30. Stack value 27.

### Spacing / Radius / Shadow
- **Content container:** `max-width: 1080px`, horizontal padding 32px, centered. Nav height 60px.
- **Radii:** cards 12–14px · buttons/inputs 9–10px · chips/badges 6–7px · pills/dots 50%.
- **Card padding:** 22–26px. Section gaps 28–38px.
- **Shadows:** accent button `0 4–6px 16–20px rgba(124,108,255,0.30)`; editor frame
  `0 8px 30px rgba(0,0,0,0.25)`. Cards are mostly flat (1px borders, occasional inset highlight).
- **Motion:** hover transitions 0.12–0.14s. Generate-card hover lifts `translateY(-2px)`.
  ⚠ **Do not** use a continuously-mounted entrance animation that starts at `opacity:0` — in a
  re-rendering React tree it can stick at 0. If you want entrance fades, gate them to mount only.

---

## Global Shell (every screen)

- **Top nav** — sticky, full width, `height:60px`, `bg: rgba(26,24,23,0.82)` + `backdrop-blur(14px)`,
  bottom border `--color-border-soft`.
  - Left: wordmark **`fix·your·skills`** in JetBrains Mono 15px/600, the `·` separators in
    `--color-accent`. Preceded by a 22px rounded-square logo: `linear-gradient(135deg,#8d7eff,#6a59e0)`
    with a small 8px white square inside, accent glow shadow.
  - Right: three nav buttons — **Dashboard · Profile · Notes**.
    - Active: `bg:#2a2621`, `text:--color-text`, radius 8px, padding 7×13.
    - Inactive: transparent, `text:--color-text-2`.
- **Content container:** centered 1080px, padding `36px 32px 96px`.

---

## Screens / Views

### 1. Dashboard (`/`)
**Purpose:** launchpad — see profile, generate a task, resume recent ones.

**Layout:** single column inside the container. Order: mock banner → profile card → generate section
→ recent tasks.

- **Mock-mode banner** (conditional, dismissible) — shown when no API key. Amber/informational:
  bg `rgba(227,168,87,0.08)`, border `rgba(227,168,87,0.26)`, radius 10px, padding 13×15. Left: 18px
  round `i` glyph in amber. Text: **"Mock mode"** (bold) + "— no API key set. Tasks and reviews are
  sample data." Right: `×` dismiss button. Hidden once dismissed (state).
- **Profile summary card** — `--color-raised`, border `--color-border-2`, radius 14px, padding 24×26.
  - Eyebrow "YOUR TRAINING PROFILE" (muted, uppercase) + "Edit →" link (accent) top-right → `/profile`.
  - **Stack** value big: JetBrains Mono 27px/600, `--color-text`. (e.g. `roblox + knit + luau`)
  - Row: **level** chip (bg `#2a2621`, border `#38332c`, a 6px accent dot + capitalized level) +
    optional **goals** one-liner (`--color-text-2`).
  - "WEAK AREAS" eyebrow, then accent-tinted chips (JetBrains Mono 12px, `white-space:nowrap`). May be
    empty → italic "None tracked yet — they'll appear as you get reviews."
- **Generate section** — heading "Generate a new task" + "scoped to your stack" hint.
  - **4 cards in one row** (`grid-template-columns: repeat(4,1fr)`, gap 13px). Each: radius 13px,
    padding 17×18, left-aligned. Top row = a 22px geometric glyph + (when loading) a spinner.
    Then title 14.5px/600 + 12px muted description.
    - **Mini-feature** — square outline glyph — "implement a small realistic feature"
    - **System design** — circle outline glyph — "architecture & trade-offs"
    - **Debug / refactor** — diamond outline (rotated square) — "fix broken or messy code"
    - **Surprise me** — accented: bg `linear-gradient(160deg, rgba(124,108,255,0.14), rgba(124,108,255,0.05))`,
      border `rgba(124,108,255,0.40)`, filled accent diamond glyph — "auto-picks a type for you"
    - **Hover:** `translateY(-2px)`, border brightens. Plain cards bg `#211e1b` → `#262320`.
  - **Loading state:** on click, the clicked card shows a spinner; **all** cards drop to `opacity:0.5`
    and become non-interactive (`generating` state). After ~1.25s → navigate to the new task.
- **Recent tasks** — heading + list. Container border `#2e2a25`, radius 12px, rows separated by
  1px `--color-border-soft`. Each row (newest first): title 14.5px/500 (truncates) + meta line
  `taskType · language` in JetBrains Mono 12px muted; right: **status badge**.
  - `open` badge: neutral — text `#9b958a`, bg `#26231e`, border `#38332c`.
  - `reviewed` badge: positive — text `#6fd6b3`, bg `rgba(89,194,160,0.12)`, border `rgba(89,194,160,0.28)`.
  - Both: JetBrains Mono 11px/600 uppercase, radius 6px. Row hover bg `#262320`.
  - **Empty state:** dashed-border box "No tasks yet — pick a type above to generate your first task."

### 2. Profile (`/profile`)
**Purpose:** configure stack / level / goals. Single column, `max-width:600px`, centered.

- H1 "Profile" + subtitle "Tune what the gym trains. Tasks are generated against this."
- **Stack** — labeled text input (JetBrains Mono 14px). Input style: bg `--color-surface`, border
  `--color-input-border`, radius 10px, padding 12×14. **Focus:** border `--color-accent` +
  `box-shadow: 0 0 0 3px rgba(124,108,255,0.15)`. **Required** — on empty save show error
  "Stack is required." in `--color-neg` below the field.
  - Below: **preset chips** that fill the field on click (JetBrains Mono 12px, bg `#221f1d`, border
    `#34302c`, radius 7px). Hover → accent border + tint. Presets:
    `roblox + flamework + roblox-ts` · `roblox + knit + luau` · `roblox + luau (vanilla)`.
- **Level** — **segmented control**: inline-flex container bg `#211e1b`, border `#34302c`, radius 9px,
  3px padding. Three options junior / middle / senior. Active segment: bg `--color-accent`, white
  text, radius 7px, padding 7×18. Inactive: transparent, text `#a89fb8`.
- **Goals** — optional textarea (Inter 14px, 3 rows, `resize:vertical`), same input/focus styling.
- **Save profile** — primary accent button. On save: validate stack → write profile → flash "✓ Saved"
  (green) → return to Dashboard (~0.65s). Saving also persists for the session.

### 3. Task (`/task/[id]`) — the workbench (most important screen)
**Purpose:** read the problem, write the solution, submit for review. Two columns on wide
(`grid-template-columns: 1fr 1fr`, gap 28px, `align-items:start`); **stacks to one column** on narrow.
Above columns: "← Dashboard" back link (`--color-text-2`, hover lighter).

**Left column — the problem:**
- **Meta chips row:** `taskType` chip, `language` chip (both neutral JetBrains Mono 11.5px, bg
  `#221f1d`, border `#34302c`), + **verification badge**:
  - `auto-testable` → positive (green text/tint).
  - `review-only` → neutral.
- **Title** — 25px/600, `--color-text`, `letter-spacing:-0.02em`.
- **Statement card** — `--color-surface`, border `--color-border`, radius 13px, padding 24×26.
  Renders **markdown** (the primary reading surface — nail the prose, see Markdown spec).
- **Constraints card** — eyebrow "CONSTRAINTS" + custom bulleted list (5px accent dot + 14px text,
  gap 10px). No native bullets.
- **Hints card** — collapsed by default. Header button "Show hints (N)" / "Hide hints" with a rotating
  `⌄` chevron. Expanded: muted bulleted list (JetBrains Mono `»` markers, 13.5px `--color-text-2`).

**Right column — the solution (sticky, `top:84px`):**
- Eyebrow "YOUR SOLUTION".
- **Editor frame** — border `#2b2823`, radius 12px, `bg:--color-code`, shadow `0 8px 30px rgba(0,0,0,0.25)`.
  - **Header bar:** bg `#1a1816`, bottom border `#26231e`, padding 11×14. Three 11px gray dots
    (`#3a3530`), the **file name** (JetBrains Mono 12px `#7a746a`), and the language right-aligned.
  - **Body:** 460px tall. **In production this is Monaco** — `@monaco-editor/react`, theme `vs-dark`
    (or a custom theme matching `--color-code`), `minimap:false`, line numbers on, JetBrains Mono 13px,
    line-height 21px, the task's `starterCode` as initial value. The prototype fakes this with a
    gutter + textarea; keep the **frame**, swap the **internals** for Monaco.
- **Submit button** — full-width primary accent. Label cycles:
  `Submit for review` → (loading, disabled, spinner) `Reviewing…` → `Re-submit for review` (once a
  review exists). Show inline error text on failure.

**Review panel** — appears **below both columns, full width** after submit. The reward moment.
- Separated by a top border + `padding-top:36px`.
- **Loading:** while `reviewing`, show skeleton blocks (pulsing `--color-raised` rectangles) where the
  panel will be (~1.6s in mock).
- **Header row:** a **score ring** + verdict.
  - **Score ring (signature element):** 104px circle, `conic-gradient(<color> <score×3.6deg>, #2c2823 ...)`
    with a 7px inner punch-out (`bg:--color-bg`) so it reads as a ring. Center: big JetBrains Mono
    30px/600 score + tiny "SCORE" label. Ring color by score: `≥80 → --color-pos`, `≥55 → --color-caution`,
    else `--color-neg`.
  - **Verdict badge** (JetBrains Mono 13px/600 uppercase, radius 8px, padding 6×14):
    - `pass` → green: text `#7ad9b8`, bg `rgba(89,194,160,0.14)`, border `rgba(89,194,160,0.40)`.
    - `needs-work` → amber: text `#ecc07f`, bg `rgba(227,168,87,0.14)`, border `rgba(227,168,87,0.40)`.
    - `fail` → red: text `#e89490`, bg `rgba(224,116,110,0.14)`, border `rgba(224,116,110,0.40)`.
  - Plus a one-line verdict note next to it.
- **Sections** (each: H3 title + a 1px divider line filling remaining width):
  - **Correctness** — summary paragraph + **issues** list. Each issue is a card (`--color-surface`,
    border `--color-border`, **left border 3px in severity color**, radius 10px) with a **severity tag**
    + description. Severity system (JetBrains Mono 10.5px uppercase, radius 5px):
    - `blocker` → red (left border `#e0746e`).
    - `major` → amber (left border `#e3a857`).
    - `minor` → accent/neutral (left border `#7c6cff`).
  - **Idiomatic quality** — summary paragraph + accent-dot bulleted suggestions.
  - **Trade-offs** — one paragraph.
  - **What to learn next** — bulleted list with JetBrains Mono `→` markers.
  - **"Saved to your notes" callout** — accent-tinted: bg
    `linear-gradient(135deg, rgba(124,108,255,0.10), rgba(124,108,255,0.04))`, border
    `rgba(124,108,255,0.30)`, radius 14px. Contains a ✓ "SAVED TO YOUR NOTES" eyebrow, an inner card
    with the **note title** + note **markdown**, a row of weak-area **tag chips**, and an
    "Open Notes archive →" link.

**Other states:** task-not-found → dashed box "Task not found" + "Back to Dashboard" button.

### 4. Notes archive (`/notes`)
**Purpose:** searchable study log. Newest first.

- **Header row:** H1 "Notes" + subtitle "Distilled lessons from your reviews." On the right, a
  **search input** (260px, leading `⌕` glyph, same input/focus styling). Debounced; filters by note
  title, content, and tags.
- **Note cards** — `--color-surface`, border `--color-border`, radius 13px, padding 22×24. Each:
  title 16px/600 + **date** (JetBrains Mono 11.5px muted, right-aligned) → note **markdown** →
  footer row: tag chips (accent-tinted, `nowrap`) + optional "View task →" link (navigates to the task).
- **Empty state:** dashed box "No notes yet — submit a task for review and a note is created
  automatically."
- **No-results state:** dashed box `No notes match "<query>".`

---

## Markdown / Prose Spec
Used in: task statement, review note, note cards. In production use **`react-markdown` + `remark-gfm`**
(tables) and style these elements (prototype class `.md`, base 15px/1.72, color `--color-prose`):

- **h1–h4:** `--color-text`, 600, `letter-spacing:-0.01em`, margins `22 0 10`. Sizes 21/17.5/15/13.
  h4 is uppercase `letter-spacing:0.06em` muted.
- **p:** margin `12 0`. **strong:** `#f3f0ea`/600.
- **ul/ol:** padding-left 21, item gap; **list markers** in `--color-accent`.
- **inline code:** JetBrains Mono 0.85em, bg `#26221d`, border `#38332c`, radius 5px, text `#e8c79c`.
- **pre (fenced):** bg `--color-code`, border `#2b2823`, radius 9px, padding 15×17, scrollable.
  `pre code` text `#cfc8bd`, 13px/1.65, no chip styling.
- **a:** `--color-accent-hi`, underline via 1px bottom border `rgba(148,134,255,0.32)` → solid on hover.
- **table:** full width, collapsed borders `#34302a`, th bg `#221f1b`/600, cells padding 8×12.
- **blockquote:** 2px accent left border, muted text. **hr:** 1px `#322f2a`.

---

## Interactions & Behavior
- **Generate:** click a card → set `generating=type`, disable+dim cards, spinner on clicked card →
  ~1.25s → create a task scoped to the type (surprise picks randomly), navigate to `/task/[id]`.
- **Solve:** editor is controlled; Tab inserts 4 spaces; line-number gutter scroll-syncs with the
  editor (Monaco handles this natively).
- **Submit:** `reviewing=true` → skeletons → ~1.6s → attach review, set task `status='reviewed'`,
  create a note (if not already present for that task), **merge the review's weak-area tags into the
  profile**, flip button to "Re-submit for review", reveal the review panel.
- **Profile save:** validate stack (required) → persist → "✓ Saved" → back to Dashboard.
- **Notes search:** debounced filter across title/content/tags; switches between results / no-results.
- **Responsive:** Task two columns → stacked (problem, editor, review) on narrow; generate cards
  4-in-a-row → 2×2; nav keeps all three links reachable.

## State Management
Per the data shapes below. Minimum client state: `route`/navigation (Next router), `profile`,
`tasks[]` (with `status` + attached `review`), `notes[]`, per-task `solution` (editor buffer),
`generating` (which type, or null), `reviewing` (bool), `hintsOpen`, `search`, `bannerDismissed`,
profile form fields + `stackError` + `savedFlash`. In the real app, generation + review are AI calls
(or mock data when no API key — that's what the mock banner signals).

### Data shapes
```
Profile  { stack: string, level: "junior"|"middle"|"senior", goals: string, weakAreas: string[] }
Task     { id, title, taskType: "mini-feature"|"system-design"|"debug-refactor",
           language: "luau"|"typescript", statement: markdown, constraints: string[],
           starterCode: string, hints: string[], testable: boolean, status: "open"|"reviewed" }
Review   { verdict: "pass"|"needs-work"|"fail", scorePercent: 0..100,
           correctnessSummary: string, issues: { severity: "blocker"|"major"|"minor", description }[],
           idiomaticSummary: string, idiomaticSuggestions: string[], tradeoffs: string,
           whatToLearnNext: string[], weakAreaTags: string[], noteTitle, noteMarkdown }
Note     { title: string, content: markdown, tags: string[], createdAt }
```
The prototype's `buildDefs()` contains four fully-written sample tasks (cooldown manager, health
replicator, Knit service registry, leaking RunService connection) with complete statements,
constraints, hints, starter code, and reviews — usable as realistic seed/mock data.

## Assets
None external. Logo is a CSS gradient square (no image). All "icons" are CSS shapes (dots, outlined
square/circle/diamond) or text glyphs (`⌕ → » ⌄ ✓ ×`) — reuse your codebase's icon set if preferred.

## Files
- `fix-your-skills.prototype.html` — the full interactive design reference (all 4 screens + the live
  core loop). Open in a browser. Authored with inline styles + a mock editor/markdown renderer — treat
  as a visual + behavioral spec, not code to ship.
