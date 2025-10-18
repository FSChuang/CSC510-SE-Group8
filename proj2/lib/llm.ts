import { RecipeResponse } from "./schemas";

/**
 * Stub LLM provider that returns schema-valid JSON deterministically from input.
 * If corrective flag is passed, it simplifies the shape even further.
 */
export async function generateRecipeStub(
  dishes: string[],
  opts?: { corrective?: boolean }
): Promise<RecipeResponse | Record<string, unknown>> {
  const title = `MealSlot Combo: ${dishes.join(" + ")}`;
  // deterministic pseudo quantities
  const baseQ = Math.max(1, 2 + (hash(dishes.join("|")) % 3));
  const ingredients = dishes.map((d) => ({
    name: d,
    quantity: baseQ,
    unit: "portion"
  }));
  const steps = [
    "Read all steps before starting.",
    `Prep ingredients for: ${dishes.join(", ")}.`,
    "Cook components in parallel where possible.",
    "Plate and serve."
  ];
  const equipment = ["knife", "cutting board", "pan", "pot"];
  const nutrition = {
    kcal: 600 + (hash(title) % 200),
    protein_g: 20 + (hash(title + "p") % 30),
    carbs_g: 50,
    fat_g: 20
  };
  const shoppingList = dishes.map((d) => `${d} ingredients`);
  const warnings = dishes.some((d) => /shellfish|clam|shrimp/i.test(d)) ? ["Contains shellfish"] : [];

  const payload: RecipeResponse = {
    title,
    ingredients,
    steps: opts?.corrective ? steps.slice(0, 3) : steps,
    equipment,
    nutrition,
    shoppingList,
    warnings
  };
  return payload;
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
