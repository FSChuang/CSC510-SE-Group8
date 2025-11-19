// --- path: tests/components/PlacesMapCard.test.tsx ---

/**
 * Tests for PlacesMapCard component
 *
 * Covers:
 * - Rendering of the outer card wrapper and inner map div with configurable height
 * - Injection of a Google Maps <script> tag when NEXT_PUBLIC_GOOGLE_MAPS_KEY is set
 *   and window.google.maps is not already present
 * - Graceful handling when the API key is missing (console warning, no script injected)
 * - Usage of an existing window.google.maps instance to create a Map + Marker
 */

import React from "react";
import { render, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import PlacesMapCard from "@/components/PlacesMapCard";

describe("PlacesMapCard", () => {
  const ORIGINAL_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
  const ORIGINAL_GOOGLE = (window as any).google;

  beforeEach(() => {
    // Reset env + global google before each test
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY = ORIGINAL_KEY;
    (window as any).google = undefined;

    // Remove any leftover script from prior tests
    const existing = document.getElementById("gmaps-sdk");
    if (existing) existing.remove();
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY = ORIGINAL_KEY;
    (window as any).google = ORIGINAL_GOOGLE;
    vi.restoreAllMocks();
  });

  it("renders card wrapper and inner map div with the given height", () => {
    const { container } = render(<PlacesMapCard height={300} />);

    const outer = container.firstElementChild as HTMLDivElement;
    expect(outer).toBeInTheDocument();
    expect(outer).toHaveClass(
      "rounded-2xl",
      "border",
      "dark:border-neutral-800",
      "overflow-hidden"
    );

    const inner = outer.firstElementChild as HTMLDivElement;
    expect(inner).toBeInTheDocument();
    expect(inner.style.height).toBe("300px");
  });

  it("injects a Google Maps script when API key is set and google.maps is missing", async () => {
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY = "TEST_KEY";
    (window as any).google = undefined;

    render(<PlacesMapCard height={260} />);

    // loadGoogleMaps runs inside useEffect; wait until the script is added
    await waitFor(() => {
      const scripts = Array.from(
        document.querySelectorAll("script")
      ) as HTMLScriptElement[];

      const mapsScript = scripts.find((s) =>
        s.src.includes("https://maps.googleapis.com/maps/api/js")
      );

      expect(mapsScript).toBeTruthy();
      expect(mapsScript!.id).toBe("gmaps-sdk");
      expect(mapsScript!.src).toContain("key=TEST_KEY");
      expect(mapsScript!.src).toContain("&v=weekly");
    });
  });

  it("logs a warning and does not inject a script when the API key is missing", async () => {
    // Explicitly clear the key
    delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
    (window as any).google = undefined;

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    render(<PlacesMapCard height={260} />);

    await waitFor(() => {
      // Our loader should have complained about the missing key
      expect(warnSpy).toHaveBeenCalledWith(
        "Missing NEXT_PUBLIC_GOOGLE_MAPS_KEY"
      );
    });

    const scripts = Array.from(
      document.querySelectorAll("script")
    ) as HTMLScriptElement[];

    const mapsScript = scripts.find((s) =>
      s.src.includes("https://maps.googleapis.com/maps/api/js")
    );

    // No Google Maps script injected when key is absent
    expect(mapsScript).toBeUndefined();
  });

  it("uses an existing google.maps instance to create a Map and Marker", async () => {
    // Stub an existing google.maps implementation before render
    const setCenter = vi.fn();
    const MapMock = vi.fn(() => ({ setCenter }));
    const MarkerMock = vi.fn();

    (window as any).google = {
      maps: {
        Map: MapMock,
        Marker: MarkerMock,
      },
    };

    // Key technically not needed in this branch, but set one anyway
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY = "IGNORED_KEY";

    render(<PlacesMapCard height={260} />);

    // Wait for the effect to run and construct the map
    await waitFor(() => {
      expect(MapMock).toHaveBeenCalled();
      expect(MarkerMock).toHaveBeenCalled();
    });

    // Map should be constructed with the fallback center and zoom 14
    const firstCallArgs = MapMock.mock.calls[0];
    expect(firstCallArgs[1]).toMatchObject({
      center: { lat: 35.7704, lng: -78.674 },
      zoom: 14,
      disableDefaultUI: false,
    });
  });
});
