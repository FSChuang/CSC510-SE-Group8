import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const dishes = [
    { name: "Grilled Chicken", category: "meat", cuisine: "American", tags: ["protein"], baseIngredients: ["chicken", "salt"], kcal: 420, protein_g: 40, time_min: 25, price_cents: 500, healthScore: 0.7 },
    { name: "Beef Stir-Fry", category: "meat", cuisine: "Chinese", tags: ["wok"], baseIngredients: ["beef", "broccoli"], kcal: 520, protein_g: 35, time_min: 22, price_cents: 650, healthScore: 0.6 },
    { name: "Tofu Steak", category: "meat", cuisine: "Japanese", tags: ["vegetarian"], baseIngredients: ["tofu", "soy"], kcal: 250, protein_g: 20, time_min: 15, price_cents: 300, healthScore: 0.8 },
    { name: "Lentil Curry", category: "veg", cuisine: "Indian", tags: ["vegan", "spicy"], baseIngredients: ["lentils", "tomato"], kcal: 380, protein_g: 18, time_min: 30, price_cents: 250, healthScore: 0.85 },
    { name: "Caesar Salad", category: "veg", cuisine: "Italian", tags: ["salad"], baseIngredients: ["romaine", "croutons"], kcal: 300, protein_g: 10, time_min: 10, price_cents: 200, healthScore: 0.75 },
    { name: "Stir-fried Greens", category: "veg", cuisine: "Chinese", tags: ["vegan"], baseIngredients: ["bok choy", "garlic"], kcal: 120, protein_g: 5, time_min: 8, price_cents: 150, healthScore: 0.9 },
    { name: "Fried Rice", category: "staple", cuisine: "Chinese", tags: ["rice"], baseIngredients: ["rice", "egg"], kcal: 520, protein_g: 12, time_min: 18, price_cents: 180, healthScore: 0.55 },
    { name: "Garlic Noodles", category: "staple", cuisine: "Vietnamese", tags: ["noodles"], baseIngredients: ["noodles", "garlic"], kcal: 480, protein_g: 9, time_min: 16, price_cents: 170, healthScore: 0.5 },
    { name: "Quinoa Bowl", category: "staple", cuisine: "Fusion", tags: ["gluten-free"], baseIngredients: ["quinoa", "veg"], kcal: 430, protein_g: 14, time_min: 25, price_cents: 320, healthScore: 0.82 },
    { name: "Tomato Soup", category: "soup", cuisine: "American", tags: ["vegetarian"], baseIngredients: ["tomato", "onion"], kcal: 150, protein_g: 4, time_min: 14, price_cents: 120, healthScore: 0.78 },
    { name: "Miso Soup", category: "soup", cuisine: "Japanese", tags: ["umami"], baseIngredients: ["miso", "tofu"], kcal: 90, protein_g: 5, time_min: 7, price_cents: 100, healthScore: 0.8 },
    { name: "Chicken Noodle Soup", category: "soup", cuisine: "American", tags: ["classic"], baseIngredients: ["chicken", "noodles"], kcal: 280, protein_g: 18, time_min: 28, price_cents: 200, healthScore: 0.7 }
  ];
  for (const d of dishes) {
    await prisma.dish.upsert({
      where: { name: d.name },
      create: { ...d, tags: d.tags as any, baseIngredients: d.baseIngredients as any },
      update: {}
    });
  }
  console.log("Seeded dishes:", dishes.length);
}

main().finally(() => prisma.$disconnect());
