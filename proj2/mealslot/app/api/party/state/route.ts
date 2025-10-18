import "server-only";
import { NextRequest } from "next/server";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code") ?? "";
  const codeSchema = z.string().length(6);
  const parsed = codeSchema.safeParse(code);
  if (!parsed.success) return Response.json({ issues: parsed.error.issues }, { status: 400 });

  // Stub state with empty members/constraints
  return Response.json({
    party: {
      id: `pty_stub_${code}`,
      code,
      isActive: true,
      constraints: { diet: ["vegan"], allergens: ["peanut"], maxBudget: 2, maxTime: 30 },
      members: []
    }
  });
}
