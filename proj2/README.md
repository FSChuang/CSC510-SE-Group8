# MealSlot (MVP)

Slot-machine meal picker with Cook-at-Home recipes and Eat-Outside stubs, plus Party Mode with realtime spins.

## Quick Start

```bash
# 1) Install deps
pnpm i # or npm i / yarn

# 2) Configure env
cp .env.example .env.local
# fill DATABASE_URL; Redis vars optional

# 3) Prisma
npx prisma generate
npm run prisma:migrate
npm run prisma:seed

# 4) Dev servers
npm run dev          # Next.js on http://localhost:3000
# In another terminal:
cd ws-server && npm i && npm run dev  # Socket.IO on :7071
s