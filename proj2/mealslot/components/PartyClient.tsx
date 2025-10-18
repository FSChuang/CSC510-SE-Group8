"use client";

import { useEffect, useState } from "react";

export function PartyClient({ code }: { code: string }) {
  const [state, setState] = useState<any>(null);

  useEffect(() => {
    if (code.length === 6) {
      fetch(`/api/party/state?code=${code}`)
        .then((r) => r.json())
        .then(setState)
        .catch(() => setState({ error: "Failed to fetch state." }));
    } else {
      setState(null);
    }
  }, [code]);

  return (
    <div className="rounded-xl border bg-white p-3 shadow-sm">
      <div className="text-sm text-neutral-600">Party code: {code || "—"}</div>
      {state && (
        <pre className="mt-2 max-h-64 overflow-auto rounded bg-neutral-100 p-2 text-xs">
{JSON.stringify(state, null, 2)}
        </pre>
      )}
    </div>
  );
}
