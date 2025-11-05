/* eslint-disable no-console */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// canonical categories (plain strings in schema)
const CATEGORIES = ["breakfast", "lunch", "dinner", "dessert"];

const BREAKFAST = [
  ["Overnight Oats", 1, 1, true, ["oats", "dairy"], "overnight oats recipe"],
  ["Greek Yogurt Parfait", 1, 1, true, ["dairy"], "yogurt parfait"],
  ["Veggie Omelette", 1, 1, true, ["egg", "dairy"], "veggie omelette"],
  ["Avocado Toast", 1, 1, true, ["gluten"], "avocado toast"],
  ["Scrambled Eggs & Toast", 1, 1, true, ["egg", "gluten"], "scrambled eggs toast"],
  ["Breakfast Burrito", 2, 2, false, ["gluten", "egg", "dairy"], "breakfast burrito"],
  ["Protein Smoothie", 1, 1, true, ["dairy"], "breakfast protein smoothie"],
  ["Berry Smoothie Bowl", 1, 1, true, [], "smoothie bowl"],
  ["Banana Pancakes", 2, 2, false, ["gluten", "egg", "dairy"], "banana pancakes"],
  ["Whole-Grain Waffles", 2, 2, false, ["gluten", "egg", "dairy"], "healthy waffles"],
  ["French Toast", 2, 2, false, ["gluten", "egg", "dairy"], "french toast"],
  ["Bagel & Lox", 2, 2, false, ["gluten", "fish", "dairy"], "bagel and lox"],
  ["Breakfast Sandwich", 2, 2, false, ["gluten", "egg", "dairy"], "egg cheese breakfast sandwich"],
  ["Shakshuka", 2, 2, true, ["egg"], "shakshuka"],
  ["Chia Pudding", 1, 1, true, [], "chia pudding"],
  ["Cottage Cheese Bowl", 1, 1, true, ["dairy"], "cottage cheese breakfast bowl"],
  ["Peanut Butter Toast", 1, 1, true, ["gluten", "peanut"], "peanut butter toast"],
  ["Oatmeal with Fruit", 1, 1, true, ["oats"], "stovetop oatmeal"],
  ["Breakfast Quesadilla", 2, 2, false, ["gluten", "dairy", "egg"], "breakfast quesadilla"],
  ["Spinach Feta Frittata", 2, 2, true, ["egg", "dairy"], "spinach feta frittata"],
  ["Tofu Scramble", 1, 1, true, ["soy"], "tofu scramble"],
  ["Breakfast Hash (Egg & Potato)", 2, 2, true, ["egg"], "breakfast hash"],
  ["Smoked Salmon Scramble", 2, 2, true, ["egg", "fish", "dairy"], "smoked salmon scrambled eggs"],
  ["Huevos Rancheros", 2, 2, true, ["egg"], "huevos rancheros"],
  ["Breakfast Tacos", 1, 1, false, ["gluten", "egg", "dairy"], "breakfast tacos"],
  ["Blueberry Muffins", 2, 2, false, ["gluten", "egg", "dairy"], "blueberry muffins"],
  ["Granola & Milk", 1, 1, true, ["oats", "dairy"], "homemade granola"],
  ["Fruit & Nut Bowl", 1, 1, true, ["tree-nut"], "fruit and nuts breakfast"],
  ["Porridge (Congee) with Egg", 1, 2, true, ["egg"], "congee breakfast"],
  ["Ricotta Honey Toast", 1, 1, false, ["gluten", "dairy"], "ricotta honey toast"],
  ["Breakfast Sausage & Eggs", 2, 2, false, ["egg"], "eggs and sausage"],
  ["Turkey Bacon & Eggs", 2, 2, true, ["egg"], "turkey bacon eggs"],
  ["Breakfast Skillet (Veggie)", 2, 2, true, [], "vegetable breakfast skillet"],
  ["Oat Banana Smoothie", 1, 1, true, ["oats", "dairy"], "banana oat smoothie"],
  ["Steel-Cut Oats (Instant Pot)", 1, 2, true, ["oats"], "instant pot steel cut oats"],
  ["Almond Butter Overnight Oats", 1, 1, true, ["oats", "tree-nut"], "almond butter overnight oats"],
  ["Breakfast Paratha & Yogurt", 2, 2, false, ["gluten", "dairy"], "aloo paratha yogurt"],
  ["Egg White Wrap", 1, 1, true, ["egg", "gluten"], "egg white wrap"],
  ["Matcha Chia Latte & Toast", 1, 1, true, ["gluten"], "matcha chia latte"]
];


const LUNCH = [
  ["Caesar Salad", 1, 1, true, ["dairy"], "caesar salad"],
  ["Greek Salad", 1, 1, true, ["dairy"], "greek salad"],
  ["Quinoa Power Bowl", 1, 2, true, [], "quinoa bowl"],
  ["Caprese Sandwich", 1, 2, false, ["gluten", "dairy"], "caprese sandwich"],
  ["Chicken Caesar Wrap", 2, 2, true, ["gluten", "dairy"], "chicken caesar wrap"],
  ["Turkey Avocado Sandwich", 2, 2, true, ["gluten"], "turkey avocado sandwich"],
  ["Hummus Veggie Wrap", 1, 2, true, ["gluten", "sesame"], "hummus veggie wrap"],
  ["Falafel Pita", 2, 2, true, ["gluten", "sesame"], "falafel pita"],
  ["Cobb Salad", 2, 2, false, ["egg", "dairy"], "cobb salad"],
  ["Avocado Toast", 1, 1, true, ["gluten"], "avocado toast"],
  ["Grilled Chicken Bowl", 2, 2, true, [], "grilled chicken bowl"],
  ["BBQ Chicken Salad", 2, 2, true, ["dairy"], "bbq chicken salad"],
  ["Tuna Salad Sandwich", 2, 2, false, ["gluten", "fish", "egg"], "tuna salad sandwich"],
  ["Asian Chicken Lettuce Wraps", 2, 2, true, ["soy"], "chicken lettuce wraps"],
  ["Veggie Grain Bowl", 1, 2, true, [], "veggie grain bowl"],
  ["Burrito Bowl", 2, 2, true, [], "burrito bowl"],
  ["Shrimp Tacos", 2, 2, false, ["shellfish", "gluten"], "shrimp tacos"],
  ["Beef Tacos", 2, 2, false, ["gluten"], "beef tacos"],
  ["Grilled Veggie Panini", 2, 2, false, ["gluten", "dairy"], "grilled veggie panini"],
  ["Soup & Salad Combo", 1, 1, true, ["dairy"], "soup and salad combo"],
  ["Sushi Bento Box", 3, 3, true, ["fish", "soy"], "sushi lunch box"],
  ["Chicken Shawarma Plate", 3, 3, true, ["sesame"], "chicken shawarma plate"],
  ["Poke Bowl", 3, 3, true, ["fish", "soy"], "poke bowl"],
  ["Pasta Primavera", 2, 3, false, ["gluten", "dairy"], "pasta primavera"],
  ["Lentil Curry Bowl", 2, 2, true, [], "lentil curry bowl"],
  ["Vegetable Stir Fry", 2, 2, true, ["soy"], "vegetable stir fry"],
  ["Chicken Fried Rice", 2, 2, false, ["egg", "soy"], "chicken fried rice"],
  ["Turkey Chili", 2, 2, true, [], "turkey chili"],
  ["Stuffed Bell Peppers", 2, 2, true, [], "stuffed bell peppers"],
  ["Fish Tacos", 2, 2, false, ["fish", "gluten"], "fish tacos"],
  ["Quinoa Veggie Wrap", 1, 2, true, ["gluten"], "quinoa veggie wrap"],
  ["Avocado Chicken Salad", 2, 2, true, ["egg"], "avocado chicken salad"],
  ["Turkey BLT Sandwich", 2, 2, false, ["gluten", "dairy"], "turkey blt sandwich"],
  ["Thai Peanut Noodle Bowl", 2, 3, false, ["peanut", "soy", "gluten"], "thai peanut noodles"],
  ["Banh Mi Sandwich", 2, 2, false, ["gluten", "soy"], "banh mi sandwich"],
  ["Ramen Lunch Bowl", 2, 3, false, ["gluten", "soy", "egg"], "ramen lunch bowl"],
  ["Tofu Buddha Bowl", 1, 2, true, ["soy"], "tofu buddha bowl"],
  ["Mediterranean Salad", 1, 1, true, ["dairy"], "mediterranean salad"],
  ["Black Bean Burger", 2, 2, true, ["gluten", "soy"], "black bean burger"],
  ["Grilled Salmon Plate", 3, 3, true, ["fish"], "grilled salmon lunch"],
  ["Chicken Pesto Pasta", 2, 3, false, ["gluten", "dairy"], "chicken pesto pasta"],
  ["Asian Noodle Salad", 2, 2, true, ["soy", "gluten"], "asian noodle salad"]
];


const DINNER = [
  ["Grilled Salmon with Veggies", 3, 3, true, ["fish"], "grilled salmon dinner"],
  ["Chicken Alfredo Pasta", 3, 3, false, ["gluten", "dairy"], "chicken alfredo pasta"],
  ["Beef Stir Fry", 2, 2, true, ["soy"], "beef stir fry dinner"],
  ["Vegetable Curry", 2, 2, true, [], "vegetable curry"],
  ["Shrimp Scampi", 3, 3, false, ["shellfish", "gluten"], "shrimp scampi recipe"],
  ["Lentil Stew", 1, 2, true, [], "lentil stew"],
  ["Stuffed Bell Peppers", 2, 2, true, [], "stuffed bell peppers"],
  ["Teriyaki Chicken Bowl", 2, 2, false, ["soy"], "teriyaki chicken bowl"],
  ["Tofu & Broccoli Stir Fry", 1, 2, true, ["soy"], "tofu broccoli stir fry"],
  ["Spaghetti Bolognese", 2, 3, false, ["gluten"], "spaghetti bolognese"],
  ["Pesto Pasta with Chicken", 2, 3, false, ["gluten", "dairy"], "chicken pesto pasta"],
  ["Roast Chicken with Potatoes", 3, 3, true, [], "roast chicken potatoes"],
  ["Veggie Fried Rice", 1, 2, true, ["soy"], "vegetable fried rice"],
  ["BBQ Ribs", 3, 3, false, [], "bbq ribs"],
  ["Miso Glazed Cod", 3, 3, true, ["fish", "soy"], "miso glazed cod"],
  ["Falafel Plate with Rice", 2, 2, true, ["sesame"], "falafel plate dinner"],
  ["Thai Green Curry", 2, 3, false, ["soy"], "thai green curry"],
  ["Beef and Broccoli", 2, 2, false, ["soy"], "beef and broccoli"],
  ["Eggplant Parmesan", 2, 3, false, ["gluten", "dairy"], "eggplant parmesan"],
  ["Chicken Fajitas", 2, 2, true, [], "chicken fajitas"],
  ["Turkey Meatballs with Pasta", 2, 3, false, ["gluten", "egg"], "turkey meatballs pasta"],
  ["Seared Tuna Bowl", 3, 3, true, ["fish", "soy"], "seared tuna bowl"],
  ["Chickpea & Spinach Stew", 1, 2, true, [], "chickpea spinach stew"],
  ["Lamb Chops with Asparagus", 3, 3, false, [], "lamb chops dinner"],
  ["Coconut Curry Shrimp", 3, 3, false, ["shellfish"], "coconut shrimp curry"],
  ["Margherita Pizza (Dinner Size)", 2, 3, false, ["gluten", "dairy"], "margherita pizza dinner"],
  ["Vegetable Pad Thai", 2, 2, true, ["peanut", "soy", "egg"], "vegetable pad thai"],
  ["Salmon Teriyaki Bowl", 3, 3, true, ["fish", "soy"], "salmon teriyaki"],
  ["Stuffed Portobello Mushrooms", 2, 2, true, ["dairy"], "stuffed portobello mushrooms"],
  ["Chicken Tikka Masala", 3, 3, false, ["dairy"], "chicken tikka masala"],
  ["Grilled Steak & Veggies", 3, 3, false, [], "grilled steak dinner"],
  ["Tofu Katsu Curry", 2, 3, false, ["soy", "gluten"], "tofu katsu curry"],
  ["Pasta Primavera", 2, 2, true, ["gluten", "dairy"], "pasta primavera"],
  ["Sweet & Sour Chicken", 2, 3, false, ["soy"], "sweet sour chicken"],
  ["Vegetable Lasagna", 2, 3, false, ["gluten", "dairy"], "vegetable lasagna"],
  ["Mediterranean Grain Bowl", 1, 2, true, ["dairy"], "mediterranean grain bowl"],
  ["Fish & Chips", 3, 3, false, ["gluten", "fish"], "fish and chips"],
  ["Cauliflower Fried Rice", 1, 2, true, ["soy"], "cauliflower fried rice"],
  ["Spicy Ramen Bowl", 2, 3, false, ["gluten", "soy", "egg"], "spicy ramen dinner"],
  ["Stuffed Zucchini Boats", 2, 2, true, ["dairy"], "stuffed zucchini boats"],
  ["Shrimp Tacos", 2, 2, false, ["shellfish", "gluten"], "shrimp tacos dinner"],
  ["Mushroom Risotto", 3, 3, false, ["dairy"], "mushroom risotto"],
  ["Pork Schnitzel", 3, 3, false, ["gluten", "egg"], "pork schnitzel"],
  ["Roasted Veggie Quinoa Bowl", 1, 2, true, [], "roasted veggie quinoa bowl"],
  ["Korean Beef Bulgogi", 3, 3, false, ["soy"], "beef bulgogi"],
  ["Chicken Parmesan", 3, 3, false, ["gluten", "dairy", "egg"], "chicken parmesan"],
  ["Taco Salad", 1, 2, true, ["dairy"], "taco salad"],
  ["Garlic Butter Shrimp Pasta", 2, 3, false, ["shellfish", "gluten", "dairy"], "garlic butter shrimp pasta"],
  ["Mushroom Stroganoff", 2, 3, true, ["gluten", "dairy"], "mushroom stroganoff"]
];


const DESSERT = [
  ["Chocolate Brownie", 1, 2, false, ["gluten", "dairy", "egg"], "chocolate brownie"],
  ["Cheesecake", 2, 3, false, ["dairy", "gluten"], "classic cheesecake"],
  ["Apple Pie", 2, 2, false, ["gluten"], "apple pie"],
  ["Fruit Salad", 1, 1, true, [], "fruit salad dessert"],
  ["Chia Pudding", 1, 1, true, [], "chia pudding dessert"],
  ["Tiramisu", 2, 2, false, ["dairy", "egg", "gluten"], "tiramisu"],
  ["Yogurt Parfait", 1, 1, true, ["dairy"], "yogurt parfait dessert"],
  ["Banana Bread", 1, 2, false, ["gluten", "egg"], "banana bread"],
  ["Mochi Ice Cream", 1, 2, true, ["dairy"], "mochi ice cream"],
  ["Panna Cotta", 2, 2, false, ["dairy"], "panna cotta"],
  ["Chocolate Chip Cookies", 1, 1, false, ["gluten", "egg", "dairy"], "chocolate chip cookies"],
  ["Oatmeal Raisin Cookies", 1, 1, true, ["gluten"], "oatmeal raisin cookies"],
  ["Peanut Butter Cookies", 1, 1, false, ["gluten", "peanut"], "peanut butter cookies"],
  ["Lemon Bars", 2, 2, false, ["gluten", "egg", "dairy"], "lemon bars"],
  ["Brown Sugar Blondies", 2, 2, false, ["gluten", "dairy", "egg"], "blondies dessert"],
  ["Strawberry Shortcake", 2, 2, false, ["gluten", "dairy", "egg"], "strawberry shortcake"],
  ["Blueberry Muffin", 1, 2, false, ["gluten", "egg", "dairy"], "blueberry muffin dessert"],
  ["Carrot Cake", 2, 3, false, ["gluten", "egg", "dairy"], "carrot cake"],
  ["Chocolate Mousse", 2, 2, false, ["dairy", "egg"], "chocolate mousse"],
  ["Coconut Macaroons", 1, 1, true, ["egg"], "coconut macaroons"],
  ["Rice Pudding", 1, 1, true, ["dairy"], "rice pudding"],
  ["Baklava", 2, 2, false, ["gluten", "tree-nut", "dairy"], "baklava dessert"],
  ["Pavlova", 2, 2, false, ["egg"], "pavlova dessert"],
  ["Crème Brûlée", 3, 3, false, ["egg", "dairy"], "creme brulee"],
  ["Eclairs", 3, 3, false, ["gluten", "dairy", "egg"], "eclairs dessert"],
  ["Cannoli", 2, 3, false, ["gluten", "dairy"], "cannoli dessert"],
  ["Cupcakes", 1, 2, false, ["gluten", "egg", "dairy"], "cupcake recipes"],
  ["Donuts", 2, 2, false, ["gluten", "egg", "dairy"], "donuts dessert"],
  ["Chocolate Lava Cake", 3, 3, false, ["gluten", "dairy", "egg"], "lava cake"],
  ["Berries & Cream", 1, 1, true, ["dairy"], "berries and cream"],
  ["Tropical Fruit Sorbet", 1, 1, true, [], "tropical fruit sorbet"],
  ["Ice Cream Sundae", 2, 2, false, ["dairy"], "ice cream sundae"],
  ["Affogato", 1, 1, false, ["dairy"], "affogato dessert"],
  ["Chocolate Truffles", 2, 2, false, ["dairy"], "chocolate truffles"],
  ["Pineapple Upside-Down Cake", 2, 2, false, ["gluten", "egg", "dairy"], "pineapple upside down cake"],
  ["Molten Chocolate Soufflé", 3, 3, false, ["gluten", "egg", "dairy"], "chocolate souffle"],
  ["Matcha Ice Cream", 2, 2, true, ["dairy"], "matcha ice cream"],
  ["Mango Sticky Rice", 1, 2, true, [], "mango sticky rice"],
  ["Banoffee Pie", 2, 3, false, ["gluten", "dairy"], "banoffee pie"],
  ["Fruit Tart", 2, 3, false, ["gluten", "dairy", "egg"], "fruit tart"]
];


function asDishes(category, arr) {
  return arr.map((a) => ({
    name: a[0],
    category,                 // string, matches schema
    tags: [],                 // will be JSON.stringified on insert
    costBand: a[1],
    timeBand: a[2],
    isHealthy: a[3],
    allergens: a[4],          // array -> JSON.stringified on insert
    ytQuery: a[5] || null
  }));
}

function dId(d) {
  return `${d.category}_${d.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`.slice(0, 50);
}

async function main() {
  console.log("[seed.mjs] Seeding Dish table…");

  // 1) Start clean so nothing from seed.ts remains
  console.log("[seed.mjs] Clearing existing dishes…");
  await prisma.dish.deleteMany();

  // 2) Build base set from your four arrays already defined above
  const base = [
    ...asDishes("breakfast", BREAKFAST),
    ...asDishes("lunch", LUNCH),
    ...asDishes("dinner", DINNER),
    ...asDishes("dessert", DESSERT),
  ];

  // 3) Optional variants — NO CAP
  const variantDefs = [
    {
      suffix: "(Spicy)",
      tag: "spicy",
      adjust: (d) => d, // no allergen/health change
    },
    {
      suffix: "(Low-carb)",
      tag: "low-carb",
      adjust: (d) => ({ ...d, isHealthy: true }),
    },
    {
      suffix: "(Gluten-free)",
      tag: "gluten-free",
      adjust: (d) => ({
        ...d,
        isHealthy: true,
        allergens: (d.allergens ?? []).filter((x) => x !== "gluten"),
      }),
    },
  ];

  // generate variants for every base dish
  const extras = base.flatMap((b) =>
    variantDefs.map((v) => {
      const adj = v.adjust(b);
      return {
        ...adj,
        name: `${b.name} ${v.suffix}`,
        tags: [...(adj.tags ?? []), v.tag],
      };
    })
  );

  // combine + de-dupe by deterministic id (safety on re-seed)
  const all = [...base, ...extras];
  const seen = new Set();
  const final = all.filter((d) => {
    const id = dId(d);
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });


  // 4) Insert (upsert with deterministic id so re-seeding is stable)
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
        ytQuery: d.ytQuery ?? null,
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
        ytQuery: d.ytQuery ?? null,
      },
    });
    n++;
  }

  // 5) Summary
  const grouped = await prisma.dish.groupBy({
    by: ["category"],
    _count: { category: true },
    orderBy: { category: "asc" },
  });
  console.log(`[seed.mjs] Seeded dishes=${n}`);
  console.log("[seed.mjs] Final counts by category:", grouped);
}

main()
  .catch((e) => {
    console.error("[seed.mjs] ERROR:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
