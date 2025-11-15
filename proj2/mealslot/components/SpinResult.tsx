// --- path: components/SpinResult.tsx ---
import { Lock, RefreshCcw, ThumbsUp } from "lucide-react";

type Reel = {
  id?: string;
  name?: string;
  category?: string;
  tags?: any;
  allergens?: any;
  ytQuery?: string;
  slow?: boolean;
  mid?: boolean;
  isHealthy?: boolean;
};
type VoteInfo = {
  keep: number;
  reroll: number;
  majority: number;
  iVotedKeep: boolean;
  iVotedReroll: boolean;
};

type Props = {
  selection: Reel[] | null;
  reels: readonly string[];
  locks: boolean[];
  votes: VoteInfo[];
  countdown: number | null;
  onToggleLock: (idx: number) => void;
  onVoteKeep: (idx: number) => void;
  onVoteReroll: (idx: number) => void;
  disabled?: boolean; // disable actions when not host (buttons still show tallies)
};

function toStrings(x: any): string[] {
  if (!x) return [];
  if (Array.isArray(x)) return x.map((s) => String(s));
  if (typeof x === "string") {
    const s = x.trim();
    try {
      if ((s.startsWith("[") && s.endsWith("]")) || s.includes('","')) {
        const arr = JSON.parse(s);
        return Array.isArray(arr) ? arr.map((v: any) => String(v)) : [s];
      }
    } catch {}
    if (s.includes(",")) return s.split(",").map((t) => t.trim());
    return [s];
  }
  return [String(x)];
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-neutral-300 bg-white px-2 py-0.5 text-[11px] text-neutral-800 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100">
      {children}
    </span>
  );
}

export default function SpinResult({
  selection,
  reels,
  locks,
  votes,
  countdown,
  onToggleLock,
  onVoteKeep,
  onVoteReroll,
  disabled,
}: Props) {
  if (!selection || selection.length === 0) {
    return (
      <div className="rounded-xl border p-3 text-sm text-neutral-500 dark:border-neutral-800">
        No spin yet.
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {reels.map((label, i) => {
        const d = selection[i] || selection[0];
        const tags = toStrings(d?.tags).map((t) => t.replace(/[_-]/g, " "));
        const allergens = toStrings(d?.allergens).map((t) => t.replace(/[_-]/g, " "));
        const pills: string[] = [];
        if (d?.category) pills.push(d.category);
        if (d?.mid) pills.push("mid");
        if (d?.slow) pills.push("slow");
        if (d?.isHealthy) pills.push("healthy");

        const v: VoteInfo =
          votes[i] ?? { keep: 0, reroll: 0, majority: 1, iVotedKeep: false, iVotedReroll: false };

        return (
          <div key={label} className="rounded-xl border p-3 dark:border-neutral-800">
            <div className="mb-1 flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-300">
              <div className="font-semibold">{label}</div>
              <button
                type="button"
                onClick={() => onToggleLock(i)}
                className={[
                  "inline-flex items-center gap-1 rounded border px-2 py-0.5",
                  locks[i]
                    ? "border-amber-600 bg-amber-600 text-white"
                    : "border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100",
                ].join(" ")}
                title={locks[i] ? "Unlock" : "Lock this slot"}
              >
                <Lock className="h-3.5 w-3.5" />
                {locks[i] ? "Locked" : "Lock"}
              </button>
            </div>

            <div className="mb-2 text-lg font-semibold leading-6">{d?.name ?? "—"}</div>

            {pills.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-1">
                {pills.map((p) => (
                  <Chip key={p}>{p}</Chip>
                ))}
              </div>
            )}

            <div className="mb-1 text-xs font-semibold text-neutral-600 dark:text-neutral-300">Tags</div>
            <div className="mb-2 min-h-[1.5rem]">
              {tags.length > 0 ? (
                <div className="flex flex-wrap gap-1">{tags.map((t) => <Chip key={t}>{t}</Chip>)}</div>
              ) : (
                <span className="text-xs text-neutral-500">—</span>
              )}
            </div>

            <div className="mb-1 text-xs font-semibold text-neutral-600 dark:text-neutral-300">Allergens</div>
            <div>
              {allergens.length > 0 ? (
                <div className="flex flex-wrap gap-1">{allergens.map((t) => <Chip key={t}>{t}</Chip>)}</div>
              ) : (
                <span className="text-xs text-neutral-500">—</span>
              )}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onVoteKeep(i)}
                disabled={disabled}
                className={[
                  "inline-flex items-center gap-1 rounded border px-2 py-1 text-xs",
                  v.iVotedKeep
                    ? "border-green-600 bg-green-600 text-white"
                    : "border-neutral-300 bg-white hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800",
                ].join(" ")}
                title="Vote to keep this reel"
              >
                <ThumbsUp className="h-3.5 w-3.5" /> Keep ({v.keep}/{v.majority})
              </button>

              <button
                type="button"
                onClick={() => onVoteReroll(i)}
                disabled={disabled}
                className={[
                  "inline-flex items-center gap-1 rounded border px-2 py-1 text-xs",
                  v.iVotedReroll
                    ? "border-amber-600 bg-amber-600 text-white"
                    : "border-neutral-300 bg-white hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800",
                ].join(" ")}
                title="Vote to re-roll only this reel"
              >
                <RefreshCcw className="h-3.5 w-3.5" /> Re-roll ({v.reroll}/{v.majority})
              </button>

              {typeof countdown === "number" && (
                <span className="ml-auto rounded border border-neutral-300 px-2 py-0.5 text-[11px] dark:border-neutral-700">
                  Spin in {countdown}
                </span>
              )}
            </div>

            <div className="mt-3">
              <a
                className="inline-block rounded border border-neutral-300 px-2 py-1 text-xs hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(d?.ytQuery || d?.name || "recipe")}`}
                target="_blank"
                rel="noreferrer"
              >
                Watch on YouTube
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
}
