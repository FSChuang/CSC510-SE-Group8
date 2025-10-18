type PlaceInput = {
  city?: string;
  lat?: number;
  lon?: number;
  cuisine?: string;
  tags?: string[];
};

type Place = { name: string; cuisine: string; distance_km: number };

function roundCoord(x?: number) {
  if (typeof x !== "number") return 0;
  return Math.round(x * 10) / 10; // coarse rounding
}

export function placesStub(input: PlaceInput): Place[] {
  // Deterministic based on rounded lat/lon or city + cuisine/tags
  const key = `${input.city ?? ""}:${roundCoord(input.lat)},${roundCoord(input.lon)}:${(input.cuisine ?? input.tags?.[0] ?? "any").toLowerCase()}`;
  const hash = simpleHash(key);
  const cuisines = ["Chinese", "Japanese", "Italian", "Mexican", "Indian", "American", "Greek"];
  const base = cuisines[hash % cuisines.length];
  const tag = (input.cuisine ?? input.tags?.[0] ?? "Fusion");
  const out: Place[] = [];
  for (let i = 0; i < 5; i++) {
    out.push({
      name: `${base} ${tag} #${i + 1}`,
      cuisine: base,
      distance_km: 0.8 + ((hash + i) % 40) / 10
    });
  }
  return out;
}

function simpleHash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  return Math.abs(h) >>> 0;
}
