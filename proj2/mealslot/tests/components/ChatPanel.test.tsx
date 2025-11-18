// --- path: tests/components/ChatPanel.test.tsx ---
/**
 * Tests for ChatPanel component
 *
 * Covers:
 * - Rendering of header and empty-state message when there are no messages
 * - Rendering of chat messages with:
 *   - Visual distinction for messages sent by "me" vs others
 *   - Timestamp formatting via `toLocaleTimeString`
 * - Send button behavior:
 *   - Disabled when `meId` is null (not joined)
 *   - Enabled when `meId` is set, with correct tooltip
 * - Message sending workflow:
 *   - Trimming of input before sending
 *   - Preventing sends for empty/whitespace-only text
 *   - Clearing the input after successful send
 * - Auto-scroll behavior when `messages` change
 *
 * Test framework:
 * - Vitest (describe/it/expect/vi)
 * - React Testing Library (render, screen, fireEvent, waitFor)
 *
 * Notes:
 * - `Date.prototype.toLocaleTimeString` is mocked for stable timestamp assertions
 * - `Object.defineProperty` is used to control `scrollHeight` for scroll tests
 * - `rerender` from RTL is used to simulate updates to the `messages` prop
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
import { describe, it, expect, vi, afterEach } from "vitest";
import ChatPanel, { ChatMsg } from "../../components/ChatPanel";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("ChatPanel", () => {
  it("shows empty state when there are no messages", () => {
    // Renders header and empty-state text when messages list is empty
    render(<ChatPanel messages={[]} meId="me" onSend={vi.fn()} />);

    expect(screen.getByText("Party chat")).toBeInTheDocument();
    expect(screen.getByText("No messages yet.")).toBeInTheDocument();
  });

  it("renders messages and highlights my messages differently", () => {
    // Renders messages and applies different badge styles for my messages vs others
    const spy = vi
      .spyOn(Date.prototype, "toLocaleTimeString")
      .mockReturnValue("mock-time");

    const messages: ChatMsg[] = [
      {
        id: "1",
        ts: Date.now(),
        fromId: "me",
        name: "Me",
        text: "Hello from me",
      },
      {
        id: "2",
        ts: Date.now(),
        fromId: "other",
        name: "Other",
        text: "Hello from other",
      },
    ];

    render(<ChatPanel messages={messages} meId="me" onSend={vi.fn()} />);

    // Check my message
    const myName = screen.getByText("Me");
    expect(myName).toBeInTheDocument();
    expect(myName).toHaveClass("bg-sky-500", "text-black");

    // Check other message
    const otherName = screen.getByText("Other");
    expect(otherName).toBeInTheDocument();
    expect(otherName).toHaveClass("bg-neutral-200");

    // Time label rendered via toLocaleTimeString
    expect(screen.getAllByText("mock-time").length).toBe(2);

    spy.mockRestore();
  });

  it("disables send button and shows tooltip when user is not joined", () => {
    // Button is disabled and tooltip updated when meId is null
    render(<ChatPanel messages={[]} meId={null} onSend={vi.fn()} />);

    const sendButton = screen.getByRole("button", { name: /send/i });
    expect(sendButton).toBeDisabled();
    expect(sendButton).toHaveAttribute("title", "Join the party to chat");
  });

  it("enables send button and sends trimmed text, then clears input", () => {
    // Submitting non-empty text calls onSend with trimmed value and clears input
    const onSend = vi.fn();
    render(<ChatPanel messages={[]} meId="user-1" onSend={onSend} />);

    const input = screen.getByPlaceholderText(/Message/);
    const sendButton = screen.getByRole("button", { name: /send/i });

    // Button should be enabled for joined user
    expect(sendButton).toBeEnabled();
    expect(sendButton).toHaveAttribute("title", "Send message");

    fireEvent.change(input, { target: { value: "   hello world   " } });

    const form = input.closest("form") as HTMLFormElement;
    fireEvent.submit(form);

    expect(onSend).toHaveBeenCalledTimes(1);
    expect(onSend).toHaveBeenCalledWith("hello world");
    expect(input).toHaveValue("");
  });

  it("does not send when the text is empty or whitespace only", () => {
    // Submitting whitespace-only text does not call onSend
    const onSend = vi.fn();
    render(<ChatPanel messages={[]} meId="user-1" onSend={onSend} />);

    const input = screen.getByPlaceholderText(/Message/);
    const form = input.closest("form") as HTMLFormElement;

    fireEvent.change(input, { target: { value: "    " } });
    fireEvent.submit(form);

    expect(onSend).not.toHaveBeenCalled();
    // Value stays as whitespace until user changes it
    expect(input).toHaveValue("    ");
  });

  it("auto-scrolls to the bottom when messages change", async () => {
    // When messages update, the scroll container scrolls to its scrollHeight
    const onSend = vi.fn();

    const { rerender } = render(
      <ChatPanel messages={[]} meId="me" onSend={onSend} />
    );

    // The scrollable div is the parent of the "No messages yet." text initially
    const emptyState = screen.getByText("No messages yet.");
    const scrollContainer = emptyState.parentElement as HTMLDivElement;

    // Set a fake scrollHeight and ensure scrollTop starts at 0
    Object.defineProperty(scrollContainer, "scrollHeight", {
      value: 999,
      configurable: true,
    });
    scrollContainer.scrollTop = 0;

    const messages: ChatMsg[] = [
      {
        id: "1",
        ts: Date.now(),
        fromId: "me",
        name: "Me",
        text: "New message",
      },
    ];

    rerender(<ChatPanel messages={messages} meId="me" onSend={onSend} />);

    await waitFor(() => {
      expect(scrollContainer.scrollTop).toBe(999);
    });
  });
});
