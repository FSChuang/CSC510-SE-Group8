import "server-only";
import { NextRequest } from "next/server";
import { z } from "zod";

export async function POST(req: NextRequest) {
  const Body = z.object({ code: z.string().length(6), memberId: z.string().min(1) });
  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) return Response.json({ issues: parsed.error.issues }, { status: 400 });
  return Response.json({ ok: true });
}
