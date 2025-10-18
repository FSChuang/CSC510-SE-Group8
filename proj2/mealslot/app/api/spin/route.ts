import "server-only";
export const runtime = "nodejs"; // ensure Prisma runs in Node runtime

import { NextRequest } from "next/server";
import { z } from "zod";
import { dishesByCategory } from "@/lib/dishes";
import { Dish, PowerUpsInput } from "@/lib/schemas";
import { weightedSpin } from "@/lib/scoring";
import { withRateLimit } from "@/lib/rateLimit";
import { prisma } from "@/lib/db";

const Body = z.object({
  categories: z.array(z.string().min(1)).min(1).max(6),
  locked: z.array(z.object({ index: z.number().int().min(0).max(5), dishId: z.string() })).optional(),
  powerups: z.object({ healthy: z.boolean().optional(), cheap: z.boolean().optional(), max30m: z.boolean().optional() }).optional(),
  partyId: z.string().optional()
});

export async function POST(req: NextRequest) {
  try {
    const rateRes = withRateLimit(req);
    if (rateRes) return rateRes;

    const json = await req.json().catch(() => ({}));
    const parsed = Body.safeParse(json);
    if (!parsed.success) {
      return Response.json({ code: "BAD_REQUEST", issues: parsed.error.issues }, { status: 400 });
    }
    const { categories, locked = [], powerups = {} as PowerUpsInput } = parsed.data;

    const reels: Dish[][] = categories.map((c) => dishesByCategory(c));
    const selection = weightedSpin(reels, locked, powerups);

    // Persist spin (best-effort)
    try {
      await prisma.spin.create({
        data: {
          reelsJson: JSON.stringify(reels.map((r) => r.map((d) => d.id))),
          lockedJson: JSON.stringify(locked),
          resultDishIds: JSON.stringify(selection.map((d) => d.id)),
          powerupsJson: JSON.stringify(powerups)
        }
      });
    } catch (e) {
      // Log but don't fail the request in stub/local mode
      console.warn("spin persist failed (non-fatal):", (e as Error).message);
    }

    return Response.json({
      spinId: `spin_${Date.now()}`,
      reels,
      selection
    });
  } catch (err) {
    console.error("spin route error:", err);
    return Response.json(
      { code: "INTERNAL_ERROR", message: (err as Error).message ?? "unknown" },
      { status: 500 }
    );
  }
}
