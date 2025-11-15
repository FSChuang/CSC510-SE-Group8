import { Dish, PowerUpsInput } from "./schemas";
import { makeDeterministicRng } from "./rng";

/**
 * Compute a score for a dish given powerups.
 * Higher score => more likely.
 */
function scoreDish(d: Dish, power: PowerUpsInput): number {
  let s = 1;

  if (power.healthy) s *= d.isHealthy ? 2.0 : 0.8;
  if (power.cheap) {
    // costBand 1=cheap, 3=expensive
    s *= d.costBand === 1 ? 2.0 : d.costBand === 2 ? 1.0 : 0.6;
  }
  if (power.max30m) {
    // timeBand 1=~<30m, 3=slow
    s *= d.timeBand === 1 ? 2.0 : d.timeBand === 2 ? 0.9 : 0.5;
  }

  // keep a tiny floor to prevent zeros
  return Math.max(s, 0.0001);
}

/**
 * Deterministic weighted choice given an RNG in [0,1).
 */
function weightedChoice<T>(
  items: T[],
  weights: number[],
  rnd: () => number
): T | undefined {
  // Only consider up to the shortest length to avoid undefined elements
  const n = Math.min(items.length, weights.length);
  if (n === 0) return undefined;

  const total = weights.slice(0, n).reduce((a, b) => a + b, 0);
  if (!isFinite(total) || total <= 0) return undefined;

  let r = rnd() * total;
  for (let i = 0; i < n; i++) {
    const w = weights[i] ?? 0; // extra safety, but should always exist now
    r -= w;
    if (r <= 0) return items[i];
  }

  // roundoff fallback
  return items[n - 1];
}

/**
 * Main selection routine.
 * - Always returns exactly one Dish per reel.
 * - Honors locks if the locked dish exists in that reel; otherwise it picks normally.
 * - Never returns undefined; falls back to the first item in a reel if needed.
 */
export function weightedSpin(
  reels: Dish[][],
  locked: { index: number; dishId: string }[] = [],
  powerups: PowerUpsInput = {}
): Dish[] {
  const nowBucket = Math.floor(Date.now() / 10_000); // 10s bucket for mild determinism
  const seedString =
    reels
      .map((r) => r.map((d) => d.id).join(","))
      .join("|") + `|${nowBucket}`;
  const rng = makeDeterministicRng(seedString);

  const locksByIndex = new Map<number, string>();
  for (const l of locked) {
    if (l.index >= 0 && l.index < reels.length) locksByIndex.set(l.index, l.dishId);
  }

  const out: Dish[] = [];
  for (let i = 0; i < reels.length; i++) {
    const reel = reels[i] ?? [];

    // If the reel is literally empty, manufacture a harmless placeholder so UI doesn't blow up
    if (reel.length === 0) {
      out.push({
        id: `placeholder_${i}`,
        name: "No options",
        category: "unknown",
        tags: [],
        costBand: 2,
        timeBand: 2,
        isHealthy: true,
        allergens: [],
        ytQuery: "quick recipe",
      });
      continue;
    }

    // Lock honored only if the dish exists on this reel
    const lockId = locksByIndex.get(i);
    if (lockId) {
      const lockedDish = reel.find((d) => d.id === lockId);
      if (lockedDish) {
        out.push(lockedDish);
        continue;
      }
    }

    // Build weights and pick
    const weights = reel.map((d) => scoreDish(d, powerups));
    const pick = weightedChoice(reel, weights, rng) ?? reel[0]!;

    out.push(pick);
  }


  return out;
}
