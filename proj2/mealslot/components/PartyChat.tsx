"use client";

import { useEffect, useRef, useState } from "react";

type ChatMsg = { id: string; ts: number; nick: string; text: string };

type Props = {
  code: string;
  nickname: string;
  transportLabel?: string;
  // provide an emitter pair from PartyClient so we reuse the same realtime
  onGetRealtime: () => Promise<{ emit: (event: string, payload: any) => void; on: (e: string, cb: (p: any) => void) => void }>;
};

export default function PartyChat({ code, nickname, transportLabel, onGetRealtime }: Props) {
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [text, setText] = useState("");
  const rtRef = useRef<{ emit: Function; on: Function } | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const rt = await onGetRealtime();
      if (!mounted) return;
      rtRef.current = rt;

      rt.on("chat", (p: any) => {
        if (!p || p.code !== code) return;
        setMsgs((m) => [...m, { id: p.id, ts: p.ts, nick: p.nick, text: p.text }]);
      });
    })();

    return () => {
      mounted = false;
    };
  }, [code, onGetRealtime]);

  const send = () => {
    const t = text.trim();
    if (!t || !rtRef.current) return;
    const payload = { code, id: crypto.randomUUID(), ts: Date.now(), nick: nickname, text: t };
    try {
      (rtRef.current as any).emit("chat", payload);
      setMsgs((m) => [...m, payload]); // optimistic
      setText("");
    } catch {}
  };

  return (
    <div className="rounded-2xl border bg-white dark:bg-neutral-900 dark:border-neutral-800">
      <div className="px-3 py-2 text-sm font-semibold">Party chat</div>
      <div className="h-40 overflow-auto border-y px-3 py-2 text-xs dark:border-neutral-800">
        {msgs.length === 0 ? (
          <div className="text-neutral-500">No messages yet.</div>
        ) : (
          msgs.map((m) => (
            <div key={m.id} className="mb-1">
              <span className="mr-2 rounded bg-sky-600/20 px-1.5 py-0.5 text-sky-200 dark:text-sky-300">{m.nick}</span>
              <span className="text-neutral-300">{new Date(m.ts).toLocaleTimeString()}</span>
              <div className="pl-2">{m.text}</div>
            </div>
          ))
        )}
      </div>
      <div className="flex gap-2 p-2">
        <input
          className="flex-1 rounded border border-neutral-300 bg-white px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-800"
          placeholder="Message…"
          value={text}
          onChange={(e) => setText(e.currentTarget.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <button
          className="rounded border border-neutral-300 px-3 py-1 text-sm hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
          onClick={send}
        >
          Send
        </button>
      </div>
    </div>
  );
}
