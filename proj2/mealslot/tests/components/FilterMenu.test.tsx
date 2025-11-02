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

  it("1) renders headings and details skeleton before fetch resolves", async () => {
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

  it("2) renders tag and allergen buttons from fetch and toggles tags calling onTagChange", async () => {
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

  it("3) toggles multiple tags and preserves order of selected tags", async () => {
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

  it("4) toggles allergens and calls onAllergenChange", async () => {
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

  it("5) handles empty filter lists gracefully", async () => {
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

  it("6) logs an error if fetch rejects", async () => {
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

  it("7) applies 'selected' classes when items are selected", async () => {
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

  it("8) opens Tags details when summary clicked and shows tag buttons", async () => {
    (global as any).fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_FILTERS,
    });

    render(<FilterMenu onTagChange={() => {}} onAllergenChange={() => {}} />);

    const tagsSummary = screen.getByText(/tags/i);
    // open details
    await userEvent.click(tagsSummary);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Vegan" })).toBeInTheDocument();
    });
  });

  it("9) opens Allergens details when summary clicked and shows allergen buttons", async () => {
    (global as any).fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_FILTERS,
    });

    render(<FilterMenu onTagChange={() => {}} onAllergenChange={() => {}} />);

    const allergensSummary = screen.getByText(/allergens/i);
    await userEvent.click(allergensSummary);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Peanuts" })).toBeInTheDocument();
    });
  });

  it("10) selecting multiple tags calls onTagChange with items in selection order", async () => {
    (global as any).fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_FILTERS,
    });

    const onTagChange = vi.fn();
    render(<FilterMenu onTagChange={onTagChange} onAllergenChange={() => {}} />);

    // open details to ensure buttons are visible
    await userEvent.click(screen.getByText(/tags/i));
    await waitFor(() => expect(screen.getByRole("button", { name: "Vegan" })).toBeInTheDocument());

    const vegan = screen.getByRole("button", { name: "Vegan" });
    const halal = screen.getByRole("button", { name: "Halal" });
    const gf = screen.getByRole("button", { name: "Kosher" });

    await userEvent.click(vegan);
    expect(onTagChange).toHaveBeenLastCalledWith(["Vegan"]);

    await userEvent.click(halal);
    expect(onTagChange).toHaveBeenLastCalledWith(["Vegan", "Halal"]);

    await userEvent.click(gf);
    expect(onTagChange).toHaveBeenLastCalledWith(["Vegan", "Halal", "Kosher"]);
  });

  it("11) selecting multiple allergens calls onAllergenChange with accumulated items", async () => {
    (global as any).fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_FILTERS,
    });

    const onAllergenChange = vi.fn();
    render(<FilterMenu onTagChange={() => {}} onAllergenChange={onAllergenChange} />);

    await userEvent.click(screen.getByText(/allergens/i));
    await waitFor(() => expect(screen.getByRole("button", { name: "Peanuts" })).toBeInTheDocument());

    const peanuts = screen.getByRole("button", { name: "Peanuts" });
    const dairy = screen.getByRole("button", { name: "Dairy" });

    await userEvent.click(peanuts);
    expect(onAllergenChange).toHaveBeenLastCalledWith(["Peanuts"]);

    await userEvent.click(dairy);
    expect(onAllergenChange).toHaveBeenLastCalledWith(["Peanuts", "Dairy"]);
  });

  it("12) deselecting one tag leaves other selections intact", async () => {
    (global as any).fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_FILTERS,
    });

    const onTagChange = vi.fn();
    render(<FilterMenu onTagChange={onTagChange} onAllergenChange={() => {}} />);

    await userEvent.click(screen.getByText(/tags/i));
    await waitFor(() => expect(screen.getByRole("button", { name: "Vegan" })).toBeInTheDocument());

    const vegan = screen.getByRole("button", { name: "Vegan" });
    const halal = screen.getByRole("button", { name: "Halal" });

    await userEvent.click(vegan); // ["Vegan"]
    await userEvent.click(halal); // ["Vegan","Halal"]
    // now deselect vegan
    await userEvent.click(vegan); // ["Halal"]
    expect(onTagChange).toHaveBeenLastCalledWith(["Halal"]);
  });

  it("13) handles missing tags/allergens keys in fetch result gracefully", async () => {
    // fetch returns empty object (no tags/allergens keys)
    (global as any).fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    render(<FilterMenu onTagChange={() => {}} onAllergenChange={() => {}} />);

    // open both details
    await userEvent.click(screen.getByText(/tags/i));
    await userEvent.click(screen.getByText(/allergens/i));

    // wait and assert that no buttons were rendered
    await waitFor(() => {
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });
  });

  it("14) rapid repeated clicks toggle without duplicating items in callback", async () => {
    (global as any).fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_FILTERS,
    });

    const onTagChange = vi.fn();
    render(<FilterMenu onTagChange={onTagChange} onAllergenChange={() => {}} />);

    await userEvent.click(screen.getByText(/tags/i));
    await waitFor(() => expect(screen.getByRole("button", { name: "Halal" })).toBeInTheDocument());

    const halal = screen.getByRole("button", { name: "Halal" });

    // simulate quick double-clicks
    await Promise.all([userEvent.click(halal), userEvent.click(halal), userEvent.click(halal)]);
    // last call should reflect final state (either selected or not), and selection array shouldn't contain duplicates
    const lastCallArgs = onTagChange.mock.calls.at(-1)?.[0] ?? [];
    // ensure array has unique entries
    const unique = Array.from(new Set(lastCallArgs));
    expect(unique.length).toBe(lastCallArgs.length);
  });

  it("15) keyboard activation (Enter) triggers tag selection", async () => {
    (global as any).fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_FILTERS,
    });

    const onTagChange = vi.fn();
    render(<FilterMenu onTagChange={onTagChange} onAllergenChange={() => {}} />);

    await userEvent.click(screen.getByText(/tags/i));
    await waitFor(() => expect(screen.getByRole("button", { name: "Vegan" })).toBeInTheDocument());

    // Tab to the first button then press Enter
    await userEvent.tab(); // focuses first focusable element (depends on DOM) - repeat until Vegan is focused
    // ensure focus lands on Vegan by focusing explicitly if needed
    const vegan = screen.getByRole("button", { name: "Vegan" });
    vegan.focus();
    expect(document.activeElement).toBe(vegan);

    await userEvent.keyboard("{Enter}");
    expect(onTagChange).toHaveBeenLastCalledWith(["Vegan"]);
  });

  it("16) buttons reflect aria-pressed when toggled", async () => {
    (global as any).fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_FILTERS,
    });

    render(<FilterMenu onTagChange={() => {}} onAllergenChange={() => {}} />);

    await userEvent.click(screen.getByText(/tags/i));
    await waitFor(() => expect(screen.getByRole("button", { name: "Kosher" })).toBeInTheDocument());

    const gf = screen.getByRole("button", { name: "Kosher" });
    expect(gf).toHaveAttribute("aria-pressed", "false");

    await userEvent.click(gf);
    expect(gf).toHaveAttribute("aria-pressed", "true");

    await userEvent.click(gf);
    expect(gf).toHaveAttribute("aria-pressed", "false");
  });

  it("17) clicking tags and allergens independently invokes both callbacks", async () => {
    (global as any).fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_FILTERS,
    });

    const onTagChange = vi.fn();
    const onAllergenChange = vi.fn();
    render(<FilterMenu onTagChange={onTagChange} onAllergenChange={onAllergenChange} />);

    await userEvent.click(screen.getByText(/tags/i));
    await userEvent.click(screen.getByText(/allergens/i));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Vegan" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Peanuts" })).toBeInTheDocument();
    });

    const vegan = screen.getByRole("button", { name: "Vegan" });
    const peanuts = screen.getByRole("button", { name: "Peanuts" });

    await userEvent.click(vegan);
    expect(onTagChange).toHaveBeenLastCalledWith(["Vegan"]);

    await userEvent.click(peanuts);
    expect(onAllergenChange).toHaveBeenLastCalledWith(["Peanuts"]);
  });

  it("18) renders all tag and allergen buttons after fetch", async () => {
    (global as any).fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_FILTERS,
    });

    render(<FilterMenu onTagChange={() => {}} onAllergenChange={() => {}} />);

    // wait for buttons to appear
    await waitFor(() => {
      MOCK_FILTERS.tags.forEach(tag => {
        expect(screen.getByRole("button", { name: tag })).toBeInTheDocument();
      });
      MOCK_FILTERS.allergens.forEach(allergen => {
        expect(screen.getByRole("button", { name: allergen })).toBeInTheDocument();
      });
    });
  });

  it("19) calls onTagChange with all selected tags in order", async () => {
    (global as any).fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_FILTERS,
    });

    const onTagChange = vi.fn();
    render(<FilterMenu onTagChange={onTagChange} onAllergenChange={() => {}} />);

    await userEvent.click(screen.getByText(/tags/i));
    await waitFor(() => expect(screen.getByRole("button", { name: "Vegan" })).toBeInTheDocument());

    const vegan = screen.getByRole("button", { name: "Vegan" });
    const halal = screen.getByRole("button", { name: "Halal" });

    await userEvent.click(vegan);
    await userEvent.click(halal);

    expect(onTagChange).toHaveBeenLastCalledWith(["Vegan", "Halal"]);
  });

  it("20) calls onAllergenChange when allergens are toggled", async () => {
    (global as any).fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_FILTERS,
    });

    const onAllergenChange = vi.fn();
    render(<FilterMenu onTagChange={() => {}} onAllergenChange={onAllergenChange} />);

    await userEvent.click(screen.getByText(/allergens/i));
    await waitFor(() => expect(screen.getByRole("button", { name: "Peanuts" })).toBeInTheDocument());

    const peanuts = screen.getByRole("button", { name: "Peanuts" });
    const dairy = screen.getByRole("button", { name: "Dairy" });

    await userEvent.click(peanuts);
    expect(onAllergenChange).toHaveBeenLastCalledWith(["Peanuts"]);

    await userEvent.click(dairy);
    expect(onAllergenChange).toHaveBeenLastCalledWith(["Peanuts", "Dairy"]);
  });

});
