// --- path: tests/components/theme-provider.test.tsx ---
import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ThemeProvider from "@/components/theme-provider";

// Mock next-themes so we can inspect props and rendering
vi.mock("next-themes", () => {
  return {
    ThemeProvider: ({ children, ...props }: any) => (
      <div data-testid="next-themes-provider" data-props={JSON.stringify(props)}>
        {children}
      </div>
    ),
  };
});

/**
 * Unit tests for ThemeProvider
 *
 * Ensures that:
 * - It renders without crashing.
 * - It wraps children correctly.
 * - It forwards the correct props to NextThemesProvider.
 */
describe("ThemeProvider", () => {
  it("renders children inside the NextThemesProvider wrapper", () => {
    render(
      <ThemeProvider>
        <div data-testid="child-example">Hello Child</div>
      </ThemeProvider>
    );

    expect(screen.getByTestId("next-themes-provider")).toBeInTheDocument();
    expect(screen.getByTestId("child-example")).toBeInTheDocument();
  });

  it("applies expected props to NextThemesProvider", () => {
    render(
      <ThemeProvider>
        <span>Content</span>
      </ThemeProvider>
    );

    const wrapper = screen.getByTestId("next-themes-provider");
    const props = JSON.parse(wrapper.getAttribute("data-props") || "{}");

    expect(props.attribute).toBe("class");
    expect(props.defaultTheme).toBe("system");
    expect(props.enableSystem).toBe(true);
    expect(props.disableTransitionOnChange).toBe(true);
  });
});
