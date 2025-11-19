// tests/components/PartyClient.test.tsx
import React from "react";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";
import {
  describe,
  it,
  expect,
  vi,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
} from "vitest";
import PartyClient from "@/components/PartyClient";

// --- Mock PlacesMapCard to avoid pulling in real map logic ---
vi.mock("@/components/PlacesMapCard", () => ({
  __esModule: true,
  default: ({ height }: { height: number }) => (
    <div data-testid="places-map-card">Places map height {height}</div>
  ),
}));

// --- Mock realtime layer ---
const mockEmit = vi.fn();
const mockOn = vi.fn();
const mockClose = vi.fn();

vi.mock("@/lib/realtime", () => ({
  __esModule: true,
  getRealtimeForRoom: vi.fn(async () => ({
    kind: "mock-rt",
    emit: mockEmit,
    on: mockOn,
    close: mockClose,
  })),
}));

// --- Global stubs: fetch, clipboard, alert ---
type MockResponse = {
  ok: boolean;
  status: number;
  statusText: string;
  json: () => Promise<any>;
  text: () => Promise<string>;
};

const fetchMock = vi.fn(
  async (input: any, init?: any): Promise<MockResponse> => {
    const url = typeof input === "string" ? input : input?.url ?? "";

    // Create party
    if (url.includes("/api/party/create")) {
      const body = init?.body ? JSON.parse(init.body as string) : {};
      return {
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => ({
          memberId: "m1",
          code: "ABC123",
          nickname: body.nickname || "Host",
        }),
        text: async () => "",
      };
    }

    // Join party
    if (url.includes("/api/party/join")) {
      const body = init?.body ? JSON.parse(init.body as string) : {};
      return {
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => ({
          memberId: "m2",
          code: body.code || "ABC123",
          nickname: body.nickname || "Guest",
        }),
        text: async () => "",
      };
    }

    // Party state
    if (url.includes("/api/party/state")) {
      return {
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => ({
          party: { id: "party1", code: "ABC123", isActive: true, constraints: {} },
          members: [{ id: "m1", nickname: "Host", prefs: {} }],
        }),
        text: async () => "",
      };
    }

    // Prefs update
    if (url.includes("/api/party/update")) {
      return {
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => ({
          merged: { diet: "vegan", allergens: [] },
        }),
        text: async () => "",
      };
    }

    // Group spin / reroll
    if (url.includes("/api/party/spin")) {
      return {
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => ({
          selection: [
            {
              id: "d1",
              name: "Dish One",
              category: "main",
              tags: ["tag1"],
              allergens: ["nuts"],
              ytQuery: "Dish One recipe",
            },
            {
              id: "d2",
              name: "Dish Two",
              category: "side",
              tags: ["tag2"],
              allergens: [],
              ytQuery: "Dish Two recipe",
            },
            {
              id: "d3",
              name: "Dish Three",
              category: "dessert",
              tags: ["tag3"],
              allergens: ["dairy"],
              ytQuery: "Dish Three recipe",
            },
          ],
        }),
        text: async () => "",
      };
    }

    // Generic OK fallback
    return {
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => ({}),
      text: async () => "",
    };
  }
);

let originalFetch: any;
let originalClipboard: any;
let originalAlert: any;

beforeAll(() => {
  // Stub fetch
  originalFetch = (globalThis as any).fetch;
  (globalThis as any).fetch = fetchMock as any;

  // Stub clipboard
  originalClipboard = (navigator as any).clipboard;
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    writable: true,
    value: {
      writeText: vi.fn().mockResolvedValue(undefined),
    },
  });

  // Stub alert
  originalAlert = window.alert;
  window.alert = vi.fn();
});

afterAll(() => {
  // Restore fetch
  (globalThis as any).fetch = originalFetch;

  // Restore clipboard
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    writable: true,
    value: originalClipboard,
  });

  // Restore alert
  window.alert = originalAlert;
});

beforeEach(() => {
  vi.clearAllMocks();
  fetchMock.mockClear();
});

afterEach(() => {
  cleanup();
});

describe("PartyClient", () => {
  it("renders basic layout with code + name fields and members header", () => {
    render(<PartyClient />);

    // Left column header (the 'Party' card, not 'Party chat')
    expect(screen.getByText("Party")).toBeInTheDocument();

    const codeInput = screen.getByPlaceholderText("ABC123") as HTMLInputElement;
    const nameInput = screen.getByPlaceholderText("Your name") as HTMLInputElement;

    expect(codeInput).toBeInTheDocument();
    expect(nameInput).toBeInTheDocument();
    expect(nameInput.value).toBe("Guest");

    // Members header on the right
    expect(screen.getByText(/members/i)).toBeInTheDocument();

    // Map card stub
    expect(screen.getByTestId("places-map-card")).toBeInTheDocument();
  });

  it("enables/disables Create and Join buttons based on code length", () => {
    render(<PartyClient />);

    const createBtn = screen.getByRole("button", { name: "Create" });
    const joinBtn = screen.getByRole("button", { name: "Join" });
    const codeInput = screen.getByPlaceholderText("ABC123") as HTMLInputElement;

    // Initially: no code -> create enabled, join disabled
    expect(createBtn).not.toBeDisabled();
    expect(joinBtn).toBeDisabled();

    // Enter a 6-char code -> canCreate=false, canJoin=true
    fireEvent.change(codeInput, { target: { value: "abc123" } });
    expect(codeInput.value).toBe("ABC123");

    // Now: Create should be disabled, Join enabled
    expect(createBtn).toBeDisabled();
    expect(joinBtn).not.toBeDisabled();
  });

  it("copies the current party code to the clipboard when 'Copy' is clicked", async () => {
    render(<PartyClient />);

    const codeInput = screen.getByPlaceholderText("ABC123") as HTMLInputElement;
    const copyBtn = screen.getByRole("button", { name: /copy/i });

    // Enter a code
    fireEvent.change(codeInput, { target: { value: "xyz789" } });
    expect(codeInput.value).toBe("XYZ789");

    fireEvent.click(copyBtn);

    await waitFor(() => {
      expect((navigator as any).clipboard.writeText).toHaveBeenCalledWith("XYZ789");
    });
  });

  it("calls /api/party/create with nickname and then wires realtime for returned code", async () => {
    render(<PartyClient />);

    const nameInput = screen.getByPlaceholderText("Your name") as HTMLInputElement;
    const createBtn = screen.getByRole("button", { name: "Create" });

    fireEvent.change(nameInput, { target: { value: "HostUser" } });
    fireEvent.click(createBtn);

    // Ensure create endpoint is called
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/party/create",
        expect.objectContaining({
          method: "POST",
        })
      );
    });

    // Should also fetch state for the returned code
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/party/state?code=ABC123"),
      expect.anything()
    );

    // Once realtime is wired, transport text should show mock-rt
    await waitFor(() => {
      expect(screen.getByText(/transport:/i)).toHaveTextContent("mock-rt");
    });

    // UI shows that we're in the party
    expect(screen.getByText(/you’re in party/i)).toBeInTheDocument();
    expect(screen.getByText("ABC123")).toBeInTheDocument();
  });

  it("calls /api/party/join with 6-char code and nickname", async () => {
    render(<PartyClient />);

    const codeInput = screen.getByPlaceholderText("ABC123") as HTMLInputElement;
    const nameInput = screen.getByPlaceholderText("Your name") as HTMLInputElement;
    const joinBtn = screen.getByRole("button", { name: "Join" });

    fireEvent.change(codeInput, { target: { value: "abc123" } });
    fireEvent.change(nameInput, { target: { value: "GuestUser" } });

    fireEvent.click(joinBtn);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/party/join",
        expect.objectContaining({
          method: "POST",
        })
      );
    });

    // Should also fetch state for the joined code
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/party/state?code=ABC123"),
      expect.anything()
    );
  });

  it("allows the host to perform a group spin and shows resulting dishes", async () => {
    render(<PartyClient />);

    // Become host via Create
    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    // Wait until transport text shows we’re wired up
    await waitFor(() => {
      expect(screen.getByText(/transport:/i)).toHaveTextContent("mock-rt");
    });

    const groupSpinBtn = screen.getByRole("button", { name: /group spin/i });
    expect(groupSpinBtn).not.toBeDisabled();

    // Trigger spin
    fireEvent.click(groupSpinBtn);

    // Wait for spin API + UI to update
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/api/party/spin"),
        expect.objectContaining({ method: "POST" })
      );
      expect(screen.getByText("Dish One")).toBeInTheDocument();
      expect(screen.getByText("Dish Two")).toBeInTheDocument();
      expect(screen.getByText("Dish Three")).toBeInTheDocument();
    });

    // Voting buttons visible now
    expect(screen.getAllByRole("button", { name: /keep/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: /re-roll/i }).length).toBeGreaterThan(0);

    // At least one YouTube link present
    const ytLink = screen.getAllByRole("link", { name: /watch on youtube/i })[0] as HTMLAnchorElement;
    expect(ytLink.href).toContain("youtube.com");
  });

  it("sends chat messages and renders them in the Party chat area", async () => {
    render(<PartyClient />);

    // Become a member/host so activeCode is non-empty
    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    // Wait until we're clearly in a party
    await waitFor(() => {
      expect(screen.getByText(/you’re in party/i)).toBeInTheDocument();
    });

    const chatInput = screen.getByPlaceholderText("Message…") as HTMLInputElement;
    const sendBtn = screen.getByRole("button", { name: "Send" });

    // Type message and send via Enter
    chatInput.value = "Hello via Enter";
    fireEvent.keyDown(chatInput, { key: "Enter", code: "Enter" });

    await waitFor(() => {
      expect(screen.getByText("Hello via Enter")).toBeInTheDocument();
    });

    // Type another message and send via button
    chatInput.value = "Hello via Button";
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(screen.getByText("Hello via Button")).toBeInTheDocument();
    });
  });

  it("toggles diet and allergens preferences and calls /api/party/update", async () => {
    render(<PartyClient />);

    // Join/create so we have state.party.id & memberId
    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some(([url]) =>
          String(url).includes("/api/party/state?code=ABC123")
        )
      ).toBe(true);
    });

    // --- Diet chip: handle multiple 'none' buttons safely ---
    let dietChipButton: HTMLButtonElement | null = null;

    const noneButtons = screen.queryAllByRole("button", { name: /^none$/i });
    if (noneButtons.length > 0) {
      dietChipButton = noneButtons[0] as HTMLButtonElement;
    } else {
      dietChipButton =
        (screen
          .getAllByRole("button")
          .find((btn) =>
            /vegan|vegetarian|omnivore|pescatarian/i.test(btn.textContent || "")
          ) as HTMLButtonElement) || null;
    }

    if (dietChipButton) {
      fireEvent.click(dietChipButton);
    }

    // --- Allergen chip: just pick the first matching allergen-looking button ---
    const allergenChip = screen
      .getAllByRole("button")
      .find((btn) =>
        /gluten|peanut|milk|egg|soy|shellfish|tree nut|fish/i.test(
          btn.textContent || ""
        )
      );

    if (allergenChip) {
      fireEvent.click(allergenChip);
    }

    // We should have called /api/party/update at least once due to pushPrefs
    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some(([url]) =>
          String(url).includes("/api/party/update")
        )
      ).toBe(true);
    });
  });
});
