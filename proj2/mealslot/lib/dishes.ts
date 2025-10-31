// lib/dishes.ts
import { prisma } from "./db";
import { parseCsvToArray, includesAny } from "./csv";

// Keep types local to this file (you can export if needed elsewhere)
export type MealCategory = "breakfast" | "lunch" | "dinner" | "dessert";

export type DishDTO = {
  id: string;
  name: string;
  mealCategory: MealCategory;
  tags: string[];
  allergens: string[];
  costBand: number;
  timeBand: number;
  isHealthy: boolean;
  ytQuery?: string | null;
  // If you later add `description` to schema, uncomment next line and map it below.
  // description?: string | null;
};

export type SpinRequest = {
  category: MealCategory;
  num?: number;            // default 1
  tags?: string[];         // include-any
  allergens?: string[];    // exclude-any
  locked?: string[];       // pre-selected dish ids to keep
  powerups?: { noDuplicates?: boolean }; // default true
};

/** Fetch dishes for a given mealCategory and map CSV -> arrays */
export async function getCandidatesByCategory(cat: MealCategory): Promise<DishDTO[]> {
  const rows = await prisma.dish.findMany({
    where: { mealCategory: cat },
    orderBy: { name: "asc" },
  });

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    mealCategory: (r.mealCategory as MealCategory) ?? "lunch",
    tags: parseCsvToArray(r.tags),
    allergens: parseCsvToArray(r.allergens),
    costBand: r.costBand,
    timeBand: r.timeBand,
    isHealthy: r.isHealthy,
    ytQuery: r.ytQuery ?? null,
    // description: (r as any).description ?? null,
  }));
}

/** Include-any for tags; exclude-any for allergens */
export function filterByTagsAllergens(
  dishes: DishDTO[],
  opts: { tags?: string[]; allergens?: string[] }
): DishDTO[] {
  const wantedTags = (opts.tags ?? []).map((t) => t.toLowerCase());
  const banned = (opts.allergens ?? []).map((a) => a.toLowerCase());

  return dishes
    .filter((d) => wantedTags.length === 0 || includesAny(d.tags, wantedTags))
    .filter((d) => banned.length === 0 || !includesAny(d.allergens, banned));
}

export function pickRandom<T>(arr: T[], k: number, noDup = true): T[] {
  if (!arr.length || k <= 0) return [];

  // sample with replacement
  if (!noDup) {
    const out: T[] = [];
    for (let i = 0; i < k; i++) {
      const idx = Math.floor(Math.random() * arr.length);
      out.push(arr[idx]!); // non-null assertion: idx is in-bounds
    }
    return out;
  }

  // Fisher–Yates, then slice (no destructuring; asserts for strict indexing)
  const a: T[] = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i]!;   // assert: i is in-bounds
    a[i] = a[j]!;
    a[j] = tmp;
  }
  const n = Math.min(k, a.length);
  return a.slice(0, n);
}


