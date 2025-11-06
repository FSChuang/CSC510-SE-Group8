import "server-only";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db"; // ✅ consistent with your setup
import { PrefsSchema, mergeConstraints } from "@/lib/party";

const Body = z.object({
  partyId: z.string(),
  memberId: z.string(),
  prefs: PrefsSchema,
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json().catch(() => ({}));
    const parsed = Body.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ issues: parsed.error.issues }, { status: 400 });
    }

    const { partyId, memberId, prefs } = parsed.data;

    // ✅ 1. Update only preferences, not nickname
    await prisma.partyMember.update({
      where: { id: memberId },
      data: { prefsJson: JSON.stringify(prefs) },
    });

    // ✅ 2. Recompute merged constraints for the entire party
    const members = await prisma.partyMember.findMany({
      where: { partyId },
      select: { prefsJson: true },
    });

    const allPrefs = members
      .map((m) => {
        try {
          return JSON.parse(m.prefsJson || "{}");
        } catch {
          return {};
        }
      })
      .filter(Boolean);

    const merged = mergeConstraints(allPrefs);

    // ✅ 3. Save merged constraints on the party
    await prisma.party.update({
      where: { id: partyId },
      data: { constraintsJson: JSON.stringify(merged) },
    });

    return NextResponse.json({ merged });
  } catch (e: any) {
    console.error("/api/party/update error:", e?.message || e);
    return NextResponse.json({ code: "INTERNAL" }, { status: 500 });
  }
}
