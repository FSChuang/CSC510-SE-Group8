"use client";

import React from "react"
import { useState } from "react";
import Modal from "@/components/ui/Modal";

export type Video = {
  id: string;
  title: string;
  thumbnail?: string;
};

export default function VideoPanel({
  videosByDish,
}: {
  videosByDish: Record<string, Video[]>;
}) {
  const [video, setVideo] = useState<Video | null>(null);

  return (
    <div className="space-y-4">
      {Object.entries(videosByDish).map(([dish, vids]) => (
        <section key={dish}>
          <h3 className="text-base font-semibold mb-2">{dish}</h3>
          <div className="grid grid-cols-2 gap-2">
            {vids.slice(0, 2).map((v) => (
              <button
                key={v.id}
                onClick={() => setVideo(v)}
                className="flex items-center gap-2 rounded border p-2 text-left"
                aria-label={`Play ${v.title}`}
              >
                {v.thumbnail ? (
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
