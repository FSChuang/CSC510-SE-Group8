import "server-only";
export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { z } from "zod";
import { PrefsSchema } from "@/lib/party";
import { prisma } from "@/lib/db";

const Body = z.object({
  code: z.string().length(6),
  nickname: z.string().min(1).max(24).optional()
});

export async function POST(req: NextRequest) {
  try {
    const json = (await req.json().catch(() => ({}))) as unknown;
    const parsed = Body.safeParse(json);
    if (!parsed.success) return Response.json({ issues: parsed.error.issues }, { status: 400 });

    const party = await prisma.party.findFirst({ where: { code: parsed.data.code, isActive: true } });
    if (!party) return Response.json({ code: "NOT_FOUND" }, { status: 404 });

    const member = await prisma.partyMember.create({
      data: {
        partyId: party.id,
        prefsJson: JSON.stringify({ nickname: parsed.data.nickname ?? "Guest" })
      }
    });

    return Response.json({ partyId: party.id, memberId: member.id, code: party.code });
  } catch (e) {
    console.error("/api/party/join", e);
    return Response.json({ code: "INTERNAL" }, { status: 500 });
  }
}
