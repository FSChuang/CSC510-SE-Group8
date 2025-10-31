import { NextRequest, NextResponse } from "next/server";
import {
  getCandidatesByCategory,
  filterByTagsAllergens,
  pickRandom,
  type MealCategory,
  type DishDTO,
} from "@/lib/dishes";

/** -------- lightweight validation helpers (no new deps) -------- */
const isMealCategory = (s: any): s is MealCategory =>
  s === "breakfast" || s === "lunch" || s === "dinner" || s === "dessert";

const toStringArray = (v: unknown): string[] =>
  Array.isArray(v) ? v.map((x) => String(x)).filter(Boolean) : [];

const toLockedArray = (v: unknown): string[] =>
  Array.isArray(v) ? v.map((x) => String(x)).filter(Boolean) : [];

const toNumberInRange = (v: unknown, min: number, max: number, def: number): number => {
  const n = Number(v);
  if (!Number.isInteger(n)) return def;
  return Math.min(Math.max(n, min), max);
};

const toBool = (v: unknown, def: boolean) =>
  typeof v === "boolean" ? v : def;

/** -------- strict guardrails for breakfast / dessert -------- */
const BFAST_SIGNS = [
  "breakfast","pancake","waffle","omelet","omelette","egg","eggs","scramble","frittata",
  "cereal","granola","oatmeal","porridge","bagel","toast","hashbrown","hash brown",
  "bacon","sausage","muffin","french toast","overnight oats","avocado toast",
  "breakfast burrito","breakfast sandwich","chilaquiles","shakshuka","crepe",
  "smoothie bowl","yogurt parfait"
];

const DESSERT_SIGNS = [
  "dessert","sweet","ice cream","ice-cream","gelato","sorbet","cake","brownie","cookie",
  "tart","pie","cheesecake","pudding","custard","cupcake","macaron","chocolate",
  "banoffee","tiramisu","panna cotta","crème brûlée","donut","doughnut"
];

const hasAny = (text: string, words: string[]) => words.some((w) => text.includes(w));

function strictCategoryFilter(items: DishDTO[], category: MealCategory): DishDTO[] {
  if (category === "breakfast" || category === "dessert") {
    const SIGNS = category === "breakfast" ? BFAST_SIGNS : DESSERT_SIGNS;
    return items.filter((d) => {
      const text = `${d.name} ${(d.tags ?? []).join(" ")}`.toLowerCase();
      return d.mealCategory === category || hasAny(text, SIGNS);
    });
  }
  return items; // lunch/dinner are broad
}

/** -------------------- Route -------------------- */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const category = body?.category;
    if (!isMealCategory(category)) {
      return NextResponse.json(
        { ok: false, error: { code: "BAD_REQUEST", message: "category must be breakfast | lunch | dinner | dessert" } },
        { status: 400 }
      );
    }

    const num = toNumberInRange(body?.num, 1, 20, 3);
    const tags = toStringArray(body?.tags).map((s) => s.toLowerCase());
    const allergens = toStringArray(body?.allergens).map((s) => s.toLowerCase());
    const locked = toLockedArray(body?.locked);
    const noDuplicates = toBool(body?.powerups?.noDuplicates, true);

    const candidates = await getCandidatesByCategory(category);
    const filtered = filterByTagsAllergens(candidates, { tags, allergens });
    const guarded = strictCategoryFilter(filtered, category);

    const lockedSet = new Set(locked);
    const lockedDishes = guarded.filter((d) => lockedSet.has(d.id));

    const remainderIds = new Set(lockedDishes.map((d) => d.id));
    const pool = guarded.filter((d) => !remainderIds.has(d.id));

    const need = Math.max(0, num - lockedDishes.length);
    if (need > 0 && pool.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "NO_CANDIDATES",
            message: `No ${category} dishes matched your filters.`,
            debug: {
              category,
              requested: num,
              afterCategory: candidates.length,
              afterFilters: filtered.length,
              afterGuard: guarded.length,
              lockedInResults: lockedDishes.length,
            },
          },
        },
        { status: 404 }
      );
    }

    const picks = pickRandom(pool, need, noDuplicates);
    const items = [...lockedDishes, ...picks];

    return NextResponse.json({ ok: true, items }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: { code: "SERVER_ERROR", message: "Unexpected error", detail: String(err?.message ?? err) } },
      { status: 500 }
    );
  }
}

// Optional: friendly GET so opening the route in a browser doesn't look broken
export async function GET() {
  return NextResponse.json(
    { ok: false, error: { code: "METHOD_NOT_ALLOWED", message: "Use POST /api/spin" } },
    { status: 405 }
  );
}
