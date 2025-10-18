import "server-only";
import { NextRequest } from "next/server";
import { z } from "zod";

const Body = z.object({
  cuisines: z.array(z.string().min(1)).min(1),
  locationHint: z.string().optional()
});

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return Response.json({ code: "BAD_REQUEST", issues: parsed.error.issues }, { status: 400 });
  }
  const { cuisines, locationHint } = parsed.data;
  const city = (locationHint ?? "Your City").replace(/[^a-zA-Z\s]/g, "");

  const venues = cuisines.slice(0, 3).map((c, i) => ({
    id: `v_${c}_${i}`,
    name: `${c} Place ${i + 1}`,
    addr: `${100 + i} Main St, ${city}`,
    rating: 4.2 - i * 0.2,
    price: "$".repeat(1 + (i % 3)),
    url: "https://example.com",
    cuisine: c,
    distance_km: Number((1.0 + i * 0.7).toFixed(1))
  }));

  return Response.json({ venues, notice: "Using city-level location stub." });
}
