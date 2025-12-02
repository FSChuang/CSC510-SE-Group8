import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

// Mock @stackframe/stack so StackTheme is a simple wrapper we can assert on
vi.mock("@stackframe/stack", () => ({
  StackTheme: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="stack-theme">{children}</div>
  ),
}));

describe("StackWrapper", () => {
  it("renders heading and description text", async () => {
    const { default: StackWrapper } = await import(
      "@/components/StackWrapper" // ⬅️ adjust this path to wherever StackWrapper.tsx lives
    );

    render(<StackWrapper />);

    // Heading
    const heading = screen.getByRole("heading", {
      level: 2,
      name: /login \/ signup/i,
    });
    expect(heading).toBeInTheDocument();

    // Body text
    expect(
      screen.getByText(/Use the StackHandler routes at/i)
    ).toBeInTheDocument();

    // Code snippets
    expect(screen.getByText("/handler/sign-up")).toBeInTheDocument();
    expect(screen.getByText("/handler/login")).toBeInTheDocument();
  });

  it("wraps its content inside StackTheme", async () => {
    const { default: StackWrapper } = await import(
      "@/components/StackWrapper" // ⬅️ adjust path if needed
    );

    render(<StackWrapper />);

    const wrapper = screen.getByTestId("stack-theme");
    expect(wrapper).toBeInTheDocument();

    // The heading should be inside the StackTheme wrapper
    const heading = screen.getByRole("heading", {
      level: 2,
      name: /login \/ signup/i,
    });
    expect(wrapper).toContainElement(heading);
  });
});
