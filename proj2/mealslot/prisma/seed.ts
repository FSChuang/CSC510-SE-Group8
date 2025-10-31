/* eslint-disable no-console */
/**
 * prisma/seed.ts
 * Compatible with your current SQLite schema:
 * Dish {
 *   id, name, mealCategory (STRING), tags (CSV), allergens (CSV),
 *   costBand, timeBand, isHealthy, ytQuery?
 * }
 *
 * This seed:
 * - Accepts legacy objects with { id?, category?, tags?, allergens? }
 * - (Keeps) mealCategory inference helper available if you want it
 * - Normalizes tags/allergens to lowercase CSV
 * - Upserts by a stable id (uses provided id or a slug of the name)
 */

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// TS union for safety in code (DB stores string)
type MealCategory = "breakfast" | "lunch" | "dinner" | "dessert";

// ---------------- Heuristics (kept as-is; you can ignore if not needed) ----------------
const BREAKFAST_SIGNS = [
  "breakfast","pancake","waffle","omelet","omelette","egg","eggs","scramble","frittata",
  "cereal","granola","oatmeal","porridge","bagel","toast","hash brown","hashbrown",
  "bacon","sausage","muffin","french toast","overnight oats","avocado toast",
  "breakfast burrito","breakfast sandwich","chilaquiles","shakshuka","crepe",
  "smoothie bowl","yogurt parfait"
];

const DESSERT_SIGNS = [
  "dessert","sweet","ice cream","ice-cream","gelato","sorbet","cake","brownie","cookie",
  "tart","pie","cheesecake","pudding","custard","cupcake","macaron","chocolate",
  "banoffee","tiramisu","panna cotta","crème brûlée","donut","doughnut"
];

const LUNCH_HINTS = [
  "sandwich","wrap","burrito","salad","bowl","panini","burger","taco","poke","sushi",
  "grain bowl","power bowl","sub","banh mi","gyro","shawarma","kebab"
];

const DINNER_HINTS = [
  "steak","roast","braise","curry","pasta","noodle","risotto","stew","bbq","baked",
  "grilled","seared","stir fry","stir-fry","fried rice","lasagna","paella","enchilada"
];

const hasAny = (text: string, words: string[]) =>
  words.some((w) => text.includes(w));

const toCSV = (v: unknown): string => {
  if (v == null) return "";
  if (Array.isArray(v)) {
    return v.map((x) => String(x).trim().toLowerCase()).filter(Boolean).join(",");
  }
  return String(v)
    .replace(/;/g, ",")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .join(",");
};

const toText = (...parts: unknown[]) =>
  parts
    .map((p) => (p ?? "").toString().toLowerCase())
    .join(" ")
    .trim();

// NOTE: this is the original slug helper you had (NOT slugify)
const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60) || "dish";

// If you still want inference available, keep this; otherwise you can hard-set mealCategory in DISHES
function inferMealCategory(input: {
  mealCategory?: string;
  category?: string; // legacy
  name?: string;
  tagsCsv?: string;
}): MealCategory {
  const explicit = (input.mealCategory ?? input.category ?? "").toLowerCase();
  if (explicit === "breakfast" || explicit === "lunch" || explicit === "dinner" || explicit === "dessert") {
    return explicit as MealCategory;
  }

  const tagsCsv = (input.tagsCsv ?? "").toLowerCase();
  const tagTokens = tagsCsv.split(",").map(t => t.trim()).filter(Boolean);
  const hasTag = (t: string) => tagTokens.includes(t);
  if (hasTag("breakfast")) return "breakfast";
  if (hasTag("dessert"))   return "dessert";
  if (hasTag("dinner"))    return "dinner";
  if (hasTag("lunch"))     return "lunch";

  const text = toText(input.name, input.tagsCsv);
  if (hasAny(text, DESSERT_SIGNS))   return "dessert";
  if (hasAny(text, BREAKFAST_SIGNS)) return "breakfast";
  if (hasAny(text, ["steak","curry","roast","risotto","pasta","noodle","tikka","masala","ziti","bolognese","chimichurri"])) return "dinner";
  if (hasAny(text, ["wrap","sandwich","salad","bowl","panini","grain bowl","sushi","poke"])) return "lunch";
  return "lunch";
}

// ---------------- Your dish data ----------------
const DISHES: any[] = [
  // --- BREAKFAST ---
  { name: "Pancakes with Syrup", tags: "pancake,sweet,breakfast", allergens: "gluten,dairy", costBand: 2, timeBand: 2, isHealthy: false },
  { name: "Avocado Toast", tags: "avocado toast,toast,vegetarian,breakfast", allergens: "gluten", costBand: 2, timeBand: 1, isHealthy: true },
  { name: "Classic Omelet", tags: "omelet,egg,protein,breakfast", allergens: "egg,dairy", costBand: 2, timeBand: 1, isHealthy: true },
  { name: "Veggie Frittata", tags: "frittata,egg,vegetarian,breakfast", allergens: "egg,dairy", costBand: 2, timeBand: 2, isHealthy: true },
  { name: "Greek Yogurt Parfait", tags: "yogurt parfait,granola,fruit,breakfast,sweet", allergens: "dairy,gluten", costBand: 1, timeBand: 1, isHealthy: true },
  { name: "Oatmeal with Berries", tags: "oatmeal,porridge,breakfast,vegetarian", allergens: "gluten", costBand: 1, timeBand: 1, isHealthy: true },
  { name: "Breakfast Burrito", tags: "breakfast burrito,egg,wrap,breakfast", allergens: "gluten,egg,dairy", costBand: 2, timeBand: 2, isHealthy: false },
  { name: "Waffles and Fruit", tags: "waffle,sweet,breakfast", allergens: "gluten,dairy,egg", costBand: 2, timeBand: 2, isHealthy: false },
  { name: "Hash Browns and Eggs", tags: "hashbrown,egg,breakfast", allergens: "egg", costBand: 1, timeBand: 1, isHealthy: false },
  { name: "Bagel with Lox", tags: "bagel,toast,breakfast", allergens: "gluten,fish,dairy", costBand: 2, timeBand: 1, isHealthy: true },
  { name: "Shakshuka", tags: "shakshuka,egg,breakfast,vegetarian", allergens: "egg", costBand: 2, timeBand: 2, isHealthy: true },
  { name: "Smoothie Bowl", tags: "smoothie bowl,fruit,vegetarian,breakfast", allergens: "", costBand: 1, timeBand: 1, isHealthy: true },

  // --- LUNCH ---
  { name: "Grilled Chicken Bowl (Spicy)", tags: "grilled,spicy,protein,bowl,lunch", allergens: "", costBand: 2, timeBand: 2, isHealthy: true },
  { name: "Turkey Club Sandwich", tags: "sandwich,lunch", allergens: "gluten,dairy", costBand: 2, timeBand: 1, isHealthy: false },
  { name: "Caprese Panini", tags: "panini,sandwich,vegetarian,lunch", allergens: "gluten,dairy", costBand: 2, timeBand: 1, isHealthy: true },
  { name: "Falafel Wrap", tags: "wrap,vegetarian,lunch,mediterranean", allergens: "gluten,sesame", costBand: 2, timeBand: 1, isHealthy: true },
  { name: "Cobb Salad", tags: "salad,lunch,protein", allergens: "egg,dairy", costBand: 2, timeBand: 1, isHealthy: true },
  { name: "Chicken Caesar Salad", tags: "salad,lunch", allergens: "fish,dairy,gluten,egg", costBand: 2, timeBand: 1, isHealthy: true },
  { name: "Sushi Bento", tags: "sushi,lunch,fish", allergens: "fish,soy", costBand: 3, timeBand: 2, isHealthy: true },
  { name: "Poke Bowl (Tuna)", tags: "poke,bowl,fish,lunch", allergens: "fish,soy,sesame", costBand: 3, timeBand: 2, isHealthy: true },
  { name: "Veggie Grain Bowl", tags: "grain bowl,vegetarian,lunch,quick", allergens: "gluten", costBand: 2, timeBand: 1, isHealthy: true },
  { name: "BBQ Pulled Pork Sandwich", tags: "sandwich,bbq,lunch", allergens: "gluten", costBand: 2, timeBand: 2, isHealthy: false },

  // --- DINNER ---
  { name: "Spaghetti Bolognese", tags: "pasta,dinner,hearty", allergens: "gluten,dairy", costBand: 2, timeBand: 3, isHealthy: false },
  { name: "Margherita Pizza", tags: "pizza,vegetarian,dinner", allergens: "gluten,dairy", costBand: 2, timeBand: 2, isHealthy: false },
  { name: "Grilled Salmon with Veggies", tags: "grilled,fish,dinner,protein", allergens: "fish", costBand: 3, timeBand: 2, isHealthy: true },
  { name: "Beef Stir Fry", tags: "stir fry,dinner,protein", allergens: "soy", costBand: 2, timeBand: 2, isHealthy: true },
  { name: "Chicken Tikka Masala", tags: "curry,dinner,spicy", allergens: "dairy", costBand: 2, timeBand: 3, isHealthy: false },
  { name: "Tofu Stir Fry (Spicy)", tags: "stir fry,spicy,vegetarian,vegan,dinner", allergens: "soy", costBand: 2, timeBand: 2, isHealthy: true },
  { name: "Shrimp Fried Rice", tags: "fried rice,seafood,dinner", allergens: "shellfish,egg,soy", costBand: 2, timeBand: 2, isHealthy: false },
  { name: "Mushroom Risotto", tags: "risotto,vegetarian,dinner", allergens: "dairy", costBand: 3, timeBand: 3, isHealthy: true },
  { name: "Roast Chicken with Potatoes", tags: "roast,dinner,protein,hearty", allergens: "", costBand: 2, timeBand: 3, isHealthy: true },
  { name: "Beef Tacos", tags: "taco,dinner", allergens: "gluten", costBand: 2, timeBand: 1, isHealthy: false },
  { name: "Paneer Butter Masala", tags: "curry,vegetarian,dinner", allergens: "dairy", costBand: 2, timeBand: 3, isHealthy: false },
  { name: "Penne Arrabbiata", tags: "pasta,spicy,vegetarian,dinner", allergens: "gluten", costBand: 2, timeBand: 2, isHealthy: true },
  { name: "Steak with Chimichurri", tags: "steak,grilled,dinner,protein", allergens: "", costBand: 3, timeBand: 3, isHealthy: true },
  { name: "Vegan Chickpea Curry", tags: "curry,vegan,vegetarian,dinner", allergens: "", costBand: 1, timeBand: 2, isHealthy: true },
  { name: "Baked Ziti", tags: "pasta,baked,dinner,hearty", allergens: "gluten,dairy", costBand: 2, timeBand: 3, isHealthy: false },
  { name: "Seared Tuna with Rice", tags: "seared,fish,dinner,protein", allergens: "fish,soy", costBand: 3, timeBand: 2, isHealthy: true },
  { name: "Thai Green Curry (Chicken)", tags: "curry,spicy,dinner", allergens: "fish", costBand: 2, timeBand: 2, isHealthy: true },
  { name: "Veggie Pad Thai", tags: "noodle,vegetarian,dinner", allergens: "peanut,soy,egg", costBand: 2, timeBand: 2, isHealthy: false },
  { name: "Lentil Stew", tags: "stew,vegan,vegetarian,dinner,hearty", allergens: "", costBand: 1, timeBand: 3, isHealthy: true },

  // --- DESSERT ---
  { name: "Chocolate Cake", tags: "dessert,cake,sweet", allergens: "gluten,dairy,egg", costBand: 3, timeBand: 3, isHealthy: false },
  { name: "Vanilla Ice Cream", tags: "dessert,ice cream,sweet", allergens: "dairy", costBand: 1, timeBand: 1, isHealthy: false },
  { name: "Apple Pie", tags: "dessert,pie,sweet", allergens: "gluten,dairy", costBand: 2, timeBand: 3, isHealthy: false },
  { name: "Cheesecake", tags: "dessert,cheesecake,sweet", allergens: "gluten,dairy,egg", costBand: 3, timeBand: 3, isHealthy: false },
  { name: "Brownies", tags: "dessert,brownie,sweet,chocolate", allergens: "gluten,dairy,egg", costBand: 2, timeBand: 2, isHealthy: false },
  { name: "Lemon Tart", tags: "dessert,tart,sweet", allergens: "gluten,dairy,egg", costBand: 2, timeBand: 2, isHealthy: false },
  { name: "Panna Cotta", tags: "dessert,custard,sweet", allergens: "dairy", costBand: 2, timeBand: 2, isHealthy: false },
  { name: "Cookies and Milk", tags: "dessert,cookie,sweet", allergens: "gluten,dairy,egg", costBand: 1, timeBand: 1, isHealthy: false },
];

// ---------------- Normalization & main loop (reverted style) ----------------
type Normalized = {
  id: string;
  name: string;
  mealCategory: MealCategory;
  tags: string;       // CSV
  allergens: string;  // CSV
  costBand: number;
  timeBand: number;
  isHealthy: boolean;
  ytQuery: string | null;
};

function normalize(raw: any): Normalized {
  const name: string = String(raw.name ?? "").trim();
  if (!name) throw new Error("Dish missing name");

  const id: string = String(raw.id ?? slug(name));
  const tagsCsv = toCSV(raw.tags ?? raw.tagsCsv);
  const allergensCsv = toCSV(raw.allergens ?? raw.allergensCsv);

  const mealCategory: MealCategory =
    (raw.mealCategory as MealCategory) ??
    inferMealCategory({
      mealCategory: raw.mealCategory,
      category: raw.category,
      name,
      tagsCsv,
    });

  return {
    id,
    name,
    mealCategory,
    tags: tagsCsv,
    allergens: allergensCsv,
    costBand: Number.isFinite(raw.costBand) ? Number(raw.costBand) : 2,
    timeBand: Number.isFinite(raw.timeBand) ? Number(raw.timeBand) : 2,
    isHealthy: Boolean(raw.isHealthy ?? false),
    ytQuery: raw.ytQuery != null ? String(raw.ytQuery) : null,
  };
}

async function main() {
  if (!Array.isArray(DISHES) || DISHES.length === 0) {
    console.warn("No DISHES provided. Populate the DISHES array in prisma/seed.ts.");
    return;
  }

  const counters: Record<MealCategory, number> = {
    breakfast: 0, lunch: 0, dinner: 0, dessert: 0
  };

  // ✅ Reverted: build normalized objects (id via slug(name)), then upsert by id
  const rows: Normalized[] = DISHES.map(normalize);

  for (const d of rows) {
    await prisma.dish.upsert({
      where: { id: d.id },
      update: {
        name: d.name,
        mealCategory: d.mealCategory,
        tags: d.tags,
        allergens: d.allergens,
        costBand: d.costBand,
        timeBand: d.timeBand,
        isHealthy: d.isHealthy,
        ytQuery: d.ytQuery,
      },
      create: {
        id: d.id,
        name: d.name,
        mealCategory: d.mealCategory,
        tags: d.tags,
        allergens: d.allergens,
        costBand: d.costBand,
        timeBand: d.timeBand,
        isHealthy: d.isHealthy,
        ytQuery: d.ytQuery,
      },
    });

    counters[d.mealCategory] = (counters[d.mealCategory] ?? 0) + 1;
  }

  console.log("Seed complete. Category counts:");
  console.table(counters);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    return prisma.$disconnect().finally(() => process.exit(1));
  });
