// --- path: tests/components/SpinResult.test.tsx ---
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, it, expect, vi } from "vitest";
import SpinResult from "@/components/SpinResult";

// Mock lucide-react icons so we don't depend on the real library in tests
vi.mock("lucide-react", () => {
  const Icon = (props: any) => React.createElement("svg", props);
  return {
    __esModule: true,
    Lock: Icon,
    RefreshCcw: Icon,
    ThumbsUp: Icon,
  };
});

describe("SpinResult", () => {
  it("renders a placeholder message when no spin has been made", () => {
    const onToggleLock = vi.fn();
    const onVoteKeep = vi.fn();
    const onVoteReroll = vi.fn();

    render(
      <SpinResult
        selection={null}
        reels={[]}
        locks={[]}
        votes={[]}
        countdown={null}
        onToggleLock={onToggleLock}
        onVoteKeep={onVoteKeep}
        onVoteReroll={onVoteReroll}
      />
    );

    expect(screen.getByText(/No spin yet\./i)).toBeInTheDocument();
  });

  /**
   * With a selection and multiple reels, it renders one card per reel,
   * uses the first selection as a fallback when selection[i] is missing,
   * renders pills/tags/allergens, and wires up the lock / vote buttons
   * + countdown + YouTube link correctly.
   */
  it("renders reel cards with details, pills, votes, countdown, and a YouTube link", () => {
    const onToggleLock = vi.fn();
    const onVoteKeep = vi.fn();
    const onVoteReroll = vi.fn();

    const selection = [
      {
        id: "main-1",
        name: "Spicy Veggie Curry",
        category: "main",
        tags: ["cheap_fast", "comfort_food"],
        allergens: "dairy,gluten",
        ytQuery: "spicy veggie curry recipe",
        mid: true,
        slow: true,
        isHealthy: true,
      },
    ];

    const reels = ["Main Dish", "Side Dish"];
    const locks = [false, true];

    const votes = [
      {
        keep: 2,
        reroll: 1,
        majority: 3,
        iVotedKeep: true,
        iVotedReroll: false,
      },
      // no entry for index 1 -> default vote info path
    ];

    render(
      <SpinResult
        selection={selection as any}
        reels={reels}
        locks={locks}
        votes={votes as any}
        countdown={10}
        onToggleLock={onToggleLock}
        onVoteKeep={onVoteKeep}
        onVoteReroll={onVoteReroll}
      />
    );

    // One card per reel
    expect(screen.getByText("Main Dish")).toBeInTheDocument();
    expect(screen.getByText("Side Dish")).toBeInTheDocument();

    // Name from the selection; both reels share the fallback dish
    expect(screen.getAllByText("Spicy Veggie Curry").length).toBe(2);

    // Category + mid/slow/healthy -> pills (one set per card)
    expect(screen.getAllByText("main")).toHaveLength(2);
    expect(screen.getAllByText("mid")).toHaveLength(2);
    expect(screen.getAllByText("slow")).toHaveLength(2);
    expect(screen.getAllByText("healthy")).toHaveLength(2);

    // Tags normalized (underscores -> spaces)
    expect(screen.getAllByText("cheap fast").length).toBe(2);
    expect(screen.getAllByText("comfort food").length).toBe(2);

    // Allergens
    expect(screen.getAllByText("dairy").length).toBe(2);
    expect(screen.getAllByText("gluten").length).toBe(2);

    // Lock buttons: one unlocked, one locked
    const lockButton = screen.getByTitle("Lock this slot");
    const unlockButton = screen.getByTitle("Unlock");

    expect(lockButton).toHaveTextContent("Lock");
    expect(unlockButton).toHaveTextContent("Locked");

    // Clicking the unlock button should call onToggleLock with index 1
    fireEvent.click(unlockButton);
    expect(onToggleLock).toHaveBeenCalledWith(1);

    // Keep / Re-roll buttons use the tallies from VoteInfo
    const keepButtons = screen.getAllByTitle("Vote to keep this reel");
    const rerollButtons = screen.getAllByTitle("Vote to re-roll only this reel");

    // First card: Keep (2/3), Re-roll (1/3)
    expect(keepButtons[0]).toHaveTextContent("Keep (2/3)");
    expect(rerollButtons[0]).toHaveTextContent("Re-roll (1/3)");

    // Second card: default vote info -> Keep (0/1), Re-roll (0/1)
    expect(keepButtons[1]).toHaveTextContent("Keep (0/1)");
    expect(rerollButtons[1]).toHaveTextContent("Re-roll (0/1)");

    fireEvent.click(keepButtons[0]);
    fireEvent.click(rerollButtons[1]);
    expect(onVoteKeep).toHaveBeenCalledWith(0);
    expect(onVoteReroll).toHaveBeenCalledWith(1);

    // Countdown chips: one per reel
    const countdownChips = screen.getAllByText(/Spin in 10/i);
    expect(countdownChips).toHaveLength(2); // one for each card

    // YouTube link uses ytQuery as the search term
    const youtubeLinks = screen.getAllByRole("link", {
      name: /Watch on YouTube/i,
    });
    expect(youtubeLinks[0].getAttribute("href")).toContain(
      encodeURIComponent("spicy veggie curry recipe")
    );
  });

  it("disables keep and re-roll voting when disabled is true", () => {
    const onToggleLock = vi.fn();
    const onVoteKeep = vi.fn();
    const onVoteReroll = vi.fn();

    const selection = [
      {
        id: "main-1",
        name: "Margherita Pizza",
      },
    ];

    render(
      <SpinResult
        selection={selection as any}
        reels={["Only Reel"]}
        locks={[false]}
        votes={[]}
        countdown={null}
        onToggleLock={onToggleLock}
        onVoteKeep={onVoteKeep}
        onVoteReroll={onVoteReroll}
        disabled
      />
    );

    const keepButton = screen.getByTitle("Vote to keep this reel");
    const rerollButton = screen.getByTitle("Vote to re-roll only this reel");

    expect(keepButton).toBeDisabled();
    expect(rerollButton).toBeDisabled();

    fireEvent.click(keepButton);
    fireEvent.click(rerollButton);
    expect(onVoteKeep).not.toHaveBeenCalled();
    expect(onVoteReroll).not.toHaveBeenCalled();
  });
});
