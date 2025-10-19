import "server-only";
export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { z } from "zod";
import { PrefsSchema, mergeConstraints } from "@/lib/party";
import { prisma } from "@/lib/db";

const Body = z.object({
  partyId: z.string(),
  memberId: z.string(),
  prefs: PrefsSchema
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json().catch(() => ({}));
    const parsed = Body.safeParse(json);
    if (!parsed.success) return Response.json({ issues: parsed.error.issues }, { status: 400 });

    // Update the member prefs
    await prisma.partyMember.update({
      where: { id: parsed.data.memberId },
      data: { prefsJson: JSON.stringify(parsed.data.prefs) }
    });

    // Recompute merged constraints
    const members = await prisma.partyMember.findMany({ where: { partyId: parsed.data.partyId } });
    const prefsList = members.map((m) => {
      try {
        return PrefsSchema.parse(JSON.parse(m.prefsJson));
      } catch {
        return {};
      }
    });
    const { merged, conflict, suggestions } = mergeConstraints(prefsList);

    await prisma.party.update({
      where: { id: parsed.data.partyId },
      data: { constraintsJson: JSON.stringify(merged) }
    });

    return Response.json({ merged, conflict, suggestions });
  } catch (e) {
    console.error("/api/party/update", e);
    return Response.json({ code: "INTERNAL" }, { status: 500 });
  }
}
