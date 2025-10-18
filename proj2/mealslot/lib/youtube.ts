import { RecipeJSON } from "./schemas";

export function recipeStub({ id, titleSuffix }: { id: string; titleSuffix: string }): RecipeJSON {
  return {
    id: `r_${id}`,
    name: `Recipe for ${id} ${titleSuffix}`,
    servings: 2,
    total_minutes: 25,
    equipment: ["pan", "knife", "board"],
    ingredients: [
      { item: "Ingredient A", qty: 1, unit: "pc" },
      { item: "Ingredient B", qty: 200, unit: "g" }
    ],
    steps: [
      { order: 1, text: "Prep ingredients.", timer_minutes: 0 },
      { order: 2, text: "Cook on medium heat.", timer_minutes: 20 }
    ],
    nutrition: { kcal: 520, protein_g: 28, carbs_g: 45, fat_g: 24 },
    warnings: [],
    videos: [
      {
        id: "dQw4w9WgXcQ",
        title: "How to cook it",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg"
      }
    ]
  };
}
