import { NextRequest, NextResponse } from "next/server";
import { SpinRequestSchema, SpinResponse, SpinRequest } from "@/lib/schemas";
import { withRateLimit } from "@/lib/ratelimit";
import { spinOneReel } from "@/lib/scoring";
import { getDeterministicRng } from "@/lib/rng";
import { filterCandidatesForCategory } from "@/lib/scoring";
import { ALL_DISHES, CATEGORIES } from "@/lib/dishes";

export async function POST(req: NextRequest) {
  return withRateLimit(req, async () => {
    const body = await req.json().catch(() => ({}));
    const parsed = SpinRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const payload: SpinRequest = parsed.data;

    const categories = payload.categories.slice(0, 6);
    const seed = payload.seed || `${Date.now()}-${Math.random()}`;
    const rng = getDeterministicRng(seed);

    const candidates: string[][] = [];
    const scores: number[][] = [];
    const result: string[] = [];

    for (let i = 0; i < categories.length; i++) {
      const cat = categories[i];
      const lockedName = payload.locked?.[i];
      if (lockedName) {
        result.push(lockedName);
        candidates.push([lockedName]);
        scores.push([1]);
        continue;
      }
      const pool = filterCandidatesForCategory({
        category: cat,
        dishes: ALL_DISHES,
        constraints: payload.constraints,
      });
      const spun = spinOneReel({
        category: cat,
        dishes: pool,
        powerUps: payload.powerUps,
        constraints: payload.constraints,
        rng
      });
      result.push(spun.pick.name);
      candidates.push(spun.candidates.map(d => d.name));
      scores.push(spun.scores);
    }

    const response: SpinResponse = {
      result,
      debug: {
        candidates,
        scores,
        seed
      }
    };
    return NextResponse.json(response);
  });
}
