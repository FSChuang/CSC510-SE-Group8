import "server-only";
export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { Dish, PowerUpsInput } from "@/lib/schemas";
import { weightedSpin } from "@/lib/scoring";

// ---------- request body ----------
const Body = z.object({
  category: z.enum(["breakfast", "lunch", "dinner", "dessert"]),
  num: z.number().int().min(1).max(6),
  tags: z.array(z.string()).default([]),
  allergens: z.array(z.string()).default([]),
  locked: z
    .array(
      z.object({
        index: z.number().int().min(0).max(5),
        dishId: z.string(),
      })
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
});

// map meal period -> existing DB categories
function mapMealToDbCats(meal: string): string[] {
  if (meal === "dessert") return ["dessert"];
  return ["main", "veggie", "soup", "meat"]; // breakfast/lunch/dinner share savory sets
}

function csvToArray(csv: string | null | undefined): string[] {
  if (!csv) return [];
  return csv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

// Build Prisma where for tags/allergens against CSV strings (SQLite: case-sensitive)
// We lower incoming filters to match the seeded lowercase CSV.
function buildWhere(
  meal: "breakfast" | "lunch" | "dinner" | "dessert",
  tags: string[],
  allergens: string[]
): Prisma.DishWhereInput {
  const cats = mapMealToDbCats(meal);
  const orCats = cats.map((c) => ({ category: c }));

  const andClauses: Prisma.DishWhereInput[] = [];

  // include tags: require that CSV string contains each selected tag (lowercase)
  for (const tRaw of tags) {
    const t = tRaw.toLowerCase();
    andClauses.push({ tags: { contains: t } });
  }

  // exclude allergens: NOT contains any of the selected allergens (lowercase)
  if (allergens.length) {
    andClauses.push({
      NOT: allergens.map((aRaw) => ({
        allergens: { contains: aRaw.toLowerCase() },
      })),
    });
  }

  const where: Prisma.DishWhereInput = {
    OR: orCats,
    ...(andClauses.length ? { AND: andClauses } : {}),
  };

  return where;
}

function rowToDish(row: {
  id: string;
  name: string;
  category: string;
  tags: string | null;
  allergens: string | null;
  costBand: number;
  timeBand: number;
  isHealthy: boolean;
  ytQuery: string | null;
}): Dish {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    tags: csvToArray(row.tags),
    costBand: row.costBand,
    timeBand: row.timeBand,
    isHealthy: row.isHealthy,
    allergens: csvToArray(row.allergens),
    ytQuery: row.ytQuery ?? undefined,
  };
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json().catch(() => ({}));
    const parsed = Body.safeParse(json);
    if (!parsed.success) {
      return Response.json({ issues: parsed.error.issues }, { status: 400 });
    }

    const {
      category,
      num,
      tags: rawTags,
      allergens: rawAllergens,
      locked,
      powerups,
    } = parsed.data;

    // normalize filters to lowercase to match CSV in DB
    const tags = rawTags.map((t) => t.toLowerCase());
    const allergens = rawAllergens.map((a) => a.toLowerCase());

    const where = buildWhere(category, tags, allergens);

    const rows = await prisma.dish.findMany({
      where,
      orderBy: [{ name: "asc" }],
      take: 250,
      select: {
        id: true,
        name: true,
        category: true,
        tags: true,
        allergens: true,
        costBand: true,
        timeBand: true,
        isHealthy: true,
        ytQuery: true,
      },
    });

    const options: Dish[] = rows.map(rowToDish);

    if (options.length === 0) {
      return Response.json(
        {
          code: "NO_OPTIONS",
          message:
            "No dishes match the current category/filters. Try removing some tags/allergens.",
        },
        { status: 400 }
      );
    }

    // Create N identical reels from the same filtered option list
    const reels: Dish[][] = Array.from({ length: num }, () => options);

    // Spin with existing scoring
    const selection = weightedSpin(reels, locked, (powerups ?? {}) as PowerUpsInput);

    return Response.json({ reels, selection });
  } catch (err) {
    console.error("spin route error:", err);
    return Response.json(
      { code: "INTERNAL_ERROR", message: (err as Error)?.message ?? "unknown" },
      { status: 500 }
    );
  }
}
