"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { RecipeJSON } from "@/lib/schemas";

export default function RecipePanel({ recipes }: { recipes: RecipeJSON[] }) {
  const [video, setVideo] = useState<{ id: string; title: string } | null>(null);

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {recipes.map((r) => (
        <div key={r.id} className="rounded-xl border p-3">
          <div className="mb-1 text-base font-semibold">{r.name}</div>
          <div className="mb-2 text-xs text-neutral-600">
            Servings: {r.servings} • Total: {r.total_minutes}m
          </div>

          <div className="mb-1 text-sm font-medium">Ingredients</div>
          <ul className="mb-2 list-disc pl-6 text-sm" aria-label="Ingredients">
            {r.ingredients.map((ing, i) => (
              <li key={i}>
                {ing.item} — {ing.qty} {ing.unit}
              </li>
            ))}
          </ul>

          <div className="mb-1 text-sm font-medium">Steps</div>
          <ol className="list-decimal pl-6 text-sm">
            {r.steps.map((s) => (
              <li key={s.order}>
                {s.text} {s.timer_minutes ? `(${s.timer_minutes}m)` : ""}
              </li>
            ))}
          </ol>

          <div className="mt-2 text-xs text-neutral-600">
            Nutrition: {r.nutrition.kcal} kcal • P {r.nutrition.protein_g}g • C {r.nutrition.carbs_g}
            g • F {r.nutrition.fat_g}g
          </div>

          {r.videos?.length ? (
            <div className="mt-2">
              <div className="text-sm font-medium">Videos</div>
              <div className="mt-1 grid grid-cols-2 gap-2">
                {r.videos.slice(0, 4).map((v) => (
                  <button
                    key={v.id}
                    className="rounded border p-2 text-left text-xs underline"
                    onClick={() => setVideo({ id: v.id, title: v.title })}
                    aria-label={`Play ${v.title}`}
                  >
                    {v.title}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ))}

      <Modal
        open={!!video}
        title={video ? `Playing: ${video.title}` : "Video"}
        onClose={() => setVideo(null)}
      >
        {video && (
          <div className="aspect-video w-full">
            <iframe
              title={video.title}
              className="h-full w-full rounded-lg"
              src={`https://www.youtube.com/embed/${video.id}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
