import "server-only";
export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { z } from "zod";
import { dishesByCategoryDbFirst } from "@/lib/dishes";
import { Dish, PowerUpsInput } from "@/lib/schemas";
import { weightedSpin } from "@/lib/scoring";
import { prisma } from "@/lib/db";

// Optional WS broadcast to your Socket.IO hub
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
  category: z.string().min(1),
  num: z.number().int().min(1).max(12).default(3),
  tags: z.array(z.string()).optional().default([]),
  allergens: z.array(z.string()).optional().default([]),
  locked: z
    .array(z.object({ index: z.number().int().min(0), dishId: z.string() }))
    .optional()
    .default([]),
  powerups: z
    .object({
      healthy: z.boolean().optional(),
      cheap: z.boolean().optional(),
      max30m: z.boolean().optional(),
    })
    .optional()
    .default({}),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json().catch(() => ({}));
    const parsed = Body.safeParse(json);
    if (!parsed.success) return Response.json({ issues: parsed.error.issues }, { status: 400 });

    const { code, category, num, tags, allergens, locked, powerups } = parsed.data;

    const options: Dish[] = await dishesByCategoryDbFirst(category, tags, allergens);
    if (!options.length) {
      return Response.json(
        { code: "NO_OPTIONS", message: "No dishes available for the selected filters." },
        { status: 400 }
      );
    }

    const reels: Dish[][] = Array.from({ length: num }, () => options);
    const saneLocked = (locked ?? [])
      .filter((l) => l.index >= 0 && l.index < num)
      .map((l) => ({ index: l.index, dishId: l.dishId }));

    const selection = weightedSpin(reels, saneLocked, powerups as PowerUpsInput);

    try {
      await prisma.spin.create({
        data: {
          reelsJson: JSON.stringify(reels.map((r) => r.map((d) => d.id))),
          lockedJson: JSON.stringify(saneLocked),
          resultDishIds: JSON.stringify(selection.map((d) => d.id)),
          powerupsJson: JSON.stringify(powerups),
        },
      });
    } catch (e) {
      console.warn("party spin persist failed (non-fatal):", (e as Error).message);
    }

    // Notify party clients
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
