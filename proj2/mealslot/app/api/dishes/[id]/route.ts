import "server-only";
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const PatchIn = z.object({
  name: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  tags: z.array(z.string()).optional(),
  allergens: z.array(z.string()).optional(),
  costBand: z.number().int().min(1).max(3).optional(),
  timeBand: z.number().int().min(1).max(3).optional(),
  isHealthy: z.boolean().optional(),
  ytQuery: z.string().optional(),
});

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.dish.delete({ where: { id: params.id } });
    return new Response(null, { status: 204 });
  } catch {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json().catch(() => ({}));
  const parsed = PatchIn.safeParse(body);
  if (!parsed.success) return Response.json({ issues: parsed.error.issues }, { status: 400 });

  const d = parsed.data;

  try {
    const updated = await prisma.dish.update({
      where: { id: params.id },
      data: {
        ...(d.name !== undefined ? { name: d.name } : {}),
        ...(d.category !== undefined ? { category: d.category } : {}),
        ...(d.tags !== undefined ? { tags: d.tags.join(",") } : {}),
        ...(d.allergens !== undefined ? { allergens: d.allergens.join(",") } : {}),
        ...(d.costBand !== undefined ? { costBand: d.costBand } : {}),
        ...(d.timeBand !== undefined ? { timeBand: d.timeBand } : {}),
        ...(d.isHealthy !== undefined ? { isHealthy: d.isHealthy } : {}),
        ...(d.ytQuery !== undefined ? { ytQuery: d.ytQuery } : {}),
      },
    });
    return Response.json(updated);
  } catch {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
}
