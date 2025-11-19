// --- path: components/ThemeToggle.tsx ---
"use client";

import React, { useEffect, useRef, useState } from "react";

/**
 * ThemeToggle
 * - Knob slides immediately via local state.
 * - Flips <html class="dark"> and persists to localStorage.
 * - z-50 + pointer-events-auto so overlays don't block it.
 * - Handles click, pointerdown (mobile), keyboard.
 * - Shows a live label for sanity checks.
 */
export default function ThemeToggle() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  const applyTheme = (dark: boolean) => {
    document.documentElement.classList.toggle("dark", dark);
    try {
      localStorage.setItem("theme", dark ? "dark" : "light");
    } catch {}
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem("theme"); // "dark" | "light" | null
      const domHas = document.documentElement.classList.contains("dark");
      const prefers =
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-color-scheme: dark)").matches;

      const initial = stored === "dark" || (!stored && (domHas || prefers));
      setIsDark(initial);
      applyTheme(initial);
    } finally {
      setMounted(true);
    }
  }, []);

  const flip = () => {
    const next = !isDark;
    setIsDark(next); // slide knob right away
    requestAnimationFrame(() => applyTheme(next));
  };

  if (!mounted) {
    return (
      <div className="relative z-50 pointer-events-auto flex items-center gap-2">
        <div className="h-6 w-12 rounded-full border border-neutral-300 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900" />
        <span className="text-xs text-neutral-600 dark:text-neutral-300">…</span>
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      className="relative z-50 pointer-events-auto flex items-center gap-2"
    >
      <button
        type="button"
        aria-label="Toggle dark mode"
        title="Toggle dark mode"
        onClick={(e) => {
          e.stopPropagation();
          flip();
        }}
        onPointerDown={(e) => {
          e.stopPropagation();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            flip();
          }
        }}
        className={[
          "relative h-6 w-12 rounded-full border transition-colors duration-200",
          isDark
            ? "border-neutral-600 bg-neutral-800"
            : "border-orange-400 bg-orange-500",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2",
          "dark:focus-visible:ring-neutral-600 dark:focus-visible:ring-offset-neutral-900",
        ].join(" ")}
        role="switch"
        aria-checked={isDark}
        data-testid="theme-toggle"
      >
        {/* Knob: 20px circle, 2px gutters, 24px travel */}
        <span
          className={[
            "absolute top-[2px] left-[2px] grid h-5 w-5 place-items-center rounded-full text-[11px] leading-none shadow",
            "transition-transform duration-200 will-change-transform",
            isDark
              ? "translate-x-[24px] bg-neutral-700 text-neutral-300"
              : "translate-x-0 bg-white text-orange-500",
          ].join(" ")}
        >
          {isDark ? "☾" : "☀︎"}
        </span>
      </button>

      <span
        className="text-xs text-neutral-600 dark:text-neutral-300"
        data-testid="theme-label"
      >
        {isDark ? "dark" : "light"}
      </span>
    </div>
  );
}

export { ThemeToggle };
