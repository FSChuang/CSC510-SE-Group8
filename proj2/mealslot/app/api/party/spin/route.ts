import { NextResponse } from "next/server";

/**
 * Robust party spin:
 * - Never throws; always returns a 3-slot triple.
 * - Defaults categories to ["dinner"].
 * - Respects `locked`+incoming `slots`.
 * - Dedupes across slots.
 * - If the internal /api/spin call fails for ANY reason, falls back to a tiny baked menu.
 */
export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const body = await req.json().catch(() => ({}));

    const {
      code,
      categories,
      locked = [false, false, false],
      powerups = {},
      constraints = {},
      slots = [null, null, null],
    }: {
      code?: string;
      categories?: string[];
      locked?: [boolean, boolean, boolean];
      powerups?: Record<string, any>;
      constraints?: Record<string, any>;
      slots?: Array<any | null>;
    } = body ?? {};

    const cats: string[] =
      Array.isArray(categories) && categories.length ? categories : ["dinner"];

    // Local ultra-simple fallback menu (used only if /api/spin is unavailable).
    const fallbackMenu = [
      { id: "fb_1", name: "Veggie Fried Rice", category: "dinner", tags: ["quick"], allergens: ["soy"], ytQuery: "veggie fried rice" },
      { id: "fb_2", name: "Chicken Tacos", category: "dinner", tags: ["gluten free"], allergens: [], ytQuery: "chicken tacos easy" },
      { id: "fb_3", name: "Mediterranean Grain Bowl", category: "dinner", tags: ["healthy"], allergens: ["dairy"], ytQuery: "mediterranean grain bowl" },
      { id: "fb_4", name: "Pesto Pasta", category: "dinner", tags: [], allergens: ["gluten","dairy"], ytQuery: "pesto pasta" },
      { id: "fb_5", name: "Fruit Yogurt Cup", category: "dessert", tags: ["healthy"], allergens: ["dairy"], ytQuery: "fruit yogurt parfait" },
      { id: "fb_6", name: "Garlic Bread", category: "side", tags: [], allergens: ["gluten","dairy"], ytQuery: "garlic bread" },
    ];

    const used = new Set<string>();
    const addUsed = (d: any) => { const id = String(d?.id ?? ""); if (id) used.add(id); };

    // Seed locked slots (and mark as used)
    const out: [any | null, any | null, any | null] = [null, null, null];
    for (let i = 0; i < 3; i++) {
      if (locked[i] && slots?.[i]) {
        out[i] = slots[i];
        addUsed(slots[i]);
      }
    }

    // Call same-origin /api/spin safely
    const callSingle = async (): Promise<any[]> => {
      try {
        const spinUrl = new URL("/api/spin", url);
        const r = await fetch(spinUrl.toString(), {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ categories: cats, powerups, constraints }),
          cache: "no-store",
        });
        const j = await r.json().catch(() => ({}));
        if (Array.isArray(j?.selection)) return j.selection;
        if (j?.selection) return [j.selection];
        return [];
      } catch {
        // If the internal fetch fails (dev proxy, transient, etc.), use fallback list.
        return fallbackMenu;
      }
    };

    const pickFresh = (arr: any[]) => {
      for (const d of arr || []) {
        const id = String(d?.id ?? "");
        if (id && !used.has(id)) {
          addUsed(d);
          return d;
        }
      }
      return null;
    };

    // Try up to a few pulls to fill the three slots
    for (let tries = 0; tries < 6; tries++) {
      for (let i = 0; i < 3; i++) {
        if (locked[i] || out[i]) continue;
        const arr = await callSingle();
        const d = pickFresh(arr);
        if (d) out[i] = d;
      }
      if (out[0] && out[1] && out[2]) break;
    }

    // Guaranteed placeholders
    const mk = (i: number) =>
      out[i] ||
      { id: `placeholder_${i}`, name: "No options", category: "unknown", tags: [], allergens: [], ytQuery: "quick recipe" };

    const triple = [mk(0), mk(1), mk(2)] as [any, any, any];

    return NextResponse.json({ code, selection: triple, meta: { deduped: true } }, { status: 200 });
  } catch (err: any) {
    // Even if JSON parsing, etc. fails, still respond safely
    const triple = [
      { id: "placeholder_0", name: "No options", category: "unknown", tags: [], allergens: [], ytQuery: "quick recipe" },
      { id: "placeholder_1", name: "No options", category: "unknown", tags: [], allergens: [], ytQuery: "quick recipe" },
      { id: "placeholder_2", name: "No options", category: "unknown", tags: [], allergens: [], ytQuery: "quick recipe" },
    ] as [any, any, any];
    return NextResponse.json({ error: err?.message || "Recovered", selection: triple }, { status: 200 });
  }
}
