# MealSlot — MVP Scaffolding (Phase 1)

Production-ready scaffolding with strict TypeScript, Next.js 15 App Router, Tailwind CSS, Prisma (SQLite by default), deterministic stubs (LLM + YouTube + Places), Socket.IO websockets, Zod validation, rate limiting, and tests.

## Purpose

MealSlot helps people decide what to eat using a slot-machine UI. Categories become reels. Users can lock/reroll, apply power-ups (Healthy, Cheap, ≤30m), then choose:

- **Cook at Home** → LLM recipe JSON + matching YouTube video (stubbed deterministically).
- **Eat Outside** → venue suggestions (stubbed deterministically).
- **Party Mode** → merges constraints across participants and broadcasts spins via websockets.

## Tech Stack

- **Framework:** Next.js 15 (App Router), React, TypeScript (strict)
- **Styling:** Tailwind CSS
- **Data:** Prisma ORM, SQLite (default) / Postgres (optional via Docker)
- **Validation:** Zod
- **API:** Next.js Route Handlers
- **Websockets:** Socket.IO (separate dev server)
- **Tooling:** pnpm, ESLint, Prettier, Vitest, Playwright

## Repository Layout

```text
mealslot/
├─ app/
│  ├─ (site)/{layout.tsx,page.tsx,party/page.tsx}
│  ├─ api/
│  │  ├─ spin/route.ts
│  │  ├─ recipe/route.ts
│  │  ├─ places/route.ts
│  │  └─ party/{create,join,spin,state,leave}/route.ts
│  └─ layout.tsx
├─ components/{SlotReel.tsx,SlotMachine.tsx,PowerUps.tsx,PartyClient.tsx,ui/*}
├─ lib/{schemas.ts,dishes.ts,scoring.ts,rng.ts,rateLimit.ts,youtube.ts,auth.ts,party.ts}
├─ prisma/{schema.prisma,seed.ts}
├─ public/{favicon.ico,recipe.schema.json}
├─ ws-server/src/index.ts
├─ tests/unit/{mergeConstraints.test.ts,spinLogic.test.ts,recipeSchema.test.ts}
├─ tests/e2e/smoke.spec.ts
├─ scripts/devdata.ts
├─ .env.example
├─ docker-compose.yml
├─ package.json  tsconfig.json  next.config.js  postcss.config.js  tailwind.config.ts
├─ playwright.config.ts  vitest.config.ts
├─ .eslintrc.cjs  .prettierrc  .gitignore
└─ README.md
```

## Quick Start (GitHub Codespaces)

Create a Codespace: GitHub → Code → Codespaces → Create on `main`

Then run:
```
corepack enable
corepack prepare pnpm@latest --activate
pnpm install
pnpm prisma db push
pnpm prisma db seed
cp -n .env.example .env.local   # stubs work without keys
pnpm dev                        # Next.js on port 3000 (auto-forwarded)
```
Optional: WebSocket dev server
```
cd ws-server
pnpm install
pnpm dev                        # typically port 4001 (auto-forwarded)
```
Scripts
```
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e    # requires Playwright
```
## Environment

Basic flows work with no secrets (deterministic stubs auto-activate).

Copy `.env.example` to `.env.local`. Populate keys as needed later.

## Database

Default: SQLite (zero-config)

Postgres (optional): via `docker-compose.yml`
```
docker compose up -d
# update Prisma datasource in prisma/schema.prisma if switching to Postgres
pnpm prisma db push
pnpm prisma db seed
```
## Validation & Rate Limiting

All API input/output is Zod-validated (`lib/schemas.ts`).

Basic rate limiting in `lib/rateLimit.ts`.

## Deterministic Stubs

When env keys are missing, endpoints return deterministic data for repeatable tests and demos:

LLM recipe: `app/api/recipe/route.ts` uses `lib/schemas.ts` + `public/recipe.schema.json`.

YouTube lookup: deterministic helper in `lib/youtube.ts`.

Places: deterministic venue list in `app/api/places/route.ts`.

## Party Mode

Websocket server scaffold: `ws-server/src/index.ts` (Socket.IO).

API routes under `app/api/party/*`:

`create`, `join`, `spin`, `state`, `leave`

Phase 2 will wire spin broadcasts + constraint merge with tests.

## Tests

Unit: `tests/unit/*` (Vitest)

`mergeConstraints.test.ts`

`spinLogic.test.ts`

`recipeSchema.test.ts`

E2E: `tests/e2e/smoke.spec.ts` (Playwright)

Run:
```
pnpm test
pnpm test:e2e
```
## Notes

Next.js App Router with strict TypeScript.

Tailwind configured in `tailwind.config.ts`.

Seed data in `prisma/seed.ts`; extra dev data via `scripts/devdata.ts`.

API routes live under `app/api/**` and are fully typed.
