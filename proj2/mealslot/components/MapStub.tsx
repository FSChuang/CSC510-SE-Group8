"use client";

type Venue = {
  id: string;
  name: string;
  addr: string;
  rating: number;
  price: string;
  url: string;
  cuisine: string;
  distance_km: number;
};

export default function MapStub({ venues }: { venues: Venue[] }) {
  // Simple SVG grid with labeled pins; no external deps.
  const w = 640;
  const h = 220;
  const margin = 16;
  const cols = 6;
  const rows = 3;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="h-56 w-full rounded-xl border bg-neutral-50"
      role="img"
      aria-label="City-level map stub"
    >
      {/* grid */}
      <g stroke="#e5e5e5">
        {Array.from({ length: cols + 1 }).map((_, i) => (
          <line key={`c${i}`} x1={(i * (w - 2 * margin)) / cols + margin} y1={margin} x2={(i * (w - 2 * margin)) / cols + margin} y2={h - margin} />
        ))}
        {Array.from({ length: rows + 1 }).map((_, i) => (
          <line key={`r${i}`} x1={margin} y1={(i * (h - 2 * margin)) / rows + margin} x2={w - margin} y2={(i * (h - 2 * margin)) / rows + margin} />
        ))}
      </g>

      {/* pins */}
      {venues.slice(0, 6).map((v, i) => {
        const cx = margin + ((i % cols) + 0.5) * ((w - 2 * margin) / cols);
        const cy = margin + (Math.floor(i / cols) + 0.5) * ((h - 2 * margin) / rows);
        return (
          <g key={v.id}>
            <circle cx={cx} cy={cy} r={8} fill="#111" />
            <text x={cx + 12} y={cy + 4} fontSize="10" fill="#111">
              {v.name}
            </text>
          </g>
        );
      })}
      <text x={w - margin} y={h - 4} fontSize="10" textAnchor="end" fill="#6b7280">
        Using city-level location
      </text>
    </svg>
  );
}
