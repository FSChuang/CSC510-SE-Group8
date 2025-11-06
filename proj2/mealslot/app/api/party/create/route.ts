import "server-only";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db"; // ✅ your existing path

const Body = z.object({
  nickname: z.string().min(1).max(24).optional(),
});

function makeCode() {
  // generate 6 uppercase letters/numbers
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

async function generateUniqueCode() {
  for (let i = 0; i < 5; i++) {
    const code = makeCode();
    const exists = await prisma.party.findFirst({
      where: { code, isActive: true },
      select: { id: true },
    });
    if (!exists) return code;
  }
  throw new Error("Failed to generate unique code");
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json().catch(() => ({}));
    const parsed = Body.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ issues: parsed.error.issues }, { status: 400 });
    }

    const code = await generateUniqueCode();

    // ✅ Create new party
    const party = await prisma.party.create({
      data: {
        code,
        isActive: true,
        constraintsJson: JSON.stringify({}),
      },
      select: { id: true, code: true },
    });

    // ✅ Create first member (nickname column + prefsJson)
    const member = await prisma.partyMember.create({
      data: {
        partyId: party.id,
        nickname: parsed.data.nickname ?? "Guest",
        prefsJson: JSON.stringify({}),
      },
      select: { id: true, nickname: true },
    });

    return NextResponse.json({
      partyId: party.id,
      memberId: member.id,
      code: party.code,
      nickname: member.nickname,
    });
  } catch (e: any) {
    console.error("/api/party/create error:", e?.message || e);
    return NextResponse.json({ code: "INTERNAL" }, { status: 500 });
  }
}
