// tests/components/PartyMap.test.tsx
import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, it, expect } from "vitest";
import PartyMap from "@/components/PartyMap";

describe("PartyMap", () => {
  it("renders a map container and injects the Google Maps script with the API key", () => {
    // Fake public API key for this test
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = "TEST_KEY";

    const { container } = render(<PartyMap height={400} />);

    // Outer wrapper
    const wrapper = container.firstElementChild as HTMLDivElement;
    expect(wrapper).toBeInTheDocument();

    // Map div is the first child
    const mapDiv = wrapper.firstElementChild as HTMLDivElement;
    expect(mapDiv).toBeInTheDocument();

    // Inline styles
    expect(mapDiv.style.width).toBe("100%");
    expect(mapDiv.style.height).toBe("400px");

    // Script tag should be somewhere in the document with our key and callback
    const scripts = Array.from(
      document.querySelectorAll("script")
    ) as HTMLScriptElement[];

    const mapsScript = scripts.find((s) =>
      s.src.includes("https://maps.googleapis.com/maps/api/js")
    );

    expect(mapsScript).toBeTruthy();
    expect(mapsScript!.src).toContain("key=TEST_KEY");
    expect(mapsScript!.src).toContain("callback=_partyMapInit");
  });
});
