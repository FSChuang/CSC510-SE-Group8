// --- path: lib/realtime.ts ---
type Handler = (payload: any) => void;

export type RT = {
  emit: (event: string, payload?: any) => void;
  on: (event: string, h: Handler) => void;
  off: (event: string, h: Handler) => void;
  close: () => void;
};

/** Socket.IO if wsUrl provided; otherwise BroadcastChannel scoped to `room`. */
export async function getRealtimeForRoom(room: string, wsUrl?: string): Promise<RT> {
  const roomCode = (room || "").toUpperCase();

  if (wsUrl) {
    const { io } = await import("socket.io-client");
    const sock = io(wsUrl, { transports: ["websocket"], autoConnect: true });
    sock.emit("join", { room: roomCode });

    return {
      emit: (e, p) => sock.emit(e, p),
      on: (e, h) => sock.on(e, h),
      off: (e, h) => sock.off(e, h),
      close: () => { try { sock.close(); } catch {} },
    };
  }

  // ---- BroadcastChannel fallback (room-scoped) ----
  const name = `mealslot-party-${roomCode || "lobby"}`;
  const ch = new BroadcastChannel(name);
  const listeners = new Map<string, Set<Handler>>();
  let isClosed = false;

  const safePost = (event: string, payload?: any) => {
    if (isClosed) return;
    try {
      ch.postMessage({ event, payload });
    } catch {
      // Channel might already be closed (fast unmount / room switch). Ignore.
    }
  };

  ch.onmessage = (ev) => {
    if (isClosed) return;
    const { event, payload } = ev.data || {};
    const set = listeners.get(event);
    if (!set) return;
    for (const h of set) {
      try { h(payload); } catch { /* swallow listener errors */ }
    }
  };

  return {
    emit: safePost,
    on: (e, h) => {
      if (!listeners.has(e)) listeners.set(e, new Set());
      listeners.get(e)!.add(h);
    },
    off: (e, h) => listeners.get(e)?.delete(h),
    close: () => {
      isClosed = true;
      try { ch.close(); } catch {}
      listeners.clear();
    },
  };
}
