// --- path: tests/components/ThemeToggle.test.tsx ---
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import ThemeToggle from "@/components/ThemeToggle";

/**
 * Unit tests for ThemeToggle.
 *
 * These tests verify that:
 * - The component initializes its theme based on localStorage and prefers-color-scheme.
 * - The <html> element gets/loses the "dark" class appropriately.
 * - The toggle button exposes correct aria attributes and a text label ("light"/"dark").
 * - Clicking or using the keyboard toggles the theme and persists it to localStorage.
 */

function mockMatchMedia(matches: boolean) {
  (window as any).matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated but sometimes used
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

describe("ThemeToggle", () => {
  beforeEach(() => {
    // Ensure we start from a clean DOM and storage.
    document.documentElement.className = "";
    window.localStorage.clear();

    // Make requestAnimationFrame run callbacks synchronously so
    // applyTheme is executed immediately in tests.
    (window as any).requestAnimationFrame = (cb: FrameRequestCallback) => {
      cb(0);
      return 0;
    };
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    document.documentElement.className = "";
    window.localStorage.clear();
  });

  it("initializes to light mode when there is no stored theme and prefers-color-scheme is not dark", async () => {
    // No stored theme
    window.localStorage.removeItem("theme");
    mockMatchMedia(false); // prefers-color-scheme: light / not dark

    const setItemSpy = vi.spyOn(window.localStorage, "setItem");

    render(<ThemeToggle />);

    // Wait for the effect to run and the mounted UI to appear
    const label = await screen.findByTestId("theme-label");

    expect(label).toHaveTextContent("light");

    const switchEl = screen.getByRole("switch", { name: /toggle dark mode/i });
    expect(switchEl).toHaveAttribute("aria-checked", "false");

    // <html> should not have the "dark" class
    expect(document.documentElement.classList.contains("dark")).toBe(false);

    // Theme is persisted as "light"
    expect(setItemSpy).toHaveBeenCalledWith("theme", "light");
  });

  it("initializes to dark mode when stored theme is 'dark'", async () => {
    window.localStorage.setItem("theme", "dark");
    mockMatchMedia(false); // prefers-color-scheme shouldn't matter here

    const setItemSpy = vi.spyOn(window.localStorage, "setItem");

    render(<ThemeToggle />);

    const label = await screen.findByTestId("theme-label");
    expect(label).toHaveTextContent("dark");

    const switchEl = screen.getByRole("switch", { name: /toggle dark mode/i });
    expect(switchEl).toHaveAttribute("aria-checked", "true");

    // <html> should have the "dark" class applied
    expect(document.documentElement.classList.contains("dark")).toBe(true);

    // Theme is persisted as "dark"
    expect(setItemSpy).toHaveBeenCalledWith("theme", "dark");
  });

  it("toggles from light to dark when clicked, updating label, aria-checked, html class, and localStorage", async () => {
    // Start in light mode
    window.localStorage.setItem("theme", "light");
    mockMatchMedia(false);

    const setItemSpy = vi.spyOn(window.localStorage, "setItem");

    render(<ThemeToggle />);

    const label = await screen.findByTestId("theme-label");
    const switchEl = screen.getByRole("switch", { name: /toggle dark mode/i });

    // Initial state
    expect(label).toHaveTextContent("light");
    expect(switchEl).toHaveAttribute("aria-checked", "false");
    expect(document.documentElement.classList.contains("dark")).toBe(false);

    // Click to flip to dark
    fireEvent.click(switchEl);

    await waitFor(() => {
      expect(label).toHaveTextContent("dark");
      expect(switchEl).toHaveAttribute("aria-checked", "true");
      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });

    // Last persisted value should be "dark"
    expect(setItemSpy).toHaveBeenCalledWith("theme", "dark");
  });

  it("toggles via keyboard (Enter) from dark to light", async () => {
    // Start in dark mode
    window.localStorage.setItem("theme", "dark");
    mockMatchMedia(false);

    const setItemSpy = vi.spyOn(window.localStorage, "setItem");

    render(<ThemeToggle />);

    const label = await screen.findByTestId("theme-label");
    const switchEl = screen.getByRole("switch", { name: /toggle dark mode/i });

    // Initial state
    expect(label).toHaveTextContent("dark");
    expect(switchEl).toHaveAttribute("aria-checked", "true");
    expect(document.documentElement.classList.contains("dark")).toBe(true);

    // Use keyboard to flip to light
    fireEvent.keyDown(switchEl, { key: "Enter" });

    await waitFor(() => {
      expect(label).toHaveTextContent("light");
      expect(switchEl).toHaveAttribute("aria-checked", "false");
      expect(document.documentElement.classList.contains("dark")).toBe(false);
    });

    // Persisted value should be "light"
    expect(setItemSpy).toHaveBeenCalledWith("theme", "light");
  });
});
