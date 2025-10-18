import "server-only";
import { NextRequest } from "next/server";
import { z } from "zod";
import { dishesByCategory } from "@/lib/dishes";
import { weightedSpin } from "@/lib/scoring";
import { PowerUpsInput } from "@/lib/schemas";

const Body = z.object({
  code: z.string().length(6),
  categories: z.array(z.string().min(1)).min(1).max(6),
  locked: z.array(z.object({ index: z.number().int().min(0).max(5), dishId: z.string() })).optional(),
  powerups: z.object({ healthy: z.boolean().optional(), cheap: z.boolean().optional(), max30m: z.boolean().optional() }).optional()
});

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) return Response.json({ issues: parsed.error.issues }, { status: 400 });

  const { categories, locked = [], powerups = {} as PowerUpsInput } = parsed.data;
  const reels = categories.map((c) => dishesByCategory(c));
  const selection = weightedSpin(reels, locked, powerups);

  // In Phase 2 we would broadcast over WS. For now, just return result.
  return Response.json({ spinId: `pty_spin_${Date.now()}`, reels, selection });
}
