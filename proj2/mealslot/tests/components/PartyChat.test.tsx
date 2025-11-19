// --- path: tests/components/PartyChat.test.tsx ---
/**
 * Tests for PartyChat component
 *
 * Covers:
 * - Initial rendering:
 *   - Shows header and "No messages yet." when there are no messages
 *   - Calls `onGetRealtime` to obtain a realtime emitter
 * - Receiving messages from realtime:
 *   - Registers a "chat" listener on the provided realtime object
 *   - Ignores payloads with missing or mismatched `code`
 *   - Appends valid messages and renders nickname, timestamp, and text
 * - Sending messages:
 *   - Trims input text and does not send empty/whitespace-only messages
 *   - Does nothing if realtime has not been initialized (`rtRef.current` is null)
 *   - When realtime is set, clicking "Send" or pressing Enter:
 *     - Emits a "chat" event with a payload (code, nick, text, id, ts)
 *     - Optimistically appends the message to the chat display
 *     - Clears the input field
 * - Mount/unmount behavior:
 *   - If the component unmounts before `onGetRealtime` resolves, it avoids
 *     registering listeners after unmount (guarded by `mounted` flag)
 *
 * Test framework:
 * - Vitest (describe/it/expect/vi)
 * - React Testing Library (render, screen, fireEvent, waitFor, cleanup)
 *
 * Notes:
 * - Realtime object (`emit`/`on`) is fully mocked to capture event handlers
 * - `Date.prototype.toLocaleTimeString` is mocked in one test for stable output
 * - A local `crypto.randomUUID` stub is used in the send test to avoid runtime errors
 */

import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
  act,
} from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, it, expect, vi, afterEach } from "vitest";
import PartyChat from "../../components/PartyChat";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("PartyChat", () => {
  it("renders header and empty state, and calls onGetRealtime", async () => {
    // Purpose:
    // - Verify base rendering and that `onGetRealtime` is invoked on mount.

    const onGetRealtime = vi.fn().mockResolvedValue({
      emit: vi.fn(),
      on: vi.fn(),
    });

    render(
      <PartyChat code="ABC" nickname="Me" onGetRealtime={onGetRealtime} />
    );

    expect(screen.getByText("Party chat")).toBeInTheDocument();
    expect(screen.getByText("No messages yet.")).toBeInTheDocument();

    await waitFor(() => {
      expect(onGetRealtime).toHaveBeenCalledTimes(1);
    });
  });

  it("registers chat handler and appends valid messages from realtime", async () => {
    // Purpose:
    // - Ensure the component subscribes to the "chat" event and:
    //   - Ignores payloads without matching `code`
    //   - Renders nickname, timestamp, and text for valid messages.

    const emitMock = vi.fn();
    let chatHandler: ((p: any) => void) | undefined;

    const onMock = vi.fn((event: string, cb: (p: any) => void) => {
      if (event === "chat") chatHandler = cb;
    });

    const onGetRealtime = vi.fn().mockResolvedValue({
      emit: emitMock,
      on: onMock,
    });

    const timeSpy = vi
      .spyOn(Date.prototype, "toLocaleTimeString")
      .mockReturnValue("10:00");

    render(
      <PartyChat code="ABC" nickname="Me" onGetRealtime={onGetRealtime} />
    );

    await waitFor(() => {
      expect(onGetRealtime).toHaveBeenCalledTimes(1);
      expect(onMock).toHaveBeenCalledTimes(1);
      expect(chatHandler).toBeDefined();
    });

    // Ignore null payload
  await act(async () => {
    chatHandler!(null as any);
  });

  // Ignore wrong code
  await act(async () => {
    chatHandler!({
      code: "OTHER",
      id: "x1",
      ts: 123,
      nick: "Other",
      text: "Should not show",
    });
  });

  expect(screen.queryByText("Should not show")).not.toBeInTheDocument();

  // Accept matching code
  await act(async () => {
    chatHandler!({
      code: "ABC",
      id: "m1",
      ts: 123,
      nick: "Alice",
      text: "Hello from Alice",
    });
  });

  // Wait for React to commit the state update and DOM changes
  await waitFor(() => {
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("10:00")).toBeInTheDocument();
    expect(screen.getByText("Hello from Alice")).toBeInTheDocument();
  });

  timeSpy.mockRestore();
});

  it("does not send when text is empty or whitespace only", async () => {
    // Purpose:
    // - Ensure `send` is a no-op for empty/whitespace-only text,
    //   even when realtime is ready.

    const emitMock = vi.fn();
    const onMock = vi.fn();
    const onGetRealtime = vi.fn().mockResolvedValue({
      emit: emitMock,
      on: onMock,
    });

    render(
      <PartyChat code="ABC" nickname="Me" onGetRealtime={onGetRealtime} />
    );

    await waitFor(() => {
      expect(onGetRealtime).toHaveBeenCalledTimes(1);
    });

    const input = screen.getByPlaceholderText("Message…") as HTMLInputElement;
    const button = screen.getByRole("button", { name: /send/i });

    // Case 1: empty text
    fireEvent.click(button);
    expect(emitMock).not.toHaveBeenCalled();

    // Case 2: whitespace-only text via Enter key
    fireEvent.change(input, { target: { value: "    " } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    expect(emitMock).not.toHaveBeenCalled();
    // Text remains as typed (whitespace) because send returns early
    expect(input.value).toBe("    ");
  });

  it("does not send if realtime is not yet ready (rtRef.current is null)", () => {
    // Purpose:
    // - When `onGetRealtime` has not resolved, `rtRef.current` is null.
    //   Sending should be a no-op and not throw.

    // Never-resolving promise simulates slow realtime setup
    const onGetRealtime = vi.fn(
      () => new Promise(() => { /* never resolve, rtRef stays null */ })
    );

    const { getByPlaceholderText, getByRole } = render(
      <PartyChat code="ABC" nickname="Me" onGetRealtime={onGetRealtime} />
    );

    const input = getByPlaceholderText("Message…") as HTMLInputElement;
    const button = getByRole("button", { name: /send/i });

    fireEvent.change(input, { target: { value: "Hello before RT" } });
    fireEvent.click(button);

    // Input should remain unchanged because send returned early
    expect(input.value).toBe("Hello before RT");
  });

  it("sends a trimmed message, emits event, appends locally, and clears input", async () => {
    // Purpose:
    // - With realtime ready, sending should:
    //   - Trim the text
    //   - Emit a 'chat' event with a payload
    //   - Append the message to the UI optimistically
    //   - Clear the input field.
  
    const emitMock = vi.fn();
    const onMock = vi.fn();
  
    const onGetRealtime = vi.fn().mockResolvedValue({
      emit: emitMock,
      on: onMock,
    });
  
    render(
      <PartyChat code="ABC" nickname="Me" onGetRealtime={onGetRealtime} />
    );
  
    await waitFor(() => {
      expect(onGetRealtime).toHaveBeenCalledTimes(1);
    });
  
    const input = screen.getByPlaceholderText("Message…") as HTMLInputElement;
    const button = screen.getByRole("button", { name: /send/i });
  
    fireEvent.change(input, { target: { value: "   hello world   " } });
    fireEvent.click(button);
  
    // Emit should be called once with a 'chat' event and payload
    expect(emitMock).toHaveBeenCalledTimes(1);
    const [eventName, payload] = emitMock.mock.calls[0];
  
    expect(eventName).toBe("chat");
    expect(payload.code).toBe("ABC");
    expect(payload.nick).toBe("Me");
    expect(payload.text).toBe("hello world"); // trimmed
    expect(typeof payload.id).toBe("string"); // don't care about exact id
    expect(typeof payload.ts).toBe("number");
  
    // UI should show the trimmed text
    expect(screen.getByText("hello world")).toBeInTheDocument();
  
    // Input should be cleared
    expect(input.value).toBe("");
  });

  it("does not register listeners if unmounted before realtime resolves", async () => {
    // Purpose:
    // - If the component unmounts before `onGetRealtime` resolves,
    //   the `mounted` guard should prevent calling `rt.on`.

    let resolveRt: ((rt: { emit: () => void; on: () => void }) => void) | null =
      null;
    const onMock = vi.fn();

    const onGetRealtime = vi.fn(
      () =>
        new Promise<{ emit: () => void; on: () => void }>((resolve) => {
          resolveRt = resolve;
        }) as any
    );

    const { unmount } = render(
      <PartyChat code="ABC" nickname="Me" onGetRealtime={onGetRealtime} />
    );

    // Immediately unmount before the promise resolves
    unmount();

    // Now resolve the promise; because mounted is false, effect should bail out
    resolveRt?.({ emit: vi.fn(), on: onMock });

    // Flush microtasks
    await Promise.resolve();

    expect(onMock).not.toHaveBeenCalled();
  });
});
