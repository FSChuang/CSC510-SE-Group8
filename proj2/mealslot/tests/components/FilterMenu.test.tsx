/**
 * @vitest-environment jsdom
 */
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock cn helper - adjust path if your real cn lives elsewhere
vi.mock("../../src/components/ui/cn", () => ({
  cn: (...args: (string | false | null | undefined)[]) => args.filter(Boolean).join(" "),
}));

import FilterMenu from "../../components/FilterMenu";

const MOCK_FILTERS = {
  tags: ["Halal", "Vegan", "Kosher"],
  allergens: ["Peanuts", "Dairy"],
};

describe("FilterMenu component", () => {
  const originalFetch = (global as any).fetch;
  const originalConsoleError = console.error;

  beforeEach(() => {
    vi.useRealTimers();
    // ensure a clean slate for mocks each test
    vi.restoreAllMocks();
    (global as any).fetch = undefined;
  });

  afterEach(() => {
    // restore original fetch & console after each test
    vi.restoreAllMocks();
    (global as any).fetch = originalFetch;
    console.error = originalConsoleError;
  });

  it("renders headings and details skeleton before fetch resolves", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_FILTERS,
    });
    (global as any).fetch = fetchMock;

    render(<FilterMenu onTagChange={() => {}} onAllergenChange={() => {}} />);

    expect(screen.getByRole("heading", { level: 2, name: /filters/i })).toBeInTheDocument();
    expect(screen.getByText(/tags/i)).toBeInTheDocument();
    expect(screen.getByText(/allergens/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Halal" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Peanuts" })).toBeInTheDocument();
    });
  });

  it("renders tag and allergen buttons from fetch and toggles tags calling onTagChange", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_FILTERS,
    });
    (global as any).fetch = fetchMock;

    const onTagChange = vi.fn();
    const onAllergenChange = vi.fn();

    render(<FilterMenu onTagChange={onTagChange} onAllergenChange={onAllergenChange} />);

    await waitFor(() => expect(screen.getByRole("button", { name: "Vegan" })).toBeInTheDocument());

    const veganBtn = screen.getByRole("button", { name: "Vegan" });
    expect(veganBtn).toHaveAttribute("aria-pressed", "false");

    await userEvent.click(veganBtn);
    expect(onTagChange).toHaveBeenLastCalledWith(["Vegan"]);
    expect(veganBtn).toHaveAttribute("aria-pressed", "true");

    await userEvent.click(veganBtn);
    expect(onTagChange).toHaveBeenLastCalledWith([]);
    expect(veganBtn).toHaveAttribute("aria-pressed", "false");
  });

  it("toggles multiple tags and preserves order of selected tags", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_FILTERS,
    });
    (global as any).fetch = fetchMock;

    const onTagChange = vi.fn();
    render(<FilterMenu onTagChange={onTagChange} onAllergenChange={() => {}} />);

    await waitFor(() => expect(screen.getByRole("button", { name: "Halal" })).toBeInTheDocument());

    const halal = screen.getByRole("button", { name: "Halal" });
    const kosher = screen.getByRole("button", { name: "Kosher" });

    await userEvent.click(halal);
    expect(onTagChange).toHaveBeenLastCalledWith(["Halal"]);

    await userEvent.click(kosher);
    expect(onTagChange).toHaveBeenLastCalledWith(["Halal", "Kosher"]);

    await userEvent.click(halal);
    expect(onTagChange).toHaveBeenLastCalledWith(["Kosher"]);
  });

  it("toggles allergens and calls onAllergenChange", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_FILTERS,
    });
    (global as any).fetch = fetchMock;

    const onAllergenChange = vi.fn();
    render(<FilterMenu onTagChange={() => {}} onAllergenChange={onAllergenChange} />);

    await waitFor(() => expect(screen.getByRole("button", { name: "Peanuts" })).toBeInTheDocument());

    const peanuts = screen.getByRole("button", { name: "Peanuts" });

    await userEvent.click(peanuts);
    expect(onAllergenChange).toHaveBeenLastCalledWith(["Peanuts"]);
    expect(peanuts).toHaveAttribute("aria-pressed", "true");

    await userEvent.click(peanuts);
    expect(onAllergenChange).toHaveBeenLastCalledWith([]);
    expect(peanuts).toHaveAttribute("aria-pressed", "false");
  });

  it("handles empty filter lists gracefully", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ tags: [], allergens: [] }),
    });
    (global as any).fetch = fetchMock;

    render(<FilterMenu onTagChange={() => {}} onAllergenChange={() => {}} />);

    await waitFor(() => {
      expect(screen.queryByRole("button", { name: "Halal" })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Peanuts" })).not.toBeInTheDocument();
    });
  });

  it("logs an error if fetch rejects", async () => {
    const fetchMock = vi.fn().mockRejectedValueOnce(new Error("network"));
    (global as any).fetch = fetchMock;

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(<FilterMenu onTagChange={() => {}} onAllergenChange={() => {}} />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
      const called = consoleSpy.mock.calls.flat().join(" ");
      expect(called).toMatch(/Failed to fetch filters/i);
    });

    consoleSpy.mockRestore();
  });

  it("applies 'selected' classes when items are selected", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_FILTERS,
    });
    (global as any).fetch = fetchMock;

    render(<FilterMenu onTagChange={() => {}} onAllergenChange={() => {}} />);

    await waitFor(() => expect(screen.getByRole("button", { name: "Vegan" })).toBeInTheDocument());
    const vegan = screen.getByRole("button", { name: "Vegan" });

    expect(vegan.className).toContain("bg-white");

    await userEvent.click(vegan);
    expect(vegan.className).toContain("bg-neutral-900");
    expect(vegan.getAttribute("aria-pressed")).toBe("true");
  });
});
