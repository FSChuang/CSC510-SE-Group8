import { NextRequest, NextResponse } from "next/server";
import { getRedis } from "./redis";

type Bucket = { tokens: number; last: number };
const MEMORY_BUCKETS = new Map<string, Bucket>();

const LIMIT = 20; // 20 per minute
const WINDOW = 60_000;

export async function withRateLimit(req: NextRequest, handler: () => Promise<NextResponse>) {
  const ip = (req.headers.get("x-forwarded-for") || req.ip || "anon").split(",")[0].trim();
  const allowed = await check(ip);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  return handler();
}

async function check(key: string): Promise<boolean> {
  const redis = getRedis();
  if (process.env.UPSTASH_REDIS_URL && process.env.UPSTASH_REDIS_TOKEN) {
    const now = Date.now();
    const windowKey = `rl:${key}:${Math.floor(now / WINDOW)}`;
    const n = await redis.incr(windowKey);
    if (n === 1) await redis.set(windowKey, "1", { ex: 60 });
    return n <= LIMIT;
  }

  const now = Date.now();
  const bucket = MEMORY_BUCKETS.get(key) ?? { tokens: LIMIT, last: now };
  const delta = now - bucket.last;
  const refill = Math.floor(delta / (WINDOW / LIMIT));
  bucket.tokens = Math.min(LIMIT, bucket.tokens + Math.max(0, refill));
  bucket.last = now;
  if (bucket.tokens <= 0) {
    MEMORY_BUCKETS.set(key, bucket);
    return false;
  }
  bucket.tokens -= 1;
  MEMORY_BUCKETS.set(key, bucket);
  return true;
}
