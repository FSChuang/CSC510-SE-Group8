// --- path: components/PartyClient.tsx ---
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DietEnum, AllergenEnum, PrefsSchema } from "@/lib/party";
import { Crown, Link as LinkIcon, LogOut } from "lucide-react";
import { z } from "zod";

type PartyState = {
  party: { id: string; code: string; isActive: boolean; constraints: any };
  members: { id: string; nickname?: string; prefs: z.infer<typeof PrefsSchema> }[];
};

function Chip({
  active,
  children,
  onClick,
  disabled
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      className={[
        "rounded-full border px-3 py-1 text-sm transition",
        active
          ? "bg-neutral-900 text-white dark:bg-orange-500 dark:text-black dark:border-orange-400"
          : "bg-white dark:bg-neutral-900 dark:border-neutral-700",
        disabled ? "opacity-50 cursor-not-allowed" : "hover:opacity-90",
      ].join(" ")}
      onClick={disabled ? undefined : onClick}
      aria-pressed={!!active}
      disabled={disabled}
      type="button"
    >
      {children}
    </button>
  );
}

type Peer = {
  id: string;
  nickname: string;
  ts: number;
  creator?: boolean;
  lastSeen: number;
};

function PartyClient({ code: initialCode = "" }: { code?: string }) {
  const [code, setCode] = useState(initialCode);
  const [state, setState] = useState<PartyState | null>(null);
  const [memberId, setMemberId] = useState<string | null>(null);

  const [nickname, setNickname] = useState<string>(() => {
    if (typeof window === "undefined") return "Guest";
    return localStorage.getItem("mealslot_nickname") || "Guest";
  });
  useEffect(() => { try { localStorage.setItem("mealslot_nickname", nickname); } catch {} }, [nickname]);

  const [prefs, setPrefs] = useState<z.infer<typeof PrefsSchema>>({});
  const [lastSpin, setLastSpin] = useState<any[] | null>(null);
  const [peers, setPeers] = useState<Record<string, Peer>>({});
  const [transport, setTransport] = useState<string>("");

  const genClientId = () => {
    try {
      const uuid =
        typeof crypto !== "undefined" && typeof (crypto as any).randomUUID === "function"
          ? (crypto as any).randomUUID()
          : null;
      return (uuid as string) || `c_${Math.random().toString(36).slice(2, 10)}`;
    } catch {
      return `c_${Math.random().toString(36).slice(2, 10)}`;
    }
  };
  const clientIdRef = useRef<string>(genClientId());
  const myJoinTsRef = useRef<number>(Date.now());
  const iCreatedRef = useRef<boolean>(false);

  const [memberPrefs, setMemberPrefs] = useState<Record<string, any>>({});

  const rtRef = useRef<null | import("@/lib/realtime").RT>(null);
  const WS_URL = process.env.NEXT_PUBLIC_WS_URL || undefined;

  // host = explicit creator, else earliest ts
  const hostId = useMemo(() => {
    const arr = Object.values(peers);
    if (!arr.length) return null;
    const creator = arr.find(p => p.creator);
    if (creator) return creator.id;
    arr.sort((a, b) => a.ts - b.ts);
    return arr[0]?.id ?? null;
  }, [peers]);
  const isHost = hostId === clientIdRef.current;

  const upsertPeer = (p: Peer) => setPeers(prev => ({ ...prev, [p.id]: p }));
  const patchPeer  = (id: string, patch: Partial<Peer>) =>
    setPeers(prev => (prev[id] ? { ...prev, [id]: { ...prev[id], ...patch } } : prev));
  const removePeer = (id: string) => setPeers(prev => { const cp = { ...prev }; delete cp[id]; return cp; });

  // prune stale peers quickly (keeps UI snappy)
  useEffect(() => {
    const t = setInterval(() => {
      const now = Date.now();
      setPeers(prev => {
        const keep: Record<string, Peer> = {};
        for (const [id, p] of Object.entries(prev)) {
          if (now - p.lastSeen <= 10_000) keep[id] = p;  // 10s
        }
        return keep;
      });
    }, 4000);
    return () => clearInterval(t);
  }, []);

  // small per-peer debounce
  const lastEvtRef = useRef<Record<string, number>>({});
  const seenRecently = (id: string, windowMs = 200) => {
    const now = Date.now();
    const last = lastEvtRef.current[id] ?? 0;
    if (now - last < windowMs) return true;
    lastEvtRef.current[id] = now;
    return false;
  };

  useEffect(() => {
    let mounted = true;

    (async () => {
      try { rtRef.current?.close(); } catch {}
      rtRef.current = null;

      const { getRealtimeForRoom } = await import("@/lib/realtime");
      const rt = await getRealtimeForRoom(code, WS_URL);
      rtRef.current = rt;
      setTransport(WS_URL ? "ws" : `bc:${(code || "").toUpperCase()}`);

      const ignoreSelf = (p: any) => !p || p.clientId === clientIdRef.current;

      // only catch the immediate hello+here double fire (≈250ms)
      const looksLikeMyEcho = (p: any) =>
        p?.clientId !== clientIdRef.current &&
        Math.abs((p?.ts ?? 0) - myJoinTsRef.current) <= 250;

      const onSpin = (payload: any) => {
        if (!mounted) return;
        if (payload?.code === code) setLastSpin(payload.selection);
      };
      const onPrefs = (payload: any) => {
        if (!mounted) return;
        if (payload?.code === code) {
          setMemberPrefs(prev => ({ ...prev, [payload.memberId]: payload.prefs }));
        }
      };

      const onHello = (p: any) => {
        if (!mounted || p?.code !== code || ignoreSelf(p)) return;
        if (looksLikeMyEcho(p)) return;
        if (seenRecently(p.clientId, 200)) return;
        upsertPeer({
          id: p.clientId,
          nickname: p.nickname || "Guest",
          ts: typeof p.ts === "number" ? p.ts : Date.now(),
          creator: !!p.creator,
          lastSeen: Date.now(),
        });
        rt.emit("here", {
          code, clientId: clientIdRef.current, nickname,
          ts: myJoinTsRef.current, creator: iCreatedRef.current
        });
      };
      const onHere = (p: any) => {
        if (!mounted || p?.code !== code || ignoreSelf(p)) return;
        if (looksLikeMyEcho(p)) return;
        if (seenRecently(p.clientId, 200)) return;
        upsertPeer({
          id: p.clientId,
          nickname: p.nickname || "Guest",
          ts: typeof p.ts === "number" ? p.ts : Date.now(),
          creator: !!p.creator,
          lastSeen: Date.now(),
        });
      };
      const onBye = (p: any) => {
        if (!mounted || p?.code !== code || ignoreSelf(p)) return;
        removePeer(p.clientId);
      };
      const onNick = (p: any) => {
        if (!mounted || p?.code !== code || ignoreSelf(p)) return;
        patchPeer(p.clientId, { nickname: p.nickname || "Guest", lastSeen: Date.now() });
      };
      const onBeat = (p: any) => {
        if (!mounted || p?.code !== code || ignoreSelf(p)) return;
        patchPeer(p.clientId, { lastSeen: Date.now() });
      };

      rt.on("spin_result", onSpin);
      rt.on("prefs_update", onPrefs);
      rt.on("hello", onHello);
      rt.on("here", onHere);
      rt.on("bye", onBye);
      rt.on("nick", onNick);
      rt.on("beat", onBeat);

      // seed self + announce immediately
      const selfPeer: Peer = {
        id: clientIdRef.current,
        nickname,
        ts: myJoinTsRef.current,
        creator: iCreatedRef.current,
        lastSeen: Date.now(),
      };
      setPeers({ [selfPeer.id]: selfPeer });
      rt.emit("hello", { code, clientId: selfPeer.id, nickname, ts: myJoinTsRef.current, creator: iCreatedRef.current });
      rt.emit("here",  { code, clientId: selfPeer.id, nickname, ts: myJoinTsRef.current, creator: iCreatedRef.current });

      // heartbeat
      const hb = setInterval(() => {
        try {
          rt.emit("beat", { code, clientId: clientIdRef.current });
          patchPeer(clientIdRef.current, { lastSeen: Date.now() });
        } catch {}
      }, 4000);

      const sendBye = () => { try { rt.emit("bye", { code, clientId: clientIdRef.current }); } catch {} };
      const onBeforeUnload = () => sendBye();
      const onPageHide = (e: PageTransitionEvent) => { if (!e.persisted) sendBye(); };

      window.addEventListener("beforeunload", onBeforeUnload);
      window.addEventListener("pagehide", onPageHide);

      return () => {
        clearInterval(hb);
        window.removeEventListener("beforeunload", onBeforeUnload);
        window.removeEventListener("pagehide", onPageHide);
      };
    })();

    return () => {
      try { rtRef.current?.emit("bye", { code, clientId: clientIdRef.current }); } catch {}
      try { rtRef.current?.close(); } catch {}
      rtRef.current = null;
      setPeers({});
      setTransport("");
    };
  }, [WS_URL, code, nickname]);

  // nickname change broadcast
  useEffect(() => {
    try {
      rtRef.current?.emit("nick", { code, clientId: clientIdRef.current, nickname });
      setPeers(prev => prev[clientIdRef.current] ? {
        ...prev, [clientIdRef.current]: { ...prev[clientIdRef.current], nickname }
      } : prev);
    } catch {}
  }, [nickname, code]);

  const emit = (event: string, payload?: any) => { try { rtRef.current?.emit(event, payload); } catch {} };

  const canCreate = code.length === 0;
  const canJoin  = code.length === 6;

  const fetchState = async (c: string) => {
    const r = await fetch(`/api/party/state?code=${c}`);
    if (!r.ok) return null;
    const j = (await r.json()) as PartyState;
    setState(j);
    return j;
  };

  const onCreate = async () => {
    const r = await fetch("/api/party/create", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ nickname })
    });
    const j = await r.json();
    if (!r.ok) return alert("Create failed");

    setCode(j.code);
    setMemberId(j.memberId);
    iCreatedRef.current = true;
    myJoinTsRef.current = Date.now();
    await fetchState(j.code);

    const payload = { code: j.code, clientId: clientIdRef.current, nickname, ts: myJoinTsRef.current, creator: true };
    setPeers({ [clientIdRef.current]: { ...(payload as any), lastSeen: Date.now() } });
    emit("hello", payload);
    emit("here",  payload);
  };

  const onJoin = async () => {
    const r = await fetch("/api/party/join", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code, nickname })
    });
    const j = await r.json();
    if (!r.ok) return alert("Join failed");

    setMemberId(j.memberId);
    iCreatedRef.current = false;
    myJoinTsRef.current = Date.now();
    await fetchState(code);

    const payload = { code, clientId: clientIdRef.current, nickname, ts: myJoinTsRef.current, creator: false };
    upsertPeer({ ...(payload as any), lastSeen: Date.now() });
    emit("hello", payload);
    emit("here",  payload);
  };

  const onLeave = () => {
    try { emit("bye", { code, clientId: clientIdRef.current }); } catch {}
    setState(null);
    setMemberId(null);
    setPeers({});
    setLastSpin(null);
  };

  const pushPrefs = async (next: Partial<z.infer<typeof PrefsSchema>>) => {
    const merged = { ...prefs, ...next };
    setPrefs(merged);
    emit("prefs_update", { code: state?.party?.code, memberId, prefs: merged });

    if (!state || !memberId) return;
    const r = await fetch("/api/party/update", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ partyId: state.party.id, memberId, prefs: merged })
    });
    if (r.ok) {
      const j = await r.json();
      setState(s => (s ? { ...s, party: { ...s.party, constraints: j.merged } } : s));
    }
  };

  const onHostSpin = async () => {
    if (!state || !isHost) return;
    const categories = ["main", "veggie", "soup", "meat", "dessert"];
    const r = await fetch("/api/party/spin", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code: state.party.code, categories })
    });
    const j = await r.json();
    if (!r.ok) return alert("Spin failed");
    setLastSpin(j.selection);
    emit("spin_result", { code: state.party.code, selection: j.selection });
  };

  // show anyone with a recent heartbeat (no nickname-based delay)
  const livePeers = useMemo(() => {
    const now = Date.now();
    return Object.values(peers).filter(p => now - p.lastSeen <= 10_000);
  }, [peers]);

  const displayOrder = useMemo(() => {
    return [...livePeers].sort((a, b) => {
      if (!!a.creator !== !!b.creator) return a.creator ? -1 : 1;
      return a.ts - b.ts;
    });
  }, [livePeers]);

  const chipStyle = (peerId: string, isHostChip: boolean) => {
    if (isHostChip) return "bg-orange-500 text-black border-orange-400";
    if (peerId === clientIdRef.current) return "bg-sky-500 text-black border-sky-400";
    return "bg-white dark:bg-neutral-800 dark:border-neutral-700";
  };

  const copyInvite = async () => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("code", (state?.party.code || code || "").toUpperCase());
      await navigator.clipboard.writeText(url.toString());
      alert("Invite link copied!");
    } catch {
      alert("Copy failed — share the code instead.");
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-[280px_1fr]">
      {/* Left: create/join */}
      <div className="rounded-2xl border bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mb-2 text-sm font-semibold">Party</div>

        <label className="mb-1 block text-xs text-neutral-600 dark:text-neutral-300">Code</label>
        <input
          value={code}
          onChange={(e) => setCode(e.currentTarget.value.toUpperCase().slice(0, 6))}
          placeholder="ABC123"
          className="mb-2 w-full rounded border px-2 py-1 bg-white dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-100"
          aria-label="Party Code"
        />

        <label className="mb-1 block text-xs text-neutral-600 dark:text-neutral-300">Nickname</label>
        <input
          value={nickname}
          onChange={(e) => setNickname(e.currentTarget.value.slice(0, 24))}
          placeholder="Your name"
          className="mb-3 w-full rounded border px-2 py-1 bg-white dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-100"
          aria-label="Nickname"
        />

        <div className="flex flex-wrap gap-2">
          <button
            className="rounded-md border px-3 py-1 text-sm bg-white hover:bg-neutral-100
                       dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:border-neutral-700 dark:text-neutral-100
                       disabled:opacity-50"
            onClick={onCreate}
            disabled={!canCreate}
            type="button"
          >
            Create
          </button>
          <button
            className="rounded-md border px-3 py-1 text-sm bg-white hover:bg-neutral-100
                       dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:border-neutral-700 dark:text-neutral-100
                       disabled:opacity-50"
            onClick={onJoin}
            disabled={!canJoin}
            type="button"
          >
            Join
          </button>
          <button
            className="inline-flex items-center gap-1 rounded-md border px-3 py-1 text-sm bg-white hover:bg-neutral-100
                       dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:border-neutral-700 dark:text-neutral-100"
            onClick={copyInvite}
            disabled={!state?.party.code && code.length !== 6}
            title="Copy invite link"
            type="button"
          >
            <LinkIcon className="h-3.5 w-3.5" />
            Invite
          </button>
          <button
            className="inline-flex items-center gap-1 rounded-md border px-3 py-1 text-sm bg-white hover:bg-neutral-100
                       dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:border-neutral-700 dark:text-neutral-100"
            onClick={onLeave}
            title="Leave this party"
            disabled={!state}
            type="button"
          >
            <LogOut className="h-3.5 w-3.5" />
            Leave
          </button>
        </div>

        {state && (
          <div className="mt-3 rounded border p-2 text-xs dark:border-neutral-700">
            You’re in party <span className="font-mono">{state.party.code}</span>
            {memberId ? "" : " (viewing)"}
          </div>
        )}
      </div>

      {/* Right: prefs & merged view */}
      <div className="rounded-2xl border bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
        {state ? (
          <>
            <div className="mb-2 flex items-center gap-2">
              <div className="text-sm font-semibold">Participants</div>
              <span className="rounded-full border px-2 py-0.5 text-[10px] opacity-70 dark:border-neutral-700">
                {transport || "…"}
              </span>
              <button
                onClick={() => {
                  const payload = {
                    code,
                    clientId: clientIdRef.current,
                    nickname,
                    ts: myJoinTsRef.current,
                    creator: iCreatedRef.current,
                  };
                  emit("hello", payload);
                  emit("here", payload);
                }}
                className="text-[10px] rounded border px-2 py-0.5 opacity-80 hover:opacity-100 dark:border-neutral-700"
                title="Re-announce presence to this room"
                type="button"
              >
                Ping room
              </button>
            </div>

            <div className="mb-3 flex flex-wrap gap-2">
              {displayOrder.map((p) => {
                const isHostChip = p.id === hostId;
                const isSelfChip = p.id === clientIdRef.current;
                const style = chipStyle(p.id, isHostChip);
                return (
                  <span
                    key={p.id}
                    className={["inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs", style].join(" ")}
                    title={isHostChip ? "Host" : isSelfChip ? "You" : undefined}
                  >
                    {isHostChip && <Crown className="h-3 w-3" />}
                    {p.nickname}
                    {isSelfChip ? " (you)" : ""}
                  </span>
                );
              })}
            </div>

            <div className="mb-2 text-sm font-semibold">Your preferences</div>

            <div className="mb-2 text-xs text-neutral-600 dark:text-neutral-300">Diet</div>
            <div className="mb-3 flex flex-wrap gap-2">
              {DietEnum.options.map((d) => (
                <Chip key={d} active={prefs.diet === d} onClick={() => setPrefs({ ...prefs, diet: d })}>
                  {d}
                </Chip>
              ))}
              <Chip active={!prefs.diet} onClick={() => setPrefs({ ...prefs, diet: undefined })}>
                none
              </Chip>
            </div>

            <div className="mb-2 text-xs text-neutral-600 dark:text-neutral-300">Allergens</div>
            <div className="mb-3 flex flex-wrap gap-2">
              {AllergenEnum.options.map((a) => {
                const active = (prefs.allergens ?? []).includes(a);
                return (
                  <Chip
                    key={a}
                    active={active}
                    onClick={() => {
                      const set = new Set(prefs.allergens ?? []);
                      if (active) set.delete(a); else set.add(a);
                      setPrefs({ ...prefs, allergens: Array.from(set) });
                      emit("prefs_update", { code: state?.party?.code, memberId, prefs: { ...prefs, allergens: Array.from(set) } });
                    }}
                  >
                    {a.replace("_", " ")}
                  </Chip>
                );
              })}
            </div>

            <div className="mb-2 grid grid-cols-2 gap-4">
              <div>
                <div className="mb-2 text-xs text-neutral-600 dark:text-neutral-300">Budget (1=cheap)</div>
                <div className="flex gap-2">
                  {[1, 2, 3].map((n) => (
                    <Chip key={n} active={(prefs as any).budgetBand === n} onClick={() => setPrefs({ ...prefs, budgetBand: n })}>
                      {n}
                    </Chip>
                  ))}
                </div>
              </div>
              <div>
                <div className="mb-2 text-xs text-neutral-600 dark:text-neutral-300">Time (1=≤30m)</div>
                <div className="flex gap-2">
                  {[1, 2, 3].map((n) => (
                    <Chip key={n} active={(prefs as any).timeBand === n} onClick={() => setPrefs({ ...prefs, timeBand: n })}>
                      {n}
                    </Chip>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border p-3 dark:border-neutral-800">
              <div className="mb-1 text-sm font-semibold">Merged constraints</div>
              <pre className="max-h-40 overflow-auto rounded bg-neutral-50 p-2 text-xs dark:bg-neutral-800 dark:text-neutral-100">
{JSON.stringify(state?.party?.constraints ?? {}, null, 2)}
              </pre>
              <div className="mt-2">
                <button
                  className="rounded-md border px-3 py-1 text-sm bg-white hover:bg-neutral-100
                             dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:border-neutral-700 dark:text-neutral-100"
                  onClick={onHostSpin}
                  disabled={!isHost}
                  title={isHost ? "Spin for the party" : "Only the host can spin"}
                  type="button"
                >
                  Host Spin
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-sm text-neutral-600 dark:text-neutral-300">
            Create a party or join with a 6-char code.
          </div>
        )}
      </div>
    </div>
  );
}

export { PartyClient };
export default PartyClient;
