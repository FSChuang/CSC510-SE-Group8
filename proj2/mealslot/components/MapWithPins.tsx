"use client";
import React, { useEffect, useRef } from "react";

type Venue = {
  id: string;
  name: string;
  lat?: number;
  lng?: number;
  url?: string;
};

declare global {
  interface Window {
    initMap?: () => void;
    google?: any;
  }
}

export default function MapWithPins({ venues }: { venues: Venue[] }) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

  useEffect(() => {
    if (!apiKey) {
      console.warn("NEXT_PUBLIC_GOOGLE_MAPS_KEY not set");
      return;
    }

    // If SDK already loaded, initialize immediately
    const run = () => {
      if (!mapRef.current || !window.google) return;

      const coords = venues
        .filter((v) => typeof v.lat === "number" && typeof v.lng === "number")
        .map((v) => ({ lat: v.lat as number, lng: v.lng as number }));

      // If we have coords use them, otherwise center to fallback
      const center = coords.length
        ? coords[0]
        : { lat: 35.7796, lng: -78.6382 }; // fallback center (Raleigh)

      const map = new window.google.maps.Map(mapRef.current, {
        center,
        zoom: coords.length ? 13 : 11,
      });

      // Add markers
      const bounds = new window.google.maps.LatLngBounds();
      venues.forEach((v) => {
        if (typeof v.lat === "number" && typeof v.lng === "number") {
          const pos = { lat: v.lat as number, lng: v.lng as number };
          const marker = new window.google.maps.Marker({
            position: pos,
            map,
            title: v.name,
          });

          // Optional: info window on click
          const infowindow = new window.google.maps.InfoWindow({
            content: `<div style="min-width:150px"><strong>${v.name}</strong>${
              v.url ? `<div><a href="${v.url}" target="_blank">Website</a></div>` : ""
            }</div>`,
          });
          marker.addListener("click", () => infowindow.open({ anchor: marker, map }));

          bounds.extend(pos);
        }
      });

      // Fit bounds if we added markers
      if (!bounds.isEmpty) map.fitBounds(bounds, 64);
    };

    if (window.google && window.google.maps) {
      run();
      return;
    }

    // Insert script if not already present
    if (!document.querySelector(`#google-maps-${apiKey}`)) {
      const script = document.createElement("script");
      script.id = `google-maps-${apiKey}`;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
      script.async = true;
      script.defer = true;
      script.onload = run;
      document.head.appendChild(script);
    } else {
      // script exists but maybe not loaded yet
      const checkLoaded = setInterval(() => {
        if (window.google && window.google.maps) {
          clearInterval(checkLoaded);
          run();
        }
      }, 100);
      return () => clearInterval(checkLoaded);
    }

    // re-run when venues change (clean is not strictly required here)
  }, [venues, apiKey]);

  return <div ref={mapRef} style={{ width: "100%", height: 360, borderRadius: 12 }} />;
}
