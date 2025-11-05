"use client";
import React, { useEffect, useRef, useState } from "react";

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
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    // Ask for user location once
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => {
          console.warn("User denied geolocation or error:", err);
        }
      );
    }
  }, []);

  useEffect(() => {
    if (!apiKey) {
      console.warn("NEXT_PUBLIC_GOOGLE_MAPS_KEY not set");
      return;
    }

    const run = () => {
      if (!mapRef.current || !window.google) return;

      const coords = venues
        .filter((v) => typeof v.lat === "number" && typeof v.lng === "number")
        .map((v) => ({ lat: v.lat as number, lng: v.lng as number }));

      // Center map on user location if available, else first venue, else fallback
      const center = userLocation
        ? userLocation
        : coords.length
        ? coords[0]
        : { lat: 35.7796, lng: -78.6382 }; // fallback (Raleigh)

      const map = new window.google.maps.Map(mapRef.current, {
        center,
        zoom: userLocation ? 12 : coords.length ? 13 : 11,
      });

      const bounds = new window.google.maps.LatLngBounds();

      // Add user location marker
      if (userLocation) {
        new window.google.maps.Marker({
          position: userLocation,
          map,
          title: "You are here",
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "#4285F4",
            fillOpacity: 1,
            strokeWeight: 2,
          },
        });
        bounds.extend(userLocation);
      }

      // Add venue markers
      venues.forEach((v) => {
        if (typeof v.lat === "number" && typeof v.lng === "number") {
          const pos = { lat: v.lat as number, lng: v.lng as number };
          const marker = new window.google.maps.Marker({
            position: pos,
            map,
            title: v.name,
          });

          const infowindow = new window.google.maps.InfoWindow({
            content: `<div style="min-width:150px"><strong>${v.name}</strong>${
              v.url ? `<div><a href="${v.url}" target="_blank">Website</a></div>` : ""
            }</div>`,
          });
          marker.addListener("click", () => infowindow.open({ anchor: marker, map }));

          bounds.extend(pos);
        }
      });

      if (!bounds.isEmpty()) map.fitBounds(bounds, 64);
    };

    if (window.google && window.google.maps) {
      run();
      return;
    }

    if (!document.querySelector(`#google-maps-${apiKey}`)) {
      const script = document.createElement("script");
      script.id = `google-maps-${apiKey}`;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
      script.async = true;
      script.defer = true;
      script.onload = run;
      document.head.appendChild(script);
    } else {
      const checkLoaded = setInterval(() => {
        if (window.google && window.google.maps) {
          clearInterval(checkLoaded);
          run();
        }
      }, 100);
      return () => clearInterval(checkLoaded);
    }
  }, [venues, apiKey, userLocation]);

  return <div ref={mapRef} style={{ width: "100%", height: 360, borderRadius: 12 }} />;
}
