// --- path: tests/components/InviteBar.test.tsx ---
/**
 * Tests for InviteBar component
 *
 * Covers:
 * - Rendering of invite URL from window.location
 * - Clicking "Copy" button:
 *   - Calls `navigator.clipboard.writeText` with the invite URL
 *   - Updates UI state to show "Copied"
 * - Clipboard write failure fallback:
 *   - Calls `prompt("Copy this link:", inviteUrl)` when clipboard write fails
 *
 * Test framework:
 * - Vitest (describe/it/expect/vi)
 * - React Testing Library (render, screen, fireEvent, waitFor, cleanup)
 *
 * Notes:
 * - `window.navigator.clipboard.writeText` is patched per-test to a mock function
 * - `window.location.href` is mocked to a fixed URL for deterministic invite generation
 * - No fake timers are used; we only test for state change to "Copied", not the reset
 */

import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import InviteBar from "../../components/InviteBar";

// Preserve original navigator so we can restore it after each test
const originalNavigator = window.navigator;
const writeTextMock = vi.fn();
const promptMock = vi.fn();

beforeEach(() => {
  // Reset mocks
  writeTextMock.mockReset();
  promptMock.mockReset();

  // Patch window.navigator to include our clipboard mock
  Object.defineProperty(window, "navigator", {
    value: {
      ...originalNavigator,
      clipboard: {
        writeText: writeTextMock,
      },
    },
    configurable: true,
  });

  // Also expose prompt on the global object for the fallback path
  (globalThis as any).prompt = promptMock;

  // Stable URL for invite generation
  Object.defineProperty(window, "location", {
    value: { href: "https://example.com/?code=ABC123" },
    writable: true,
  });

  // By default, clipboard writes succeed
  writeTextMock.mockResolvedValue(undefined);
});

afterEach(() => {
  // Restore original navigator
  Object.defineProperty(window, "navigator", {
    value: originalNavigator,
    configurable: true,
  });

  // Clean up DOM between tests
  cleanup();
});

describe("InviteBar", () => {
  it("renders the invite URL in read-only input", () => {
    // Purpose:
    // - Ensure invite URL and UI text render correctly

    render(<InviteBar />);
    const input = screen.getByRole("textbox") as HTMLInputElement;

    expect(input).toBeInTheDocument();
    expect(input.readOnly).toBe(true);
    // Invite URL should be the /party variant of the mocked href
    expect(input.value).toBe("https://example.com/party?code=ABC123");
  });

  it("copies link to clipboard and shows 'Copied' after click", async () => {
    // Purpose:
    // - Verify that clicking the button:
    //   - Calls clipboard.writeText with the invite URL
    //   - Updates the button text to "Copied"

    render(<InviteBar />);

    // Initial button text
    const button = screen.getByRole("button", { name: /copy/i });
    expect(button).toBeInTheDocument();
    expect(screen.getByText("Copy")).toBeInTheDocument();

    // Click to copy
    fireEvent.click(button);

    // Clipboard API should be called with the invite URL
    expect(writeTextMock).toHaveBeenCalledTimes(1);
    expect(writeTextMock).toHaveBeenCalledWith(
      "https://example.com/party?code=ABC123"
    );

    // After the async handler resolves, the text should change to "Copied"
    await screen.findByText("Copied");
  });

  it("calls prompt fallback when clipboard write fails", async () => {
    // Purpose:
    // - Confirm that if clipboard write fails, the component falls back
    //   to calling prompt with the invite URL

    writeTextMock.mockRejectedValueOnce(new Error("Blocked"));

    render(<InviteBar />);
    const button = screen.getByRole("button", { name: /copy/i });

    fireEvent.click(button);

    // Wait for the async error path to run and prompt to be called
    await waitFor(() => {
      expect(promptMock).toHaveBeenCalledTimes(1);
    });

    expect(promptMock).toHaveBeenCalledWith(
      "Copy this link:",
      "https://example.com/party?code=ABC123"
    );
  });
});
