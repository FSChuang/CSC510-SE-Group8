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

const parseArrayField = (v: any): string[] => {
	if (!v) return [];
	if (Array.isArray(v)) {
		// sometimes Prisma returns array of one string like '["dairy","gluten"]'
		if (v.length === 1 && v[0].startsWith('["')) {
			return v[0]
				.replace(/^\[|]$/g, '')          // remove [ and ]
				.split(',')
				.map((s: string) => s.replace(/"/g, '').trim().toLowerCase());
		}
		return v.map((s: string) => s.trim().toLowerCase());
	}
	if (typeof v === "string") {
		try {
			const parsed = JSON.parse(v);
			if (Array.isArray(parsed)) return parsed.map((s: string) => s.trim().toLowerCase());
		} catch {}
		return v.split(',').map((s: string) => s.trim().toLowerCase());
	}
	return [];
};


// ---- STATIC FALLBACK (your existing catalog) ----
type Raw = [name: string, costBand: number, timeBand: number, isHealthy: boolean, allergens: string[], ytQuery: string];

// … keep your existing static arrays here (MAIN / VEGGIE / SOUP / MEAT / DESSERT) …
// … and the expand() logic you already had …

// build BY_CAT from static catalog
const STATIC_BY_CAT: Record<string, UIDish[]> = /* build exactly like you had */ {};

// ---- DB-first, fallback to static ----
export async function dishesByCategoryDbFirst(
	category: string,
	tags: string[] = [],
	allergens: string[] = []
): Promise<UIDish[]> {
	const where: Prisma.DishWhereInput = { category };
	const rows = await prisma.dish.findMany({
		where,
		orderBy: [{ name: "asc" }]
	});

	if (rows.length === 0) {
		return (STATIC_BY_CAT[category] ?? []).slice();
	}

	const parse = (v: any) => {
		if (!v && v !== "") return [];
		try {
			const arr = JSON.parse(v);
			return Array.isArray(arr) ? arr.map(String) : [];
		} catch {
			return String(v).split(",").map(s => s.trim()).filter(Boolean);
		}
	};

  const filtered = rows.filter(r => {
    const rTags = parseArrayField(r.tags);
    const rAllergens = parseArrayField(r.allergens);
    console.log("Row Allergens")
    console.log(rAllergens)
    console.log("Selected Allergens")
    console.log(allergens)
    return tags.every(t => rTags.includes(t.toLowerCase())) &&
          allergens.every(a => rAllergens.includes(a.toLowerCase()));
  });

	return filtered.map(toUIDish);
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
