import "server-only";
import { NextRequest } from "next/server";
import { z } from "zod";

const Body = z.object({
  cuisines: z.array(z.string().min(1)).min(1),
  locationHint: z.string().optional()
});

const GOOGLE_KEY = process.env.MAPS_API_KEY;
if (!GOOGLE_KEY) {
  // During development it's useful to fail fast if key missing
  // In production you might want to handle this more gracefully.
  console.warn("Missing GOOGLE_MAPS_API_KEY environment variable");
}

function toPriceStr(price_level: number | undefined | null) {
  if (typeof price_level !== "number") return undefined;
  return "$".repeat(Math.max(1, Math.min(4, Math.round(price_level))));
}

function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  // returns distance in kilometers
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

async function geocodeCity(city: string) {
  // Use Google Geocoding API to get coordinates for the city / location hint.
  if (!GOOGLE_KEY) return null;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
    city
  )}&key=${GOOGLE_KEY}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const body = await res.json();
  if (!body.results || body.results.length === 0) return null;
  const loc = body.results[0].geometry?.location;
  if (!loc) return null;
  return { lat: loc.lat, lng: loc.lng };
}

async function placesTextSearch(query: string, pageSize = 2) {
  if (!GOOGLE_KEY) return { results: [], error: "missing_key" };
  // Text Search
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
    query
  )}&type=restaurant&key=${GOOGLE_KEY}`;
  const res = await fetch(url);
  if (!res.ok) return { results: [], error: `http_${res.status}` };
  const body = await res.json();
  const results = Array.isArray(body.results) ? body.results.slice(0, pageSize) : [];
  return { results, error: null };
}

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return Response.json(
      { code: "BAD_REQUEST", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { cuisines, locationHint } = parsed.data;
  const city = (locationHint ?? "Your City").replace(/[^a-zA-Z\s]/g, "");
  const responseObj: {
    results: Record<string, Array<Record<string, any>>>;
    errors: Array<{ cuisine: string; message: string }>;
    notice?: string;
  } = { results: {}, errors: [] };

  // obtain city lat/lng for distance calculations (best-effort)
  let origin: { lat: number; lng: number } | null = null;
  try {
    origin = await geocodeCity(city);
    if (!origin) {
      responseObj.notice = "Could not geocode provided location; distance omitted.";
    }
  } catch (e) {
    responseObj.notice = "Error geocoding location; distance omitted.";
  }

  // For each cuisine/dish, query Places Text Search
  const jobs = cuisines.map(async (dish) => {
    const query = `${dish} restaurant in ${city}`;
    try {
      const { results, error } = await placesTextSearch(query, 2);
      if (error) {
        responseObj.errors.push({ cuisine: dish, message: String(error) });
        responseObj.results[dish] = [];
        return;
      }

      const mapped = results.map((r: any, i: number) => {
        const place_id: string = r.place_id;
        const name: string = r.name;
        const addr: string | undefined = r.formatted_address ?? r.vicinity;
        const rating: number | undefined =
          typeof r.rating === "number" ? r.rating : undefined;
        const price = toPriceStr(r.price_level);
        const lat = r.geometry?.location?.lat;
        const lng = r.geometry?.location?.lng;
        const distance_km =
          origin && typeof lat === "number" && typeof lng === "number"
            ? haversineDistanceKm(origin.lat, origin.lng, lat, lng)
            : undefined;
        const url = place_id
          ? `https://www.google.com/maps/place/?q=place_id:${place_id}`
          : undefined;

        return {
          id: `g_${place_id ?? `${dish}_${i}`}`,
          name,
          addr,
          rating,
          price,
          url,
          cuisine: dish,
          distance_km
        };
      });

      responseObj.results[dish] = mapped;
    } catch (err: any) {
      responseObj.errors.push({ cuisine: dish, message: err?.message ?? String(err) });
      responseObj.results[dish] = [];
    }
  });

  await Promise.all(jobs);

  // If key missing, return early with helpful message (keeps previous stub behavior if you want)
  if (!GOOGLE_KEY) {
    // fallback stub if no key - mimic previous behaviour but note that it's a stub
    const venues = cuisines.slice(0, 3).map((c, i) => ({
      id: `v_${c}_${i}`,
      name: `${c} Place ${i + 1}`,
      addr: `${100 + i} Main St, ${city}`,
      rating: 4.2 - i * 0.2,
      price: "$".repeat(1 + (i % 3)),
      url: "https://example.com",
      cuisine: c,
      distance_km: Number((1.0 + i * 0.7).toFixed(1))
    }));
    return Response.json({
      results: cuisines.reduce((acc: any, c: string) => ((acc[c] = venues), acc), {}),
      notice:
        "GOOGLE_MAPS_API_KEY not set — returning the old city-level stub. Set GOOGLE_MAPS_API_KEY to enable real searches.",
    });
  }

  return Response.json(responseObj);
}
