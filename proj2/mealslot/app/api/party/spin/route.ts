import "server-only";
export const runtime = "nodejs"; // Prisma + ws client => Node runtime

import { NextRequest } from "next/server";
import { z } from "zod";
import { dishesByCategory } from "@/lib/dishes";
import { weightedSpin } from "@/lib/scoring";
import { PowerUpsInput, Dish } from "@/lib/schemas";
import { prisma } from "@/lib/db";

// Optional WS broadcast from server → Socket.IO hub
let ioClient: typeof import("socket.io-client") | null = null;
async function emitWs(code: string, payload: any) {
  try {
    if (!ioClient) ioClient = await import("socket.io-client");
    const url = process.env.WS_URL || "http://localhost:4001";
    const sock = ioClient.io(url, { transports: ["websocket"], timeout: 1500, autoConnect: true });
    await new Promise<void>((resolve) => {
      const timer = setTimeout(() => resolve(), 500);
      sock.on("connect", () => resolve());
      setTimeout(() => clearTimeout(timer), 500);
    });
    sock.emit("spin", { code, selection: payload });
    setTimeout(() => sock.close(), 100);
  } catch (e) {
    console.warn("ws emit failed (non-fatal):", (e as Error).message);
  }
}

const Body = z.object({
  code: z.string().length(6),
  categories: z.array(z.string().min(1)).min(1).max(6),
  locked: z.array(z.object({ index: z.number().int().min(0).max(5), dishId: z.string() })).optional(),
  powerups: z.object({ healthy: z.boolean().optional(), cheap: z.boolean().optional(), max30m: z.boolean().optional() }).optional()
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json().catch(() => ({}));
    const parsed = Body.safeParse(json);
    if (!parsed.success) return Response.json({ issues: parsed.error.issues }, { status: 400 });

    const { code, categories, locked = [], powerups = {} as PowerUpsInput } = parsed.data;
    const reels: Dish[][] = categories.map((c) => dishesByCategory(c));
    const selection = weightedSpin(reels, locked, powerups);

    try {
      await prisma.spin.create({
        data: {
          reelsJson: JSON.stringify(reels.map((r) => r.map((d) => d.id))),
          lockedJson: JSON.stringify(locked),
          resultDishIds: JSON.stringify(selection.map((d) => d.id)),
          powerupsJson: JSON.stringify(powerups)
        }
      });
    } catch (e) {
      console.warn("party spin persist failed (non-fatal):", (e as Error).message);
    }

    emitWs(code, selection).catch(() => {});

    return Response.json({ spinId: `pty_spin_${Date.now()}`, reels, selection });
  } catch (err) {
    console.error("party spin route error:", err);
    return Response.json(
      { code: "INTERNAL_ERROR", message: (err as Error).message ?? "unknown" },
      { status: 500 }
    );
  }
}
