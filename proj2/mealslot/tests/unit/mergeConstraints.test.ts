import { mergeConstraints, Constraints } from "@/lib/party";
import { describe, it, expect } from "vitest";

describe("mergeConstraints", () => {
  it("handles empty", () => {
    expect(mergeConstraints([])).toEqual({
      diet: [],
      allergens: [],
      maxBudget: null,
      maxTime: null
    });
  });

  it("AND diet, UNION allergens, MIN budget/time", () => {
    const cs: Constraints[] = [
      { diet: ["vegan", "halal"], allergens: ["peanut"], maxBudget: 2, maxTime: 30 },
      { diet: ["vegan"], allergens: ["shellfish"], maxBudget: 1, maxTime: 20 }
    ];
    expect(mergeConstraints(cs)).toEqual({
      diet: ["vegan"],
      allergens: ["peanut", "shellfish"],
      maxBudget: 1,
      maxTime: 20
    });
  });
});
