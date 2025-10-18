"use client";

import { PowerUpsInput } from "@/lib/schemas";
import { cn } from "./ui/cn";

export function PowerUps({
  value,
  onChange
}: {
  value: PowerUpsInput;
  onChange: (v: PowerUpsInput) => void;
}) {
  const toggle = (k: keyof PowerUpsInput) => onChange({ ...value, [k]: !value[k] });
  return (
    <section className="rounded-2xl border bg-white p-4 shadow-sm">
      <h2 className="mb-2 text-lg font-semibold">Power-Ups</h2>
      <div className="flex gap-2">
        <button
          onClick={() => toggle("healthy")}
          className={cn("rounded-full border px-3 py-1 text-sm", value.healthy ? "bg-neutral-900 text-white" : "bg-white")}
          aria-pressed={!!value.healthy}
        >
          Healthy
        </button>
        <button
          onClick={() => toggle("cheap")}
          className={cn("rounded-full border px-3 py-1 text-sm", value.cheap ? "bg-neutral-900 text-white" : "bg-white")}
          aria-pressed={!!value.cheap}
        >
          Cheap
        </button>
        <button
          onClick={() => toggle("max30m")}
          className={cn("rounded-full border px-3 py-1 text-sm", value.max30m ? "bg-neutral-900 text-white" : "bg-white")}
          aria-pressed={!!value.max30m}
        >
          ≤30m
        </button>
      </div>
    </section>
  );
}
