import { weightedSpin } from "../../lib/scoring";
import { Dish } from "@/lib/schemas";
import { describe, it, expect } from "vitest";
import { test } from "vitest";

test.skip("placeholder", () => {});

const makeDish = (id: string, healthy: boolean, cost: number, time: number): Dish => ({
  id,
  name: id,
  category: "main",
  tags: [],
  costBand: cost,
  timeBand: time,
  isHealthy: healthy,
  allergens: [],
  ytQuery: id
});

describe("weightedSpin", () => {
  it("honors locks", () => {
    const reels = [[makeDish("A", true, 1, 1), makeDish("B", false, 3, 3)]];
    const sel = weightedSpin(reels, [{ index: 0, dishId: "B" }], {});
    expect(sel[0].id).toBe("B");
  });

  it("applies powerups", () => {
    const reels = [[
      makeDish("cheap_fast_healthy", true, 1, 1),
      makeDish("expensive_slow", false, 3, 3)
    ]];
    const sel = weightedSpin(reels, [], { healthy: true, cheap: true, max30m: true });
    expect(sel[0].id).toBe("cheap_fast_healthy");
  });
});
