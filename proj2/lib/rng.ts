import seedrandom from "seedrandom";

export type RNG = seedrandom.prng;

export function getDeterministicRng(seed: string): RNG {
  return seedrandom(seed) as unknown as RNG;
}

export function softmax(xs: number[], temperature = 0.6): number[] {
  const t = Math.max(0.05, temperature);
  const maxX = Math.max(...xs);
  const exps = xs.map((x) => Math.exp((x - maxX) / t));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / (sum || 1));
}

export function pickByProbs<T>(rng: RNG, items: T[], probs: number[]): T {
  let r = rng.quick();
  let cum = 0;
  for (let i = 0; i < items.length; i++) {
    cum += probs[i];
    if (r <= cum) return items[i];
  }
  // Fallback
  return items[items.length - 1];
}
