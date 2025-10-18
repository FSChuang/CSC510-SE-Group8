"use client";

import { useMemo, useState } from "react";
import SlotReel from "./SlotReel";

type Props = {
  categories: string[];
  onSpin: (locked: Record<number, string>, seed?: string) => Promise<void>;
  disabled?: boolean;
};

function seededSeed() {
  return Math.random().toString(36).slice(2, 8);
}

export default function SlotMachine({ categories, onSpin, disabled }: Props) {
  const [locked, setLocked] = useState<Record<number, string>>({});
  const [values, setValues] = useState<string[]>(
    categories.map((c) => `${c}…`)
  );

  const canSpin = useMemo(() => values.length === categories.length, [values, categories]);

  function toggleLock(i: number) {
    setLocked((prev) => {
      const copy = { ...prev };
      if (copy[i]) delete copy[i];
      else copy[i] = values[i];
      return copy;
    });
  }

  async function spin(seed?: string) {
    await onSpin(locked, seed);
  }

  // Sync values when onSpin updates result via parent
  // Parent updates `result` internally, but we can't read it directly;
  // Instead, we provide a small hook: parent calls this component again with new props via re-render.

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {categories.map((cat, i) => (
          <SlotReel
            key={i}
            label={cat}
            value={locked[i] ?? values[i]}
            locked={!!locked[i]}
            onToggleLock={() => toggleLock(i)}
          />
        ))}
      </div>
      <div className="flex gap-2">
        <button
          disabled={!canSpin || !!disabled}
          onClick={async () => {
            const seed = seededSeed();
            await spin(seed);
          }}
          className="px-3 py-2 rounded-md bg-black text-white disabled:opacity-50"
        >
          Spin / Reroll
        </button>
        <button
          disabled={!canSpin || !!disabled}
          onClick={async () => {
            // Reroll only unlocked reels by sending current locks; API respects locks
            const seed = seededSeed();
            await spin(seed);
          }}
          className="px-3 py-2 rounded-md border"
        >
          Reroll Unlocked
        </button>
      </div>
      <p className="text-xs text-gray-500">
        Tip: Lock reels you like, then reroll to refine. Deterministic selection with seed & temperature.
      </p>
    </div>
  );
}
