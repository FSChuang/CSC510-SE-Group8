export type Constraints = {
  diet: string[];           // AND merge
  allergens: string[];      // UNION merge
  maxBudget: number | null; // MIN
  maxTime: number | null;   // MIN
};

export function mergeConstraints(cs: Constraints[]): Constraints {
  if (cs.length === 0) return { diet: [], allergens: [], maxBudget: null, maxTime: null };
  const dietAll = cs.map((c) => new Set(c.diet));
  const andDiet = [...dietAll.reduce((acc, s) => new Set([...acc].filter((x) => s.has(x))))];
  const unionAllergens = [...new Set(cs.flatMap((c) => c.allergens))];
  const minBudget = cs.map((c) => c.maxBudget).filter((x): x is number => x != null);
  const minTime = cs.map((c) => c.maxTime).filter((x): x is number => x != null);
  return {
    diet: andDiet,
    allergens: unionAllergens,
    maxBudget: minBudget.length ? Math.min(...minBudget) : null,
    maxTime: minTime.length ? Math.min(...minTime) : null
  };
}

export function newPartyCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += alphabet[(Math.random() * alphabet.length) | 0];
  return s;
}
