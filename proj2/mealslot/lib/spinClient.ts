// lib/spinClient.ts
export type MealCategory = "breakfast" | "lunch" | "dinner" | "dessert";

export type SpinPayload = {
  category: MealCategory;
  num?: number;
  tags?: string[];
  allergens?: string[];
  locked?: string[];
  powerups?: { noDuplicates?: boolean };
};

export async function spin(payload: SpinPayload) {
  const res = await fetch("/api/spin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      `${res.status}${err?.error?.message ? ` — ${err.error.message}` : ""}`
    );
  }
  return (await res.json()) as { ok: true; items: any[] };
}
