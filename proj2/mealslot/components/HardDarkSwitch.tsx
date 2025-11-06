// --- path: components/HardDarkSwitch.tsx ---
"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Floating, bulletproof dark-mode switch (for diagnosis & control).
 * - Renders via portal to document.body (outside your app tree)
 * - Huge z-index, native listeners so nothing can swallow the click
 * - Toggles BOTH <html> and <body> .dark
 * - Shows live status (html.dark true/false)
 */
export default function HardDarkSwitch() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [domDark, setDomDark] = useState(false);

  const isDomDark = () =>
    document.documentElement.classList.contains("dark") ||
    document.body.classList.contains("dark");

  const apply = (dark: boolean) => {
    document.documentElement.classList.toggle("dark", dark);
    document.body.classList.toggle("dark", dark);
    try { localStorage.setItem("theme", dark ? "dark" : "light"); } catch {}
    setDomDark(isDomDark());
  };

  useEffect(() => {
    setMounted(true);

    // initialize from storage / system / existing class
    const stored = (() => { try { return localStorage.getItem("theme"); } catch { return null; } })();
    const prefers = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ?? false;
    const initial = isDomDark() || stored === "dark" || (!stored && prefers);
    apply(!!initial);

    // mount portal host
    const host = document.createElement("div");
    host.setAttribute("data-hard-dark-root", "true");
    document.body.appendChild(host);
    mountRef.current = host;

    return () => { host.remove(); mountRef.current = null; };
  }, []);

  // native listeners so even rogue stopPropagation in the app can’t block it
  useEffect(() => {
    if (!btnRef.current) return;
    const handler = (ev: Event) => {
      ev.stopPropagation();
      apply(!isDomDark());
    };
    const el = btnRef.current;
    el.addEventListener("pointerdown", handler, { capture: true });
    el.addEventListener("click", handler, { capture: true });
    return () => {
      el.removeEventListener("pointerdown", handler, true);
      el.removeEventListener("click", handler, true);
    };
  }, [btnRef.current]);

  if (!mounted || !mountRef.current) return null;

  return createPortal(
    <div
      style={{
        position: "fixed",
        top: 10,
        right: 10,
        zIndex: 2147483647,
        pointerEvents: "auto",
      }}
      onClickCapture={(e) => e.stopPropagation()}
    >
      <button
        ref={btnRef}
        type="button"
        title="Hard Dark Switch"
        aria-label="Hard Dark Switch"
        style={{
          width: 56, height: 28, borderRadius: 9999, padding: 2,
          display: "flex", alignItems: "center",
          justifyContent: domDark ? "flex-start" : "flex-end",
          border: "1px solid", borderColor: domDark ? "#525252" : "#fb923c",
          background: domDark ? "#171717" : "#fb923c", cursor: "pointer",
          userSelect: "none",
        }}
      >
        <span
          style={{
            width: 22, height: 22, borderRadius: 9999,
            background: domDark ? "#404040" : "#ffffff",
            color: domDark ? "#e5e5e5" : "#fb923c",
            display: "grid", placeItems: "center",
            fontSize: 12, lineHeight: 1,
            boxShadow: "0 1px 2px rgba(0,0,0,0.25)",
          }}
        >
          {domDark ? "☾" : "☀︎"}
        </span>
      </button>

      <div
        style={{
          marginTop: 6, fontSize: 11,
          fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
          background: "rgba(0,0,0,0.55)", color: "white",
          padding: "2px 6px", borderRadius: 6,
        }}
      >
        html.dark: <b style={{ color: domDark ? "#22c55e" : "#f87171" }}>{String(domDark)}</b>
      </div>
    </div>,
    mountRef.current
  );
}
