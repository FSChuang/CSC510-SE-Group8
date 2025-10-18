import "server-only";
import { NextRequest } from "next/server";
import { z } from "zod";
import { newPartyCode } from "@/lib/party";

export async function POST(req: NextRequest) {
  const Body = z.object({
    hostName: z.string().min(1).max(40).optional()
  });
  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) return Response.json({ issues: parsed.error.issues }, { status: 400 });

  const code = newPartyCode();
  return Response.json({
    party: {
      id: `pty_${Date.now()}`,
      code,
      isActive: true,
      constraints: { diet: [], allergens: [], maxBudget: null as number | null, maxTime: null as number | null }
    }
  });
}
