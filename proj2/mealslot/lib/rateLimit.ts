import { NextRequest } from "next/server";

type Bucket = { tokens: number; last: number };
const buckets = new Map<string, Bucket>();
const CAP = 20; // spins/min/IP
const REFILL_MS = 60_000;

export function withRateLimit(req: NextRequest): Response | null {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1";
  const now = Date.now();
  const b = buckets.get(ip) ?? { tokens: CAP, last: now };
  const elapsed = now - b.last;
  if (elapsed > 0) {
    const refill = Math.floor((elapsed / REFILL_MS) * CAP);
    b.tokens = Math.min(CAP, b.tokens + refill);
    b.last = now;
  }
  if (b.tokens <= 0) {
    const retryAfterMs = Math.max(0, REFILL_MS - (now - b.last));
    return Response.json({ code: "RATE_LIMIT", retryAfterMs }, { status: 429 });
  }
  b.tokens -= 1;
  buckets.set(ip, b);
  return null;
}
