import "server-only";
import { NextRequest } from "next/server";
import { z } from "zod";

export async function POST(req: NextRequest) {
  const Body = z.object({ code: z.string().length(6), name: z.string().min(1).max(40) });
  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) return Response.json({ issues: parsed.error.issues }, { status: 400 });

  return Response.json({
    member: { id: `mem_${Date.now()}`, name: parsed.data.name, joinedAt: new Date().toISOString() },
    partyId: `pty_stub_${parsed.data.code}`
  });
}
