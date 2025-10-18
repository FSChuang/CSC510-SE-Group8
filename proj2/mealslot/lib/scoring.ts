import { Dish, PowerUpsInput } from "./schemas";
import { rngFromSeed } from "./rng";

export function scoreDish(d: Dish, p: PowerUpsInput): number {
  let score = 1.0;
  if (p.healthy && d.isHealthy) score += 0.8;
  if (p.cheap && d.costBand === 1) score += 0.6;
  if (p.max30m && d.timeBand <= 1) score += 0.6;
  return score;
}

/** Deterministic spin given reels + locked slots */
export function weightedSpin(
  reels: Dish[][],
  locked: { index: number; dishId: string }[],
  p: PowerUpsInput
): Dish[] {
  const seed = `${reels.length}|${locked.map((l) => `${l.index}:${l.dishId}`).join(",")}|${JSON.stringify(
    p
  )}|v1`;
  const rand = rngFromSeed(seed);
  return reels.map((choices, i) => {
    const lock = locked.find((l) => l.index === i);
    if (lock) {
      const found = choices.find((c) => c.id === lock.dishId);
      if (found) return found;
    }
    const weights = choices.map((c) => scoreDish(c, p));
    const total = weights.reduce((a, b) => a + b, 0);
    let r = rand() * total;
    for (let k = 0; k < choices.length; k++) {
      r -= weights[k];
      if (r <= 0) return choices[k];
    }
    return choices[choices.length - 1];
  });
}
