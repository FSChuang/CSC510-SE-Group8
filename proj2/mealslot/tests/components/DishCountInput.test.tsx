// --- path: tests/components/DishCountInput.test.tsx ---
/**
 * Tests for DishCountInput component
 *
 * Covers:
 * - Initial rendering of label, input value, placeholder, and aria-label
 * - Numeric input handling:
 *   - Accepts digits and updates internal state
 *   - Calls `onChange` with parsed non-negative integers
 * - Input clearing behavior:
 *   - Allows empty string while typing without calling `onChange`
 * - Blur behavior:
 *   - When input is empty on blur, normalizes back to `value` (or 0)
 *   - Calls `onChange` with the normalized value on blur
 * - Validation behavior:
 *   - Rejects non-digit characters (ignores input and does not call `onChange`)
 *
 * Test framework:
 * - Vitest (describe/it/expect/vi)
 * - React Testing Library (render, screen, fireEvent, cleanup)
 *
 * Notes:
 * - Tests focus on input state transitions and callback behavior, not styling
 * - `onChange` is mocked to verify when and with what value it is called
 */

import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, it, expect, vi, afterEach } from "vitest";
import DishCountInput from "../../components/DishCountInput";

afterEach(() => {
  cleanup();
});

describe("DishCountInput", () => {
  it("renders label and initial input value", () => {
    // Purpose:
    // - Ensure the label, initial value, placeholder, and aria-label are rendered correctly.

    const onChange = vi.fn();
    render(<DishCountInput value={3} onChange={onChange} />);

    expect(screen.getByText("Number of Dishes:")).toBeInTheDocument();

    const input = screen.getByLabelText("Number of dishes") as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.value).toBe("3"); // initial state derived from `value`
    expect(input.placeholder).toBe("0");
  });

  it("accepts digit input, updates value, and calls onChange with parsed integer", () => {
    // Purpose:
    // - Verify that valid numeric input updates internal state and triggers onChange
    //   with a non-negative parsed integer.

    const onChange = vi.fn();
    render(<DishCountInput value={1} onChange={onChange} />);

    const input = screen.getByLabelText("Number of dishes") as HTMLInputElement;

    // Type a new numeric value
    fireEvent.change(input, { target: { value: "5" } });

    // Input state should reflect typed value
    expect(input.value).toBe("5");

    // onChange should be called with parsed integer
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(5);
  });

  it("allows clearing the input to an empty string without calling onChange", () => {
    // Purpose:
    // - Confirm that clearing the input (empty string) is allowed while typing
    //   and does not immediately trigger onChange.

    const onChange = vi.fn();
    render(<DishCountInput value={2} onChange={onChange} />);

    const input = screen.getByLabelText("Number of dishes") as HTMLInputElement;

    // Clear the input
    fireEvent.change(input, { target: { value: "" } });

    expect(input.value).toBe("");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("restores previous value and calls onChange when blurred with empty input", () => {
    // Purpose:
    // - When the input is empty and loses focus, it should normalize back to the
    //   `value` prop (or 0) and call onChange with that normalized value.

    const onChange = vi.fn();
    render(<DishCountInput value={4} onChange={onChange} />);

    const input = screen.getByLabelText("Number of dishes") as HTMLInputElement;

    // Clear the input first (no onChange expected yet)
    fireEvent.change(input, { target: { value: "" } });
    expect(input.value).toBe("");
    expect(onChange).not.toHaveBeenCalled();

    // Trigger blur while input is empty
    fireEvent.blur(input);

    // Input should be normalized back to the original `value`
    expect(input.value).toBe("4");

    // onChange should be called once with the normalized value
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it("does nothing when blurred with a non-empty input", () => {
    // Purpose:
    // - Ensure that blur does not change the value or trigger extra onChange calls
    //   when the input is already non-empty.

    const onChange = vi.fn();
    render(<DishCountInput value={3} onChange={onChange} />);

    const input = screen.getByLabelText("Number of dishes") as HTMLInputElement;

    // Change to a non-empty numeric value
    fireEvent.change(input, { target: { value: "7" } });
    expect(input.value).toBe("7");
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(7);

    // Blur should not trigger additional changes
    fireEvent.blur(input);
    expect(input.value).toBe("7");
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("ignores non-digit input and does not call onChange", () => {
    // Purpose:
    // - Validate the regex guard: non-digit characters should be rejected,
    //   meaning internal state and onChange remain unchanged.

    const onChange = vi.fn();
    render(<DishCountInput value={9} onChange={onChange} />);

    const input = screen.getByLabelText("Number of dishes") as HTMLInputElement;
    expect(input.value).toBe("9");

    // Attempt to type non-numeric characters
    fireEvent.change(input, { target: { value: "a3" } });

    // Since the new value fails /^\d*$/, the component should ignore it
    expect(input.value).toBe("9");
    expect(onChange).not.toHaveBeenCalled();
  });
});
