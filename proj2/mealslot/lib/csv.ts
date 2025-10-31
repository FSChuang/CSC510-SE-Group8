// lib/csv.ts
export const parseCsvToArray = (csv?: string | null): string[] =>
  (csv ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

export const includesAny = (haystack: string[], needles: string[]) =>
  needles.some((n) => haystack.includes(n.toLowerCase()));
