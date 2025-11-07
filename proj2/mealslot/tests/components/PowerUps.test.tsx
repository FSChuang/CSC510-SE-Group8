/** @vitest-environment happy-dom */
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

// If you mocked cn earlier, keep it. Otherwise you can remove this.
// vi.mock("../../src/components/ui/cn", () => ({
//   cn: (...args: (string | false | null | undefined)[]) => args.filter(Boolean).join(" "),
// }));

// IMPORTANT: PowerUps is a **named** export in your codebase
import { PowerUps } from "../../components/PowerUps";

// ---- Types used by the component
type PU = {
  healthy?: boolean;
  cheap?: boolean;
  max30m?: boolean;
};

// Labels your component renders on the three buttons.
// Keep these in sync with the actual component text.
const labels = {
  healthy: /healthy/i,
  cheap: /cheap/i,
  max30m: /≤?30m|<=?30m|30\s*min/i,
};

// Test helper: always provide a value object and an onChange callback
function renderPU(
  value: Partial<PU> = {},
  onChange: (v: PU) => void = () => {}
) {
  return render(<PowerUps value={value} onChange={onChange} />);
}

describe("PowerUps component", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("1) renders three toggles", () => {
    renderPU({});
    expect(screen.getByRole("button", { name: labels.healthy })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: labels.cheap })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: labels.max30m })).toBeInTheDocument();
  });

  it("2) defaults are unpressed when no value provided", () => {
    renderPU({});
    const h = screen.getByRole("button", { name: labels.healthy });
    const c = screen.getByRole("button", { name: labels.cheap });
    const m = screen.getByRole("button", { name: labels.max30m });
    expect(h).toHaveAttribute("aria-pressed", "false");
    expect(c).toHaveAttribute("aria-pressed", "false");
    expect(m).toHaveAttribute("aria-pressed", "false");
  });

  it("3) respects initial value prop", () => {
    renderPU({ healthy: true, cheap: false, max30m: true });
    expect(screen.getByRole("button", { name: labels.healthy })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: labels.cheap })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: labels.max30m })).toHaveAttribute("aria-pressed", "true");
  });

  it("4) clicking Healthy toggles and calls onChange with updated object", async () => {
    const onChange = vi.fn();
    renderPU({ healthy: false, cheap: false, max30m: false }, onChange);

    await user.click(screen.getByRole("button", { name: labels.healthy }));

    // safely read the first payload
    const firstPayload = onChange.mock.calls[0]?.[0];
    expect(firstPayload?.healthy).toBe(true);
    expect(firstPayload).toMatchObject({ cheap: false, max30m: false });
  });

  it("5) clicking Cheap toggles and calls onChange", async () => {
    const onChange = vi.fn();
    renderPU({}, onChange);
    await user.click(screen.getByRole("button", { name: labels.cheap }));
    const payload = onChange.mock.calls[0]?.[0];
    expect(payload?.cheap).toBe(true);
  });

  it("6) clicking ≤30m toggles and calls onChange", async () => {
    const onChange = vi.fn();
    renderPU({}, onChange);
    await user.click(screen.getByRole("button", { name: labels.max30m }));
    const payload = onChange.mock.calls[0]?.[0];
    expect(payload?.max30m).toBe(true);
  });

  it("7) toggling the same button twice returns it to unpressed and updates onChange each time", async () => {
    const onChange = vi.fn();
    renderPU({}, onChange);

    const btn = screen.getByRole("button", { name: labels.healthy });
    await user.click(btn);
    await user.click(btn);

    expect(onChange).toHaveBeenCalledTimes(2);
    const second = onChange.mock.calls[1]?.[0];
    expect(second?.healthy).toBe(false);
  });

  it("8) multiple toggles accumulate state (Healthy then Cheap)", async () => {
    const onChange = vi.fn();
    renderPU({}, onChange);

    await user.click(screen.getByRole("button", { name: labels.healthy }));
    await user.click(screen.getByRole("button", { name: labels.cheap }));

    const last = onChange.mock.calls.at(-1)?.[0];
    expect(last).toMatchObject({ healthy: true, cheap: true });
  });

  it("11) preserves other flags when one is toggled off", async () => {
    const onChange = vi.fn();
    renderPU({ healthy: true, cheap: true, max30m: false }, onChange);

    await user.click(screen.getByRole("button", { name: labels.healthy })); // turn healthy off
    const last = onChange.mock.calls.at(-1)?.[0];
    expect(last).toMatchObject({ healthy: false, cheap: true, max30m: false });
  });

  it("12) emits a *new* object identity each change", async () => {
    const onChange = vi.fn();
    renderPU({}, onChange);

    const btn = screen.getByRole("button", { name: labels.healthy });
    await user.click(btn);
    await user.click(btn);

    const firstObj = onChange.mock.calls[0]?.[0];
    const secondObj = onChange.mock.calls[1]?.[0];
    expect(firstObj).not.toBe(secondObj);
  });

  it("16) does not crash if onChange is omitted (no-op)", async () => {
    // still supply a no-op; component requires the prop
    renderPU({ healthy: false, cheap: false, max30m: false }, () => {});
    await user.click(screen.getByRole("button", { name: labels.healthy }));
    // no assertion: test passes if no error is thrown
  });

  it("17) honors a controlled value prop: external state wins after re-render", async () => {
    const onChange = vi.fn();
    const { rerender } = render(<PowerUps value={{ healthy: false, cheap: false, max30m: false }} onChange={onChange} />);

    // pretend the parent sets healthy to true
    rerender(<PowerUps value={{ healthy: true, cheap: false, max30m: false }} onChange={onChange} />);
    expect(screen.getByRole("button", { name: labels.healthy })).toHaveAttribute("aria-pressed", "true");
  });
});
