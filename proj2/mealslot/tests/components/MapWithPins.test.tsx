// --- path: tests/components/MapWithPins.test.tsx ---
/**
 * Tests for MapWithPins component
 *
 * Covers:
 * - Handling of missing Google Maps API key:
 *   - Logs warning
 *   - Skips script injection and map initialization
 * - Map initialization when `window.google.maps` is already available:
 *   - Creates a map centered on the first venue when `userLocation` is null
 *   - Uses an appropriate zoom level based on venue presence
 *   - Creates markers for venues with valid coordinates
 *   - Extends bounds and calls `fitBounds` when markers exist
 * - Using user geolocation when available:
 *   - `navigator.geolocation.getCurrentPosition` is used to derive `userLocation`
 *   - Map recenters on user location with a different zoom level
 *   - Adds a distinct marker for the user location
 * - Script injection path:
 *   - When `window.google` is not available, injects a Google Maps script tag
 *   - Script tag has a stable id and URL containing the API key
 *
 * Test framework:
 * - Vitest (describe/it/expect/vi)
 * - React Testing Library (render, waitFor, cleanup)
 *
 * Notes:
 * - Google Maps objects (Map, Marker, LatLngBounds, InfoWindow, SymbolPath) are mocked
 * - `process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY` is temporarily patched per test
 * - `navigator.geolocation` is mocked where needed
 * - Tests focus on behavior and side effects, not styles or actual map rendering
 */

import React from "react";
import { render, cleanup, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import MapWithPins from "../../components/MapWithPins";

const originalEnv = { ...process.env };
const originalNavigator = window.navigator;
const originalGoogle = (window as any).google;

afterEach(() => {
  // Restore environment and global objects between tests
  process.env = { ...originalEnv };

  Object.defineProperty(window, "navigator", {
    value: originalNavigator,
    configurable: true,
  });

  (window as any).google = originalGoogle;

  // Remove any injected Google Maps script tags
  document
    .querySelectorAll('script[id^="google-maps-"]')
    .forEach((s) => s.parentNode?.removeChild(s));

  cleanup();
});

describe("MapWithPins", () => {
  it("logs a warning and does not inject script when API key is missing", () => {
    // Purpose:
    // - If NEXT_PUBLIC_GOOGLE_MAPS_KEY is not set, the component should warn
    //   and skip map initialization / script injection.

    delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    // Minimal navigator stub so the geolocation effect doesn't crash
    Object.defineProperty(window, "navigator", {
      value: { geolocation: { getCurrentPosition: vi.fn() } },
      configurable: true,
    });

    render(<MapWithPins venues={[]} />);

    expect(warnSpy).toHaveBeenCalledWith("NEXT_PUBLIC_GOOGLE_MAPS_KEY not set");

    // No Google Maps script should be injected
    const anyScript = document.querySelector(
      'script[src*="maps.googleapis.com/maps/api/js"]'
    );
    expect(anyScript).toBeNull();

    warnSpy.mockRestore();
  });

  it("initializes a map and venue markers when Google Maps is already available", async () => {
    // Purpose:
    // - When `window.google.maps` exists, the component should immediately:
    //   - Create a map centered on the first venue
    //   - Use zoom 13 (no userLocation, venues present)
    //   - Create markers for each venue with coordinates
    //   - Extend bounds and call fitBounds when bounds is not empty

    process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY = "TEST_KEY";

    const mapFitBoundsMock = vi.fn();
    const mapConstructor = vi.fn(() => ({
      fitBounds: mapFitBoundsMock,
    }));

    const markerAddListenerMock = vi.fn();
    const markerConstructor = vi.fn(() => ({
      addListener: markerAddListenerMock,
    }));

    const boundsExtendMock = vi.fn();
    const boundsIsEmptyMock = vi.fn(() => false);
    const boundsConstructor = vi.fn(() => ({
      extend: boundsExtendMock,
      isEmpty: boundsIsEmptyMock,
    }));

    const infoWindowOpenMock = vi.fn();
    const infoWindowConstructor = vi.fn(() => ({
      open: infoWindowOpenMock,
    }));

    // Mock Google Maps API
    (window as any).google = {
      maps: {
        Map: mapConstructor,
        Marker: markerConstructor,
        LatLngBounds: boundsConstructor,
        InfoWindow: infoWindowConstructor,
        SymbolPath: { CIRCLE: "CIRCLE" },
      },
    };

    // Stub geolocation to do nothing (userLocation remains null)
    Object.defineProperty(window, "navigator", {
      value: { geolocation: { getCurrentPosition: vi.fn() } },
      configurable: true,
    });

    const venues = [
      { id: "1", name: "A", lat: 1, lng: 2 },
      { id: "2", name: "B", lat: 3, lng: 4 },
    ];

    render(<MapWithPins venues={venues} />);

    // Wait for map initialization to happen
    await waitFor(() => {
      expect(mapConstructor).toHaveBeenCalledTimes(1);
    });

    // Verify map center and zoom based on first venue and no userLocation
    const [, options] = mapConstructor.mock.calls[0];
    expect(options.center).toEqual({ lat: 1, lng: 2 });
    expect(options.zoom).toBe(13);

    // Two markers for the two venues
    expect(markerConstructor).toHaveBeenCalledTimes(2);

    // Bounds should be extended for each venue and fitBounds called once
    expect(boundsExtendMock).toHaveBeenCalledTimes(2);
    expect(mapFitBoundsMock).toHaveBeenCalledTimes(1);
  });

  it("uses userLocation when geolocation succeeds and adds a user marker", async () => {
    // Purpose:
    // - When geolocation succeeds, userLocation should:
    //   - Recenter the map on the user's coordinates
    //   - Use zoom 12
    //   - Add an extra marker for the user ("You are here")
    //   - Extend bounds with user location as well

    process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY = "TEST_KEY";

    const mapFitBoundsMock = vi.fn();
    const mapConstructor = vi.fn(() => ({
      fitBounds: mapFitBoundsMock,
    }));

    const markerConstructor = vi.fn(() => ({
      addListener: vi.fn(),
    }));

    const boundsExtendMock = vi.fn();
    const boundsIsEmptyMock = vi.fn(() => false);
    const boundsConstructor = vi.fn(() => ({
      extend: boundsExtendMock,
      isEmpty: boundsIsEmptyMock,
    }));

    const infoWindowConstructor = vi.fn(() => ({
      open: vi.fn(),
    }));

    (window as any).google = {
      maps: {
        Map: mapConstructor,
        Marker: markerConstructor,
        LatLngBounds: boundsConstructor,
        InfoWindow: infoWindowConstructor,
        SymbolPath: { CIRCLE: "CIRCLE" },
      },
    };

    // Geolocation stub that immediately reports a position
    const geoMock = vi.fn((success: any) => {
      success({
        coords: { latitude: 10, longitude: 20 },
      });
    });

    Object.defineProperty(window, "navigator", {
      value: { geolocation: { getCurrentPosition: geoMock } },
      configurable: true,
    });

    const venues = [
      { id: "1", name: "A", lat: 1, lng: 2 },
      { id: "2", name: "B", lat: 3, lng: 4 },
    ];

    render(<MapWithPins venues={venues} />);

    // Map may be constructed multiple times (before and after userLocation),
    // so we check the last call to confirm it uses the user location.
    await waitFor(() => {
      expect(mapConstructor.mock.calls.length).toBeGreaterThanOrEqual(1);
    });

    const lastCall = mapConstructor.mock.calls[mapConstructor.mock.calls.length - 1];
    const [, options] = lastCall;

    expect(options.center).toEqual({ lat: 10, lng: 20 });
    expect(options.zoom).toBe(12);

    // Markers: 2 venues + 1 user marker
    expect(markerConstructor.mock.calls.length).toBeGreaterThanOrEqual(3);

    // Bounds should be extended with user location at least once
    const extendArgs = boundsExtendMock.mock.calls.map((c) => c[0]);
    expect(extendArgs).toContainEqual({ lat: 10, lng: 20 });
  });

  it("injects Google Maps script when API key is set but window.google is missing", async () => {
    // Purpose:
    // - When API key exists but the Maps API is not yet loaded, the component
    //   should inject a script tag with an id based on the API key and correct URL.

    process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY = "TEST_KEY";

    // Ensure window.google is not defined
    (window as any).google = undefined;

    // Remove any pre-existing script with this id to avoid false positives
    const existing = document.querySelector("#google-maps-TEST_KEY");
    if (existing) existing.parentNode?.removeChild(existing);

    // Minimal navigator stub
    Object.defineProperty(window, "navigator", {
      value: { geolocation: { getCurrentPosition: vi.fn() } },
      configurable: true,
    });

    render(<MapWithPins venues={[]} />);

    // Script injection should be synchronous in the effect
    const script = document.querySelector(
      "#google-maps-TEST_KEY"
    ) as HTMLScriptElement;

    expect(script).not.toBeNull();
    expect(script.src).toContain(
      "https://maps.googleapis.com/maps/api/js?key=TEST_KEY"
    );
    expect(script.async).toBe(true);
    expect(script.defer).toBe(true);
    expect(typeof script.onload).toBe("function");
  });
});
