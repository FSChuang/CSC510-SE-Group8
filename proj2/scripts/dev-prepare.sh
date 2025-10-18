
# mealslot/scripts/dev-prepare.sh
```bash
#!/usr/bin/env bash
set -euo pipefail

REQUIRED_NODE=18
NODE_MAJOR=$(node -v | sed 's/v\([0-9]*\).*/\1/')
if [ "$NODE_MAJOR" -lt "$REQUIRED_NODE" ]; then
  echo "Node >= $REQUIRED_NODE required, found $(node -v)"
  exit 1
fi

echo "✔ Node version OK: $(node -v)"
npx prisma generate
echo "ℹ If DB is empty, run: npm run prisma:migrate && npm run prisma:seed"

if [ -z "${UPSTASH_REDIS_URL:-}" ] || [ -z "${UPSTASH_REDIS_TOKEN:-}" ]; then
  echo "⚠ Redis env not set. Falling back to in-memory presence/ratelimiting."
else
  echo "✔ Redis env detected."
fi
