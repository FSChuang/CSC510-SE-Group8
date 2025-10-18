"use client";

import { useState } from "react";
import SlotMachine from "@/components/SlotMachine";
import PowerUps from "@/components/PowerUps";
import { SpinRequest, SpinResponse, RecipeRequest, RecipeResponse } from "@/lib/schemas";
import { placesStub } from "@/lib/places";

const DEFAULT_CATEGORIES = ["meat", "veg", "staple", "soup"] as const;

export default function Page() {
  const [categories] = useState<string[]>([...DEFAULT_CATEGORIES]);
  const [result, setResult] = useState<string[]>([]);
  const [powerUps, setPowerUps] = useState<{ healthy: number; cheap: number; t30: number }>({
    healthy: 0.5,
    cheap: 0.5,
    t30: 0.5
  });
  const [mode, setMode] = useState<"idle" | "cook" | "outside">("idle");
  const [recipe, setRecipe] = useState<RecipeResponse | null>(null);
  const [restaurants, setRestaurants] = useState<{ name: string; cuisine: string; distance_km: number }[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function spin(locked: Record<number, string>, seed?: string) {
    setLoading(true);
    setError(null);
    try {
      const body: SpinRequest = { categories, locked, powerUps, seed };
      const res = await fetch("/api/spin", { method: "POST", body: JSON.stringify(body) });
      if (!res.ok) throw new Error(`Spin failed: ${res.status}`);
      const json: SpinResponse = await res.json();
      setResult(json.result);
      setMode("idle");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function onCook() {
    setLoading(true);
    setError(null);
    try {
      const body: RecipeRequest = { dishes: result };
      const res = await fetch("/api/recipe", { method: "POST", body: JSON.stringify(body) });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Recipe error: ${res.status} ${txt}`);
      }
      const json: RecipeResponse = await res.json();
      setRecipe(json);
      setMode("cook");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function onOutside() {
    setLoading(true);
    setError(null);
    try {
      // Use deterministic stub directly (client-side safe; no secrets)
      const near = placesStub({
        city: "Raleigh",
        lat: 35.78,
        lon: -78.64,
        tags: result,
        cuisine: undefined
      });
      setRestaurants(near);
      setMode("outside");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PowerUps values={powerUps} onChange={setPowerUps} />
      <SlotMachine categories={categories} onSpin={spin} disabled={loading} />
      {error && <div className="text-red-600 text-sm">{error}</div>}
      {result.length > 0 && (
        <div className="flex gap-2">
          <button
            onClick={onCook}
            className="px-3 py-2 rounded-md bg-emerald-600 text-white disabled:opacity-50"
            disabled={loading}
          >
            Cook at Home
          </button>
          <button
            onClick={onOutside}
            className="px-3 py-2 rounded-md bg-sky-600 text-white disabled:opacity-50"
            disabled={loading}
          >
            Eat Outside
          </button>
        </div>
      )}

      {mode === "cook" && recipe && (
        <div className="rounded-md border bg-white p-4 space-y-3">
          <h3 className="text-lg font-semibold">Recipe Plan</h3>
          <div className="text-sm"><strong>Title:</strong> {recipe.title}</div>
          <div>
            <strong>Ingredients</strong>
            <ul className="list-disc pl-6 text-sm">
              {recipe.ingredients.map((i, idx) => (
                <li key={idx}>{i.quantity} {i.unit} {i.name}</li>
              ))}
            </ul>
          </div>
          <div>
            <strong>Steps</strong>
            <ol className="list-decimal pl-6 text-sm">
              {recipe.steps.map((s, idx) => (
                <li key={idx}>{s}</li>
              ))}
            </ol>
          </div>
          <div className="text-sm">
            <strong>Equipment:</strong> {recipe.equipment.join(", ")}
          </div>
          <div className="text-sm">
            <strong>Nutrition:</strong> {recipe.nutrition.kcal} kcal · protein {recipe.nutrition.protein_g}g
          </div>
          <div className="text-sm">
            <strong>Shopping List:</strong> {recipe.shoppingList.join(", ")}
          </div>
          {recipe.warnings.length > 0 && (
            <div className="text-sm text-amber-700">
              <strong>Warnings:</strong> {recipe.warnings.join("; ")}
            </div>
          )}
        </div>
      )}

      {mode === "outside" && restaurants.length > 0 && (
        <div className="rounded-md border bg-white p-4">
          <h3 className="text-lg font-semibold mb-2">Nearby spots</h3>
          <ul className="space-y-2">
            {restaurants.map((r, i) => (
              <li key={i} className="text-sm">
                <span className="font-medium">{r.name}</span> — {r.cuisine} · {r.distance_km.toFixed(1)} km
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
