import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type DishSeed = {
  name: string;
  category: string;
  tags: string[];
  costBand: number;
  timeBand: number;
  isHealthy: boolean;
  allergens: string[];
  ytQuery: string | null;
  cuisineType?: string;
  keyIngredients?: string[];
};

const CATEGORIES = ["breakfast", "lunch", "dinner", "dessert", "snack"];

// --------------------- BREAKFAST ---------------------
const BREAKFAST: (string | number | boolean | string[] | null)[][] = [
  ["Overnight Oats", 1, 1, true, ["oats", "dairy"], "overnight oats recipe", "American", ["oats", "milk", "honey"]],
  ["Greek Yogurt Parfait", 1, 1, true, ["dairy"], "yogurt parfait", "Greek", ["yogurt", "berries", "granola"]],
  ["Veggie Omelette", 1, 1, true, ["egg", "dairy"], "veggie omelette", "French", ["eggs", "bell pepper", "spinach"]],
  ["Avocado Toast", 1, 1, true, ["gluten"], "avocado toast", "American", ["avocado", "bread", "olive oil"]],
  ["Scrambled Eggs & Toast", 1, 1, true, ["egg", "gluten"], "scrambled eggs toast", "American", ["eggs", "bread", "butter"]],
  ["Breakfast Burrito", 2, 2, false, ["gluten", "egg", "dairy"], "breakfast burrito", "Mexican", ["tortilla", "eggs", "cheese", "beans"]],
  ["Protein Smoothie", 1, 1, true, ["dairy"], "breakfast protein smoothie", "American", ["protein powder", "milk", "banana"]],
  ["Berry Smoothie Bowl", 1, 1, true, [], "smoothie bowl", "American", ["berries", "banana", "granola"]],
  ["Banana Pancakes", 2, 2, false, ["gluten", "egg", "dairy"], "banana pancakes", "American", ["flour", "banana", "milk", "egg"]],
  ["Whole-Grain Waffles", 2, 2, false, ["gluten", "egg", "dairy"], "healthy waffles", "American", ["whole wheat flour", "milk", "egg"]],
  ["French Toast", 2, 2, false, ["gluten", "egg", "dairy"], "french toast", "French", ["bread", "egg", "milk"]],
  ["Bagel & Lox", 2, 2, false, ["gluten", "fish", "dairy"], "bagel and lox", "Jewish-American", ["bagel", "salmon", "cream cheese"]],
  ["Breakfast Sandwich", 2, 2, false, ["gluten", "egg", "dairy"], "egg cheese breakfast sandwich", "American", ["bread", "egg", "cheese"]],
  ["Shakshuka", 2, 2, true, ["egg"], "shakshuka", "Middle Eastern", ["eggs", "tomato", "bell pepper"]],
  ["Chia Pudding", 1, 1, true, [], "chia pudding", "Various", ["chia seeds", "milk", "honey"]],
  ["Cottage Cheese Bowl", 1, 1, true, ["dairy"], "cottage cheese breakfast bowl", "American", ["cottage cheese", "fruit", "honey"]]
];

// --------------------- LUNCH ---------------------
const LUNCH: (string | number | boolean | string[] | null)[][] = [
  ["Caesar Salad", 1, 1, true, ["dairy"], "caesar salad", "Italian", ["lettuce", "parmesan", "croutons"]],
  ["Turkey Sandwich", 1, 1, true, ["gluten"], "turkey sandwich", "American", ["turkey", "bread", "lettuce"]],
  ["Veggie Wrap", 1, 1, true, ["gluten"], "veggie wrap", "American", ["tortilla", "vegetables", "hummus"]],
  ["Grilled Cheese Sandwich", 1, 1, false, ["gluten", "dairy"], "grilled cheese", "American", ["bread", "cheese", "butter"]],
  ["Chicken Salad", 1, 1, true, ["dairy"], "chicken salad", "American", ["chicken", "lettuce", "mayonnaise"]],
];

// --------------------- DINNER ---------------------
const DINNER: (string | number | boolean | string[] | null)[][] = [
  ["Grilled Salmon with Veggies", 3, 3, true, ["fish"], "grilled salmon dinner", "American", ["salmon", "vegetables", "lemon"]],
  ["Chicken Alfredo Pasta", 3, 3, false, ["gluten", "dairy"], "chicken alfredo pasta", "Italian", ["chicken", "pasta", "cream"]],
  ["Beef Stir Fry", 2, 2, true, ["soy"], "beef stir fry dinner", "Chinese", ["beef", "soy sauce", "vegetables"]],
  ["Vegetable Curry", 2, 2, true, [], "vegetable curry", "Indian", ["vegetables", "coconut milk", "spices"]],
  ["Shrimp Scampi", 3, 3, false, ["shellfish", "gluten"], "shrimp scampi recipe", "Italian", ["shrimp", "garlic", "butter"]],
  ["Lentil Stew", 1, 2, true, [], "lentil stew", "Middle Eastern", ["lentils", "carrots", "onion"]],
  ["Stuffed Bell Peppers", 2, 2, true, [], "stuffed bell peppers", "Mediterranean", ["bell pepper", "rice", "vegetables"]],
  ["Teriyaki Chicken Bowl", 2, 2, false, ["soy"], "teriyaki chicken bowl", "Japanese", ["chicken", "soy sauce", "rice"]],
  ["Tofu & Broccoli Stir Fry", 1, 2, true, ["soy"], "tofu broccoli stir fry", "Chinese", ["tofu", "broccoli", "soy sauce"]],
  ["Spaghetti Bolognese", 2, 3, false, ["gluten"], "spaghetti bolognese", "Italian", ["beef", "tomato", "pasta"]],
  ["Pesto Pasta with Chicken", 2, 3, false, ["gluten", "dairy"], "chicken pesto pasta", "Italian", ["chicken", "pasta", "pesto"]],
  ["Roast Chicken with Potatoes", 3, 3, true, [], "roast chicken potatoes", "American", ["chicken", "potatoes", "herbs"]],
  ["Veggie Fried Rice", 1, 2, true, ["soy"], "vegetable fried rice", "Chinese", ["rice", "vegetables", "soy sauce"]],
  ["BBQ Ribs", 3, 3, false, [], "bbq ribs", "American", ["pork ribs", "bbq sauce"]],
  ["Miso Glazed Cod", 3, 3, true, ["fish", "soy"], "miso glazed cod", "Japanese", ["cod", "miso", "soy sauce"]],
  ["Falafel Plate with Rice", 2, 2, true, ["sesame"], "falafel plate dinner", "Middle Eastern", ["chickpeas", "sesame", "spices"]],
  ["Thai Green Curry", 2, 3, false, ["soy"], "thai green curry", "Thai", ["coconut milk", "vegetables", "green curry paste"]],
  ["Beef and Broccoli", 2, 2, false, ["soy"], "beef and broccoli", "Chinese", ["beef", "broccoli", "soy sauce"]],
  ["Eggplant Parmesan", 2, 3, false, ["gluten", "dairy"], "eggplant parmesan", "Italian", ["eggplant", "cheese", "tomato"]],
  ["Chicken Fajitas", 2, 2, true, [], "chicken fajitas", "Mexican", ["chicken", "bell pepper", "onion"]],
  ["Turkey Meatballs with Pasta", 2, 3, false, ["gluten", "egg"], "turkey meatballs pasta", "Italian", ["turkey", "pasta", "egg"]],
  ["Seared Tuna Bowl", 3, 3, true, ["fish", "soy"], "seared tuna bowl", "Japanese", ["tuna", "rice", "soy sauce"]],
  ["Chickpea & Spinach Stew", 1, 2, true, [], "chickpea spinach stew", "Mediterranean", ["chickpeas", "spinach", "tomato"]],
  ["Lamb Chops with Asparagus", 3, 3, false, [], "lamb chops dinner", "Mediterranean", ["lamb", "asparagus", "herbs"]],
  ["Coconut Curry Shrimp", 3, 3, false, ["shellfish"], "coconut shrimp curry", "Thai", ["shrimp", "coconut milk", "spices"]],
  ["Margherita Pizza (Dinner Size)", 2, 3, false, ["gluten", "dairy"], "margherita pizza dinner", "Italian", ["flour", "cheese", "tomato"]],
  ["Vegetable Pad Thai", 2, 2, true, ["peanut", "soy", "egg"], "vegetable pad thai", "Thai", ["rice noodles", "peanuts", "vegetables"]],
  ["Salmon Teriyaki Bowl", 3, 3, true, ["fish", "soy"], "salmon teriyaki", "Japanese", ["salmon", "rice", "soy sauce"]],
  ["Stuffed Portobello Mushrooms", 2, 2, true, ["dairy"], "stuffed portobello mushrooms", "Italian", ["mushrooms", "cheese", "breadcrumbs"]],
  ["Chicken Tikka Masala", 3, 3, false, ["dairy"], "chicken tikka masala", "Indian", ["chicken", "tomato", "cream"]]
  // ... continue for remaining dinner items
];

// --------------------- DESSERT ---------------------
const DESSERT: (string | number | boolean | string[] | null)[][] = [
  ["Chocolate Brownie", 1, 2, false, ["gluten", "dairy", "egg"], "chocolate brownie", "American", ["chocolate", "flour", "butter"]],
  ["Cheesecake", 2, 3, false, ["dairy", "gluten"], "classic cheesecake", "American", ["cream cheese", "sugar", "eggs"]],
  ["Apple Pie", 2, 2, false, ["gluten"], "apple pie", "American", ["apple", "flour", "butter"]],
  ["Fruit Salad", 1, 1, true, [], "fruit salad dessert", "Various", ["assorted fruits"]],
  ["Chia Pudding", 1, 1, true, [], "chia pudding dessert", "Various", ["chia seeds", "milk", "honey"]]
  // ... continue for remaining dessert items
];

// --------------------- SNACK ---------------------
const SNACK: (string | number | boolean | string[] | null)[][] = [
  ["Granola Bar", 1, 1, true, ["nuts"], "granola bar recipe", "American", ["oats", "honey", "nuts"]],
  ["Veggie Sticks & Hummus", 1, 1, true, [], "veggie hummus snack", "Mediterranean", ["carrot", "cucumber", "hummus"]],
  ["Trail Mix", 1, 1, true, ["nuts"], "trail mix recipe", "Various", ["nuts", "dried fruit", "chocolate chips"]]
];

// --------------------- HELPER FUNCTIONS ---------------------
function asDishes(category: string, arr: readonly any[]): DishSeed[] {
  return arr.map((a) => ({
    name: a[0],
    category,
    tags: [],
    costBand: a[1],
    timeBand: a[2],
    isHealthy: a[3],
    allergens: a[4],
    ytQuery: a[5] || null,
    cuisineType: a[6] || null,
    keyIngredients: a[7] || [],
  }));
}

function dId(d: DishSeed) {
  return `${d.category}_${d.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`.slice(0, 50);
}

// --------------------- MAIN ---------------------
async function main() {
  console.log("Seeding dishes…");

  const all: DishSeed[] = [
    ...asDishes("breakfast", BREAKFAST),
    ...asDishes("lunch", LUNCH),
    ...asDishes("dinner", DINNER),
    ...asDishes("dessert", DESSERT),
    ...asDishes("snack", SNACK),
  ];

  for (const d of all) {
    await prisma.dish.upsert({
      where: { id: dId(d) },
      update: {},
      create: {
        id: dId(d),
        name: d.name,
        category: d.category,
        tags: d.tags.join(","),
        allergens: d.allergens.join(","),
        costBand: d.costBand,
        timeBand: d.timeBand,
        isHealthy: d.isHealthy,
        ytQuery: d.ytQuery,
        cuisineType: d.cuisineType,
        keyIngredients: d.keyIngredients?.join(","),
      },
    });
  }

  console.log(`Seeded dishes=${all.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });