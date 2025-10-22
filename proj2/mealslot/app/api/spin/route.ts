import "server-only";
export const runtime = "nodejs"; // ensure Prisma runs in Node

import { NextRequest } from "next/server";
import { z } from "zod";
import { dishesByCategoryDbFirst } from "@/lib/dishes";
import { Dish, PowerUpsInput } from "@/lib/schemas";
import { weightedSpin } from "@/lib/scoring";
import { prisma } from "@/lib/db";

// -------- Helper coercers --------
// const coerceCategories = (v: unknown): string[] => {
//   if (Array.isArray(v)) return v.filter((x) => typeof x === "string") as string[];
//   if (typeof v === "string") {
//     return v
//       .split(",")
//       .map((s) => s.trim())
//       .filter(Boolean);
//   }
//   return [];
// };

const Body = z
  .object({
    category: z.string().min(1).optional(),
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
	  dishCount: z.number().int().min(1).optional()
  })
  .passthrough(); // ignore extra fields from the client

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json().catch(() => ({}));
    const parsed = Body.safeParse(raw);

    if (!parsed.success) {
      return Response.json({ issues: parsed.error.issues }, { status: 400 });
    }

    const { category, powerups, locked, dishCount } = parsed.data as {
      category: string;
      powerups: PowerUpsInput;
      locked: Array<number | { index: number; dishId: string }>;
      dishCount: number;
    };

    // Normalize locked
    const lockedInput = (locked ?? []).flatMap((x) => {
      if (typeof x === "number") return [];
      if (x && typeof x === "object" && "index" in x && "dishId" in x) return [x];
      return [];
    }) as Array<{ index: number; dishId: string }>;

    const reels: Dish[][] = [];
    for (let i = 0; i < dishCount; i++) {
      // dishesByCategoryDbFirst now takes a count parameter
      const dishes = await dishesByCategoryDbFirst(category);
      reels.push(dishes);
    }

    const selection = weightedSpin(reels, lockedInput, powerups);

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

