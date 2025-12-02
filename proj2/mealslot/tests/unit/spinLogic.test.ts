import { describe, it, expect, test, vi } from "vitest";
import { weightedSpin } from "../../lib/scoring";
import type { Dish } from "@/lib/schemas";

// Mock the deterministic RNG so it always returns 0.
// This makes weightedChoice always pick from the start of the distribution,
// which in our test is the highest-scoring dish.
vi.mock("../../lib/rng", () => ({
  makeDeterministicRng: () => {
    // Ignore the seed; always return an RNG that yields 0
    return () => 0;
  },
}));

test.skip("placeholder", () => {});

const makeDish = (
  id: string,
  healthy: boolean,
  cost: number,
  time: number
): Dish => ({
  id,
  name: id,
  category: "main",
  tags: [],
  costBand: cost,
  timeBand: time,
  isHealthy: healthy,
  allergens: [],
  ytQuery: id,
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
      makeDish("expensive_slow", false, 3, 3),
    ]];

    const sel = weightedSpin(reels, [], {
      healthy: true,
      cheap: true,
      max30m: true,
    });

    // With powerups and our mocked RNG, this should deterministically
    // pick the higher-scoring "cheap_fast_healthy" dish.
    expect(sel[0].id).toBe("cheap_fast_healthy");
  });
});
