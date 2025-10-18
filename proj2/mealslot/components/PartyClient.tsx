"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

export function PartyClient({ code }: { code: string }) {
  const [state, setState] = useState<any>(null);
  const [lastSpin, setLastSpin] = useState<any>(null);
  const socketRef = useRef<Socket | null>(null);

  // Fetch state when code changes
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

  // Connect to WS room
  useEffect(() => {
    if (code.length !== 6) return;
    const url = process.env.NEXT_PUBLIC_WS_URL || process.env.WS_URL || "http://localhost:4001";
    const s = io(url, { transports: ["websocket"] });
    socketRef.current = s;
    s.emit("join", code);
    s.on("spin_result", (sel) => setLastSpin(sel));
    return () => {
      s.disconnect();
      socketRef.current = null;
    };
  }, [code]);

  const hostSpin = async () => {
    if (code.length !== 6) return;
    const res = await fetch("/api/party/spin", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code, categories: ["main", "veggie", "soup"] })
    });
    if (!res.ok) return alert("Spin failed");
    const j = await res.json();
    setLastSpin(j.selection);
  };

  return (
    <div className="rounded-xl border bg-white p-3 shadow-sm">
      <div className="text-sm text-neutral-600">Party code: {code || "—"}</div>
      {state && (
        <pre className="mt-2 max-h-48 overflow-auto rounded bg-neutral-100 p-2 text-xs">
{JSON.stringify(state, null, 2)}
        </pre>
      )}
      <button
        className="mt-2 rounded border bg-neutral-900 px-3 py-1 text-sm text-white disabled:opacity-50"
        onClick={hostSpin}
        disabled={code.length !== 6}
        aria-disabled={code.length !== 6}
      >
        Host Spin
      </button>
      {lastSpin && (
        <div className="mt-2 rounded border p-2 text-xs">
          <div className="font-medium">Last Spin (live):</div>
          <pre className="max-h-48 overflow-auto">{JSON.stringify(lastSpin, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
