import "server-only";
export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const Body = z.object({
  memberId: z.string()
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json().catch(() => ({}));
    const parsed = Body.safeParse(json);
    if (!parsed.success) return Response.json({ issues: parsed.error.issues }, { status: 400 });

    await prisma.partyMember.delete({ where: { id: parsed.data.memberId } });
    return Response.json({ ok: true });
  } catch (e) {
    console.error("/api/party/leave", e);
    return Response.json({ code: "INTERNAL" }, { status: 500 });
  }
}
