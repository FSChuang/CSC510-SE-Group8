// tests/components/GuestModal.test.tsx
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// ---- Mocks ----

// Mock next/navigation so we can assert on router.push
const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

// If your Modal implementation is complex (portals, etc.), you can mock it.
// Uncomment and fix the path if needed.
// vi.mock("../../components/ui/Modal", () => ({
//   default: ({ open, title, onClose, children }: any) =>
//     open ? (
//       <div data-testid="modal">
//         <h2>{title}</h2>
//         <button onClick={onClose}>Close</button>
//         {children}
//       </div>
//     ) : null,
// }));

// 🔁 Adjust this import path to where GuestModal.tsx actually lives
import GuestModal from "../../components/GuestModal";

beforeEach(() => {
  pushMock.mockReset();
  window.sessionStorage.clear();
  window.localStorage.clear();
});

describe("GuestModal", () => {
  it("shows the modal on first visit and sets sessionStorage flag", async () => {
    render(<GuestModal />);

    // Wait for the modal content to appear (effect runs after mount)
    const text = await screen.findByText(
      /Continue as Guest or Sign Up to save your progress\./i
    );
    expect(text).toBeInTheDocument();

    // Modal should mark that it has been shown
    expect(window.sessionStorage.getItem("guestModalShown")).toBe("true");
  });

  it("calls onGuest and sets guestUser when clicking 'Continue as Guest'", async () => {
    const onGuest = vi.fn();

    render(<GuestModal onGuest={onGuest} />);

    const guestButton = await screen.findByRole("button", {
      name: /continue as guest/i,
    });

    fireEvent.click(guestButton);

    expect(onGuest).toHaveBeenCalled();
    expect(window.localStorage.getItem("guestUser")).toBe("true");
  });

  it("navigates to /handler/sign-up when clicking 'Sign Up'", async () => {
    // Spy on setTimeout so we can manually trigger the 300ms delayed callback
    const setTimeoutSpy = vi.spyOn(window, "setTimeout");

    render(<GuestModal />);

    const signUpButton = await screen.findByRole("button", {
      name: /sign up/i,
    });

    fireEvent.click(signUpButton);

    // Find the timeout scheduled by handleSignUp (delay = 300ms)
    const signUpTimeoutCall = setTimeoutSpy.mock.calls.find(
      ([, delay]) => delay === 300
    );

    expect(signUpTimeoutCall).toBeTruthy();

    // signUpTimeoutCall is something like [callback, delay]
    const callback = signUpTimeoutCall?.[0] as () => void;
    callback();

    expect(pushMock).toHaveBeenCalledWith("/handler/sign-up");

    setTimeoutSpy.mockRestore();
  });

  it("auto-continues as guest after AUTO_CLOSE_MS", async () => {
    const onGuest = vi.fn();
    const setTimeoutSpy = vi.spyOn(window, "setTimeout");

    render(<GuestModal onGuest={onGuest} />);

    // Ensure the effect has run and the modal is visible
    await screen.findByText(
      /Auto-continuing as guest in 8 seconds\.\.\./i
    );

    // AUTO_CLOSE_MS = 8000; find that timeout
    const autoCloseCall = setTimeoutSpy.mock.calls.find(
      ([, delay]) => delay === 8000
    );

    expect(autoCloseCall).toBeTruthy();

    const autoCloseCallback = autoCloseCall?.[0] as () => void;
    autoCloseCallback();

    // handleGuest should have been called, which triggers onGuest + localStorage
    expect(onGuest).toHaveBeenCalled();
    expect(window.localStorage.getItem("guestUser")).toBe("true");

    setTimeoutSpy.mockRestore();
  });
});
