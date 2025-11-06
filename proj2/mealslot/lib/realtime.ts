// Lightweight client-side realtime using either BroadcastChannel (same-origin tabs)
// or WebSocket when NEXT_PUBLIC_WS_URL is set. All events are namespaced per room code.

type Handler = (payload: any) => void;

class BCWire {
  kind = "bc" as const;
  private ch: BroadcastChannel;
  private handlers = new Map<string, Set<Handler>>();
  constructor(room: string) {
    this.ch = new BroadcastChannel(`party:${room}`);
    this.ch.onmessage = (ev) => {
      const { type, payload } = ev.data || {};
      const set = this.handlers.get(type);
      if (!set) return;
      for (const h of set) try { h(payload); } catch {}
    };
  }
  on(type: string, fn: Handler) {
    if (!this.handlers.has(type)) this.handlers.set(type, new Set());
    this.handlers.get(type)!.add(fn);
  }
  emit(type: string, payload: any) { try { this.ch.postMessage({ type, payload }); } catch {} }
  close() { try { this.ch.close(); } catch {} }
}

class WSWire {
  kind = "ws" as const;
  private ws: WebSocket;
  private room: string;
  private handlers = new Map<string, Set<Handler>>();
  private openPromise: Promise<void>;
  constructor(room: string, url: string) {
    this.room = room;
    this.ws = new WebSocket(url.replace(/^http/,"ws"));
    this.ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (!msg || msg.room !== this.room) return;
        const set = this.handlers.get(msg.type);
        if (!set) return;
        for (const h of set) try { h(msg.payload); } catch {}
      } catch {}
    };
    this.openPromise = new Promise((res)=> this.ws.onopen = ()=>res());
  }
  async on(type: string, fn: Handler) {
    if (!this.handlers.has(type)) this.handlers.set(type, new Set());
    this.handlers.get(type)!.add(fn);
  }
  async emit(type: string, payload: any) {
    await this.openPromise;
    try { this.ws.send(JSON.stringify({ room: this.room, type, payload })); } catch {}
  }
  close() { try { this.ws.close(); } catch {} }
}

export async function getRealtimeForRoom(room: string) {
  const url = process.env.NEXT_PUBLIC_WS_URL || "";
  if (!url) return new BCWire(room);
  return new WSWire(room, url);
}
