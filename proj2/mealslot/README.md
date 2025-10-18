# MealSlot (Phase 1 – Scaffolding)

Production-ready MVP scaffolding with strict TypeScript, Next.js 15 App Router, Tailwind, Prisma (SQLite by default), deterministic stubs (LLM + YouTube + Places), Socket.IO websockets, zod validation, rate limiting, and tests.

## Purpose

MealSlot helps people decide what to eat using a slot-machine UI. Categories become reels. Users can lock/reroll, apply power-ups (Healthy, Cheap, ≤30m), and then choose **Cook at Home** (LLM recipe + YouTube) or **Eat Outside** (stubbed venues). Party Mode merges constraints across participants and broadcasts spins via websockets.

## Repo Layout

mealslot/
├─ app/
│ ├─ (site)/{layout.tsx,page.tsx,party/page.tsx}
│ ├─ api/
│ │ ├─ spin/route.ts
│ │ ├─ recipe/route.ts
│ │ ├─ places/route.ts
│ │ └─ party/{create,join,spin,state,leave}/route.ts
│ └─ layout.tsx
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
├─ package.json, tsconfig.json, next.config.js, postcss.config.js, tailwind.config.ts
├─ playwright.config.ts, vitest.config.ts
├─ .eslintrc.cjs, .prettierrc, .gitignore
└─ README.md

graphql
Copy code

## GitHub Codespaces — Run Steps (verbatim)

# Create Codespace: GitHub → Code → Codespaces → Create on main

# In the Codespace terminal:
corepack enable
corepack prepare pnpm@latest --activate
pnpm install
pnpm prisma db push
pnpm prisma db seed
cp -n .env.example .env.local # stubs work without keys
pnpm dev # Next.js on port 3000 (auto-forwarded)

graphql
Copy code

# If a separate WebSocket server exists:
cd ws-server && pnpm install && pnpm dev # typically port 4001 (auto-forwarded)

bash
Copy code

# Tests:
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e # optional, if Playwright is available

sql
Copy code

## Notes

- Default DB is SQLite (works out-of-the-box). Optional Postgres via `docker-compose.yml`.
- All API input/output is zod-validated.
- Secrets are never required for basic flows—deterministic stubs kick in when env keys are missing.
- Party Mode websockets are scaffolded; Phase 2 wires spin broadcast + constraint merge with tests.