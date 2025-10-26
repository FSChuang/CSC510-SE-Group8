/* eslint-disable no-console */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * We now treat model.Dish.category as the *meal* category:
 *   "breakfast" | "lunch" | "dinner" | "dessert"
 *
 * We still build from your original course groupings (main|veggie|soup|meat|dessert),
 * but only to infer a sensible meal category. We don't store the course
 * anywhere except optionally as a tag (commented out below).
 */

const MAIN = [
  ["Margherita Pizza", 2, 2, false, ["gluten", "dairy"], "margherita pizza"],
  ["Grilled Chicken Bowl", 2, 2, true, [], "grilled chicken bowl"],
  ["Tofu Stir Fry", 1, 1, true, ["soy"], "tofu stir fry"],
  ["Pasta Bolognese", 2, 2, false, ["gluten"], "pasta bolognese"],
  ["Sushi Platter", 3, 3, true, ["fish"], "sushi at home"],
  ["Veggie Burrito", 1, 1, true, ["gluten"], "veggie burrito"],
  ["Beef Tacos", 1, 1, false, ["gluten"], "beef tacos"],
  ["Shrimp Fried Rice", 1, 1, false, ["shellfish"], "shrimp fried rice"],
  ["Paneer Butter Masala", 2, 2, false, ["dairy"], "paneer butter masala"],
  ["Bibimbap", 2, 2, true, ["egg"], "bibimbap recipe"],
  ["Falafel Bowl", 1, 2, true, [], "falafel bowl"],
  ["Ramen", 2, 3, false, ["gluten"], "home ramen"],
  ["Pho", 2, 3, true, [], "pho recipe"],
  ["Steak & Potatoes", 3, 2, false, [], "steak potatoes"]
];

const VEGGIE = [
  ["Caesar Salad", 1, 1, true, ["dairy"], "caesar salad"],
  ["Greek Salad", 1, 1, true, ["dairy"], "greek salad"],
  ["Quinoa Bowl", 1, 1, true, [], "quinoa bowl"],
  ["Caprese", 1, 1, true, ["dairy"], "caprese salad"],
  ["Roasted Veg Medley", 1, 2, true, [], "roasted vegetables"],
  ["Kale & Chickpea", 1, 1, true, [], "kale chickpea salad"],
  ["Coleslaw", 1, 1, true, [], "coleslaw"],
  ["Cobb Salad", 2, 1, false, ["egg", "dairy"], "cobb salad"],
  ["Avocado Toast", 1, 1, true, ["gluten"], "avocado toast"], // -> breakfast special-case
  ["Hummus Plate", 1, 1, true, ["sesame"], "hummus plate"]
];

const SOUP = [
  ["Tomato Soup", 1, 1, true, [], "tomato soup"],
  ["Chicken Noodle Soup", 1, 2, true, ["gluten"], "chicken noodle soup"],
  ["Miso Soup", 1, 1, true, ["soy"], "miso soup"],
  ["Lentil Soup", 1, 2, true, [], "lentil soup"],
  ["Minestrone", 1, 2, true, ["gluten"], "minestrone"],
  ["Butternut Squash", 1, 2, true, [], "butternut squash soup"],
  ["Beef Broth", 1, 2, false, [], "beef broth soup"],
  ["Clam Chowder", 2, 2, false, ["shellfish", "dairy"], "clam chowder"],
  ["Hot & Sour", 1, 1, true, ["soy"], "hot sour soup"],
  ["Corn Chowder", 1, 2, false, ["dairy"], "corn chowder"]
];

const MEAT = [
  ["Beef Bulgogi", 2, 2, false, ["soy"], "beef bulgogi"],
  ["BBQ Ribs", 3, 3, false, [], "bbq ribs"],
  ["Chicken Satay", 2, 2, true, ["peanut"], "chicken satay"],
  ["Pork Schnitzel", 2, 2, false, ["gluten", "egg"], "pork schnitzel"],
  ["Lamb Chops", 3, 2, false, [], "lamb chops"],
  ["Teriyaki Chicken", 2, 2, false, ["soy"], "teriyaki chicken"],
  ["Turkey Meatballs", 1, 2, true, ["egg"], "turkey meatballs"],
  ["Beef Stir Fry", 1, 1, false, ["soy"], "beef stir fry"],
  ["Roast Chicken", 2, 3, true, [], "roast chicken"],
  ["Fish & Chips", 2, 2, false, ["gluten", "fish"], "fish and chips"]
];

const DESSERT = [
  ["Chia Pudding", 1, 1, true, [], "chia pudding"],
  ["Chocolate Brownie", 1, 1, false, ["gluten"], "chocolate brownie"],
  ["Fruit Salad", 1, 1, true, [], "fruit salad"],
  ["Tiramisu", 2, 2, false, ["dairy", "egg", "gluten"], "tiramisu"],
  ["Panna Cotta", 2, 2, false, ["dairy"], "panna cotta"],
  ["Apple Pie", 2, 2, false, ["gluten"], "apple pie"],
  ["Cheesecake", 2, 2, false, ["dairy", "gluten"], "cheesecake"],
  ["Yogurt Parfait", 1, 1, true, ["dairy"], "yogurt parfait"],
  ["Mochi", 1, 1, true, [], "mochi dessert"],
  ["Banana Bread", 1, 2, false, ["gluten"], "banana bread"]
];

/** Explicit breakfast set: [name, costBand, timeBand, isHealthy, allergens[], ytQuery, course] */
const BREAKFAST = [
  ["Pancakes", 1, 1, false, ["gluten", "dairy", "egg"], "pancakes recipe", "main"],
  ["Omelette", 1, 1, true, ["egg", "dairy"], "omelette recipe", "main"],
  ["Breakfast Burrito", 1, 1, false, ["gluten", "egg", "dairy"], "breakfast burrito", "main"],
  ["Oatmeal", 1, 1, true, [], "oatmeal recipe", "main"],
  ["Smoothie Bowl", 1, 1, true, [], "smoothie bowl", "veggie"],
  ["French Toast", 1, 1, false, ["gluten", "dairy", "egg"], "french toast", "main"],
  ["Shakshuka", 1, 1, true, ["egg"], "shakshuka", "main"],
  ["Granola Bowl", 1, 1, true, ["dairy"], "granola yogurt bowl", "dessert"],
  ["Bagel & Lox", 2, 1, false, ["gluten", "fish", "dairy"], "bagel lox", "main"]
];

// ---------- helpers ----------

function slug(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

// Infer meal category from course + name
function inferMealCategory(course, name) {
  if (/avocado toast/i.test(name)) return "breakfast";
  if (course === "dessert") return "dessert";
  if (course === "soup" || course === "veggie") return "lunch";
  if (course === "main" || course === "meat") return "dinner";
  return "dinner";
}

function asDishes(course, arr, forceMeal) {
  return arr.map((a) => {
    const name = a[0];
    return {
      // model fields
      id: "", // fill below
      name,
      category: forceMeal ?? inferMealCategory(course, name), // <-- meal category for UI
      tags: [],            // CSV later
      allergens: a[4],     // CSV later
      costBand: a[1],
      timeBand: a[2],
      isHealthy: a[3],
      ytQuery: a[5] ?? null
      // If you want to keep the original "course" for debugging:
      // tags: [course] // uncomment to store course as a tag
    };
  });
}

function asBreakfastDishes(arr) {
  return arr.map((a) => ({
    id: "",
    name: a[0],
    category: "breakfast",
    tags: [],            // or [a[6]] to store course as a tag
    allergens: a[4],
    costBand: a[1],
    timeBand: a[2],
    isHealthy: a[3],
    ytQuery: a[5] ?? null
  }));
}

// Build a stable ID using the meal category (now in .category)
function buildId(d) {
  return `${d.category}_${slug(d.name)}`.slice(0, 50);
}

async function main() {
  console.log("Seeding Dish table…");

  // Base set
  const base = [
    ...asDishes("main", MAIN),
    ...asDishes("veggie", VEGGIE),
    ...asDishes("soup", SOUP),
    ...asDishes("meat", MEAT),
    ...asDishes("dessert", DESSERT),
    ...asBreakfastDishes(BREAKFAST)
  ];

  // Variants to ~95 rows
  const variants = ["(Spicy)", "(Low-carb)", "(Gluten-free)"];
  const CAP = 95;
  const extras = [];

  for (const b of base) {
    for (const v of variants) {
      if (base.length + extras.length >= CAP) break;
      const isGF = v.includes("Gluten-free");
      extras.push({
        ...b,
        id: "",
        name: `${b.name} ${v}`,
        tags: [...b.tags, v.replace(/[()]/g, "").toLowerCase()],
        isHealthy: b.isHealthy || v.includes("Low-carb") || isGF,
        allergens: isGF ? (b.allergens ?? []).filter((x) => x !== "gluten") : (b.allergens ?? [])
      });
    }
    if (base.length + extras.length >= CAP) break;
  }

  const final = [...base, ...extras].slice(0, CAP).map((d) => ({ ...d, id: buildId(d) }));

  // Upsert with CSV fields
  let n = 0;
  for (const d of final) {
    await prisma.dish.upsert({
      where: { id: d.id },
      update: {
        name: d.name,
        category: d.category,                     // meal category
        tags: (d.tags ?? []).join(","),           // CSV
        allergens: (d.allergens ?? []).join(","), // CSV
        costBand: d.costBand,
        timeBand: d.timeBand,
        isHealthy: d.isHealthy,
        ytQuery: d.ytQuery
      },
      create: {
        id: d.id,
        name: d.name,
        category: d.category,
        tags: (d.tags ?? []).join(","),           // CSV
        allergens: (d.allergens ?? []).join(","), // CSV
        costBand: d.costBand,
        timeBand: d.timeBand,
        isHealthy: d.isHealthy,
        ytQuery: d.ytQuery
      }
    });
    n++;
  }

  console.log(`Seeded dishes=${n}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
