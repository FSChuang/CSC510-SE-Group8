// --- path: tests/components/SiteNav.test.tsx ---

/**
 * Tests for SiteNav component
 *
 * Covers:
 * - Rendering of a <nav> container
 * - Presence of primary navigation links:
 *   - "Home" -> "/"
 *   - "Party Mode" -> "/party"
 * - Integration with ThemeToggle:
 *   - Renders a ThemeToggle control (mocked as a simple button)
 *
 * We mock:
 * - next/link: so links render as normal <a> elements with href
 * - ThemeToggle: simplified to a button with a test id
 */

import React from "react";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, it, expect, afterEach, vi } from "vitest";

// Mock next/link so it behaves like a basic <a> tag
vi.mock("next/link", () => {
  return {
    __esModule: true,
    default: ({ href, children, ...rest }: any) => (
      <a href={typeof href === "string" ? href : ""} {...rest}>
        {children}
      </a>
    ),
  };
});

// Mock ThemeToggle to avoid pulling in its internal behavior
vi.mock("@/components/ThemeToggle", () => {
  return {
    __esModule: true,
    default: () => (
      <button data-testid="theme-toggle" type="button">
        Toggle theme
      </button>
    ),
  };
});

import SiteNav from "@/components/SiteNav";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("SiteNav", () => {
  it("renders a nav container with Home and Party Mode links", () => {
    const { container } = render(<SiteNav />);

    // nav exists
    const nav = container.querySelector("nav");
    expect(nav).toBeInTheDocument();

    // Home link
    const homeLink = screen.getByRole("link", { name: "Home" });
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveAttribute("href", "/");

    // Party Mode link
    const partyLink = screen.getByRole("link", { name: "Party Mode" });
    expect(partyLink).toBeInTheDocument();
    expect(partyLink).toHaveAttribute("href", "/party");
  });

  it("renders the ThemeToggle control", () => {
    render(<SiteNav />);

    const toggle = screen.getByTestId("theme-toggle");
    expect(toggle).toBeInTheDocument();
    expect(toggle).toHaveTextContent(/toggle theme/i);
  });
});
