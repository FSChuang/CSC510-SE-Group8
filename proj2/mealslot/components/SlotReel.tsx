"use client";

import React from "react"
import { Dish } from "@/lib/schemas";
import { cn } from "./ui/cn";

type Props = {
  dish?: Dish;
  locked: boolean;
  onToggle(): void;
};

export default function SlotReel({ dish, locked, onToggle }: Props) {
  return (
    <div className="flex h-40 w-full flex-col justify-between rounded-2xl border bg-white p-3 shadow-sm">
      <div className="min-h-12">
        <div className="text-base font-semibold" suppressHydrationWarning>
          {dish?.name ?? ""}
        </div>
        <div className="text-xs text-neutral-600" suppressHydrationWarning>
          {dish?.category ?? ""}
        </div>
      </div>
      <button
        className={cn(
          "rounded-md border px-3 py-1 text-sm",
          locked ? "bg-neutral-900 text-white" : "bg-white"
        )}
        onClick={onToggle}
        aria-pressed={locked}
      >
        {locked ? "Unlock" : "Lock"}
      </button>
    </div>
  );
}
