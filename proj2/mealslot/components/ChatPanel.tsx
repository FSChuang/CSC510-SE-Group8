// --- path: components/ChatPanel.tsx ---
// import { useEffect, useRef, useState } from "react";
import React, { useEffect, useRef, useState } from "react";
export type ChatMsg = { id: string; ts: number; fromId: string; name: string; text: string };

export default function ChatPanel({
  messages,
  meId,
  onSend,
}: {
  messages: ChatMsg[];
  meId: string | null;
  onSend: (text: string) => void;
}) {
  const [text, setText] = useState("");
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  return (
    <div className="rounded-2xl border p-3 dark:border-neutral-800">
      <div className="mb-2 text-sm font-semibold">Party chat</div>

      <div
        ref={listRef}
        className="mb-2 max-h-56 overflow-y-auto rounded border border-neutral-200 p-2 text-sm dark:border-neutral-700"
      >
        {messages.length === 0 ? (
          <div className="text-xs text-neutral-500">No messages yet.</div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className="mb-1">
              <span
                className={[
                  "mr-2 rounded px-1 py-[1px] text-[11px]",
                  m.fromId === meId ? "bg-sky-500 text-black" : "bg-neutral-200 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100",
                ].join(" ")}
              >
                {m.name}
              </span>
              <span className="break-words">{m.text}</span>
              <span className="ml-2 text-[10px] text-neutral-500">
                {new Date(m.ts).toLocaleTimeString()}
              </span>
            </div>
          ))
        )}
      </div>

      <form
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const t = text.trim();
          if (!t) return;
          onSend(t);
          setText("");
        }}
      >
        <input
          className="flex-1 rounded border border-neutral-300 bg-white px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-800"
          placeholder="Message…"
          value={text}
          onChange={(e) => setText(e.currentTarget.value)}
        />
        <button
          type="submit"
          className="rounded border border-neutral-300 bg-white px-3 py-1 text-sm hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-800/80"
          disabled={!meId}
          title={meId ? "Send message" : "Join the party to chat"}
        >
          Send
        </button>
      </form>
    </div>
  );
}
