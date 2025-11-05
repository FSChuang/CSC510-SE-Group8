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
import MapWithPins from "@/components/MapWithPins";
import VideoPanel, {Video} from "@/components/VideoPanel";

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
  const [category, setCategory] = useState<string>("Breakfast");
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
  const [videosByDish, setVideosByDish] = useState<Record<string, Video[]>>({});
  const [openVideoModal, setOpenVideoModal] = useState(false);


  const cuisines = useMemo(() => {
    // Extract the "name" property from each selected item
    const names = selection.map((d) => d.name).filter(Boolean);

    // Fallback list if nothing is selected
    return names.length ? names : ["american", "asian", "italian"];
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
    // send categories as an array for backwards compatibility, containing the single selection
    const res = await fetch("/api/spin", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ category, tags: selectedTags, allergens: selectedAllergens, locked, powerups, dishCount })
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
    setOpenVideoModal(false);
    setCooldownMs(3000);

    await fetchVideos(data.selection);
  };

  const fetchVideos = async (dishes: Dish[]) => {
    if (!dishes.length) return;

    const dishNames = dishes.map(d => d.name);

    const res = await fetch("/api/videos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dishes: dishNames }),
    });

    const data = await res.json();
    if (res.ok) {
      setVideosByDish(data.results);
    } else {
      console.error("Failed to fetch videos", data);
    }
  };


  const fetchVenues = async (coords?: { lat: number; lng: number }) => {
    const body: any = { cuisines };
    if (coords) {
      body.lat = coords.lat;
      body.lng = coords.lng;
    } else {
      body.locationHint = "Denver"; // fallback city
    }

    const r = await fetch("/api/places", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });

    const j = await r.json();
    console.log("API response:", j);

    // Normalize results
    let normalized: any[] = [];
    if (Array.isArray(j.venues)) {
      normalized = j.venues;
    } else if (j.results && typeof j.results === "object") {
      normalized = Object.values(j.results).flat();
    } else if (Array.isArray(j)) {
      normalized = j;
    }

    console.log("Normalized venues:", normalized);
    setVenues(normalized);
  };


  return (
    <div className="space-y-4">
      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <h2 className="mb-2 text-lg font-semibold">Choose Category</h2>
        <div className="flex flex-wrap gap-2">
          {["Breakfast", "Lunch", "Dinner", "Dessert"].map((c) => {
            const active = category === c.toLowerCase();
            return (
              <button
                key={c.toLowerCase()}
                className={cn(
                  "rounded-full border px-3 py-1 text-sm",
                  active ? "bg-neutral-900 text-white" : "bg-white"
                )}
                // clicking a different option selects it; clicking the active option will deselect (set to "")
                onClick={() => setCategory((prev) => (prev === c.toLowerCase() ? "" : c.toLowerCase()))}
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
            <button className="underline" onClick={() => setOpenVideoModal(true)}>
              Cook at Home
            </button>
            <button
              className="underline"
              onClick={() => {
                if ("geolocation" in navigator) {
                  navigator.geolocation.getCurrentPosition(
                    (pos) => {
                      fetchVenues({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                    },
                    (err) => {
                      console.warn("Geolocation error or denied:", err);
                      // fallback if denied
                      fetchVenues();
                    },
                    { maximumAge: 1000 * 60 * 5, timeout: 10000 }
                  );
                } else {
                  console.warn("Geolocation not supported");
                  fetchVenues();
                }
              }}
            >
              Eat Outside
            </button>
          </div>
        </section>
      )}

      <Modal
        open={openVideoModal && !!videosByDish}
        title="Cook at Home — Recipes"
        onClose={() => setOpenVideoModal(false)}
      >
        <VideoPanel videosByDish={videosByDish} />
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
              <MapWithPins venues={venues} />
            </div>
          </>
        )}
      </section>
    </div>
  );
}

// Client-only page to avoid hydration noise from extensions/timers.
export default dynamic(() => Promise.resolve(HomePage), { ssr: false });
