# fix-your-skills — Design Brief

> Paste this whole document into a design session. It is self-contained: it describes the
> product, every screen, its content, states, and the real data each screen renders. First
> produce a cohesive visual design (style direction + screen mockups), then implement it.

---

## 1. Product in one paragraph

**fix-your-skills** is a web app for a working developer who now uses AI to write most of their
production code and is worried about losing their hands-on **problem-solving** ability. The app
generates coding practice tasks tailored to the user's exact tech stack, lets them solve each
task in an in-browser code editor, then runs an AI **review** that grades the solution and
teaches. Every review is distilled into a **study note** saved to a searchable archive, and the
user's weak areas feed back into future task generation. It's a personal training gym for coding
judgment — not a course, not a leaderboard.

**Primary (and only) user:** the developer themselves. Single-user, no auth, no social features.
The product should feel like a focused personal tool — calm, fast, a little bit "pro/IDE-adjacent."

**Core loop (this is the spine of the whole UX):**

```
Profile (stack · level · goals · weak areas)
  → Generate a task scoped to the stack
    → Solve it in the editor
      → AI review (correctness · idiomatic quality · trade-offs · what to learn next)
        → Note saved to archive
          → Weak areas update the profile → next task is smarter
```

---

## 2. Design goals & tone

- **Calm, focused, developer-grade.** This is a tool used daily for deliberate practice. No
  gamified noise, no marketing flourish. Think Linear / Raycast / a good IDE settings panel.
- **Reading + writing code is the main activity.** Typography and code blocks must be excellent.
  Long task statements (markdown) and code must be comfortable to read for minutes at a time.
- **The review is the payoff.** The review screen should feel rewarding and clear — the moment
  the user learns something. Give it visual weight and good information hierarchy.
- **Dark-first.** The current app is dark; a polished dark theme is the priority. A light theme
  is a nice-to-have, not required.
- **One clear primary action per screen.** Generate. Submit. Save. Never make the user hunt.

**Freedom:** you choose the palette, type system, spacing scale, motion, and component styling.
The direction above is guidance, not a constraint — propose something with character. If you
want to pitch 2–3 distinct visual directions before committing, do that first and let me pick.

**Hard constraints (so the design is implementable in our stack):**
- Implemented in **Next.js (App Router) + React + Tailwind CSS v4**. Design with utility-class
  styling in mind (a token/scale-based system maps cleanly to Tailwind).
- The code editor is **Monaco** (the VS Code editor) embedded in the Task screen — design around
  a real editor widget (~460px tall), don't reinvent it.
- Markdown is rendered for task statements and notes (headings, lists, inline code, code blocks,
  tables, links) — the design must include a **markdown/prose style**.
- Fonts: a clean sans for UI and a good monospace for code. Pick whatever you like.

---

## 3. Global shell

Present on every screen:

- **Top nav bar** (full width, sits above content). Left: wordmark `fix·your·skills`. Right: three
  links — **Dashboard**, **Profile**, **Notes**. Show the active route.
- **Content container**: centered, max width ~1000–1100px, generous horizontal padding.
- **Mock-mode banner** (conditional): when no AI key is configured, a dismissible-feeling info
  banner appears at the top of the Dashboard: "Mock mode — no API key set. Tasks and reviews are
  sample data." Style as informational/warning, not alarming.

Design the nav, wordmark treatment, and the active-state. Consider a subtle accent color used
consistently for primary actions, links, and active states.

---

## 4. Screens

There are **four** routes. Design each, including empty / loading / error states.

### 4.1 Dashboard (`/`) — home base

The launchpad. Three stacked regions:

1. **Profile summary card.** Shows the user's current setup:
   - `stack` (e.g. `roblox + knit + luau`) — the most prominent value.
   - `level` (junior / middle / senior) and optional `goals` (one line).
   - `weakAreas` — a list of short tags (e.g. `edge-cases`, `error-handling`, `di-lifecycle`),
     0–12 of them, rendered as chips. May be empty.
   - An "Edit" affordance linking to Profile.
2. **"Generate a new task" section.** Four selectable cards/buttons in a row:
   - **Mini-feature** — "implement a small realistic feature"
   - **System design** — "architecture & trade-offs"
   - **Debug / refactor** — "fix broken or messy code"
   - **Surprise me** (visually distinct / accented) — auto-picks a type
   - Clicking one triggers generation (show a loading/disabled state on the cards while it works,
     then navigates to the new task). Design the loading state.
3. **Recent tasks list.** Rows, newest first. Each row: task `title`, a meta line
   (`taskType` · `language`), and a status badge — `open` or `reviewed` (reviewed should read as
   "done/positive"). Clicking a row opens the task.

**Empty states:**
- No profile yet → a welcome state inviting the user to create a profile (single primary CTA).
- Profile exists but no tasks yet → friendly "generate your first task" hint under the list.

### 4.2 Profile (`/profile`) — setup form

A focused, single-column form (max ~600px). Fields:
- **Stack** — free-text input (e.g. `roblox + knit + luau`). Below it, 2–4 **preset chips** the
  user can click to fill the field (e.g. `roblox + flamework + roblox-ts`, `roblox + knit + luau`,
  `roblox + luau (vanilla)`).
- **Level** — segmented control: junior / middle / senior.
- **Goals** — optional multi-line textarea (e.g. "get sharper at networking/replication design").
- **Save** primary button. Inline validation: stack is required. On save, return to Dashboard.

Design the input, chip, segmented-control, and textarea styles — these become the app's form
system.

### 4.3 Task (`/task/[id]`) — the workbench (most important screen)

This is where the user spends real time. Two-column on wide screens; stacks to one column on
narrow. Above the columns: a back link to Dashboard.

**Left column — the problem:**
- **Meta chips row:** `taskType`, `language`, and a verification badge — either
  **"auto-testable"** (positive accent) or **"review-only"** (neutral).
- **Title** (large).
- **Statement card** — rendered **markdown**: headings, paragraphs, lists, inline code, fenced
  code blocks. Can be long. This is primary reading material — nail the prose style.
- **Constraints card** — a bulleted list of requirements the solution must satisfy.
- **Hints card** — collapsed by default ("Show hints (N)"); expands to a bulleted list. Hints are
  secondary/muted.

**Right column — the solution (sticky on scroll on wide screens):**
- Section label "Your solution".
- **Monaco code editor** (~460px tall, dark theme, line numbers, no minimap). Design the frame /
  container around it, not the editor internals.
- **Submit button** ("Submit for review" → "Reviewing…" loading → "Re-submit for review" once a
  review exists). Inline error text on failure.

**Review panel** — appears **below both columns** after submission (full width). This is the
reward moment; give it strong hierarchy. Contents:
- **Header row:** "Review" title, a big numeric **score** (0–100), and a **verdict badge** —
  one of `pass` (positive/green), `needs-work` (caution/amber), `fail` (negative/red).
- **Correctness** section: a summary paragraph + a list of **issues**, each tagged by severity
  (`blocker` / `major` / `minor`) with distinct treatment per severity.
- **Idiomatic quality** section: summary paragraph + bulleted suggestions (how idiomatic the
  solution is for the specific framework).
- **Trade-offs** section: a paragraph.
- **What to learn next** section: a bulleted list.
- **"Saved to your notes" callout** (accented): the distilled note rendered as **markdown**, the
  weak-area **tags** as chips, and a link to the Notes archive.

Design all section dividers, the severity tag system, the verdict badges, and the score display.

**States:** loading the task; task not found; submitting/reviewing (button + maybe skeleton on the
review area); review present vs. not yet submitted.

### 4.4 Notes archive (`/notes`) — searchable study log

- **Header** with title + subtitle ("Distilled lessons from your reviews") and a **search input**
  on the right (debounced; filters by note text and tags).
- **List of note cards**, newest first. Each card: note **title**, a **date**, the note **content**
  rendered as **markdown**, a row of **tag** chips, and an optional "View task →" link.
- **Empty state:** "No notes yet — submit a task for review and a note is created automatically."
- **No-results state** for an unmatched search.

---

## 5. Component inventory (design these once, reuse everywhere)

- **Buttons:** primary (accent), secondary/ghost, and disabled/loading variants.
- **Cards / panels:** the base surface used for statement, constraints, profile summary, review
  sections, note cards.
- **Chips / tags:** weak-area tags, meta chips, stack presets, severity tags. Possibly a few color
  variants (neutral, positive, caution, negative).
- **Badges:** task status (`open` / `reviewed`), verification (`auto-testable` / `review-only`),
  verdict (`pass` / `needs-work` / `fail`).
- **Inputs:** text input, textarea, segmented control, search input.
- **Markdown / prose block:** headings, paragraphs, lists, inline code, fenced code blocks (with a
  distinct code surface), tables, links.
- **Banner:** mock-mode informational banner.
- **Section header / divider** used inside the review panel.
- **List rows:** the recent-tasks row.
- **Loading states:** button spinners and (optionally) skeletons for cards/lists.
- **Empty states:** welcome (no profile), no tasks, no notes, no search results.

A **score number + verdict badge** pairing is a signature element of the product — give it a
memorable treatment.

---

## 6. Responsive behavior

- **Wide (desktop):** Task screen is two columns (problem left, solution right; solution sticky).
  Generate cards in a single row of four. Notes/tasks as comfortable lists.
- **Narrow (mobile/tablet):** everything collapses to one column. Task screen stacks: problem,
  then editor, then review. Generate cards wrap to a 2×2 grid. Nav may collapse but keep the three
  links reachable.

---

## 7. Real data shapes (so mockups use realistic content, not lorem ipsum)

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

**Sample content to mock with:**
- Stack: `roblox + knit + luau` · Level: `middle` · Weak areas: `edge-cases`, `di-lifecycle`.
- Task title: "Implement a debounced cooldown manager" · type `mini-feature` · language `luau` ·
  `review-only`.
- Review: score `65`, verdict `needs-work`; one `minor` issue ("Consider the expiry edge case");
  tags `edge-cases`.
- Note title: "Cooldowns: store the end timestamp, not the start".

---

## 8. Deliverables

1. **Style direction**: palette (dark-first), typography (UI sans + code mono), spacing/radii,
   accent usage, motion principles. (Optionally 2–3 directions to choose from first.)
2. **Mockups** for all four screens, including the key states (empty, loading, review-present).
3. **Component specs** for the inventory in §5.
4. **Implementation** in our stack: Next.js App Router + React + Tailwind CSS v4. Reuse the existing
   routes and data shapes above; keep Monaco as the editor and the markdown renderer for prose.
```
