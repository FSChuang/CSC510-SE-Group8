import "server-only";
import { Dish, RecipeJSON } from "./schemas";

type Yt = { id: string; title: string; url: string; thumbnail?: string };

/**
 * Recipes adapter:
 * - If OPENAI_API_KEY is present, calls OpenAI with a strict JSON schema.
 * - Otherwise generates deterministic, name-derived recipes (stub).
 */

const SYS_PROMPT = `
You are a meticulous recipe generator. Output ONLY JSON that conforms to the provided JSON Schema.
Do not include commentary. Provide precise, practical ingredient quantities and steps.
`;

const RECIPE_JSON_SCHEMA: any = {
  type: "object",
  additionalProperties: false,
  properties: {
    id: { type: "string" },
    name: { type: "string" },
    servings: { type: "integer", minimum: 1 },
    total_minutes: { type: "integer", minimum: 1 },
    equipment: { type: "array", items: { type: "string" } },
    ingredients: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          item: { type: "string" },
          qty: { type: "number" },
          unit: { type: "string" }
        },
        required: ["item", "qty", "unit"]
      }
    },
    steps: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          order: { type: "integer" },
          text: { type: "string" },
          timer_minutes: { type: "integer" }
        },
        required: ["order", "text", "timer_minutes"]
      }
    },
    nutrition: {
      type: "object",
      additionalProperties: false,
      properties: {
        kcal: { type: "number" },
        protein_g: { type: "number" },
        carbs_g: { type: "number" },
        fat_g: { type: "number" }
      },
      required: ["kcal", "protein_g", "carbs_g", "fat_g"]
    },
    warnings: { type: "array", items: { type: "string" } },
    videos: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: true,
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          url: { type: "string" },
          thumbnail: { type: "string" }
        },
        required: ["id", "title", "url"]
      }
    }
  },
  required: [
    "id",
    "name",
    "servings",
    "total_minutes",
    "equipment",
    "ingredients",
    "steps",
    "nutrition"
  ]
};

function tokensFromName(name: string) {
  return name
    .toLowerCase()
    .replace(/[()]/g, "")
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function stubRecipe(d: Dish, idx: number, videos: Yt[]): RecipeJSON {
  const [a = "ingredient", b = "sauce", c = "herb"] = tokensFromName(d.name);
  const fast = d.timeBand === 1;

  const ing = [
    { item: a, qty: 2, unit: "pc" },
    { item: `${b}`, qty: fast ? 150 : 250, unit: "g" },
    { item: "olive oil", qty: 1, unit: "tbsp" },
    { item: c, qty: 5, unit: "g" }
  ];

  const steps = [
    { order: 1, text: `Prep ${a} and ${c}; warm ${b}.`, timer_minutes: 5 },
    { order: 2, text: `Cook ${a} with ${b} on medium.`, timer_minutes: fast ? 10 : 20 },
    { order: 3, text: "Season and serve.", timer_minutes: 0 }
  ];

  const safeVideos = videos.map((v) => ({
    id: v.id,
    title: v.title,
    url: v.url,
    thumbnail: v.thumbnail ?? "", // ensure a string
  }));

  return {
    id: `rcp_${d.id}_${idx}`,
    name: `Recipe for ${d.name}`,
    servings: 2,
    total_minutes: fast ? 25 : d.timeBand === 2 ? 35 : 50,
    equipment: ["pan", "knife", "board"],
    ingredients: ing,
    steps,
    nutrition: {
      kcal: d.isHealthy ? 420 : 520,
      protein_g: d.category === "meat" ? 35 : 28,
      carbs_g: d.costBand === 1 ? 40 : 45,
      fat_g: d.isHealthy ? 12 : 24
    },
    warnings: [],
    videos: safeVideos,
  };
}


export async function recipesViaOpenAI(
  dishes: Dish[],
  videoLookup: (query: string) => Promise<Yt[]>
): Promise<RecipeJSON[]> {
  const key = process.env.OPENAI_API_KEY;

  // ── No API key: use deterministic stub recipes ────────────────────────────────
  if (!key) {
    const allRawVideos = await Promise.all(
      dishes.map((d) => videoLookup(d.ytQuery))
    );

    // Normalize thumbnails so they’re always strings
    const allSafeVideos = allRawVideos.map((arr) =>
      (arr ?? []).map((v) => ({
        id: v.id,
        title: v.title,
        url: v.url,
        thumbnail: v.thumbnail ?? "",
      }))
    );

    return dishes.map((d, i) => stubRecipe(d, i, allSafeVideos[i] ?? []));
  }

  // ── With API key: call OpenAI, still normalizing videos ──────────────────────
  const out: RecipeJSON[] = [];

  for (let i = 0; i < dishes.length; i++) {
    const d = dishes[i]!;
    const rawVideos = await videoLookup(d.ytQuery);
    const videos = (rawVideos ?? []).map((v) => ({
      id: v.id,
      title: v.title,
      url: v.url,
      thumbnail: v.thumbnail ?? "",
    }));

    const userPrompt = `
Return a single JSON object describing a cooking recipe for: "${d.name}".
Constraints:
- servings: 2
- total_minutes consistent with ~${
      d.timeBand === 1 ? "≤30" : d.timeBand === 2 ? "30–45" : "45–60"
    } minutes
- include realistic ingredients with quantities/units
- steps should be numbered and include timer_minutes
- consider common allergens for this dish name: ${
      d.allergens.join(", ") || "none"
    }
- keep equipment minimal (pan/pot/knife/board)
Return ONLY JSON.
`;

    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          response_format: {
            type: "json_schema",
            json_schema: { name: "recipe", schema: RECIPE_JSON_SCHEMA, strict: true },
          },
          messages: [
            { role: "system", content: SYS_PROMPT },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.4,
        }),
      });

      if (!res.ok) throw new Error(`OpenAI ${res.status}`);

      const data = (await res.json()) as any;
      const content: string =
        data?.choices?.[0]?.message?.content ??
        data?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments ??
        "{}";

      const parsed = JSON.parse(content);

      const recipe: RecipeJSON = {
        id: parsed.id ?? `rcp_${d.id}_${i}`,
        name: parsed.name ?? `Recipe for ${d.name}`,
        servings: parsed.servings ?? 2,
        total_minutes:
          parsed.total_minutes ??
          (d.timeBand === 1 ? 25 : d.timeBand === 2 ? 35 : 50),
        equipment: parsed.equipment ?? ["pan", "knife", "board"],
        ingredients: parsed.ingredients ?? [],
        steps: parsed.steps ?? [],
        nutrition:
          parsed.nutrition ?? { kcal: 500, protein_g: 25, carbs_g: 50, fat_g: 20 },
        warnings: parsed.warnings ?? [],
        videos,
      };

      out.push(recipe);
    } catch {
      // Fallback: stubbed recipe with the same normalized videos
      out.push(stubRecipe(d, i, videos));
    }
  }

  return out;
}

