# fix-your-skills

Practice your **problem solving** by hand while AI writes your production code. The app
generates coding tasks tailored to your stack, you solve them, and it reviews your solution
with educational feedback that gets saved as study notes.

## The loop

1. **Profile** — describe your stack (e.g. `roblox + knit + luau`), level, goals.
2. **Generate** — Claude creates a task scoped to your stack (mini-feature, system design, or debug/refactor).
3. **Solve** — write your solution in the in-browser editor.
4. **Review** — Claude judges correctness, idiomatic quality for your framework, and trade-offs.
5. **Notes** — each review distills a memorizable note into a searchable archive.
6. **Adapt** — weak areas from reviews bias future task generation.

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind · Monaco editor · Prisma + SQLite · Anthropic Claude API (`claude-opus-4-8`), structured outputs.

## Run

```bash
npm install
npx prisma migrate dev   # first run only — creates the SQLite DB
npm run dev              # http://localhost:3000
```

### Enable real AI (recommended)

The app runs in **mock mode** with sample tasks/reviews until you add a key. Edit `.env`:

```
ANTHROPIC_API_KEY="sk-ant-..."
```

Restart `npm run dev`. The dashboard banner disappears and tasks/reviews become real and stack-aware.

## Verification of solutions

- **Pure-logic** roblox-ts / Luau (no Roblox runtime): auto-testable (planned: `vitest` / `lune`).
- **Framework-coupled** (Flamework DI, Knit services) & **system design**: LLM review only.

Today every submission goes through LLM review; running real test suites and in-Studio execution
of framework code are the next milestones (a connected Roblox Studio MCP could bridge the latter).

## Project layout

```
src/
  app/
    page.tsx              Dashboard (profile summary, generate, recent tasks)
    profile/page.tsx      Profile editor
    task/[id]/page.tsx    Task view: statement + Monaco editor + review
    notes/page.tsx        Notes archive (search)
    api/                  profile · tasks · tasks/generate · tasks/[id]/submit · notes · status
  lib/
    anthropic.ts          Claude calls + structured outputs + mock fallback
    schemas.ts            Types + JSON schemas for generation & review
    prompts.ts            Generation & review prompts
    db.ts                 Prisma client
    mappers.ts            DB row → DTO helpers
  components/
    CodeEditor.tsx        Monaco wrapper
    Markdown.tsx          Markdown renderer
prisma/schema.prisma      Profile · Task · Submission · Review · Note
```
