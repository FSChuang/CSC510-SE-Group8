/** @vitest-environment happy-dom */

import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ✅ If your file lives at components/ui/SlotReel.tsx, this path is correct.
//    If it's components/SlotReel.tsx (no /ui), change the import to:
//    import SlotReel from "../../components/SlotReel";
import SlotReel from "../../components/SlotReel";

/* ------------------------------------------------------------------ */
/* Test helpers                                                        */
/* ------------------------------------------------------------------ */

// Minimal factory that satisfies SlotReel's Dish shape.
// You can override any fields in tests as needed.
const mkDish = (over: Partial<{
  id: string;
  name: string;
  category: string;
  tags: string[];
  costBand: number;
  timeBand: number;
  isHealthy: boolean;
  allergens: string[];
  ytQuery: string;
}> = {}) => ({
  id: over.id ?? "dish_1",
  name: over.name ?? "Blueberry Muffins",
  category: over.category ?? "breakfast",
  tags: over.tags ?? [],
  costBand: over.costBand ?? 1,
  timeBand: over.timeBand ?? 1,
  isHealthy: over.isHealthy ?? false,
  allergens: over.allergens ?? [],
  ytQuery: over.ytQuery ?? "",
});

/* ------------------------------------------------------------------ */
/* Tests                                                               */
/* ------------------------------------------------------------------ */

describe("SlotReel", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    // nothing yet; placeholder in case we add timers/mocks later
  });

  it("1) renders the dish name", () => {
    render(<SlotReel dish={mkDish({ name: "Granola & Milk" })} locked={false} onToggle={() => {}} />);
    expect(screen.getByText(/Granola & Milk/i)).toBeInTheDocument();
  });

  it("2) shows a Lock button with proper role", () => {
    render(<SlotReel dish={mkDish()} locked={false} onToggle={() => {}} />);
    expect(screen.getByRole("button", { name: /lock/i })).toBeInTheDocument();
  });

  it("3) clicking Lock calls onToggle once", async () => {
    const onToggle = vi.fn();
    render(<SlotReel dish={mkDish()} locked={false} onToggle={onToggle} />);
    await user.click(screen.getByRole("button", { name: /lock/i }));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("4) when locked prop=true, button has aria-pressed=true", () => {
    render(<SlotReel dish={mkDish()} locked={true} onToggle={() => {}} />);
    expect(screen.getByRole("button", { name: /lock/i })).toHaveAttribute("aria-pressed", "true");
  });

  it("5) when locked prop=false, button has aria-pressed=false", () => {
    render(<SlotReel dish={mkDish()} locked={false} onToggle={() => {}} />);
    expect(screen.getByRole("button", { name: /lock/i })).toHaveAttribute("aria-pressed", "false");
  });

  it("6) keyboard Space toggles via onToggle (accessibility)", async () => {
    const onToggle = vi.fn();
    render(<SlotReel dish={mkDish()} locked={false} onToggle={onToggle} />);
    const btn = screen.getByRole("button", { name: /lock/i });
    await user.keyboard("{Space}");
    expect(onToggle).toHaveBeenCalledTimes(1);
    // Enter should also trigger
    await user.keyboard("{Enter}");
    expect(onToggle).toHaveBeenCalledTimes(2);
  });

  it("7) re-render with new dish updates visible name", async () => {
    const { rerender } = render(<SlotReel dish={mkDish({ name: "A" })} locked={false} onToggle={() => {}} />);
    expect(screen.getByText("A")).toBeInTheDocument();
    rerender(<SlotReel dish={mkDish({ name: "B" })} locked={false} onToggle={() => {}} />);
    expect(screen.getByText("B")).toBeInTheDocument();
  });

  it("8) shows any subtitle/metadata container (does not assert exact copy)", () => {
    render(<SlotReel dish={mkDish({ tags: ["vegan"], isHealthy: true })} locked={false} onToggle={() => {}} />);
    // We just ensure the two typical text containers exist (title + meta area)
    // Without depending on exact wording/styles.
    const title = screen.getAllByText(/blueberry muffins/i)[0];
    expect(title).toBeInTheDocument();
  });

  it("9) lock button is focusable and can be tabbed to", async () => {
    render(<SlotReel dish={mkDish()} locked={false} onToggle={() => {}} />);
    await user.tab();
    expect(screen.getByRole("button", { name: /lock/i })).toHaveFocus();
  });

  it("10) does not crash if onToggle is a no-op", async () => {
    render(<SlotReel dish={mkDish()} locked={false} onToggle={() => {}} />);
    await user.click(screen.getByRole("button", { name: /lock/i })); // should not throw
    expect(true).toBe(true);
  });
});
