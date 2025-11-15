import "server-only";
export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { z } from "zod";
import { Dish, RecipeJSON, RecipeSchema } from "@/lib/schemas";
import { allDishes } from "@/lib/dishes";
import { recipesViaOpenAI } from "@/lib/llm";
import { videoStubsFor } from "@/lib/youtube";

const Body = z.object({
  dishIds: z.array(z.string()).min(1),
});

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return Response.json({ issues: parsed.error.issues }, { status: 400 });
  }

  // Build a catalog from the static dish list
  const catalog = new Map(allDishes.map((d) => [d.id, d]));

  // Resolve the requested dish IDs to Dish objects
  const selectedDishes: Dish[] = parsed.data.dishIds
    .map((id) => catalog.get(id))
    .filter(Boolean) as Dish[];

  // Real LLM if key exists, otherwise deterministic stub (inside adapter)
  const recipes: RecipeJSON[] = await recipesViaOpenAI(
    selectedDishes,
    videoStubsFor,
  );

  // Validate shape in dev
  for (const r of recipes) RecipeSchema.parse(r);

  return Response.json({ recipes });
}
