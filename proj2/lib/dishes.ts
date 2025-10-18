export type Dish = {
  name: string;
  category: "meat" | "veg" | "staple" | "soup";
  cuisine?: string;
  tags: string[];
  baseIngredients: string[];
  kcal?: number;
  protein_g?: number;
  time_min?: number;
  price_cents?: number;
  healthScore?: number; // 0..1
};

export const CATEGORIES = ["meat", "veg", "staple", "soup"] as const;

const D: Dish[] = [
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
  { name: "Chicken Noodle Soup", category: "soup", cuisine: "American", tags: ["classic"], baseIngredients: ["chicken", "noodles"], kcal: 280, protein_g: 18, time_min: 28, price_cents: 200, healthScore: 0.7 },
  { name: "Turkey Meatballs", category: "meat", cuisine: "Italian", tags: ["lean"], baseIngredients: ["turkey", "tomato"], kcal: 410, protein_g: 35, time_min: 26, price_cents: 520, healthScore: 0.72 },
  { name: "Paneer Tikka", category: "meat", cuisine: "Indian", tags: ["vegetarian"], baseIngredients: ["paneer", "spices"], kcal: 350, protein_g: 22, time_min: 24, price_cents: 350, healthScore: 0.7 },
  { name: "Veggie Medley", category: "veg", cuisine: "Fusion", tags: ["vegan"], baseIngredients: ["carrot", "pepper"], kcal: 220, protein_g: 6, time_min: 12, price_cents: 160, healthScore: 0.88 },
  { name: "Soba Salad", category: "staple", cuisine: "Japanese", tags: ["noodles", "cold"], baseIngredients: ["soba", "veg"], kcal: 390, protein_g: 13, time_min: 20, price_cents: 260, healthScore: 0.76 },
  { name: "Pho Broth", category: "soup", cuisine: "Vietnamese", tags: ["herbs"], baseIngredients: ["beef bones", "spices"], kcal: 120, protein_g: 10, time_min: 180, price_cents: 400, healthScore: 0.65 },
  { name: "Ramen Broth", category: "soup", cuisine: "Japanese", tags: ["rich"], baseIngredients: ["pork bones"], kcal: 250, protein_g: 15, time_min: 240, price_cents: 500, healthScore: 0.4 },
  { name: "Brown Rice", category: "staple", cuisine: "American", tags: ["wholegrain"], baseIngredients: ["rice"], kcal: 215, protein_g: 5, time_min: 30, price_cents: 120, healthScore: 0.8 },
  { name: "Mashed Potatoes", category: "staple", cuisine: "American", tags: ["comfort"], baseIngredients: ["potato", "butter"], kcal: 360, protein_g: 6, time_min: 25, price_cents: 140, healthScore: 0.5 },
  { name: "Greek Salad", category: "veg", cuisine: "Greek", tags: ["salad"], baseIngredients: ["cucumber", "feta"], kcal: 320, protein_g: 8, time_min: 12, price_cents: 220, healthScore: 0.8 },
  { name: "Chickpea Stew", category: "veg", cuisine: "Moroccan", tags: ["vegan"], baseIngredients: ["chickpea", "spices"], kcal: 410, protein_g: 18, time_min: 35, price_cents: 230, healthScore: 0.82 },
  { name: "Clam Chowder", category: "soup", cuisine: "American", tags: ["seafood"], baseIngredients: ["clams", "potato"], kcal: 450, protein_g: 20, time_min: 40, price_cents: 450, healthScore: 0.45 },
  { name: "Minestrone", category: "soup", cuisine: "Italian", tags: ["vegetarian"], baseIngredients: ["beans", "veg"], kcal: 280, protein_g: 12, time_min: 35, price_cents: 220, healthScore: 0.78 },
  { name: "Bulgur Pilaf", category: "staple", cuisine: "Turkish", tags: ["wholegrain"], baseIngredients: ["bulgur", "tomato"], kcal: 350, protein_g: 9, time_min: 22, price_cents: 180, healthScore: 0.77 },
  { name: "Roast Salmon", category: "meat", cuisine: "American", tags: ["omega3"], baseIngredients: ["salmon", "lemon"], kcal: 430, protein_g: 34, time_min: 18, price_cents: 900, healthScore: 0.9 }
];

export const ALL_DISHES = D;

export function normalize(field: keyof Dish, items: Dish[]): Map<string, number> {
  const vals = items.map((d) => (d[field] ?? 0) as number);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const map = new Map<string, number>();
  for (const d of items) {
    const v = (d[field] ?? 0) as number;
    const norm = max === min ? 0.5 : (v - min) / (max - min);
    map.set(d.name, norm);
  }
  return map;
}
