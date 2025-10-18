import { NextRequest, NextResponse } from "next/server";
import { RecipeRequestSchema, RecipeResponseSchema, RecipeRequest } from "@/lib/schemas";
import { generateRecipeStub } from "@/lib/llm";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = RecipeRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const payload: RecipeRequest = parsed.data;

  // First attempt
  const out1 = await generateRecipeStub(payload.dishes);
  const valid1 = RecipeResponseSchema.safeParse(out1);
  if (valid1.success) return NextResponse.json(valid1.data);

  // Retry once with corrective hint (applied internally in stub)
  const out2 = await generateRecipeStub(payload.dishes, { corrective: true });
  const valid2 = RecipeResponseSchema.safeParse(out2);
  if (valid2.success) return NextResponse.json(valid2.data);

  return NextResponse.json(
    { error: "Recipe generation failed schema validation after one retry." },
    { status: 422 }
  );
}
