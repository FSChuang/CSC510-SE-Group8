import "server-only";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db"; // ✅ consistent import

const Body = z.object({
  code: z.string().length(6),
  nickname: z.string().min(1).max(24).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json().catch(() => ({}));
    const parsed = Body.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ issues: parsed.error.issues }, { status: 400 });
    }

    const party = await prisma.party.findFirst({
      where: { code: parsed.data.code, isActive: true },
    });
    if (!party)
      return NextResponse.json({ code: "NOT_FOUND" }, { status: 404 });

    const member = await prisma.partyMember.create({
      data: {
        partyId: party.id,
        nickname: parsed.data.nickname ?? "Guest",
        prefsJson: JSON.stringify({}),
      },
    });

    const members = await prisma.partyMember.findMany({
      where: { partyId: party.id },
      select: { id: true, nickname: true },
    });

    return NextResponse.json({
      partyId: party.id,
      memberId: member.id,
      code: party.code,
      members,
    });
  } catch (e: any) {
    console.error("/api/party/join error:", e?.message || e);
    return NextResponse.json({ code: "INTERNAL" }, { status: 500 });
  }
}
