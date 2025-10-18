import { Dish } from "./schemas";

// Minimal static catalog for UI; full list seeded in DB via prisma/seed.ts.
// Keep these few for client reels to avoid bloating bundle.
const BASE: Dish[] = [
  {
    id: "d_main_margherita",
    name: "Margherita Pizza",
    category: "main",
    tags: ["vegetarian"],
    costBand: 2,
    timeBand: 2,
    isHealthy: false,
    allergens: ["gluten", "dairy"],
    ytQuery: "margherita pizza"
  },
  {
    id: "d_main_chicken_bowl",
    name: "Grilled Chicken Bowl",
    category: "main",
    tags: ["high-protein"],
    costBand: 2,
    timeBand: 2,
    isHealthy: true,
    allergens: [],
    ytQuery: "grilled chicken bowl"
  },
  {
    id: "d_veggie_caesar",
    name: "Caesar Salad",
    category: "veggie",
    tags: ["salad"],
    costBand: 1,
    timeBand: 1,
    isHealthy: true,
    allergens: ["dairy"],
    ytQuery: "caesar salad"
  },
  {
    id: "d_soup_tomato",
    name: "Tomato Soup",
    category: "soup",
    tags: ["vegetarian"],
    costBand: 1,
    timeBand: 1,
    isHealthy: true,
    allergens: [],
    ytQuery: "tomato soup"
  },
  {
    id: "d_meat_bulgogi",
    name: "Beef Bulgogi",
    category: "meat",
    tags: ["korean"],
    costBand: 2,
    timeBand: 2,
    isHealthy: false,
    allergens: ["soy"],
    ytQuery: "beef bulgogi"
  },
  {
    id: "d_dessert_pudding",
    name: "Chia Pudding",
    category: "dessert",
    tags: ["vegan"],
    costBand: 1,
    timeBand: 1,
    isHealthy: true,
    allergens: [],
    ytQuery: "chia pudding"
  }
];

export function dishesByCategory(category: string): Dish[] {
  return BASE.filter((d) => d.category === category);
}
