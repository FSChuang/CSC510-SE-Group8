"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { SlotMachine } from "@/components/SlotMachine";
import { PowerUps } from "@/components/PowerUps";
import FilterMenu from "@/components/FilterMenu";
import DishCountInput from "@/components/DishCountInput";
import { Dish, PowerUpsInput, RecipeJSON } from "@/lib/schemas";
import { cn } from "@/components/ui/cn";
import Modal from "@/components/ui/Modal";
import RecipePanel from "@/components/RecipePanel";
import MapStub from "@/components/MapStub";

type Venue = {
  id: string;
  name: string;
  addr: string;
  rating: number;
  price: string;
  url: string;
  cuisine: string;
  distance_km: number;
};

type MealCategory = "breakfast" | "lunch" | "dinner" | "dessert";

function HomePage() {
  // Use lowercase values that the API expects
  const [category, setCategory] = useState<MealCategory>("breakfast");
  const [dishCount, setDishCount] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [powerups, setPowerups] = useState<PowerUpsInput>({});
  const [selection, setSelection] = useState<Dish[]>([]);
  const [busy, setBusy] = useState(false);
  const [cooldownMs, setCooldownMs] = useState(0);

  const [recipes, setRecipes] = useState<RecipeJSON[] | null>(null);
  const [venues, setVenues] = useState<Venue[] | null>(null);
  const [openRecipeModal, setOpenRecipeModal] = useState(false);

  const cuisines = useMemo(() => {
    const tagish = new Set<string>();
    selection.forEach((d) => {
      d.tags.forEach((t) => tagish.add(t));
      if (d.category === "meat") tagish.add("bbq");
      if (d.category === "veggie") tagish.add("salad");
      if (d.category === "soup") tagish.add("soup");
    });
    const arr = Array.from(tagish);
    return arr.length ? arr : ["american", "asian", "italian"];
  }, [selection]);

  useEffect(() => {
    let t: number | undefined;
    if (cooldownMs > 0) {
      t = window.setInterval(() => setCooldownMs((ms) => Math.max(0, ms - 250)), 250);
    }
    return () => (t ? clearInterval(t) : undefined);
  }, [cooldownMs]);

  const onSpin = async (locked: { index: number; dishId: string }[] = []) => {
    // enforce 1..6
    const num = Math.min(6, Math.max(1, Number(dishCount) || 1));
    const lockedIds = locked.map((l) => l.dishId);

    setBusy(true);
    try {
      const res = await fetch("/api/spin", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          category,              // "breakfast" | "lunch" | "dinner" | "dessert"
          num,
          tags: selectedTags,
          allergens: selectedAllergens,
          locked: lockedIds,     // API expects string[]
          powerups: { noDuplicates: true },
        }),
      });

      const payload = await res.json().catch(() => ({} as any));

      if (!res.ok) {
        const msg =
          payload?.error?.message ??
          payload?.message ??
          `${res.status} ${res.statusText}`;
        alert(`Spin failed: ${msg}`);
        return;
      }

      // ---- Map API -> UI Dish type ----
      type ApiDishDTO = {
        id: string;
        name: string;
        mealCategory: MealCategory;
        tags?: string[];
        allergens?: string[];
        costBand?: number;
        timeBand?: number;
        isHealthy?: boolean;
        ytQuery?: string | null;
      };

      const items = (payload.items ?? []) as ApiDishDTO[];

      const uiDishes: Dish[] = items.map((d): Dish => ({
        id: d.id,
        name: d.name,
        // bridge backend mealCategory -> UI Dish['category'] (legacy union)
        category: d.mealCategory as unknown as Dish["category"],
        tags: d.tags ?? [],
        allergens: d.allergens ?? [],
        costBand: d.costBand ?? 2,
        timeBand: d.timeBand ?? 2,
        isHealthy: !!d.isHealthy,
        ytQuery: d.ytQuery ?? "",
      }));

      setSelection(uiDishes);
      setRecipes(null);
      setVenues(null);
      setOpenRecipeModal(false);
      setCooldownMs(3000);
    } catch (e: any) {
      alert(`Spin failed: ${e?.message ?? e}`);
    } finally {
      setBusy(false);
    }
  };

  const fetchRecipes = async () => {
    if (!selection.length) return;
    const ids = selection.map((d) => d.id);
    const r = await fetch("/api/recipe", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ dishIds: ids })
    });
    const j = await r.json();
    setRecipes(j.recipes);
    setOpenRecipeModal(true);
  };

  const fetchVenues = async () => {
    const r = await fetch("/api/places", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ cuisines, locationHint: "Your City" })
    });
    const j = await r.json();
    setVenues(j.venues);
  };

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <h2 className="mb-2 text-lg font-semibold">Choose Category</h2>
        <div className="flex flex-wrap gap-2">
          {["Breakfast", "Lunch", "Dinner", "Dessert"].map((c) => {
            const value = c.toLowerCase() as MealCategory;
            const active = category === value;
            return (
              <button
                key={value}
                className={cn(
                  "rounded-full border px-3 py-1 text-sm",
                  active ? "bg-neutral-900 text-white" : "bg-white"
                )}
                onClick={() => setCategory(value)}
                aria-pressed={active}
              >
                {c}
              </button>
            );
          })}
        </div>
      </section>

      <FilterMenu
        onTagChange={setSelectedTags}
        onAllergenChange={setSelectedAllergens}
      />

      <PowerUps value={powerups} onChange={setPowerups} />

      <DishCountInput value={dishCount} onChange={setDishCount} />

      <SlotMachine
        reelCount={dishCount}
        onSpin={onSpin}
        cooldownMs={cooldownMs}
        busy={busy}
        selection={selection}
      />

      {selection.length > 0 && (
        <section className="rounded-2xl border bg-white p-4 shadow-sm">
          <h2 className="mb-2 text-lg font-semibold">Selected Dishes</h2>
          <ul className="list-disc pl-6">
            {selection.map((d) => (
              <li key={d.id}>
                <span className="font-medium">{d.name}</span>{" "}
                <span className="text-xs">({d.category})</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex gap-2">
            <button className="underline" onClick={fetchRecipes}>
              Cook at Home
            </button>
            <button className="underline" onClick={fetchVenues}>
              Eat Outside
            </button>
          </div>
        </section>
      )}

      <Modal
        open={openRecipeModal && !!recipes}
        title="Cook at Home — Recipes"
        onClose={() => setOpenRecipeModal(false)}
      >
        {recipes ? <RecipePanel recipes={recipes} /> : <div className="text-sm">Loading…</div>}
      </Modal>

      <section id="outside" className="rounded-2xl border bg-white p-4 shadow-sm">
        <h2 className="mb-2 text-lg font-semibold">Eat Outside</h2>
        <p className="text-sm text-neutral-600">Shows stubbed venues; “Using city-level location.”</p>
        {venues && (
          <>
            <div className="mt-3 grid gap-3 md:grid-cols-2" aria-label="Venue list">
              {venues.map((v) => (
                <div key={v.id} className="rounded-xl border p-3">
                  <div className="mb-1 text-base font-semibold">{v.name}</div>
                  <div className="text-xs text-neutral-600">
                    {v.cuisine} • {v.price} • {v.rating.toFixed(1)}★ • {v.distance_km} km
                  </div>
                  <div className="text-xs">{v.addr}</div>
                  <a
                    className="mt-2 inline-block text-xs underline"
                    href={v.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Visit website
                  </a>
                </div>
              ))}
            </div>
            <div className="mt-3">
              <MapStub venues={venues} />
            </div>
          </>
        )}
      </section>
    </div>
  );
}

export default dynamic(() => Promise.resolve(HomePage), { ssr: false });
