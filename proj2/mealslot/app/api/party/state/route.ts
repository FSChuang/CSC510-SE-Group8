import "server-only";
export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { z } from "zod";
import { PartyStateSchema, PrefsSchema, ConstraintsSchema } from "@/lib/party";
import { prisma } from "@/lib/db";

const Query = z.object({
  code: z.string().length(6)
});

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const parsed = Query.safeParse({ code: url.searchParams.get("code") ?? "" });
    if (!parsed.success) return Response.json({ issues: parsed.error.issues }, { status: 400 });

    const party = await prisma.party.findFirst({ where: { code: parsed.data.code } });
    if (!party) return Response.json({ code: "NOT_FOUND" }, { status: 404 });

    const members = await prisma.partyMember.findMany({ where: { partyId: party.id } });

    const resp = {
      party: {
        id: party.id,
        code: party.code,
        isActive: party.isActive,
        constraints: (() => {
          try {
            return ConstraintsSchema.parse(JSON.parse(party.constraintsJson));
          } catch {
            return {};
          }
        })()
      },
      members: members.map((m) => ({
        id: m.id,
        nickname: (() => {
          try {
            const p = JSON.parse(m.prefsJson);
            return typeof p.nickname === "string" ? p.nickname : undefined;
          } catch {
            return undefined;
          }
        })(),
        prefs: (() => {
          try {
            return PrefsSchema.parse(JSON.parse(m.prefsJson));
          } catch {
            return {};
          }
        })()
      }))
    };

    // Validate before sending
    const validated = PartyStateSchema.parse(resp);
    return Response.json(validated);
  } catch (e) {
    console.error("/api/party/state", e);
    return Response.json({ code: "INTERNAL" }, { status: 500 });
  }
}
