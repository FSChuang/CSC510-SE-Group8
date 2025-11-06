import "server-only";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { PartyStateSchema, PrefsSchema, ConstraintsSchema } from "@/lib/party";
import { prisma } from "@/lib/db";

const Query = z.object({
  code: z.string().length(6),
});

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const parsed = Query.safeParse({ code: url.searchParams.get("code") ?? "" });
    if (!parsed.success) {
      return NextResponse.json({ issues: parsed.error.issues }, { status: 400 });
    }

    const party = await prisma.party.findFirst({
      where: { code: parsed.data.code },
    });
    if (!party) {
      return NextResponse.json({ code: "NOT_FOUND" }, { status: 404 });
    }

    // ✅ Fetch members including nickname directly
    const members = await prisma.partyMember.findMany({
      where: { partyId: party.id },
      select: { id: true, nickname: true, prefsJson: true },
    });

    const resp = {
      party: {
        id: party.id,
        code: party.code,
        isActive: party.isActive,
        constraints: (() => {
          try {
            return ConstraintsSchema.parse(JSON.parse(party.constraintsJson || "{}"));
          } catch {
            return {};
          }
        })(),
      },
      members: members.map((m) => ({
        id: m.id,
        nickname: m.nickname ?? "Guest", // ✅ use the real column
        prefs: (() => {
          try {
            return PrefsSchema.parse(JSON.parse(m.prefsJson || "{}"));
          } catch {
            return {};
          }
        })(),
      })),
    };

    const validated = PartyStateSchema.parse(resp);
    return NextResponse.json(validated);
  } catch (e) {
    console.error("/api/party/state", e);
    return NextResponse.json({ code: "INTERNAL" }, { status: 500 });
  }
}
