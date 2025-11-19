// --- path: tests/components/Modal.test.tsx ---
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Modal from "@/components/ui/Modal";

/**
 * Unit tests for Modal
 *
 * Covers:
 * - Returns null when `open` is false.
 * - Renders accessible dialog when `open` is true (role, aria-modal, title, children).
 * - Backdrop click closes, but clicking inside dialog does not.
 * - Escape key closes the modal.
 * - Basic focus management:
 *   - Initial focus moves to the "Close" button.
 *   - Tab / Shift+Tab cycles between first and last focusable elements.
 */
describe("Modal", () => {
  it("returns null when open is false", () => {
    const { container } = render(
      <Modal open={false} title="Hidden" onClose={() => {}}>
        <p>Should not appear</p>
      </Modal>
    );

    expect(container.firstChild).toBeNull();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders dialog, title, and children when open is true", () => {
    render(
      <Modal open title="My Modal" onClose={() => {}}>
        <p>Modal content</p>
      </Modal>
    );

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute("aria-modal", "true");

    // Title is wired via aria-labelledby="dialog-title"
    expect(screen.getByText("My Modal")).toBeInTheDocument();
    expect(screen.getByText("Modal content")).toBeInTheDocument();
  });

  it("moves initial focus to the Close button when opened", () => {
    vi.useFakeTimers();

    render(
      <Modal open title="Focus Test" onClose={() => {}}>
        <p>Content</p>
      </Modal>
    );

    // Run the setTimeout in the effect that focuses firstFocusRef
    vi.runAllTimers();

    const closeButton = screen.getByLabelText("Close dialog");
    expect(closeButton).toHaveFocus();

    vi.useRealTimers();
  });

  it("closes when the backdrop is clicked but not when the dialog content is clicked", () => {
    const onClose = vi.fn();

    const { container } = render(
      <Modal open title="Backdrop Test" onClose={onClose}>
        <p>Inner content</p>
      </Modal>
    );

    const backdrop = container.firstChild as HTMLElement;
    const dialog = screen.getByRole("dialog");

    // Clicking on the backdrop (outer div) should close
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);

    // Clicking inside the dialog should NOT trigger additional closes
    fireEvent.click(dialog);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes when Escape key is pressed", () => {
    const onClose = vi.fn();

    render(
      <Modal open title="Esc Test" onClose={onClose}>
        <p>Esc content</p>
      </Modal>
    );

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("traps focus between the first and last focusable elements with Tab/Shift+Tab", () => {
    render(
      <Modal open title="Trap Test" onClose={() => {}}>
        <button>Another focusable</button>
      </Modal>
    );

    const closeButton = screen.getByLabelText("Close dialog");
    const doneButton = screen.getByText("Done");

    // Start on first (Close) and Shift+Tab => wraps to last (Done)
    closeButton.focus();
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(doneButton);

    // Start on last (Done) and Tab => wraps back to first (Close)
    doneButton.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(closeButton);
  });

  it("invokes onClose when Close and Done buttons are clicked", () => {
    const onClose = vi.fn();

    render(
      <Modal open title="Buttons Test" onClose={onClose}>
        <p>Body</p>
      </Modal>
    );

    const closeButton = screen.getByLabelText("Close dialog");
    const doneButton = screen.getByText("Done");

    fireEvent.click(closeButton);
    fireEvent.click(doneButton);

    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
