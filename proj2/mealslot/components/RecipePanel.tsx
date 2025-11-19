"use client";

import React, { useState } from "react";
import Modal from "@/components/ui/Modal";
import { RecipeJSON } from "@/lib/schemas";

export default function RecipePanel({ recipes }: { recipes: RecipeJSON[] }) {
  const [video, setVideo] = useState<{ id: string; title: string } | null>(null);

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {recipes.map((r) => (
        <article key={r.id} className="rounded-xl border p-3" aria-labelledby={`r-${r.id}`}>
          <header className="mb-1">
            <h3 id={`r-${r.id}`} className="text-base font-semibold">
              {r.name}
            </h3>
            <p className="text-xs text-neutral-600">
              Servings: {r.servings} • Total: {r.total_minutes}m
            </p>
          </header>

          <section className="mb-2">
            <div className="mb-1 text-sm font-medium">Ingredients</div>
            <ul className="list-disc pl-6 text-sm" aria-label="Ingredients">
              {r.ingredients.map((ing, i) => (
                <li key={i}>
                  {ing.item} — {ing.qty} {ing.unit}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <div className="mb-1 text-sm font-medium">Steps</div>
            <ol className="list-decimal pl-6 text-sm">
              {r.steps.map((s) => (
                <li key={s.order} className="mb-0.5">
                  <span>{s.text}</span>
                  {s.timer_minutes ? (
                    <span
                      aria-label={`${s.timer_minutes} minutes`}
                      className="ml-2 rounded-full border px-1.5 py-0.5 text-[11px] text-neutral-700"
                    >
                      ⏱ {s.timer_minutes}m
                    </span>
                  ) : null}
                </li>
              ))}
            </ol>
          </section>

          <footer className="mt-2 text-xs text-neutral-600">
            Nutrition: {r.nutrition.kcal} kcal • P {r.nutrition.protein_g}g • C {r.nutrition.carbs_g}
            g • F {r.nutrition.fat_g}g
          </footer>

          {r.warnings?.length ? (
            <div className="mt-2 rounded-md border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900">
              <div className="font-medium">Warnings</div>
              <ul className="list-disc pl-5">
                {r.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {r.videos?.length ? (
            <section className="mt-3">
              <div className="text-sm font-medium">Videos</div>
              <div className="mt-1 grid grid-cols-2 gap-2">
                {r.videos.slice(0, 4).map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setVideo({ id: v.id, title: v.title })}
                    className="flex items-center gap-2 rounded border p-2 text-left"
                    aria-label={`Play ${v.title}`}
                  >
                    {/* If a thumbnail is provided by the stub/real API, show it; else fallback to a square */}
                    {"thumbnail" in v && v.thumbnail ? (
                      <img
                        src={v.thumbnail}
                        alt=""
                        className="h-10 w-16 flex-shrink-0 rounded object-cover"
                      />
                    ) : (
                      <div className="h-10 w-16 flex-shrink-0 rounded bg-neutral-200" />
                    )}
                    <span className="line-clamp-2 text-xs underline">{v.title}</span>
                  </button>
                ))}
              </div>
            </section>
          ) : null}
        </article>
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
