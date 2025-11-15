import { z } from "zod";

/** ---- Types & Validation ---- */
export const DietEnum = z.enum(["omnivore", "vegetarian", "vegan", "pescatarian", "keto", "none"]);
export const AllergenEnum = z.enum([
  "gluten",
  "dairy",
  "egg",
  "soy",
  "peanut",
  "tree_nut",
  "shellfish",
  "fish",
  "sesame"
]);

export const PrefsSchema = z.object({
  nickname: z.string().min(1).max(24).optional(),
  diet: DietEnum.optional(),
  allergens: z.array(AllergenEnum).optional(),
  budgetBand: z.number().int().min(1).max(3).optional(), // 1=cheap 3=expensive
  timeBand: z.number().int().min(1).max(3).optional() // 1=fast 3=slow-ok
});
export type Prefs = z.infer<typeof PrefsSchema>;

export const ConstraintsSchema = z.object({
  diet: z.array(DietEnum).optional(), // merged = AND across users (strictest)
  allergens: z.array(AllergenEnum).optional(), // merged = UNION across users
  budgetBand: z.number().int().min(1).max(3).optional(), // merged = MIN
  timeBand: z.number().int().min(1).max(3).optional() // merged = MIN
});
export type Constraints = z.infer<typeof ConstraintsSchema>;

export const PartyStateSchema = z.object({
  party: z.object({
    id: z.string(),
    code: z.string().length(6),
    isActive: z.boolean(),
    constraints: ConstraintsSchema
  }),
  members: z.array(
    z.object({
      id: z.string(),
      nickname: z.string().optional(),
      prefs: PrefsSchema
    })
  )
});
export type PartyState = z.infer<typeof PartyStateSchema>;

/** ---- Merge Logic ---- */
export function mergeConstraints(prefsList: Prefs[]): {
  merged: Constraints;
  conflict: boolean;
  suggestions: string[];
} {
  const diets = prefsList.map((p) => p.diet).filter(Boolean) as z.infer<typeof DietEnum>[];
  const nonNone = diets.filter((d) => d !== "none");
  let dietMerged: z.infer<typeof DietEnum>[] | undefined;

  if (nonNone.length === 0) {
    dietMerged = undefined; // no constraint
  } else {
    // Pick the strictest compatible “ethic” diet; keto is orthogonal (carb limit).
    const strictness = { vegan: 4, vegetarian: 3, pescatarian: 2, omnivore: 1, keto: 2, none: 0 } as const;
    const sorted = [...new Set(nonNone)].sort((a, b) => strictness[b] - strictness[a]);
    const ethic = sorted.find((d) => d === "vegan" || d === "vegetarian" || d === "pescatarian" || d === "omnivore");
    dietMerged = [ethic ?? sorted[0]!];
  }

  const allergensMerged = Array.from(
    new Set(
      prefsList.flatMap((p) => p.allergens ?? []).filter((a): a is z.infer<typeof AllergenEnum> => !!a)
    )
  );

  const budgetMerged = prefsList.reduce<number | undefined>((min, p) => {
    if (typeof p.budgetBand === "number") return Math.min(min ?? p.budgetBand, p.budgetBand);
    return min;
  }, undefined);

  const timeMerged = prefsList.reduce<number | undefined>((min, p) => {
    if (typeof p.timeBand === "number") return Math.min(min ?? p.timeBand, p.timeBand);
    return min;
  }, undefined);

  const merged: Constraints = {};
  if (dietMerged && dietMerged.length) merged.diet = dietMerged;
  if (allergensMerged.length) merged.allergens = allergensMerged;
  if (budgetMerged !== undefined) merged.budgetBand = budgetMerged;
  if (timeMerged !== undefined) merged.timeBand = timeMerged;

  let conflict = false;
  const suggestions: string[] = [];

  if (dietMerged && dietMerged.length === 0) {
    conflict = true;
    suggestions.push("Remove conflicting diet restrictions (default to vegetarian).");
  }

  if (merged.diet?.includes("vegan")) {
    const blocked = new Set(merged.allergens ?? []);
    const many: z.infer<typeof AllergenEnum>[] = ["soy", "peanut", "tree_nut", "gluten"];
    const count = many.filter((a) => blocked.has(a)).length;
    if (count >= 3) {
      conflict = true;
      suggestions.push("Too many allergens with vegan. Consider dropping one or relaxing to vegetarian.");
    }
  }

  return { merged, conflict, suggestions };
}

/** Generate a 6-char code from a seed */
export function partyCodeFromSeed(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return (h >>> 0).toString(36).toUpperCase().padStart(6, "0").slice(0, 6);
}
