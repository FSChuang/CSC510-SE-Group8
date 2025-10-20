import "server-only";
export const runtime = "nodejs"; // Prisma + ws client => Node runtime

import { NextRequest } from "next/server";
import { z } from "zod";
import { dishesByCategory } from "@/lib/dishes";
import { weightedSpin } from "@/lib/scoring";
import { PowerUpsInput, Dish } from "@/lib/schemas";
import { prisma } from "@/lib/db";

// ----------------- WS helper -----------------
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

// ----------------- Zod schemas -----------------
const Prefs = z.object({
  diet: z.array(z.string()).optional(),         // e.g., ["vegetarian"]
  allergens: z.array(z.string()).optional(),    // e.g., ["gluten","dairy"]
  budgetBand: z.number().int().min(1).max(3).optional(), // 1=cheap
  timeBand: z.number().int().min(1).max(3).optional(),   // 1=≤30m
});

const Body = z.object({
  code: z.string().length(6),
  categories: z.array(z.string().min(1)).min(1).max(6),
  locked: z
    .array(z.object({ index: z.number().int().min(0).max(5), dishId: z.string() }))
    .optional(),
  powerups: z
    .object({
      healthy: z.boolean().optional(),
      cheap: z.boolean().optional(),
      max30m: z.boolean().optional(),
    })
    .optional(),
  prefs: Prefs.optional(), // merged party prefs
});

// ----------------- Prefs filter -----------------
function makePrefsFilter(prefs?: z.infer<typeof Prefs>) {
  if (!prefs) return (_d: Dish) => true;

  const diet = prefs.diet ?? [];
  const allergens = new Set(prefs.allergens ?? []);
  const maxCost = prefs.budgetBand ?? 3;
  const maxTime = prefs.timeBand ?? 3;

  return (d: Dish) => {
    // Allergens: exclude any dish containing a selected allergen
    if (allergens.size && (d.allergens ?? []).some((a) => allergens.has(a))) return false;

    // Diet rules (simple MVP):
    if (diet.includes("vegetarian") && d.category === "meat") return false;
    if (diet.includes("vegan")) {
      if (d.category === "meat") return false;
      if ((d.allergens ?? []).some((a) => a === "dairy" || a === "egg")) return false;
    }
    if (diet.includes("pescatarian") && d.category === "meat") return false; // adjust if fish is modeled separately

    // Budget/time bands (dish must be <= selected band)
    if (d.costBand && d.costBand > maxCost) return false;
    if (d.timeBand && d.timeBand > maxTime) return false;

    return true;
  };
}

// ----------------- Handler -----------------
export async function POST(req: NextRequest) {
  try {
    const json = await req.json().catch(() => ({}));
    const parsed = Body.safeParse(json);
    if (!parsed.success) return Response.json({ issues: parsed.error.issues }, { status: 400 });

    const { code, categories, locked = [], powerups = {} as PowerUpsInput, prefs } = parsed.data;

    // 1) Diet-based category pruning (prevents "meat" reel from reappearing via fallback)
    const diet = prefs?.diet ?? [];
    const dietRemovesMeat =
      diet.includes("vegetarian") || diet.includes("vegan") || diet.includes("pescatarian");
    const effectiveCategories = dietRemovesMeat
      ? categories.filter((c) => c !== "meat")
      : categories;

    // 2) Build reels for the effective categories
    const reelsAll: Dish[][] = effectiveCategories.map((c) => dishesByCategory(c));

    // 3) Apply prefs filtering with safe fallback (to the already-pruned reel)
    const passes = makePrefsFilter(prefs);
    const reels: Dish[][] = reelsAll.map((reel) => {
      const f = reel.filter(passes);
      return f.length ? f : reel;
    });

    // 4) Spin
    const selection = weightedSpin(reels, locked, powerups);

    // 5) Persist (non-fatal if it fails)
    try {
      await prisma.spin.create({
        data: {
          reelsJson: JSON.stringify(reels.map((r) => r.map((d) => d.id))),
          lockedJson: JSON.stringify(locked),
          resultDishIds: JSON.stringify(selection.map((d) => d.id)),
          powerupsJson: JSON.stringify(powerups),
        },
      });
    } catch (e) {
      console.warn("party spin persist failed (non-fatal):", (e as Error).message);
    }

    // 6) Optional realtime broadcast
    emitWs(code, selection).catch(() => {});

    // 7) Response
    return Response.json({
      spinId: `pty_spin_${Date.now()}`,
      appliedPrefs: prefs ?? null,
      categoriesUsed: effectiveCategories,
      reels,
      selection,
    });
  } catch (err) {
    console.error("party spin route error:", err);
    return Response.json(
      { code: "INTERNAL_ERROR", message: (err as Error).message ?? "unknown" },
      { status: 500 }
    );
  }
}
