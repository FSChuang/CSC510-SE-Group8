"use client";

import { useEffect, useMemo, useState } from "react";
import SlotReel from "./SlotReel";
import { Dish } from "@/lib/schemas";
import { cn } from "./ui/cn";

type Locked = { index: number; dishId: string };
type Props = {
  reelCount: number; // number of reels
  onSpin(locked: Locked[]): Promise<void> | void;
  cooldownMs: number; // remaining ms from parent
  busy?: boolean;
  selection?: Dish[];
};

export function SlotMachine({ reelCount, onSpin, cooldownMs, busy, selection }: Props) {
  const [locked, setLocked] = useState<Record<number, string>>({});

  useEffect(() => {
    setLocked({});
  }, [reelCount]);

  const lockedArray: Locked[] = useMemo(
    () =>
      Object.entries(locked)
        .filter(([, id]) => !!id)
        .map(([i, id]) => ({ index: Number(i), dishId: id })),
    [locked]
  );

  const dishesByIndex: (Dish | undefined)[] = useMemo(() => {
    const out: (Dish | undefined)[] = [];
    for (let i = 0; i < reelCount; i++) {
      out.push(selection?.[i]);
    }
    return out;
  }, [reelCount, selection]);

  useEffect(() => {
    const next: Record<number, string> = {};
    dishesByIndex.forEach((d, i) => {
      const currentLocked = locked[i];
      if (currentLocked && d && currentLocked === d.id) {
        next[i] = currentLocked;
      }
    });
    setLocked(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selection && selection.map((d) => d.id).join("|")]);

  const toggleLock = (i: number) => {
    setLocked((prev) => {
      const cur = { ...prev };
      const currentDish = dishesByIndex[i];
      if (!currentDish) return cur;
      if (cur[i]) delete cur[i];
      else cur[i] = currentDish.id;
      return cur;
    });
  };

  const canSpin = !busy && cooldownMs <= 0 && reelCount > 0;

  return (
    <section className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Slot Machine</h2>
        <div className="text-xs text-neutral-600" aria-live="polite">
          {cooldownMs > 0 ? `Cooldown: ${(Math.max(0, cooldownMs) / 1000).toFixed(1)}s` : "\u00A0"}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: reelCount }, (_, i) => (
          <SlotReel
            key={i}
            dish={dishesByIndex[i]}
            locked={!!locked[i]}
            onToggle={() => toggleLock(i)}
          />
        ))}
      </div>

      <div className="mt-4">
        <button
          className={cn(
            "rounded-md border px-4 py-2 text-sm font-medium",
            canSpin ? "bg-neutral-900 text-white" : "bg-neutral-200 text-neutral-500"
          )}
          onClick={() => onSpin(lockedArray)}
          disabled={!canSpin}
          aria-disabled={!canSpin}
        >
          Spin
        </button>
      </div>
    </section>
  );
}
