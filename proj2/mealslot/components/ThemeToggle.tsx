// --- path: components/ThemeToggle.tsx ---
"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * Dark-mode switch that proves it's wired:
 * - Knob slides immediately via local state.
 * - Toggles <html class="dark"> and localStorage.
 * - Shows a live label ("light"/"dark") next to the switch.
 * - Logs to console on every click.
 */
export default function ThemeToggle() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  // Apply theme to <html> and persist
  const applyTheme = (next: boolean) => {
    const html = document.documentElement;
    html.classList.toggle("dark", next);
    html.setAttribute("data-theme", next ? "dark" : "light"); // debug visibility
    try { localStorage.setItem("theme", next ? "dark" : "light"); } catch {}
    setIsDark(next);
    console.log(`[ThemeToggle] theme -> ${next ? "dark" : "light"}`);
  };

  // Initial state from DOM / storage / system
  useLayoutEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem("theme"); // "dark" | "light" | null
      const domHas = document.documentElement.classList.contains("dark");
      const prefers = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ?? false;
      const initial = stored === "dark" || (!stored && (domHas || prefers));
      applyTheme(initial);
    } catch {
      // best-effort
    }
  }, []);

  // Click handler (moves knob immediately, then updates DOM)
  const flip = () => {
    const next = !isDark;
    setIsDark(next);              // 1) slide knob immediately
    requestAnimationFrame(() => { // 2) toggle html class & persist
      applyTheme(next);
    });
  };

  if (!mounted) {
    // skeleton to avoid hydration mismatch
    return (
      <div className="h-6 w-12 rounded-full border border-neutral-300 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800" />
    );
  }

  return (
    <div ref={rootRef} className="flex items-center gap-2">
      <button
        type="button"
        aria-label="Toggle dark mode"
        title="Toggle dark mode"
        onClick={flip}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            flip();
          }
        }}
        className={[
          "relative h-6 w-12 rounded-full border transition-colors duration-200",
          isDark ? "border-neutral-600 bg-neutral-800" : "border-orange-400 bg-orange-500",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2",
          "dark:focus-visible:ring-neutral-600 dark:focus-visible:ring-offset-neutral-900",
        ].join(" ")}
        role="switch"
        aria-checked={isDark}
        data-testid="theme-toggle"
      >
        {/* knob slides using transform; independent of global theme */}
        <span
          className={[
            "absolute top-0.5 left-0.5 grid h-5 w-5 place-items-center rounded-full text-[11px] leading-none shadow",
            "transition-transform duration-200 will-change-transform",
            isDark ? "translate-x-0 bg-neutral-700 text-neutral-300" : "translate-x-[24px] bg-white text-orange-500",
          ].join(" ")}
        >
          {isDark ? "☾" : "☀︎"}
        </span>
      </button>

      {/* live label so you can *see* the logical state */}
      <span className="text-xs text-neutral-600 dark:text-neutral-300" data-testid="theme-label">
        {isDark ? "dark" : "light"}
      </span>
    </div>
  );
}

export { ThemeToggle };
