import "server-only";
export const runtime = "nodejs"; // ensure Prisma runs in Node

import { NextRequest } from "next/server";
import { z } from "zod";
import { dishesByCategoryDbFirst } from "@/lib/dishes";
import { Dish, PowerUpsInput } from "@/lib/schemas";
import { weightedSpin } from "@/lib/scoring";
import { prisma } from "@/lib/db";

// -------- Helper coercers --------
const coerceCategories = (v: unknown): string[] => {
  if (Array.isArray(v)) return v.filter((x) => typeof x === "string") as string[];
  if (typeof v === "string") {
    return v
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
};

const Body = z
  .object({
    categories: z
      .preprocess(coerceCategories, z.array(z.string().min(1)).min(1).max(6)),
    locked: z
      .array(
        z.union([
          z.object({
            index: z.number().int().min(0).max(5),
            dishId: z.string(),
          }),
          z.number().int().min(0).max(5), // allow index-only; we'll normalize
        ])
      )
      .optional()
      .default([]),
    powerups: z
      .object({
        healthy: z.boolean().optional(),
        cheap: z.boolean().optional(),
        max30m: z.boolean().optional(),
      })
      .optional()
      .default({}),
  })
  .passthrough(); // ignore extra fields from the client

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json().catch(() => ({}));
    const parsed = Body.safeParse(raw);

    if (!parsed.success) {
      // Helpful during dev: return issues so you can see exactly why it failed in Network tab
      return Response.json({ issues: parsed.error.issues }, { status: 400 });
    }

    const { categories, powerups } = parsed.data as {
      categories: string[];
      powerups: PowerUpsInput;
      locked: Array<number | { index: number; dishId: string }>;
    };

    // Normalize locked -> only objects with {index,dishId}
    const lockedInput = (parsed.data.locked ?? []).flatMap((x) => {
      if (typeof x === "number") return []; // index-only not used by server spin
      if (x && typeof x === "object" && "index" in x && "dishId" in x) return [x];
      return [];
    }) as Array<{ index: number; dishId: string }>;

    // Build reels (DB-first with static fallback inside the helper)
    const reels: Dish[][] = [];
    for (const c of categories) reels.push(await dishesByCategoryDbFirst(c));

    // Spin
    const selection = weightedSpin(reels, lockedInput, powerups);

    // Persist (non-fatal if it fails)
    try {
      await prisma.spin.create({
        data: {
          reelsJson: JSON.stringify(reels.map((r) => r.map((d) => d.id))),
          lockedJson: JSON.stringify(lockedInput),
          resultDishIds: JSON.stringify(selection.map((d) => d.id)),
          powerupsJson: JSON.stringify(powerups),
        },
      });
    } catch (e) {
      console.warn("spin persist failed (non-fatal):", (e as Error).message);
    }

    return Response.json({ spinId: `spin_${Date.now()}`, reels, selection });
  } catch (err) {
    console.error("spin route error:", err);
    return Response.json(
      { code: "INTERNAL_ERROR", message: (err as Error)?.message ?? "unknown" },
      { status: 500 }
    );
  }
}
