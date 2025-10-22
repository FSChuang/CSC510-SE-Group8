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
			new Set(dishes.flatMap(d => (d.tags ? d.tags.split(",") : [])))
		).filter(Boolean);

		const allAllergens = Array.from(
			new Set(dishes.flatMap(d => (d.allergens ? d.allergens.split(",") : [])))
		).filter(Boolean);

		return Response.json({ tags: allTags, allergens: allAllergens });
	} catch (err) {
		console.error("Failed to fetch filters:", err);
		return Response.json({ tags: [], allergens: [] }, { status: 500 });
	}
}
