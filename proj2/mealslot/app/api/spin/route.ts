import "server-only";
export const runtime = "nodejs"; // ensure Prisma runs in Node

import { NextRequest } from "next/server";
import { z } from "zod";
import { dishesByCategoryDbFirst } from "@/lib/dishes";
import { Dish, PowerUpsInput } from "@/lib/schemas";
import { weightedSpin } from "@/lib/scoring";
import { prisma } from "@/lib/db";

const Body = z
  .object({
    category: z.string().min(1).optional(),
    tags: z.array(z.string()).optional().default([]),
    allergens: z.array(z.string()).optional().default([]),
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
    dishCount: z.number().int().min(1).optional(),
  })
  .passthrough();

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json().catch(() => ({}));
    const parsed = Body.safeParse(raw);

    if (!parsed.success) {
      return Response.json({ issues: parsed.error.issues }, { status: 400 });
    }

    const {
      category,
      tags,
      allergens,
      powerups,
      locked,
      dishCount,
    } = parsed.data as {
      category?: string;
      tags: string[];
      allergens: string[];
      powerups: PowerUpsInput;
      locked: Array<number | { index: number; dishId: string }>;
      dishCount?: number;
    };

    if (!category) {
      return Response.json({ message: "category is required" }, { status: 400 });
    }

    const lockedInput = (locked ?? []).flatMap((x) => {
      if (typeof x === "number") return [];
      if (x && typeof x === "object" && "index" in x && "dishId" in x) return [x];
      return [];
    }) as Array<{ index: number; dishId: string }>;

    // Build unique reels (no duplicates across boxes; variants treated as same "base")
const all = await dishesByCategoryDbFirst(category, tags, allergens);

// helper to normalize a "base" key (strip common variant suffixes if any ever appear again)
const baseKey = (name: string) =>
  name.toLowerCase().replace(/\s*\((spicy|low-carb|gluten-free)\)\s*$/i, "").trim();

// 1) Exclude any locked dishes from the shared pool so they don't show up elsewhere
const lockedSet = new Set(lockedInput.map((l) => l.dishId));
const unlockedPool = all.filter((d) => !lockedSet.has(d.id));

// 2) Dedupe by base (keep first occurrence of each base)
const seenBase = new Set<string>();
const deduped = unlockedPool.filter((d) => {
  const k = `${d.category}:${baseKey(d.name)}`;
  if (seenBase.has(k)) return false;
  seenBase.add(k);
  return true;
});

// 3) Shuffle the deduped pool (Fisher–Yates)
for (let i = deduped.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [deduped[i], deduped[j]] = [deduped[j], deduped[i]];
}

const count = dishCount ?? 1;
const reels: Dish[][] = Array.from({ length: count }, () => []);

// 4) Deal round-robin so reels are disjoint
let rr = 0;
for (const d of deduped) {
  reels[rr].push(d);
  rr = (rr + 1) % count;
}

// 5) Ensure each locked dish is only in its own reel (and at the front)
//    Also apply base-level de-dupe against other reels
for (const { index, dishId } of lockedInput) {
  const dish = all.find((x) => x.id === dishId);
  if (!dish) continue;

  const key = `${dish.category}:${baseKey(dish.name)}`;

  // remove same-base dishes from all reels
  for (let r = 0; r < reels.length; r++) {
    reels[r] = reels[r].filter((x) => `${x.category}:${baseKey(x.name)}` !== key);
  }
  // put the locked one at the front of its designated reel
  reels[index] = [dish, ...reels[index]];
}


    // NOTE: If pool.length < count, some reels may end up small. In that edge case
    // weightedSpin will still work, but you can't guarantee uniqueness with fewer
    // available dishes than slots. That’s expected behavior.


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
