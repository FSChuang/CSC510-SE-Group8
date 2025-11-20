// --- path: tests/components/RecipePanel.test.tsx ---

/**
 * Tests for RecipePanel component
 *
 * Covers:
 * - Rendering of recipe cards with:
 *   - Title, servings, total time
 *   - Ingredients list
 *   - Steps list with optional timer badges
 *   - Nutrition footer
 *   - Optional warnings block
 * - Rendering of the Videos section:
 *   - Thumbnail vs gray fallback preview
 *   - Limiting to at most 4 videos
 * - Opening a video in a Modal when a video card is clicked:
 *   - Modal title includes the video title
 *   - iframe src points to the correct YouTube embed URL
 *   - Modal can be closed (onClose handler clears internal state)
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
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// --- Mock Modal to avoid portal / focus complexity ---
// We capture props so we can assert on title/open and trigger onClose.
let lastModalProps: any;

vi.mock("@/components/ui/Modal", () => {
  return {
    __esModule: true,
    default: (props: any) => {
      lastModalProps = props;
      if (!props.open) return null;
      return (
        <div data-testid="modal">
          <h2>{props.title}</h2>
          {props.children}
          <button onClick={props.onClose}>Close</button>
        </div>
      );
    },
  };
});

import RecipePanel from "@/components/RecipePanel";

describe("RecipePanel", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    lastModalProps = undefined;
  });

  afterEach(() => {
    cleanup();
  });

  const fullRecipe: any = {
    id: "r1",
    name: "Test Tacos",
    servings: 2,
    total_minutes: 15,
    ingredients: [
      { item: "Tortillas", qty: 4, unit: "pcs" },
      { item: "Beans", qty: 1, unit: "cup" },
    ],
    steps: [
      { order: 1, text: "Warm the tortillas.", timer_minutes: 2 },
      { order: 2, text: "Heat the beans." }, // no timer
    ],
    nutrition: {
      kcal: 500,
      protein_g: 20,
      carbs_g: 60,
      fat_g: 15,
    },
    warnings: ["Contains gluten", "May contain dairy"],
    videos: [
      {
        id: "video1",
        title: "How to Make Tacos",
        thumbnail: "https://example.com/thumb1.jpg",
      },
      {
        id: "video2",
        title: "Bean Prep Tips",
        // no thumbnail -> should use gray fallback block
      },
      {
        id: "video3",
        title: "Extra Video 3",
      },
      {
        id: "video4",
        title: "Extra Video 4",
      },
      {
        id: "video5",
        title: "Should Not Render (over limit)",
      },
    ],
  };

  it("renders recipe card with details, ingredients, steps, timers, nutrition, warnings, and videos", () => {
    const { container } = render(<RecipePanel recipes={[fullRecipe]} />);

    // --- Header basics ---
    expect(
      screen.getByRole("heading", { name: "Test Tacos" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Servings: 2 • Total: 15m")
    ).toBeInTheDocument();

    // --- Ingredients list ---
    expect(
      screen.getByRole("list", { name: "Ingredients" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Tortillas — 4 pcs")
    ).toBeInTheDocument();
    expect(screen.getByText("Beans — 1 cup")).toBeInTheDocument();

    // --- Steps list & timer badge ---
    expect(
      screen.getByText("Warm the tortillas.")
    ).toBeInTheDocument();
    expect(screen.getByText("Heat the beans.")).toBeInTheDocument();

    // Timer badge has an aria-label like "2 minutes"
    expect(screen.getByLabelText("2 minutes")).toBeInTheDocument();
    expect(screen.getByText("⏱ 2m")).toBeInTheDocument();

    // --- Nutrition footer ---
    expect(
      screen.getByText("Nutrition: 500 kcal • P 20g • C 60g • F 15g")
    ).toBeInTheDocument();

    // --- Warnings block ---
    expect(screen.getByText("Warnings")).toBeInTheDocument();
    expect(screen.getByText("Contains gluten")).toBeInTheDocument();
    expect(screen.getByText("May contain dairy")).toBeInTheDocument();

    // --- Videos section ---
    expect(screen.getByText("Videos")).toBeInTheDocument();

    const videoButtons = screen.getAllByRole("button", { name: /Play /i });
    // Should be limited to 4 even though we provided 5
    expect(videoButtons).toHaveLength(4);

    // Thumbnail vs fallback:
    // There should be an <img> for the first video with a thumbnail
    const imgThumbs = container.querySelectorAll("img.h-10.w-16");
    expect(imgThumbs.length).toBe(1);

    // And at least one gray fallback block for videos without a thumbnail
    const grayFallback = container.querySelector(
      "div.h-10.w-16.bg-neutral-200"
    );
    expect(grayFallback).toBeInTheDocument();
  });

  it("opens a Modal with the selected video when a video card is clicked, and closes it", async () => {
    render(<RecipePanel recipes={[fullRecipe]} />);

    const videoButton = screen.getByRole("button", {
      name: /Play How to Make Tacos/i,
    });

    fireEvent.click(videoButton);

    // Modal should appear with the correct title
    await waitFor(() => {
      expect(screen.getByTestId("modal")).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: /Playing: How to Make Tacos/i })
      ).toBeInTheDocument();
    });

    // We should see the iframe with the YouTube embed URL
    const iframe = screen.getByTitle("How to Make Tacos") as HTMLIFrameElement;
    expect(iframe).toBeInTheDocument();
    expect(iframe.src).toContain("https://www.youtube.com/embed/video1");

    // Our mocked Modal captured props
    expect(lastModalProps).toBeDefined();
    expect(lastModalProps.open).toBe(true);

    // Close via the mock "Close" button (which calls onClose)
    fireEvent.click(screen.getByText("Close"));

    // After closing, the modal should disappear
    await waitFor(() => {
      expect(screen.queryByTestId("modal")).not.toBeInTheDocument();
    });
  });

  it("handles recipes with no warnings or videos gracefully", () => {
    const minimalRecipe: any = {
      id: "r2",
      name: "Simple Salad",
      servings: 1,
      total_minutes: 5,
      ingredients: [{ item: "Lettuce", qty: 1, unit: "head" }],
      steps: [{ order: 1, text: "Chop and serve." }],
      nutrition: {
        kcal: 100,
        protein_g: 3,
        carbs_g: 10,
        fat_g: 2,
      },
      warnings: [],
      videos: [],
    };

    render(<RecipePanel recipes={[minimalRecipe]} />);

    // Basic render still works
    expect(
      screen.getByRole("heading", { name: "Simple Salad" })
    ).toBeInTheDocument();

    // No "Warnings" or "Videos" labels should be present
    expect(screen.queryByText("Warnings")).toBeNull();
    expect(screen.queryByText("Videos")).toBeNull();
  });
});
