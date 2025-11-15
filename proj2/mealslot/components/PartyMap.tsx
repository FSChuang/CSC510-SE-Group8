"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";

type Props = {
  // center from browser geolocation if true (fallback to approx campus)
  useBrowserLocation?: boolean;
  height?: number | string;
};

declare global {
  interface Window {
    _partyMapInit?: () => void;
    google?: any;
  }
}

export default function PartyMap({ useBrowserLocation = true, height = 360 }: Props) {
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  // Safe default (Centennial Campus-ish)
  const fallback = { lat: 35.7718, lng: -78.6811 };

  const initMap = async () => {
    if (!window.google || !mapDivRef.current) return;

    // Determine center
    const getCenter = (): Promise<{ lat: number; lng: number }> =>
      new Promise((resolve) => {
        if (!useBrowserLocation || !navigator.geolocation) return resolve(fallback);
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          () => resolve(fallback),
          { enableHighAccuracy: true, timeout: 5000 }
        );
      });

    const center = await getCenter();

    mapRef.current = new window.google.maps.Map(mapDivRef.current, {
      center,
      zoom: 16,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
    });

    markerRef.current = new window.google.maps.Marker({
      position: center,
      map: mapRef.current,
      title: "You",
      animation: window.google.maps.Animation.DROP,
    });
  };

  // expose init for the script callback
  useEffect(() => {
    window._partyMapInit = initMap;
    return () => {
      window._partyMapInit = undefined;
    };
  }, []);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

  return (
    <div className="w-full">
      {/* Map container */}
      <div
        ref={mapDivRef}
        style={{ height, width: "100%", borderRadius: 12, overflow: "hidden" }}
        className="border border-neutral-300 dark:border-neutral-800"
      />
      {/* Load Google Maps JS API (same behavior as homepage) */}
      <Script
        id="party-google-maps"
        src={`https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=weekly&callback=_partyMapInit`}
        strategy="afterInteractive"
      />
    </div>
  );
}
