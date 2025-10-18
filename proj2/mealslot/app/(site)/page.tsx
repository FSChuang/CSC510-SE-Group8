"use client";

import { useEffect, useState } from "react";
import { SlotMachine } from "@/components/SlotMachine";
import { PowerUps } from "@/components/PowerUps";
import { Dish, PowerUpsInput } from "@/lib/schemas";
import { cn } from "@/components/ui/cn";

export default function Page() {
  const [categories, setCategories] = useState<string[]>(["main", "veggie", "soup"]);
  const [powerups, setPowerups] = useState<PowerUpsInput>({});
  const [selection, setSelection] = useState<Dish[]>([]);
  const [busy, setBusy] = useState(false);
  const [cooldownMs, setCooldownMs] = useState(0);

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
    setCooldownMs(3000);
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
                <span className="font-medium">{d.name}</span> <span className="text-xs">({d.category})</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex gap-2">
            <a className="underline" href="#" onClick={(e) => { e.preventDefault(); window.location.href = "#cook"; }}>
              Cook at Home
            </a>
            <a className="underline" href="#" onClick={(e) => { e.preventDefault(); window.location.href = "#outside"; }}>
              Eat Outside
            </a>
          </div>
        </section>
      )}

      <section id="cook" className="rounded-2xl border bg-white p-4 shadow-sm">
        <h2 className="mb-2 text-lg font-semibold">Cook at Home</h2>
        <p className="text-sm text-neutral-600">Requests stubbed recipes conforming to a strict schema.</p>
      </section>

      <section id="outside" className="rounded-2xl border bg-white p-4 shadow-sm">
        <h2 className="mb-2 text-lg font-semibold">Eat Outside</h2>
        <p className="text-sm text-neutral-600">Shows stubbed venues with a simple map placeholder.</p>
      </section>
    </div>
  );
}
