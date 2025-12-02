import { describe, it, expect, test, vi } from "vitest";
import { NextRequest } from "next/server";

// Mock Prisma so importing the route modules doesn't try to load the real engine
vi.mock("@prisma/client", () => {
  // We only need a stub. Since every test here is skipped,
  // the methods are never actually called.
  class PrismaClient {
    // Add model properties if your routes access them,
    // e.g. dish = { findMany: vi.fn() } as any;
    $disconnect = vi.fn();
  }

  return { PrismaClient };
});

// Now it's safe to import route handlers – they will see the mocked PrismaClient
import * as SpinRoute from "@/app/api/spin/route";
import * as RecipeRoute from "@/app/api/recipe/route";
import * as PlacesRoute from "@/app/api/places/route";

test.skip("placeholder", () => {});

function toNextRequest(path: string, method: string, body?: any) {
  const url = new URL(`http://localhost${path}`);
  const init: RequestInit = {
    method,
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  };
  // NextRequest can be constructed from the native Request
  return new NextRequest(new Request(url, init));
}

describe("API contracts (stub)", () => {
  it.skip("spin POST returns reels + selection", async () => {
    const req = toNextRequest("/api/spin", "POST", {
      categories: ["main", "veggie"],
      powerups: { healthy: true },
    });
    const res = await SpinRoute.POST(req);
    expect(res.status).toBe(200);
    const j = await res.json();
    expect(Array.isArray(j.reels)).toBe(true);
    expect(Array.isArray(j.selection)).toBe(true);
  });

  it.skip("recipe POST validates strict schema", async () => {
    const req = toNextRequest("/api/recipe", "POST", {
      dishIds: ["main_margherita_pizza"],
    });
    const res = await RecipeRoute.POST(req);
    expect(res.status).toBe(200);
    const j = await res.json();
    expect(Array.isArray(j.recipes)).toBe(true);
    expect(j.recipes[0]).toHaveProperty("nutrition");
    expect(j.recipes[0]).toHaveProperty("videos");
  });

  it.skip("places POST returns venues", async () => {
    const req = toNextRequest("/api/places", "POST", {
      cuisines: ["italian", "japanese"],
      locationHint: "Raleigh",
    });
    const res = await PlacesRoute.POST(req);
    expect(res.status).toBe(200);
    const j = await res.json();
    expect(Array.isArray(j.venues)).toBe(true);
    expect(j.venues[0]).toHaveProperty("name");
  });
});
