// app/api/filters/route.ts
import "server-only";
import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
	try {
		// Fetch tags and allergens from all dishes
		const dishes = await prisma.dish.findMany({
			select: { tags: true, allergens: true },
		});

		// Flatten CSV arrays and get unique values
        const allTags = Array.from(
            new Set(
                dishes.flatMap(d => {
                    if (!d.tags) return [];
                    try {
                        // parse JSON array
                        const parsed = JSON.parse(d.tags);
                        if (Array.isArray(parsed)) return parsed;
                        return [];
                    } catch {
                        // fallback if it's just CSV string
                        return d.tags.split(",").map(s => s.trim());
                    }
                })
            )
        ).filter(Boolean);

        const allAllergens = Array.from(
            new Set(
                dishes.flatMap(d => {
                    if (!d.allergens) return [];
                    try {
                        const parsed = JSON.parse(d.allergens);
                        if (Array.isArray(parsed)) return parsed;
                        return [];
                    } catch {
                        return d.allergens.split(",").map(s => s.trim());
                    }
                })
            )
        ).filter(Boolean);

		return Response.json({ tags: allTags, allergens: allAllergens });
	} catch (err) {
		console.error("Failed to fetch filters:", err);
		return Response.json({ tags: [], allergens: [] }, { status: 500 });
	}
}
