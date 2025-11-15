import { RecipeSchema } from "@/lib/schemas";
import { describe, it, expect } from "vitest";
import { test } from "vitest";

test.skip("placeholder", () => {});

describe("RecipeSchema", () => {
  it("validates stub", () => {
    const r = {
      id: "r1",
      name: "Test",
      servings: 2,
      total_minutes: 25,
      equipment: ["pan"],
      ingredients: [{ item: "x", qty: 1, unit: "pc" }],
      steps: [{ order: 1, text: "do", timer_minutes: 0 }],
      nutrition: { kcal: 100, protein_g: 5, carbs_g: 10, fat_g: 3 },
      warnings: [],
      videos: [{ id: "v", title: "t", url: "https://x.com", thumbnail: "https://x.com/t.jpg" }]
    };
    expect(() => RecipeSchema.parse(r)).not.toThrow();
  });
});
