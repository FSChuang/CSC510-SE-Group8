// server-only catalog access (DB-first)
// tags/allergens are stored as CSV strings in SQLite.

import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import type { Dish } from "@/lib/schemas";

/* ----------------------------- CSV Helpers ----------------------------- */

const csvToArray = (s?: string | null): string[] =>
  s ? s.split(",").map((t) => t.trim()).filter(Boolean) : [];

const arrayToCsv = (arr?: string[]): string =>
  arr && arr.length ? arr.join(",") : "";

/* --------------------------- Row → Dish mapper -------------------------- */

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
  // Your Dish type requires ytQuery, so always provide a string
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    tags: csvToArray(row.tags),
    costBand: row.costBand,
    timeBand: row.timeBand,
    isHealthy: row.isHealthy,
    allergens: csvToArray(row.allergens),
    ytQuery: row.ytQuery ?? "", // <— important: always a string
  };
}

/* ----------------------------- Filter builder --------------------------- */

function buildWhere(
  category?: string,
  tagFilters?: string[],
  allergenFilters?: string[]
): Prisma.DishWhereInput {
  const AND: Prisma.DishWhereInput[] = [];

  if (category) {
    AND.push({ category });
  }

  // NOTE: Your generated Prisma types don’t allow `mode` on StringFilter<"Dish">.
  // So we drop it to avoid TS errors (case-sensitive match).
  if (tagFilters && tagFilters.length) {
    for (const t of tagFilters) {
      AND.push({ tags: { contains: t } });
    }
  }

  if (allergenFilters && allergenFilters.length) {
    for (const a of allergenFilters) {
      AND.push({ allergens: { contains: a } });
    }
  }

  return AND.length ? { AND } : {};
}

/* ------------------------------- Queries -------------------------------- */

export async function listDishesDbFirst(
  category?: string,
  tags: string[] = [],
  allergens: string[] = []
): Promise<Dish[]> {
  const where = buildWhere(category, tags, allergens);

  const rows = await prisma.dish.findMany({
    where,
    orderBy: [{ name: "asc" }],
    take: 500,
  });

  return rows.map(rowToDish);
}

export async function dishesByCategoryDbFirst(
  category: string,
  tags: string[] = [],
  allergens: string[] = []
): Promise<Dish[]> {
  return listDishesDbFirst(category, tags, allergens);
}

/* --------------------- Legacy sync fallback (no-op) --------------------- */

export function dishesByCategory(_category: string): Dish[] {
  // Legacy sync API kept to avoid breaking old imports.
  return [];
}

export async function allDishesDbFirst(): Promise<Dish[]> {
  return listDishesDbFirst();
}
