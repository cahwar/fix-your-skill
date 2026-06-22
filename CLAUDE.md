@AGENTS.md

# fix-your-skills — project guide

A single-user web app: a personal gym for coding **problem-solving**. The user writes most
production code with AI and wants to keep their hands-on judgment sharp. The app generates
practice tasks scoped to the user's stack, the user solves them in an in-browser editor, an AI
**review** grades + teaches, and each review is distilled into a searchable **note**. Weak areas
feed back into the profile so the next task is smarter.

**Core loop (the spine of the whole product):**
```
Profile (stack · level · goals · weakAreas)
  → generate a stack-scoped task (Claude)
    → solve in Monaco editor
      → submit → AI review (correctness · idiomatic-for-framework · trade-offs · learn-next)
        → note saved to archive
          → review's weak-area tags merge into the profile → next task adapts
```

The user's real stack is **Roblox**: Flamework + roblox-ts, or Knit + Luau. Tasks/reviews must be
idiomatic for the named framework.

---

## Stack & versions

- **Next.js 16.2.9** (App Router) + **React 19.2.4** + **TypeScript 5**.
  - ⚠️ `next dev` / `next build` use **Turbopack** by default in Next 16. See AGENTS.md — read
    `node_modules/next/dist/docs/` before writing Next code; this version has breaking changes.
- **Tailwind CSS v4** (`@import "tailwindcss"`, `@theme` tokens — no `tailwind.config.js`).
- **Prisma 6** (pinned) + **SQLite**. Do NOT upgrade to Prisma 7 casually — it drops `url` in
  `schema.prisma` and requires a driver-adapter + `prisma.config.ts`. We deliberately stay on v6.
- **Anthropic SDK** `@anthropic-ai/sdk` ^0.105 — model **`claude-opus-4-8`**, structured outputs.
- **Monaco** via `@monaco-editor/react`. **react-markdown + remark-gfm** for prose.
- Node 25 / npm 11 on the dev machine.

## Run

```bash
npm install
npx prisma migrate dev      # first run / after schema changes — creates/updates SQLite db + client
npm run dev                 # http://localhost:3000
npx tsc --noEmit            # typecheck (do this before committing)
```

`.env` holds `DATABASE_URL` (sqlite file) and `ANTHROPIC_API_KEY`. **`.env` and
`prisma/dev.db` are gitignored** — never commit them. Without an API key the app runs in
**mock mode** (deterministic sample task/review + a dashboard banner) so the full UI is clickable.

---

## Architecture map

```
src/
  app/
    layout.tsx              Root: Inter + JetBrains Mono fonts, <Nav/>, container
    page.tsx                Dashboard (client): profile card, generate cards, recent tasks
    profile/page.tsx        Profile editor (client)
    task/[id]/page.tsx      Task workbench (client): statement + Monaco + review panel
    notes/page.tsx          Notes archive (client, debounced search)
    globals.css             Design tokens (@theme) + .md prose styles + spinner/skeleton
    api/
      status/route.ts       GET { mock: !hasApiKey() }
      profile/route.ts      GET latest profile · POST upsert (single-user)
      tasks/route.ts        GET task list
      tasks/generate/route.ts        POST → Claude generates a task, persists, returns it
      tasks/[id]/route.ts            GET task + latest submission + review
      tasks/[id]/submit/route.ts     POST code → review, persist submission+review+note, adapt profile
      notes/route.ts        GET notes (?q= search over title/content/tags)
  lib/
    db.ts                   Prisma client singleton
    anthropic.ts            Claude calls (structuredCall) + generateTask/reviewSubmission + MOCK fallback
    schemas.ts              TS types + JSON Schemas for structured outputs (generation & review)
    prompts.ts              System+user prompt builders for generation & review
    mappers.ts              DB row → DTO (parses JSON-string fields)
  components/
    Nav.tsx                 Sticky nav, active-route state (client)
    CodeEditor.tsx          Monaco wrapped in a framed editor (custom dark theme "fys-dark")
    Markdown.tsx            react-markdown + remark-gfm, class "md"
prisma/
  schema.prisma            Profile · Task · Submission · Review · Note
  migrations/              committed; dev.db is gitignored
```

## Data model (Prisma → SQLite)

`Profile (1) → Task (n) → Submission (n) → Review (1)`; `Task (1) → Note (n)`.

**Convention:** array/object fields are stored as **JSON strings** (e.g. `constraints`,
`rubric`, `hints`, `weakAreas`, `Review.payload`) for SQLite portability. Always parse with the
helpers in `lib/mappers.ts` (`parseJsonArray`, `taskToDTO`, `reviewToDTO`) — never hand-parse in
components. The full structured review lives in `Review.payload` (stringified `ReviewResult`);
`verdict` + `scorePercent` are also denormalized as columns for cheap listing.

**Single-user MVP:** "the profile" = the most recently updated `Profile` row. No auth.

## Claude integration

- `lib/anthropic.ts` → `structuredCall()` calls `client.messages.create` with
  `output_config: { format: { type: "json_schema", schema } }` and parses the first text block.
  The params object is cast to `MessageCreateParamsNonStreaming` because `output_config` may not be
  in the SDK's static types yet — it's sent at runtime and the API honors it.
- Schemas (`lib/schemas.ts`) follow structured-output rules: every object has
  `additionalProperties: false` and lists all props in `required`; **no** min/max/length
  constraints (unsupported).
- `hasApiKey()` gates real vs **mock** mode. `generateTask`/`reviewSubmission` return mock data
  when no key — keep both paths working when you change shapes.
- Prompts live in `lib/prompts.ts`. Generation sets `testable: true` only for pure-logic tasks
  (no Roblox runtime). Review must judge idiomatic-for-the-framework and emit `weakAreaTags`
  (kebab-case) that drive profile adaptation.

## Design system

Warm-slate dark theme, violet accent. Tokens are defined once in `globals.css` under Tailwind v4
`@theme` (`--color-bg`, `--color-surface`, `--color-accent`, `--color-pos/caution/neg`, etc.) and
emitted as CSS vars. **Usage convention:** reference them via arbitrary values
(`bg-[var(--color-surface)]`, `text-[var(--color-text-2)]`) or inline `style`, not generated
utilities. Monospace via the `.mono` class (JetBrains Mono); UI font is Inter. Markdown is styled
through the `.md` class in `globals.css`. The full spec lives in
`design_handoff_fix_your_skills/README.md` + `DESIGN_BRIEF.md` — match it when adding UI.

## Conventions

- Pages that fetch data are **client components** (`"use client"`) using `useEffect` + the API
  routes. Initial SSR shows a "Loading…" state by design.
- Dynamic route params are a **Promise** (Next 16): `const { id } = use(params)` in client pages,
  `const { id } = await ctx.params` in route handlers.
- API responses are JSON `{ ... }`; errors return `{ error }` with a non-200 status.
- Run `npx tsc --noEmit` before committing. Commit messages end with the
  `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>` trailer.

## Verification of user solutions (product behavior, by design)

LLM review is the **universal path** today. Auto-testing is phased:
- pure-logic roblox-ts → planned `tsc` + `vitest`; pure-logic Luau → planned `lune` + TestEZ.
- Flamework/Knit/Instance-coupled & system-design → LLM review only.
A connected **Roblox Studio MCP** is a potential bridge for real in-Studio execution (phase 2).

---

## Gotchas (hard-won — don't relearn these)

- **Turbopack `root` foot-gun:** setting `turbopack: { root: path.resolve(__dirname) }` in
  `next.config.ts` broke the RSC client manifest (500s like *"Could not find the module
  …page.tsx#default in the React Client Manifest"*) on some routes. The config is currently empty
  on purpose. If you see that error: clear `.next`, and don't reintroduce a computed turbopack root.
- **Prisma 7** is intentionally avoided (see Stack). Stay on 6.x.
- **Structured outputs** need the JSON-schema constraints above or the API 400s.
- **JSON-string DB fields** — always go through `lib/mappers.ts`.
- `.env` (API key) and `prisma/dev.db` must stay gitignored; `.claude/settings.local.json` too.

## Roadmap / open items

- Auto-tests for pure-logic tasks (vitest / lune + TestEZ).
- Spaced repetition over the notes archive.
- In-Studio execution of framework code via Roblox Studio MCP.
- Optional cheaper model tier (Sonnet/Haiku) for generation vs review.
- The dashboard/preview is single-user; multi-profile + auth is not built.
