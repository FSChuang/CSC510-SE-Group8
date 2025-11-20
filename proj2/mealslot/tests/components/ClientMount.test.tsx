// --- path: tests/components/ClientMount.test.tsx ---
/**
 * Tests for ClientMount component
 *
 * Covers:
 * - Rendering of a single ReactNode child
 * - Rendering of multiple children without introducing an extra wrapper element
 *   (children should remain siblings in the DOM)
 * - Support for plain text children (non-element ReactNodes)
 *
 * Test framework:
 * - Vitest (describe/it/expect)
 * - React Testing Library (render, screen, cleanup)
 *
 * Notes:
 * - Component utilizes a React fragment (`<>`) to avoid wrapping output
 * - Tests focus on structural behavior rather than simple existence checks
 */

import React from "react";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, it, expect, afterEach } from "vitest";
import ClientMount from "../../components/ClientMount";

// Cleanup DOM and reset any global state between tests
afterEach(() => {
  cleanup();
});

describe("ClientMount", () => {
  it("renders its single child", () => {
    // Purpose:
    // - Ensure that a single child element is rendered and visible in the DOM

    render(
      <ClientMount>
        <div>Hello client</div>
      </ClientMount>
    );

    expect(screen.getByText("Hello client")).toBeInTheDocument();
  });

  it("renders multiple children as siblings", () => {
    // Purpose:
    // - Validate that multiple children are rendered without introducing
    //   an extra wrapper element (fragment behavior).
    // - Assertions verify that both children are siblings and share the same parent.

    const { container } = render(
      <ClientMount>
        <div data-testid="child-1">Child 1</div>
        <span data-testid="child-2">Child 2</span>
      </ClientMount>
    );

    const child1 = screen.getByTestId("child-1");
    const child2 = screen.getByTestId("child-2");

    expect(child1).toBeInTheDocument();
    expect(child2).toBeInTheDocument();

    // Confirm sibling relationship
    expect(child1.parentElement).toBe(child2.parentElement);

    // Sanity check: children exist under the rendered container
    expect(container.contains(child1)).toBe(true);
    expect(container.contains(child2)).toBe(true);
  });

  it("supports rendering text nodes directly", () => {
    // Purpose:
    // - Confirm that the component renders plain text correctly
    //   when passed as its child.

    render(<ClientMount>Just some text</ClientMount>);

    expect(screen.getByText("Just some text")).toBeInTheDocument();
  });
});
