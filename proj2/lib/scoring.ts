import { Dish, ALL_DISHES } from "./dishes";
import { softmax, pickByProbs, RNG } from "./rng";

export type Constraints = {
  dietFlags?: Record<string, boolean>;
  allergens?: string[];
  budgetMax?: number;
  timeMaxMin?: number;
};

export type PowerUps = { healthy?: number; cheap?: number; t30?: number };

export function violatesDiet(d: Dish, dietFlags?: Record<string, boolean>): boolean {
  if (!dietFlags) return false;
  // Example: vegetarian=true blocks meat unless dish marked vegetarian/tofu/paneer
  if (dietFlags["vegetarian"] && d.category === "meat" && !d.tags.includes("vegetarian")) return true;
  if (dietFlags["vegan"] && (d.category === "meat" || !d.tags.includes("vegan"))) return true;
  return false;
}

export function violatesAllergens(d: Dish, allergens?: string[]): boolean {
  if (!allergens || allergens.length === 0) return false;
  const ing = d.baseIngredients.join(" ").toLowerCase();
  return allergens.some((a) => ing.includes(a.toLowerCase()));
}

export function withinBudgetTime(d: Dish, c?: Constraints): boolean {
  if (!c) return true;
  if (c.budgetMax != null && (d.price_cents ?? 0) > c.budgetMax) return false;
  if (c.timeMaxMin != null && (d.time_min ?? 0) > c.timeMaxMin) return false;
  return true;
}

export function filterCandidatesForCategory(opts: {
  category: string;
  dishes: Dish[];
  constraints?: Constraints;
}): Dish[] {
  const pool = opts.dishes.filter((d) => d.category === opts.category);
  return pool.filter(
    (d) =>
      !violatesDiet(d, opts.constraints?.dietFlags) &&
      !violatesAllergens(d, opts.constraints?.allergens) &&
      withinBudgetTime(d, opts.constraints)
  );
}

export function score(
  d: Dish,
  powerUps?: PowerUps,
  constraints?: Constraints
): number {
  const healthy = d.healthScore ?? 0.5;
  const inversePrice = 1 - clamp01((d.price_cents ?? 0) / 1000); // 0..1 cheaper=1
  const inverseTime = 1 - clamp01((d.time_min ?? 0) / 60);

  let s = 0;
  const pu = { healthy: 0, cheap: 0, t30: 0, ...powerUps };
  s += 3 * pu.healthy * healthy;
  s += 3 * pu.cheap * inversePrice;

  if (pu.t30 > 0) {
    const over = (d.time_min ?? 0) > 30 ? -1 : 0; // penalty if over 30
    s += over * pu.t30 + 2 * pu.t30 * inverseTime;
  }
  return s;
}

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

export function spinOneReel(opts: {
  category: string;
  dishes: Dish[];
  powerUps?: PowerUps;
  constraints?: Constraints;
  rng: RNG;
}): { pick: Dish; candidates: Dish[]; scores: number[] } {
  const candidates = opts.dishes;
  if (candidates.length === 0) {
    // fallback from all dishes of same category ignoring constraints
    const any = ALL_DISHES.filter((d) => d.category === (opts.category as any));
    const pick = any[Math.floor(opts.rng.quick() * any.length)];
    return { pick, candidates: [pick], scores: [1] };
  }
  const scores = candidates.map((d) => score(d, opts.powerUps, opts.constraints));
  const probs = softmax(scores, 0.6);
  const pick = pickByProbs(opts.rng, candidates, probs);
  return { pick, candidates, scores };
}
