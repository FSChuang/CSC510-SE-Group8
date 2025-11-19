// --- path: tests/components/Toast.test.tsx ---
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, act } from "@testing-library/react";
import ToastStack, { ToastMsg } from "@/components/Toast";

/**
 * Unit tests for ToastStack.
 *
 * These tests verify that:
 * - When there are no toast items, nothing is rendered.
 * - When there are toast items, they are rendered in a fixed stack container.
 * - Each toast schedules an expiry callback based on `ttl` (or the default 2600 ms).
 * - Timers are cleared on unmount so `onExpire` is not fired after the component is gone.
 */

describe("ToastStack", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("returns null and renders nothing when there are no items", () => {
    const { container } = render(<ToastStack items={[]} onExpire={vi.fn()} />);

    // No container div should be rendered
    expect(container.firstChild).toBeNull();
  });

  it("renders a toast container and a card for each item", () => {
    const items: ToastMsg[] = [
      { id: "t1", text: "First toast" },
      { id: "t2", text: "Second toast" },
    ];

    const { container } = render(<ToastStack items={items} onExpire={vi.fn()} />);

    // Outer stack container
    const stack = container.querySelector(
      ".pointer-events-none.fixed.right-3.top-3.z-50"
    );
    expect(stack).not.toBeNull();

    // Individual toast messages
    expect(screen.getByText("First toast")).toBeInTheDocument();
    expect(screen.getByText("Second toast")).toBeInTheDocument();
  });

  it("calls onExpire for each toast after its ttl or the default 2600ms", () => {
    const onExpire = vi.fn();
    const items: ToastMsg[] = [
      { id: "short", text: "Short TTL", ttl: 1000 },
      { id: "default", text: "Default TTL" }, // uses default 2600ms
    ];

    render(<ToastStack items={items} onExpire={onExpire} />);

    // After 1000ms, only the first toast should expire
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(onExpire).toHaveBeenCalledTimes(1);
    expect(onExpire).toHaveBeenCalledWith("short");

    // After an additional 1600ms (total 2600ms), the second toast expires
    act(() => {
      vi.advanceTimersByTime(1600);
    });
    expect(onExpire).toHaveBeenCalledTimes(2);
    expect(onExpire).toHaveBeenLastCalledWith("default");
  });

  it("clears timers on unmount so onExpire is not called afterward", () => {
    const onExpire = vi.fn();
    const items: ToastMsg[] = [{ id: "t1", text: "Will be unmounted", ttl: 1000 }];

    const { unmount } = render(<ToastStack items={items} onExpire={onExpire} />);

    // Unmount before the TTL elapses
    unmount();

    // Even if timers run, the cleanup in useEffect should have cleared them
    act(() => {
      vi.runAllTimers();
    });

    expect(onExpire).not.toHaveBeenCalled();
  });
});
