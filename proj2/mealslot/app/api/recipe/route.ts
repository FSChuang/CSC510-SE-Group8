import "server-only";
import { NextRequest } from "next/server";
import { z } from "zod";
import { RecipeSchema } from "@/lib/schemas";
import { recipeStub } from "@/lib/youtube";

const Body = z.object({ dishIds: z.array(z.string().min(1)).min(1) });

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return Response.json({ code: "BAD_REQUEST", issues: parsed.error.issues }, { status: 400 });
  }

  const { dishIds } = parsed.data;
  const recipes = dishIds.map((id, i) =>
    recipeStub({ id, titleSuffix: `#${i + 1}` })
  );

  // Validate strict schema before output
  const results = recipes.map((r) => RecipeSchema.parse(r));
  return Response.json({ recipes: results });
}
