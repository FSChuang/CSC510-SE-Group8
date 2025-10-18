"use client";

import { useEffect, useState } from "react";
import { Dish } from "@/lib/schemas";
import { dishesByCategory } from "@/lib/dishes";
import { SlotReel } from "./SlotReel";
import { cn } from "./ui/cn";

type Props = {
  categories: string[];
  onSpin: (locked: { index: number; dishId: string }[]) => void;
  cooldownMs: number;
  busy: boolean;
};

export function SlotMachine({ categories, onSpin, cooldownMs, busy }: Props) {
  const [locked, setLocked] = useState<{ index: number; dishId: string }[]>([]);

  useEffect(() => setLocked([]), [categories]);

  const reels: Dish[][] = categories.map((c) => dishesByCategory(c));

  const toggleLock = (index: number, dishId?: string) => {
    setLocked((prev) => {
      const exists = prev.find((l) => l.index === index);
      if (exists && !dishId) return prev.filter((l) => l.index !== index);
      if (!exists && dishId) return [...prev, { index, dishId }];
      if (exists && dishId) return prev.map((l) => (l.index === index ? { index, dishId } : l));
      return prev;
    });
  };

  const disabled = busy || cooldownMs > 0;

  return (
    <section className="rounded-2xl border bg-white p-4 shadow-sm">
      <h2 className="mb-2 text-lg font-semibold">Slot Machine</h2>
      <div className="mb-3 flex flex-wrap gap-3">
        {reels.map((opts, i) => (
          <SlotReel
            key={i}
            index={i}
            options={opts}
            lockedDishId={locked.find((l) => l.index === i)?.dishId}
            onToggleLock={toggleLock}
          />
        ))}
      </div>
      <button
        className={cn(
          "rounded-md border px-4 py-2 text-sm",
          disabled ? "opacity-50" : "bg-neutral-900 text-white"
        )}
        onClick={() => onSpin(locked)}
        disabled={disabled}
        aria-disabled={disabled}
      >
        {disabled ? `Cooldown ${Math.ceil(cooldownMs / 1000)}s` : "Spin"}
      </button>
    </section>
  );
}
