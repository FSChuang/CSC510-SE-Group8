import type { SessionMember } from "./types";

export function mergeConstraints(members: SessionMember[]): {
  dietFlags?: Record<string, boolean>;
  allergens?: string[];
  budgetMax?: number;
  timeMaxMin?: number;
} {
  const dietKeys = new Set<string>();
  for (const m of members) {
    const df = m.constraints.dietFlags ?? {};
    Object.keys(df).forEach((k) => dietKeys.add(k));
  }
  // diet AND: start with all true and AND down
  let dietFlags: Record<string, boolean> | undefined = undefined;
  if (dietKeys.size > 0) {
    dietFlags = {};
    for (const k of dietKeys) {
      let val = true;
      for (const m of members) val = val && Boolean(m.constraints.dietFlags?.[k]);
      dietFlags[k] = val;
    }
  }

  // allergens union
  const allergens = Array.from(
    new Set(
      members.flatMap((m) => m.constraints.allergens ?? [])
    )
  );
  // budget/time = min
  const budgetCandidates = members.map((m) => m.constraints.budgetMax).filter((x): x is number => typeof x === "number");
  const timeCandidates = members.map((m) => m.constraints.timeMaxMin).filter((x): x is number => typeof x === "number");
  const budgetMax = budgetCandidates.length ? Math.min(...budgetCandidates) : undefined;
  const timeMaxMin = timeCandidates.length ? Math.min(...timeCandidates) : undefined;

  return {
    dietFlags,
    allergens,
    budgetMax,
    timeMaxMin
  };
}
