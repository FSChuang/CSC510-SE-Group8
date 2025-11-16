"use client";

/* eslint-disable @typescript-eslint/no-unused-expressions */

import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import { Crown, Link as LinkIcon, LogOut, Shuffle, RotateCcw, Lock, Unlock, ThumbsUp } from "lucide-react";
import { z } from "zod";
import { PrefsSchema, DietEnum, AllergenEnum } from "@/lib/party";
import { getRealtimeForRoom } from "@/lib/realtime";
import PlacesMapCard from "@/components/PlacesMapCard";

/** ——— Presence tuning ——— */
const HEARTBEAT_MS = 15_000;   // send a beat every 15s
const PEER_TTL_MS  = 120_000;  // consider peers alive for 2 minutes since lastSeen

/** ————— Types ————— */
type Dish = {
  id: string;
  name: string;
  category: string;
  tags: string[];
  allergens: string[];
  ytQuery?: string;
};
type SpinTriple = [Dish|null, Dish|null, Dish|null];

type PartyState = {
  party: { id: string; code: string; isActive: boolean; constraints?: any };
  members: { id: string; nickname?: string; prefs: z.infer<typeof PrefsSchema> }[];
};

type Peer = { id: string; nickname: string; creator: boolean; lastSeen: number };

type ChatMsg = { id: string; ts: number; from: string; text: string };

type VotePacket = { idx: 0|1|2; kind: "keep"|"reroll"; voterId: string };

/** ————— Utils ————— */
const now = () => Date.now();
const byCreated = (a: Peer, b: Peer) =>
  a.creator === b.creator ? a.id.localeCompare(b.id) : a.creator ? -1 : 1;

function ToggleChip({
  active, children, onClick
}: { active?: boolean; children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-full border px-3 py-1 text-xs transition-colors",
        active
          ? "bg-neutral-200 text-neutral-900 border-neutral-300 dark:bg-neutral-700 dark:text-white dark:border-neutral-600"
          : "bg-white text-neutral-900 border-neutral-300 hover:bg-neutral-50 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800",
      ].join(" ")}
      aria-pressed={!!active}
    >
      {children}
    </button>
  );
}

function Ribbon({children}:{children:React.ReactNode}) {
  return <div className="mb-2 text-sm font-semibold">{children}</div>;
}
function Pill({children}:{children:React.ReactNode}) {
  return <span className="rounded-full border px-2 py-0.5 text-xs bg-neutral-100 border-neutral-300 text-neutral-900 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-100">{children}</span>;
}
function Card({children}:{children:React.ReactNode}) {
  return <div className="rounded-2xl border bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">{children}</div>;
}

/** ————— Component ————— */
export default function PartyClient({ code: initialCode }: { code?: string }) {
  /** nickname (persist) */
  const [nickname, setNickname] = useState<string>(() => {
    try { return localStorage.getItem("mealslot_nickname") || "Guest"; } catch { return "Guest"; }
  });
  useEffect(() => { try { localStorage.setItem("mealslot_nickname", nickname); } catch {} }, [nickname]);

  /** membership + server */
  const [code, setCode] = useState<string>(initialCode?.toUpperCase() ?? "");
  const [activeCode, setActiveCode] = useState<string>("");
  const [memberId, setMemberId] = useState<string | null>(null);
  const [state, setState] = useState<PartyState | null>(null);

  /** presence */
  const [peers, setPeers] = useState<Record<string, Peer>>({});
  const [transport, setTransport] = useState<string>("");

  /** spin filters */
  const [cats, setCats] = useState<{breakfast:boolean; lunch:boolean; dinner:boolean; dessert:boolean}>({
    breakfast:false,lunch:false,dinner:true,dessert:false
  });
  const [powerups, setPowerups] = useState<{healthy?:boolean; cheap?:boolean; fast?:boolean}>({});

  /** prefs */
  const [prefs, setPrefs] = useState<z.infer<typeof PrefsSchema>>({});

  /** spin state */
  const [isSpinning, setIsSpinning] = useState(false);
  const [slots, setSlots] = useState<SpinTriple>([null,null,null]);
  const [locks, setLocks] = useState<[boolean,boolean,boolean]>([false,false,false]);
  const [recent, setRecent] = useState<string[]>([]);

  /** votes per slot (keep / reroll) */
  const [votes, setVotes] = useState<[{keep:Set<string>;reroll:Set<string>},{keep:Set<string>;reroll:Set<string>},{keep:Set<string>;reroll:Set<string>}]>([
    { keep:new Set(), reroll:new Set() },
    { keep:new Set(), reroll:new Set() },
    { keep:new Set(), reroll:new Set() },
  ]);
  const resetVotes = () => setVotes([
    { keep:new Set(), reroll:new Set() },
    { keep:new Set(), reroll:new Set() },
    { keep:new Set(), reroll:new Set() },
  ]);

  /** chat */
  const [chat, setChat] = useState<ChatMsg[]>([]);
  const chatInputRef = useRef<HTMLInputElement>(null);

  /** realtime */
  const rtRef = useRef<Awaited<ReturnType<typeof getRealtimeForRoom>> | null>(null);
  const clientIdRef = useRef<string>("");
  if (!clientIdRef.current) {
    try {
      const k = "party:clientId";
      const v = sessionStorage.getItem(k);
      if (v) {
        clientIdRef.current = v;
      } else {
        const id = crypto.randomUUID();
        sessionStorage.setItem(k, id);
        clientIdRef.current = id;
      }
    } catch {
      clientIdRef.current = crypto.randomUUID();
    }
  }
  const createdRef = useRef(false);

  /** refs for stable handlers */
  const slotsRef = useRef(slots); useEffect(()=>{ slotsRef.current = slots; },[slots]);
  const locksRef = useRef(locks); useEffect(()=>{ locksRef.current = locks; },[locks]);
  const livePeersRef = useRef<Peer[]>([]);

  /** computed */
  const livePeers = useMemo(() => {
    const arr = Object.values(peers);
    const pruned = arr.filter(p => now() - p.lastSeen <= PEER_TTL_MS);
    pruned.sort(byCreated);
    livePeersRef.current = pruned;
    return pruned;
  }, [peers]);

  const hostId = useMemo(() => livePeers.find(p=>p.creator)?.id ?? livePeers[0]?.id ?? null, [livePeers]);
  const iAmHost = !!memberId && hostId === memberId;
  const iAmHostRef = useRef(iAmHost); useEffect(()=>{ iAmHostRef.current = iAmHost; },[iAmHost]);

  const displayName = useMemo(() => {
    const me = state?.members.find(m => m.id === memberId);
    return me?.nickname || nickname;
  }, [memberId, nickname, state?.members]);

  const categoriesArray = useMemo(() => {
    const out:string[] = [];
    if (cats.breakfast) out.push("breakfast");
    if (cats.lunch) out.push("lunch");
    if (cats.dinner) out.push("dinner");
    if (cats.dessert) out.push("dessert");
    return out.length ? out : ["dinner"];
  }, [cats]);

  /** disconnect */
  const disconnect = useCallback(() => {
    try { rtRef.current?.emit("bye", { code: activeCode, clientId: clientIdRef.current }); } catch {}
    try { rtRef.current?.close(); } catch {}
    rtRef.current = null;
    setTransport("");
  }, [activeCode]);

  /** one-time system message */
  const pushedConnectedRef = useRef(false);
  const pushSys = useCallback((text: string) => {
    setChat(c => [...c, { id: crypto.randomUUID(), ts: Date.now(), from: "system", text }]);
  }, []);

  /** dedupe spin summaries */
  const lastSpinSummaryRef = useRef<string>("");

  /** helper: bump peer lastSeen for any id */
  const touchPeer = useCallback((id: string, mutateNickname?: string, creatorFlag?: boolean) => {
    setPeers(prev => {
      const ex = prev[id];
      return {
        ...prev,
        [id]: {
          id,
          nickname: mutateNickname ?? ex?.nickname ?? "Guest",
          creator: creatorFlag ?? ex?.creator ?? false,
          lastSeen: Date.now(),
        }
      };
    });
  }, []);

  /** realtime wiring — attach listeners once per room */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!activeCode || !memberId) { disconnect(); return; }

      const rt = await getRealtimeForRoom(activeCode);
      if (cancelled) { try{rt.close();}catch{}; return; }
      rtRef.current = rt;
      setTransport(rt.kind);

      const seenMsgIds = new Set<string>();

      // Presence
      rt.on("hello", (p:any) => {
        if (!p || p.code !== activeCode) return;
        touchPeer(p.clientId, p.nickname, !!p.creator);
        try { rt.emit("here", { code: activeCode, clientId: clientIdRef.current, nickname: displayName, creator: createdRef.current }); } catch {}
      });

      rt.on("here", (p:any) => {
        if (!p || p.code !== activeCode) return;
        touchPeer(p.clientId, p.nickname);
      });

      rt.on("beat", (p:any)=>{ if (!p || p.code!==activeCode) return;
        touchPeer(p.clientId);
      });

      rt.on("bye", (p:any)=>{ if (!p || p.code!==activeCode) return;
        setPeers(prev => { const cp={...prev}; delete cp[p.clientId]; return cp; });
      });

      // Nick
      rt.on("nick", (p:any)=>{ if (!p || p.code!==activeCode) return;
        touchPeer(p.clientId, p.nickname);
      });

      // Chat
      rt.on("chat", (m:any)=> {
        if (!m || m.code !== activeCode || !m.id || seenMsgIds.has(m.id)) return;
        seenMsgIds.add(m.id);
        touchPeer(m.clientId ?? "", undefined); // if server includes clientId, this keeps them fresh
        setChat(c => [...c, { id: m.id, ts: m.ts, from: m.from || "anon", text: String(m.text||"") }]);
      });

      // Spin sync
      rt.on("spin_result", (payload:any) => {
        if (!payload || payload.code !== activeCode) return;
        setSlots(payload.slots ?? [null,null,null]);
        setLocks(payload.locks ?? [false,false,false]);
        resetVotes();
        const summary: string = payload.summary || "";
        if (summary && summary !== lastSpinSummaryRef.current) {
          lastSpinSummaryRef.current = summary;
          setRecent(r => [summary, ...r].slice(0,30));
        }
      });

      rt.on("sync_request", (p:any) => {
        if (!iAmHostRef.current || !p || p.code !== activeCode) return;
        try {
          rt.emit("spin_result", {
            code: activeCode,
            slots: slotsRef.current,
            locks: locksRef.current,
            summary: lastSpinSummaryRef.current,
          });
        } catch {}
      });

      // Votes
      rt.on("vote", (v: VotePacket & {clientId?:string}) => {
        if (!v || v.idx === undefined) return;
        if (v.clientId) touchPeer(v.clientId);
        setVotes(prev => {
          const cp = [
            { keep:new Set(prev[0].keep), reroll:new Set(prev[0].reroll) },
            { keep:new Set(prev[1].keep), reroll:new Set(prev[1].reroll) },
            { keep:new Set(prev[2].keep), reroll:new Set(prev[2].reroll) },
          ] as typeof prev;
          cp[v.idx].keep.delete(v.voterId);
          cp[v.idx].reroll.delete(v.voterId);
          cp[v.idx][v.kind].add(v.voterId as string);
          return cp;
        });
        if (iAmHostRef.current) maybeActOnVotes(v.idx);
      });

      // announce + heartbeat
      try { rt.emit("hello", { code: activeCode, clientId: clientIdRef.current, nickname: displayName, creator: createdRef.current }); } catch {}
      // Heartbeat: also self-touch locally so we never prune ourselves even if server doesn't echo in throttled tabs
      const sendBeat = () => {
        try { rt.emit("beat",{ code: activeCode, clientId: clientIdRef.current}); } catch {}
        touchPeer(clientIdRef.current); // local keepalive
      };
      sendBeat();
      const hb = setInterval(sendBeat, HEARTBEAT_MS);

      // newbies request sync
      try { if (!iAmHostRef.current) rt.emit("sync_request", { code: activeCode, clientId: clientIdRef.current }); } catch {}

      if (!pushedConnectedRef.current) {
        pushSys(`Connected via ${rt.kind}.`);
        pushedConnectedRef.current = true;
      }

      // When tab becomes visible again, send an immediate beat
      const vis = () => { if (document.visibilityState === "visible") sendBeat(); };
      document.addEventListener("visibilitychange", vis);

      return () => { clearInterval(hb); document.removeEventListener("visibilitychange", vis); };
    })();

    return () => { cancelled = true; disconnect(); pushedConnectedRef.current = false; };
  }, [activeCode, memberId, displayName, disconnect, pushSys, touchPeer]);

  /** fetch server state */
  const fetchState = useCallback(async (c: string) => {
    const r = await fetch(`/api/party/state?code=${c}`, { cache: "no-store" });
    if (!r.ok) return null;
    const j = (await r.json()) as PartyState;
    setState(j);

    // seed peers from server order (host first)
    setPeers(prev => {
      const base = { ...prev };
      const host = j.members[0]?.id ?? null;
      for (const m of j.members) {
        base[m.id] = {
          id: m.id,
          nickname: m.nickname || "Guest",
          creator: m.id === host,
          lastSeen: Date.now(),
        };
      }
      return base;
    });
    return j;
  }, []);

  /** create/join/leave */
  const onCreate = useCallback(async () => {
    const r = await fetch("/api/party/create", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ nickname })
    });
    const j = await r.json();
    if (!r.ok) return alert(j?.error || "Create failed");

    setMemberId(j.memberId);
    createdRef.current = true;
    setActiveCode(j.code);
    clientIdRef.current = j.memberId;
    await fetchState(j.code);
    try { rtRef.current?.emit("nick", { code: j.code, clientId: j.memberId, nickname: j.nickname }); } catch {}
  }, [nickname, fetchState]);

  const onJoin = useCallback(async () => {
    if (!code || code.length !== 6) return alert("Enter a 6-char code");
    const r = await fetch("/api/party/join", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ code, nickname })
    });
    const j = await r.json();
    if (!r.ok) return alert(j?.error || "Join failed");

    setMemberId(j.memberId);
    createdRef.current = false;
    setActiveCode(code);
    clientIdRef.current = j.memberId;
    await fetchState(code);
    try { rtRef.current?.emit("nick", { code, clientId: j.memberId, nickname: j.nickname }); } catch {}
    try { rtRef.current?.emit("sync_request", { code, clientId: j.memberId }); } catch {}
  }, [code, nickname, fetchState]);

  const onLeave = useCallback(() => {
    disconnect(); setMemberId(null); setActiveCode(""); setPeers({}); setSlots([null,null,null]); setLocks([false,false,false]); resetVotes();
  }, [disconnect]);

  /** prefs push */
  const [prefsStateGuard] = useState(0); // no-op, keeps deps stable
    const pushPrefs = useCallback(async (next: Partial<z.infer<typeof PrefsSchema>>) => {
    const merged = { ...prefs, ...next };
    setPrefs(merged);
    if (!state?.party?.id || !memberId) return;
    const r = await fetch("/api/party/update", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ partyId: state.party.id, memberId, prefs: merged })
    });
    if (r.ok) {
      const j = await r.json();
      setState(s => s ? { ...s, party: { ...s.party, constraints: j.merged } } : s);
    }
    try { rtRef.current?.emit("prefs", { code: activeCode, memberId, prefs: merged }); } catch {}
  }, [prefs, state?.party?.id, memberId, activeCode, prefsStateGuard]);


  /** broadcast helpers */
  const summarize = (trip: SpinTriple) =>
    trip.map((d, i) => `${["Main","Side","Dessert"][i]}: ${d?.name ?? "—"}`).join(" · ");

  const emitSpinBroadcast = useCallback((trip: SpinTriple, lk: [boolean,boolean,boolean]) => {
    const summary = summarize(trip);
    lastSpinSummaryRef.current = summary;
    try { rtRef.current?.emit("spin_result", {
      code: activeCode, slots: trip, locks: lk, summary
    }); } catch {}
  }, [activeCode]);

  /** spinning (HOST ONLY) */
  const onGroupSpin = useCallback(async () => {
    if (!activeCode || !memberId) return alert("Join a party first");
    if (!iAmHost) return alert("Only the host can spin.");
    setIsSpinning(true);
    try {
      const endpoint = `${window.location.origin}/api/party/spin`;
      const r = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          code: activeCode,
          categories: categoriesArray,
          constraints: state?.party?.constraints || {},
          locked: locksRef.current,
          slots: slotsRef.current,
          powerups,
        }),
      });
      if (!r.ok) {
        const text = await r.text().catch(()=>"");
        throw new Error(`HTTP ${r.status} ${r.statusText} :: ${text}`);
      }
      const j = await r.json().catch(() => ({}));
      const trip = (j?.selection as SpinTriple) ?? [null, null, null];
      setSlots(trip);
      setRecent((rm) => [summarize(trip), ...rm].slice(0, 50));
      resetVotes();
      emitSpinBroadcast(trip, locksRef.current);
    } catch (e) {
      console.error(e);
      alert("Group spin failed.");
    } finally {
      setIsSpinning(false);
    }
  }, [activeCode, memberId, iAmHost, categoriesArray, state?.party?.constraints, powerups, emitSpinBroadcast]);

  const rerollSingleSlotHost = constUseCallbackRerollSingleSlotHost();

  function constUseCallbackRerollSingleSlotHost() {
    return useCallback(async (idx:0|1|2) => {
      if (!iAmHost) return;
      const lockedOverride:[boolean,boolean,boolean] = [true,true,true];
      lockedOverride[idx] = false; // only this slot changes
      setIsSpinning(true);
      try {
        const endpoint = `${window.location.origin}/api/party/spin`;
        const r = await fetch(endpoint, {
          method: "POST",
          headers: { "content-type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({
            code: activeCode,
            categories: categoriesArray,
            constraints: state?.party?.constraints || {},
            locked: lockedOverride,
            slots: slotsRef.current,
            powerups,
          }),
        });
        const j = await r.json().catch(() => ({}));
        const trip = (j?.selection as SpinTriple) ?? slotsRef.current;
        setSlots(trip);
        setRecent((rm)=>[summarize(trip), ...rm].slice(0,50));
        resetVotes();
        emitSpinBroadcast(trip, lockedOverride);
      } catch (e) {
        console.error(e);
        alert("Re-roll failed.");
      } finally {
        setIsSpinning(false);
      }
    }, [iAmHost, activeCode, categoriesArray, state?.party?.constraints, powerups, emitSpinBroadcast]);
  }

  /** lock toggles (host drives the authoritative lock) */
  const toggleLock = useCallback((idx:0|1|2) => {
    if (!iAmHost) return;
    setLocks(l => {
      const cp:[boolean,boolean,boolean] = [ ...l ] as any;
      cp[idx] = !cp[idx];
      locksRef.current = cp;
      emitSpinBroadcast(slotsRef.current, cp);
      return cp;
    });
  }, [iAmHost, emitSpinBroadcast]);

  /** votes: quorum and action */
  const quorum = useMemo(() => Math.max(1, Math.floor(livePeersRef.current.length/2) + 1), [livePeers]);

  const sendVote = useCallback((idx:0|1|2, kind:"keep"|"reroll") => {
    if (!activeCode || !memberId) return;
    const pkt: VotePacket = { idx, kind, voterId: memberId };
    // local optimistic update
    setVotes(prev => {
      const cp = [
        { keep:new Set(prev[0].keep), reroll:new Set(prev[0].reroll) },
        { keep:new Set(prev[1].keep), reroll:new Set(prev[1].reroll) },
        { keep:new Set(prev[2].keep), reroll:new Set(prev[2].reroll) },
      ] as typeof prev;
      cp[idx].keep.delete(memberId);
      cp[idx].reroll.delete(memberId);
      cp[idx][kind].add(memberId);
      return cp;
    });
    try { rtRef.current?.emit("vote", { ...pkt, code: activeCode, clientId: memberId }); } catch {}
    if (iAmHost) maybeActOnVotes(idx);
  }, [activeCode, memberId, iAmHost]);

  const maybeActOnVotes = (idx:0|1|2) => {
    const v = votes[idx];
    const keepCount = v.keep.size;
    const rerollCount = v.reroll.size;
    if (keepCount >= quorum) {
      setLocks(l => {
        const cp:[boolean,boolean,boolean] = [...l] as any;
        cp[idx] = true;
        locksRef.current = cp;
        emitSpinBroadcast(slotsRef.current, cp);
        return cp;
      });
      setVotes(prev => {
        const cp = [
          { keep:new Set(prev[0].keep), reroll:new Set(prev[0].reroll) },
          { keep:new Set(prev[1].keep), reroll:new Set(prev[1].reroll) },
          { keep:new Set(prev[2].keep), reroll:new Set(prev[2].reroll) },
        ] as typeof prev;
        cp[idx] = { keep:new Set(), reroll:new Set() };
        return cp;
      });
    } else if (rerollCount >= quorum) {
      rerollSingleSlotHost(idx);
    }
  };

  /** chat */
  const sendChat = useCallback((text: string) => {
    if (!text.trim() || !activeCode) return;
    const msg: ChatMsg = { id: crypto.randomUUID(), ts: Date.now(), from: displayName, text };
    setChat(c => [...c, msg]); // local echo
    try { rtRef.current?.emit("chat", { ...msg, code: activeCode, clientId: memberId }); } catch {}
  }, [activeCode, displayName, memberId]);

  /** ——— Render helpers ——— */
  const SpinCard = ({slot, idx}:{slot:Dish|null; idx:0|1|2}) => {
    const v = votes[idx];
    const myId = memberId || "";
    const iVotedKeep = v.keep.has(myId);
    const iVotedReroll = v.reroll.has(myId);

    return (
      <Card>
        <div className="mb-1 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-300">
          <div className="font-semibold">{["Main","Side","Dessert"][idx]}</div>
          <button
            type="button"
            onClick={()=>toggleLock(idx)}
            disabled={!iAmHost}
            className="inline-flex items-center gap-1 rounded border px-2 py-0.5 disabled:opacity-50 dark:border-neutral-700"
            title={iAmHost ? (locks[idx] ? "Unlock" : "Lock") : "Host only"}
          >
            {locks[idx] ? <Unlock className="h-3 w-3"/> : <Lock className="h-3 w-3"/>}
            {locks[idx] ? "Unlock" : "Lock"}
          </button>
        </div>

        <div className="mb-2">
          <div className="text-base font-semibold">{slot?.name ?? "No selection."}</div>
          {slot && (
            <div className="mt-1 flex flex-wrap gap-2">
              <Pill>{slot.category}</Pill>
              {slot.tags.slice(0,2).map(t => <Pill key={t}>{t}</Pill>)}
            </div>
          )}
        </div>

        {slot && (
          <>
            <div className="mb-1 text-xs text-neutral-500 dark:text-neutral-300">Allergens</div>
            <div className="mb-2 flex flex-wrap gap-2">
              {slot.allergens.length ? slot.allergens.map(a => <Pill key={a}>{a}</Pill>) : <span className="text-xs opacity-70">—</span>}
            </div>

            {/* Voting row */}
            <div className="mb-2 flex gap-2">
              <button
                type="button"
                onClick={()=>sendVote(idx,"keep")}
                className={[
                  "inline-flex items-center gap-1 rounded border px-2 py-1 text-xs dark:border-neutral-700",
                  iVotedKeep ? "bg-green-600 text-white border-green-600" : "hover:bg-neutral-50 dark:hover:bg-neutral-800"
                ].join(" ")}
                title="Vote to keep this dish"
              >
                <ThumbsUp className="h-3.5 w-3.5" /> Keep ({v.keep.size}/{Math.max(1, quorum)})
              </button>
              <button
                type="button"
                onClick={()=>sendVote(idx,"reroll")}
                className={[
                  "inline-flex items-center gap-1 rounded border px-2 py-1 text-xs dark:border-neutral-700",
                  iVotedReroll ? "bg-amber-600 text-white border-amber-600" : "hover:bg-neutral-50 dark:hover:bg-neutral-800"
                ].join(" ")}
                title="Vote to re-roll just this slot"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Re-roll ({v.reroll.size}/{Math.max(1, quorum)})
              </button>
            </div>

            <div>
              <a
                target="_blank" rel="noreferrer"
                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(slot.ytQuery || `${slot.name} recipe`)}`}
                className="inline-flex items-center gap-1 rounded border px-3 py-1 text-sm hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
              >
                Watch on YouTube
              </a>
            </div>
          </>
        )}
      </Card>
    );
  };

  /** UI gates */
  const canCreate = code.length === 0 && !memberId;
  const canJoin = code.length === 6 && !memberId;

  return (
    <div className="grid gap-4 lg:grid-cols-[420px_1fr]">
      {/* Left column */}
      <Card>
        <Ribbon>Party</Ribbon>

        <div className="mb-2 grid grid-cols-[1fr_auto] items-center gap-2">
          <label className="text-xs text-neutral-600 dark:text-neutral-300">Code</label><div />
          <input
            value={code}
            onChange={(e)=>setCode(e.currentTarget.value.toUpperCase().slice(0,6))}
            placeholder="ABC123"
            className="col-span-1 w-24 rounded border border-neutral-300 bg-white px-2 py-1 text-sm font-mono tracking-wider dark:border-neutral-700 dark:bg-neutral-800"
          />
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded border border-neutral-300 px-2 py-1 text-xs hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
            onClick={()=> code && navigator.clipboard.writeText(code)}
            disabled={!code}
            title="Copy code"
          >
            <LinkIcon className="h-3.5 w-3.5"/> Copy
          </button>
        </div>

        <div className="mb-3 grid grid-cols-[1fr_auto] items-center gap-2">
          <label className="text-xs text-neutral-600 dark:text-neutral-300">Your name</label><div />
          <input
            value={nickname}
            onChange={(e)=>setNickname(e.currentTarget.value.slice(0,24))}
            placeholder="Your name"
            className="col-span-1 w-40 rounded border border-neutral-300 bg-white px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-800"
          />
          <div />
        </div>

        <div className="mb-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={!canCreate}
            onClick={onCreate}
            className="rounded border border-neutral-300 bg-white px-2 py-1 text-sm hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-800/80"
          >
            Create
          </button>
          <button
            type="button"
            disabled={!canJoin}
            onClick={onJoin}
            className="rounded border border-neutral-300 bg-white px-2 py-1 text-sm hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-800/80"
          >
            Join
          </button>
        </div>

        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="text-xs text-neutral-600 dark:text-neutral-300">Transport: <span className="font-mono">{transport || "…"}</span></div>
          {memberId && (
            <button
              type="button" onClick={onLeave}
              className="inline-flex items-center gap-1 rounded border border-neutral-300 px-2 py-1 text-xs hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
              title="Leave party"
            >
              <LogOut className="h-3.5 w-3.5" /> Leave
            </button>
          )}
        </div>

        {state && activeCode && memberId && (
          <div className="mt-3 rounded border p-2 text-xs dark:border-neutral-700">
            You’re in party <span className="font-mono">{state.party.code}</span>
          </div>
        )}

        {/* Map area */}
        <div className="mt-6">
          <Ribbon>Eat Outside</Ribbon>
          <p className="mb-2 text-xs text-neutral-500 dark:text-neutral-400">Shows stubs based on your approximate location.</p>
          <PlacesMapCard height={300} />
        </div>
      </Card>

      {/* Right column */}
      <div className="grid gap-4">
        <Card>
          <div className="mb-2 flex items-center justify-between">
            <Ribbon>Members</Ribbon>
            <div className="text-xs text-neutral-600 dark:text-neutral-300">{livePeers.length} online</div>
          </div>

          <div className="mb-3 flex flex-wrap gap-2">
            {livePeers.map(p => {
              const tone = p.id === hostId ? "host" : (p.id === memberId ? "self" : "default");
              return (
                <span
                  key={p.id}
                  className={[
                    "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs",
                    tone==="host" ? "bg-orange-500 text-black border-orange-400"
                    : tone==="self" ? "bg-sky-500 text-black border-sky-400"
                    : "bg-neutral-100 text-neutral-900 border-neutral-300 dark:bg-neutral-800 dark:text-neutral-100 dark:border-neutral-700"
                  ].join(" ")}
                >
                  {tone==="host" && <Crown className="h-3 w-3" />} {p.nickname}{p.id===memberId ? " (you)":""}
                </span>
              );
            })}
          </div>

          {/* Categories & power-ups */}
          <div className="mb-3">
            <Ribbon>Categories</Ribbon>
            <div className="flex flex-wrap gap-2">
              {(["breakfast","lunch","dinner","dessert"] as const).map(k => (
                <ToggleChip key={k} active={(cats as any)[k]} onClick={()=>setCats(c=>({ ...c, [k]: !(c as any)[k] }))}>{k}</ToggleChip>
              ))}
            </div>
          </div>
          <div className="mb-3">
            <Ribbon>Power-Ups</Ribbon>
            <div className="flex flex-wrap gap-2">
              <ToggleChip active={!!powerups.healthy} onClick={()=>setPowerups(p=>({...p, healthy: !p.healthy}))}>Healthy</ToggleChip>
              <ToggleChip active={!!powerups.cheap} onClick={()=>setPowerups(p=>({...p, cheap: !p.cheap}))}>Cheap</ToggleChip>
              <ToggleChip active={!!powerups.fast} onClick={()=>setPowerups(p=>({...p, fast: !p.fast}))}>≤30m</ToggleChip>
            </div>
          </div>

          <div className="mb-3 flex items-center gap-2">
            <button
              type="button"
              disabled={!memberId || isSpinning || !iAmHost}
              onClick={onGroupSpin}
              className="inline-flex items-center gap-1 rounded border border-neutral-300 bg-white px-3 py-1 text-sm hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-800/80"
              title={iAmHost ? "Spin for the group" : "Host only"}
            >
              <Shuffle className="h-4 w-4" /> {isSpinning ? "Spinning…" : "Group Spin"}
            </button>
            <button
              type="button"
              disabled={!memberId || isSpinning || !iAmHost}
              onClick={()=>onGroupSpin()}
              className="inline-flex items-center gap-1 rounded border border-neutral-300 bg-white px-3 py-1 text-sm hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-800/80"
              title={iAmHost ? "Re-run spin" : "Host only"}
            >
              <RotateCcw className="h-4 w-4" /> Re-roll
            </button>
          </div>

          {/* Last spin */}
          <Ribbon>Last spin</Ribbon>
          <div className="grid gap-3 md:grid-cols-3">
            <SpinCard slot={slots[0]} idx={0}/>
            <SpinCard slot={slots[1]} idx={1}/>
            <SpinCard slot={slots[2]} idx={2}/>
          </div>

          {/* Recent spins */}
          <div className="mt-4">
            <Ribbon>Recent spins</Ribbon>
            <div className="text-xs text-neutral-600 dark:text-neutral-300">
              {recent.length ? recent.map((s,i)=><div key={i}>{s}</div>) : "Host rebroadcasts latest result to newcomers."}
            </div>
          </div>
        </Card>

        {/* Preferences */}
        <Card>
          <Ribbon>Your preferences</Ribbon>

          <div className="mb-1 text-xs text-neutral-600 dark:text-neutral-300">Diet</div>
          <div className="mb-3 flex flex-wrap gap-2">
            {DietEnum.options.map(d => (
              <ToggleChip key={d} active={prefs.diet===d} onClick={()=>pushPrefs({ diet: d })}>{d}</ToggleChip>
            ))}
            <ToggleChip active={!prefs.diet} onClick={()=>pushPrefs({ diet: undefined })}>none</ToggleChip>
          </div>

          <div className="mb-1 text-xs text-neutral-600 dark:text-neutral-300">Allergens</div>
          <div className="mb-3 flex flex-wrap gap-2">
            {AllergenEnum.options.map(a => {
              const active = (prefs.allergens ?? []).includes(a);
              return (
                <ToggleChip key={a} active={active} onClick={()=>{
                  const set = new Set(prefs.allergens ?? []);
                  active ? set.delete(a) : set.add(a);
                  pushPrefs({ allergens: Array.from(set) });
                }}>{a.replace("_"," ")}</ToggleChip>
              );
            })}
          </div>
        </Card>

        {/* Chat */}
        <Card>
          <Ribbon>Party chat</Ribbon>
          <div className="mb-2 max-h-40 overflow-auto rounded border p-2 text-xs dark:border-neutral-700">
            {chat.length === 0 ? <div className="opacity-60">No messages yet.</div> : chat.map(m => (
              <div key={m.id} className="mb-1">
                <span className="rounded bg-sky-600/20 px-1 py-0.5 font-medium">{m.from}</span>{" "}
                <span className="opacity-60">{new Date(m.ts).toLocaleTimeString()}</span>
                <div className="pl-1">{m.text}</div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              ref={chatInputRef}
              className="flex-1 rounded border border-neutral-300 bg-white px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-800"
              placeholder="Message…"
              onKeyDown={(e)=>{ if (e.key==="Enter") { const v=(e.currentTarget as HTMLInputElement).value; (e.currentTarget as HTMLInputElement).value=""; sendChat(v); }}}
            />
            <button
              type="button"
              onClick={()=>{ const v = chatInputRef.current?.value || ""; if (chatInputRef.current) chatInputRef.current.value=""; sendChat(v); }}
              className="rounded border border-neutral-300 bg-white px-3 py-1 text-sm hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-800/80"
            >
              Send
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}

export { PartyClient }
