"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { SlotMachine } from "@/components/SlotMachine";
import { PowerUps } from "@/components/PowerUps";
import { Dish, PowerUpsInput, RecipeJSON } from "@/lib/schemas";
import { cn } from "@/components/ui/cn";

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

function HomePage() {
  const [categories, setCategories] = useState<string[]>(["main", "veggie", "soup"]);
  const [powerups, setPowerups] = useState<PowerUpsInput>({});
  const [selection, setSelection] = useState<Dish[]>([]);
  const [busy, setBusy] = useState(false);
  const [cooldownMs, setCooldownMs] = useState(0);

  const [recipes, setRecipes] = useState<RecipeJSON[] | null>(null);
  const [venues, setVenues] = useState<Venue[] | null>(null);
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

  const onSpin = async (locked: { index: number; dishId: string }[]) => {
    setBusy(true);
    const res = await fetch("/api/spin", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ categories, locked, powerups })
    });
    setBusy(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(`Spin failed: ${j.message ?? res.status}`);
      return;
    }
    const data = await res.json();
    setSelection(data.selection);
    setRecipes(null);
    setVenues(null);
    setCooldownMs(3000);
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
        <h2 className="mb-2 text-lg font-semibold">Choose Categories</h2>
        <div className="flex flex-wrap gap-2">
          {["main", "veggie", "soup", "meat", "dessert"].map((c) => {
            const active = categories.includes(c);
            return (
              <button
                key={c}
                className={cn(
                  "rounded-full border px-3 py-1 text-sm",
                  active ? "bg-neutral-900 text-white" : "bg-white"
                )}
                onClick={() =>
                  setCategories((prev) =>
                    prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
                  )
                }
                aria-pressed={active}
              >
                {c}
              </button>
            );
          })}
        </div>
      </section>

      <PowerUps value={powerups} onChange={setPowerups} />

      <SlotMachine categories={categories} onSpin={onSpin} cooldownMs={cooldownMs} busy={busy} />

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

      <section id="cook" className="rounded-2xl border bg-white p-4 shadow-sm">
        <h2 className="mb-2 text-lg font-semibold">Cook at Home</h2>
        <p className="text-sm text-neutral-600">
          Requests stubbed recipes conforming to a strict schema.
        </p>
        {recipes && (
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {recipes.map((r) => (
              <div key={r.id} className="rounded-xl border p-3">
                <div className="mb-1 text-base font-semibold">{r.name}</div>
                <div className="mb-2 text-xs text-neutral-600">
                  Servings: {r.servings} • Total: {r.total_minutes}m
                </div>
                <div className="mb-1 text-sm font-medium">Ingredients</div>
                <ul className="mb-2 list-disc pl-6 text-sm">
                  {r.ingredients.map((ing, i) => (
                    <li key={i}>
                      {ing.item} — {ing.qty} {ing.unit}
                    </li>
                  ))}
                </ul>
                <div className="mb-1 text-sm font-medium">Steps</div>
                <ol className="list-decimal pl-6 text-sm">
                  {r.steps.map((s) => (
                    <li key={s.order}>
                      {s.text} {s.timer_minutes ? `(${s.timer_minutes}m)` : ""}
                    </li>
                  ))}
                </ol>
                <div className="mt-2 text-xs text-neutral-600">
                  Nutrition: {r.nutrition.kcal} kcal • P {r.nutrition.protein_g}g • C{" "}
                  {r.nutrition.carbs_g}g • F {r.nutrition.fat_g}g
                </div>
                {r.videos?.length ? (
                  <div className="mt-2">
                    <div className="text-sm font-medium">Videos</div>
                    <div className="mt-1 grid grid-cols-2 gap-2">
                      {r.videos.slice(0, 4).map((v) => (
                        <a
                          key={v.id}
                          className="rounded border p-2 text-xs underline"
                          href={v.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {v.title}
                        </a>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>

      <section id="outside" className="rounded-2xl border bg-white p-4 shadow-sm">
        <h2 className="mb-2 text-lg font-semibold">Eat Outside</h2>
        <p className="text-sm text-neutral-600">Shows stubbed venues; “Using city-level location.”</p>
        {venues && (
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {venues.map((v) => (
              <div key={v.id} className="rounded-xl border p-3">
                <div className="mb-1 text-base font-semibold">{v.name}</div>
                <div className="text-xs text-neutral-600">
                  {v.cuisine} • {v.price} • {v.rating.toFixed(1)}★ • {v.distance_km} km
                </div>
                <div className="text-xs">{v.addr}</div>
                <a className="mt-2 inline-block text-xs underline" href={v.url} target="_blank" rel="noreferrer">
                  Visit website
                </a>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// Disable SSR for this page to avoid hydration issues from extensions/timers.
export default dynamic(() => Promise.resolve(HomePage), { ssr: false });
