import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { Dish as UIDish } from "./schemas"; // UI/Spin Dish type (arrays)

function splitCSV(s: string | null | undefined): string[] {
  return (s ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}
function toUIDish(row: { id: string; name: string; category: string; tags: string; allergens: string; costBand: number; timeBand: number; isHealthy: boolean; ytQuery: string | null }): UIDish {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    tags: splitCSV(row.tags),
    allergens: splitCSV(row.allergens),
    costBand: row.costBand,
    timeBand: row.timeBand,
    isHealthy: row.isHealthy,
    ytQuery: row.ytQuery ?? ""
  };
}

// ---- STATIC FALLBACK (your existing catalog) ----
type Raw = [name: string, costBand: number, timeBand: number, isHealthy: boolean, allergens: string[], ytQuery: string];

// … keep your existing static arrays here (MAIN / VEGGIE / SOUP / MEAT / DESSERT) …
// … and the expand() logic you already had …

// build BY_CAT from static catalog
const STATIC_BY_CAT: Record<string, UIDish[]> = /* build exactly like you had */ {};

// ---- DB-first, fallback to static ----
export async function dishesByCategoryDbFirst(category: string): Promise<UIDish[]> {
  const where: Prisma.DishWhereInput = { category };
  const rows = await prisma.dish.findMany({
    where,
    orderBy: [{ name: "asc" }]
  });
  if (rows.length > 0) return rows.map(toUIDish);
  // fallback to static
  return (STATIC_BY_CAT[category] ?? []).slice();
}

export async function listDishesDbFirst(category?: string): Promise<UIDish[]> {
  const where: Prisma.DishWhereInput = category ? { category } : {};
  const rows = await prisma.dish.findMany({
    where,
    orderBy: [{ name: "asc" }]
  });
  if (rows.length > 0) return rows.map(toUIDish);
  // fallback to static (all)
  return Object.values(STATIC_BY_CAT).flat();
}
