"use client";

import { useEffect, useRef, useState } from "react";
import { Dish } from "@/lib/schemas";
import { cn } from "./ui/cn";

type Props = {
  index: number;
  options: Dish[];
  lockedDishId?: string;
  onToggleLock: (index: number, dishId?: string) => void;
};

export function SlotReel({ index, options, lockedDishId, onToggleLock }: Props) {
  const [sel, setSel] = useState<Dish | null>(options[0] ?? null);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (!lockedDishId) {
      timer.current = window.setInterval(() => {
        setSel((prev) => options[(options.findIndex((o) => o.id === prev?.id) + 1) % options.length]);
      }, 600);
      return () => {
        if (timer.current) window.clearInterval(timer.current);
      };
    }
  }, [options, lockedDishId]);

  const locked = Boolean(lockedDishId);
  return (
    <div className={cn("w-56 rounded-xl border bg-white p-3 shadow-sm", locked && "opacity-80")}>
      <div className="min-h-20">
        <div className="text-base font-semibold">{sel?.name}</div>
        <div className="text-xs text-neutral-600">{sel?.category}</div>
      </div>
      <button
        className={cn(
          "mt-2 w-full rounded-md border px-2 py-1 text-sm",
          locked ? "bg-neutral-900 text-white" : "bg-white"
        )}
        onClick={() => onToggleLock(index, locked ? undefined : sel?.id)}
        aria-pressed={locked}
        aria-label={locked ? "Unlock reel" : "Lock reel"}
      >
        {locked ? "Unlock" : "Lock"}
      </button>
    </div>
  );
}
