PROJECT 3 README: GROUP 10 EXTENDING MEALSLOT

[![Coverage Status](https://coveralls.io/repos/github/rithikkulkarni/csc-510-proj-3/badge.svg?branch=main)](https://coveralls.io/github/rithikkulkarni/csc-510-proj-3?branch=main)

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Release](https://img.shields.io/github/v/release/FSChuang/CSC510-SE-Group8)


# MealSlot — MVP Scaffolding

Production-ready scaffolding with strict TypeScript, Next.js 15 App Router, Tailwind CSS, Prisma (SQLite by default), deterministic stubs (LLM + YouTube + Places), Socket.IO websockets, Zod validation, rate limiting, and tests.

## Purpose

MealSlot helps people decide what to eat using a slot-machine UI. Categories become reels. Users can lock/reroll, apply power-ups (Healthy, Cheap, ≤30m), then choose:

- **Cook at Home** → LLM recipe JSON + matching YouTube video (stubbed deterministically).
- **Eat Outside** → venue suggestions (stubbed deterministically).
- **Party Mode** → merges constraints across participants and broadcasts spins via websockets.

## Who is MealSlot For?

Mealslot is meant to help anyone looking to expand their culinary horizons. Whether they are an adventurous eater looking for new experiences, a beginner trying to expand their pallate, or a home cook working on their skills, MealSlot can help them discover and explore new dishes.

## Demo

https://github.com/user-attachments/assets/79e14304-0232-4f44-b30f-979cc4b544a5


## Tech Stack

- **Framework:** Next.js 15 (App Router), React, TypeScript (strict)
- **Styling:** Tailwind CSS
- **Data:** Prisma ORM, SQLite (default) / Postgres (optional via Docker)
- **Validation:** Zod
- **API:** Next.js Route Handlers
- **Websockets:** Socket.IO (separate dev server)
- **Tooling:** pnpm, ESLint, Prettier, Vitest, Playwright

### Third-Party APIs

MealSlot requires the following API keys for full functionality:
- **Google Maps JavaScript API** — venue suggestions for “Eat Outside”  
- **YouTube Data API v3** — recipe and cooking videos
Remember to populate the keys in .env.local before running the app.

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
cd proj2/mealslot
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

## Roadmap

- Enhance UI with animations
- Allow for more complex meal plans spanning multiple categories
- Add a login system so users can save meal plans
- Create a system for users to share dishes and plans with others

## Support

For issues, questions, or feature requests, please open a GitHub issue.

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.
