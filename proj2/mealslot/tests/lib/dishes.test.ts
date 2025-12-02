// tests/lib/dishes.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

// 1️⃣ Mock the prisma module first. The factory is hoisted, but everything
// inside it is safe. We don't reference any external variables from here.
vi.mock("@/lib/db", () => ({
  prisma: {
    dish: {
      findMany: vi.fn(), // we'll grab this later
    },
  },
}));

// 2️⃣ Now import prisma and the module under test — they will see the mocked version.
import { prisma } from "@/lib/db";
import { dishes, allDishes } from "@/lib/dishes"; // ⬅️ adjust path if needed

// 3️⃣ Convenience handle for the mock
const findManyMock = prisma.dish.findMany as unknown as ReturnType<typeof vi.fn>;

type MockRow = {
  id: string;
  name: string;
  category: string;
  tags: any;
  allergens: any;
  costBand: number;
  timeBand: number;
  isHealthy: boolean;
  ytQuery: string | null;
};

describe("dishes()", () => {
  beforeEach(() => {
    findManyMock.mockReset();
  });

  it("returns DB dishes mapped to UIDish when no filters", async () => {
    const rows: MockRow[] = [
      {
        id: "dish_1",
        name: "Test Dish",
        category: "MAIN",
        tags: "vegan, quick",
        allergens: "dairy, gluten",
        costBand: 2,
        timeBand: 1,
        isHealthy: true,
        ytQuery: "test dish recipe",
      },
    ];

    findManyMock.mockResolvedValue(rows);

    const result = await dishes("MAIN");

    expect(findManyMock).toHaveBeenCalledWith({
      where: { category: "MAIN" },
      orderBy: [{ name: "asc" }],
    });

    expect(result).toEqual([
      {
        id: "dish_1",
        name: "Test Dish",
        category: "MAIN",
        tags: ["vegan", "quick"],
        allergens: ["dairy", "gluten"],
        costBand: 2,
        timeBand: 1,
        isHealthy: true,
        ytQuery: "test dish recipe",
      },
    ]);
  });

  it("filters dishes by requiring all selected tags", async () => {
    const rows: MockRow[] = [
      {
        id: "dish_a",
        name: "Tag Match Dish",
        category: "MAIN",
        tags: '["vegan","quick"]', // JSON string
        allergens: "dairy",
        costBand: 2,
        timeBand: 1,
        isHealthy: true,
        ytQuery: null,
      },
      {
        id: "dish_b",
        name: "Partial Tag Dish",
        category: "MAIN",
        tags: "vegan", // missing "quick"
        allergens: "",
        costBand: 2,
        timeBand: 2,
        isHealthy: false,
        ytQuery: null,
      },
    ];

    findManyMock.mockResolvedValue(rows);

    // Requires BOTH vegan and quick
    const result = await dishes("MAIN", ["vegan", "quick"], []);

    const ids = result.map((d) => d.id);
    expect(ids).toEqual(["dish_a"]);
  });

  it("excludes dishes that contain any selected allergens", async () => {
    const rows: MockRow[] = [
      {
        id: "safe_dish",
        name: "Safe Dish",
        category: "MAIN",
        tags: "",
        allergens: "soy", // not excluded
        costBand: 2,
        timeBand: 2,
        isHealthy: true,
        ytQuery: null,
      },
      {
        id: "bad_dish",
        name: "Allergen Dish",
        category: "MAIN",
        tags: "",
        allergens: '["dairy","gluten"]',
        costBand: 3,
        timeBand: 1,
        isHealthy: false,
        ytQuery: null,
      },
    ];

    findManyMock.mockResolvedValue(rows);

    // Exclude dishes with dairy or peanuts
    const result = await dishes("MAIN", [], ["dairy", "peanuts"]);

    const ids = result.map((d) => d.id);
    expect(ids).toEqual(["safe_dish"]);
  });

  it("handles CSV tags/allergens for toUIDish mapping", async () => {
  const rows: MockRow[] = [
    {
      id: "dish_weird",
      name: "Weird Array Dish",
      category: "MAIN",
      tags: "vegan, spicy",         // 👈 plain CSV
      allergens: "dairy, gluten",   // 👈 plain CSV
      costBand: 2,
      timeBand: 1,
      isHealthy: true,
      ytQuery: null,
    },
  ];

  findManyMock.mockResolvedValue(rows);

  const result = await dishes("MAIN");

  expect(result.length).toBe(1);

  const dish = result[0]!;
  expect(dish.tags).toEqual(["vegan", "spicy"]);
  expect(dish.allergens).toEqual(["dairy", "gluten"]);
});



  it("falls back to static catalog if DB returns no rows", async () => {
    findManyMock.mockResolvedValue([]);

    const result = await dishes("MAIN");

    expect(Array.isArray(result)).toBe(true);
    expect(Array.isArray(allDishes)).toBe(true);
  });
});
