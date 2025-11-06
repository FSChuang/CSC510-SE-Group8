// --- path: components/InviteBar.tsx ---
"use client";

import { useEffect, useMemo, useState } from "react";
import { Link as LinkIcon, Check } from "lucide-react";

export default function InviteBar() {
  const [copied, setCopied] = useState(false);
  const invite = useMemo(() => {
    if (typeof window === "undefined") return "";
    const u = new URL(window.location.href);
    // Ensure we're on /party route for the invite
    u.pathname = "/party";
    return u.toString();
  }, []);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1200);
    return () => clearTimeout(t);
  }, [copied]);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(invite);
      setCopied(true);
    } catch {
      // fallback: open prompt if clipboard blocked
      prompt("Copy this link:", invite);
    }
  };

  return (
    <div className="rounded-2xl border bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm">
          Share this invite link with your friend. If you have a <code>?code=ABC123</code> in the URL, it’s included.
        </div>
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={invite}
            className="w-[min(70vw,520px)] rounded border px-2 py-1 text-xs bg-white dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-100"
          />
          <button
            onClick={onCopy}
            className="inline-flex items-center gap-1 rounded-md border px-3 py-1 text-sm
                       bg-white hover:bg-neutral-100
                       dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:border-neutral-700 dark:text-neutral-100"
            title="Copy invite link"
          >
            {copied ? <Check className="h-4 w-4" /> : <LinkIcon className="h-4 w-4" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>
    </div>
  );
}
