/* eslint-disable no-console */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// canonical categories (plain strings in schema)
const CATEGORIES = ["main", "veggie", "soup", "meat", "dessert"];

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
  ["Avocado Toast", 1, 1, true, ["gluten"], "avocado toast"],
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

function asDishes(category, arr) {
  return arr.map((a) => ({
    name: a[0],
    category,                 // <-- string, matches schema
    tags: [],                 // will be JSON.stringified
    costBand: a[1],
    timeBand: a[2],
    isHealthy: a[3],
    allergens: a[4],          // will be JSON.stringified
    ytQuery: a[5]
  }));
}

function dId(d) {
  return `${d.category}_${d.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`.slice(0, 50);
}

async function main() {
  console.log("Seeding Dish table…");

  // Build base set
  const base = [
    ...asDishes("main", MAIN),
    ...asDishes("veggie", VEGGIE),
    ...asDishes("soup", SOUP),
    ...asDishes("meat", MEAT),
    ...asDishes("dessert", DESSERT)
  ];

  // Add variants to reach ~85 rows
  const extras = [];
  const variants = ["(Spicy)", "(Low-carb)", "(Gluten-free)"];
  for (const b of base) {
    for (const v of variants) {
      if (extras.length + base.length >= 85) break;
      extras.push({
        ...b,
        name: `${b.name} ${v}`,
        tags: [...b.tags, v.replace(/[()]/g, "").toLowerCase()],
        isHealthy: b.isHealthy || v.includes("Low-carb") || v.includes("Gluten-free"),
        allergens: v.includes("Gluten-free") ? b.allergens.filter((x) => x !== "gluten") : b.allergens
      });
    }
    if (extras.length + base.length >= 85) break;
  }

  const final = [...base, ...extras].slice(0, 85);

  // Upsert rows (tags/allergens as JSON strings)
  let n = 0;
  for (const d of final) {
    await prisma.dish.upsert({
      where: { id: dId(d) },
      update: {
        name: d.name,
        category: d.category,
        tags: JSON.stringify(d.tags ?? []),
        allergens: JSON.stringify(d.allergens ?? []),
        costBand: d.costBand,
        timeBand: d.timeBand,
        isHealthy: d.isHealthy,
        ytQuery: d.ytQuery ?? null
      },
      create: {
        id: dId(d),
        name: d.name,
        category: d.category,
        tags: JSON.stringify(d.tags ?? []),
        allergens: JSON.stringify(d.allergens ?? []),
        costBand: d.costBand,
        timeBand: d.timeBand,
        isHealthy: d.isHealthy,
        ytQuery: d.ytQuery ?? null
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
