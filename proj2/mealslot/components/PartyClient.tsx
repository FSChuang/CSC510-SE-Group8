"use client";

import { useEffect, useRef, useState } from "react";
import { DietEnum, AllergenEnum, PrefsSchema } from "@/lib/party";
import { z } from "zod";

type PartyState = {
  party: { id: string; code: string; isActive: boolean; constraints: any };
  members: { id: string; nickname?: string; prefs: z.infer<typeof PrefsSchema> }[];
};

function Chip({
  active,
  children,
  onClick,
  disabled,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      className={
        "rounded-full border px-3 py-1 text-sm " +
        (active ? "bg-neutral-900 text-white" : "bg-white") +
        (disabled ? " opacity-50" : "")
      }
      onClick={disabled ? undefined : onClick}
      aria-pressed={!!active}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export function PartyClient({ code: initialCode = "" }: { code?: string }) {
  const [code, setCode] = useState(initialCode);
  const [state, setState] = useState<PartyState | null>(null);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [nickname, setNickname] = useState<string>("Guest");
  const [prefs, setPrefs] = useState<z.infer<typeof PrefsSchema>>({});
  const [lastSpin, setLastSpin] = useState<any[] | null>(null);
  const [partyMembers, setPartyMembers] = useState<any[]>([]);
  const [memberPrefs, setMemberPrefs] = useState<Record<string, any>>({});

  // ✅ Remember memberId only within this tab
  useEffect(() => {
    const savedMember = sessionStorage.getItem("memberId");
    if (savedMember) setMemberId(savedMember);
  }, []);

  useEffect(() => {
    if (memberId) sessionStorage.setItem("memberId", memberId);
  }, [memberId]);

  // WebSocket optional
  const sockRef = useRef<any | null>(null);
  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:4001";
    let mounted = true;
    import("socket.io-client")
      .then(({ io }) => {
        const sock = io(url, { transports: ["websocket"] });
        sockRef.current = sock;

        sock.on("spin_result", (payload: any) => {
          if (!mounted) return;
          if (payload?.code === code) setLastSpin(payload.selection);
        });

        sock.on("party_state", (payload: any) => {
          if (payload?.code === code) setPartyMembers(payload.members || []);
        });

        sock.on("prefs_update", (payload: any) => {
          if (payload?.code === code) {
            setMemberPrefs((prev) => ({
              ...prev,
              [payload.memberId]: payload.prefs,
            }));
          }
        });
      })
      .catch(() => {});

    return () => {
      mounted = false;
      if (sockRef.current) sockRef.current.close();
      sockRef.current = null;
    };
  }, [code]);

  const canCreate = code.length === 0;
  const canJoin = code.length === 6;

  const fetchState = async (c: string) => {
    const r = await fetch(`/api/party/state?code=${c}`);
    if (r.ok) {
      const j = (await r.json()) as PartyState;
      setState(j);
      setPartyMembers(j.members);
      return j;
    }
    return null;
  };

  // ✅ Auto-refresh (poll members every 3s)
  useEffect(() => {
    if (!code) return;
    const interval = setInterval(() => fetchState(code), 3000);
    return () => clearInterval(interval);
  }, [code]);

  const onCreate = async () => {
    const r = await fetch("/api/party/create", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ nickname }),
    });
    const j = await r.json();
    if (r.ok) {
      setCode(j.code);
      setMemberId(j.memberId);
      fetchState(j.code);
      try {
        sockRef.current?.emit?.("join", j.code);
      } catch {}
    } else alert("Create failed");
  };

  const onJoin = async () => {
    if (nickname.trim().length === 0) return alert("Enter your name first!");
    if (code.length !== 6) return alert("Enter a valid 6-char code!");

    const r = await fetch("/api/party/join", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code, nickname }),
    });
    const j = await r.json();
    if (r.ok) {
      setMemberId(j.memberId);
      fetchState(code);
      try {
        sockRef.current?.emit?.("join", code);
      } catch {}
    } else alert("Join failed");
  };

  const pushPrefs = async (next: Partial<z.infer<typeof PrefsSchema>>) => {
    const merged = { ...prefs, ...next };
    setPrefs(merged);
    sockRef.current?.emit?.("update_prefs", {
      code: state?.party?.code,
      memberId,
      prefs: merged,
    });
    if (!state || !memberId) return;
    await fetch("/api/party/update", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        partyId: state.party.id,
        memberId,
        prefs: merged,
      }),
    }).then(async (r) => {
      if (r.ok) {
        const j = await r.json();
        setState((s) =>
          s ? { ...s, party: { ...s.party, constraints: j.merged } } : s
        );
      }
    });
  };

  const onHostSpin = async () => {
    if (!state) return;
    const categories = ["main", "veggie", "soup", "meat", "dessert"];
    const r = await fetch("/api/party/spin", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code: state.party.code, categories }),
    });
    const j = await r.json();
    if (r.ok) setLastSpin(j.selection);
    else alert("Spin failed");
  };

  return (
    <div className="grid gap-4 md:grid-cols-[280px_1fr]">
      {/* Left: create/join */}
      <div className="rounded-2xl border bg-white p-3">
        <div className="mb-2 text-sm font-semibold">Party</div>
        <div className="mb-1 text-xs text-neutral-600">Code</div>
        <input
          value={code}
          onChange={(e) =>
            setCode(e.currentTarget.value.toUpperCase().slice(0, 6))
          }
          placeholder="ABC123"
          className="mb-2 w-full rounded border px-2 py-1"
          aria-label="Party Code"
        />
        <div className="mb-2 text-xs text-neutral-600">Nickname</div>
        <input
          value={nickname}
          onChange={(e) => setNickname(e.currentTarget.value.slice(0, 24))}
          placeholder="Your name"
          className="mb-3 w-full rounded border px-2 py-1"
          aria-label="Nickname"
        />
        <div className="flex gap-2">
          <button
            className="rounded-md border px-3 py-1 text-sm"
            onClick={onCreate}
            disabled={!canCreate}
          >
            Create
          </button>
          <button
            className="rounded-md border px-3 py-1 text-sm"
            onClick={onJoin}
            disabled={!canJoin}
          >
            Join
          </button>
        </div>
        {state && (
          <div className="mt-3 rounded border p-2 text-xs">
            You’re in party <span className="font-mono">{state.party.code}</span>
            {memberId ? "" : " (viewing)"}
          </div>
        )}
      </div>

      {/* Right: prefs & merged view */}
      <div className="rounded-2xl border bg-white p-3">
        {state ? (
          <>
            <div className="mb-2 text-sm font-semibold">Participants</div>
            <div className="mb-3 flex flex-wrap gap-2">
              {state.members.map((m) => (
                <span
                  key={m.id}
                  className="rounded-full border px-2 py-0.5 text-xs"
                >
                  {m.nickname ?? "Guest"}
                </span>
              ))}
            </div>

            <div className="mb-2 text-sm font-semibold">Your preferences</div>
            <div className="mb-2 text-xs text-neutral-600">Diet</div>
            <div className="mb-3 flex flex-wrap gap-2">
              {DietEnum.options.map((d) => (
                <Chip
                  key={d}
                  active={prefs.diet === d}
                  onClick={() => pushPrefs({ diet: d })}
                >
                  {d}
                </Chip>
              ))}
              <Chip
                active={!prefs.diet}
                onClick={() => pushPrefs({ diet: undefined })}
              >
                none
              </Chip>
            </div>

            <div className="mb-2 text-xs text-neutral-600">Allergens</div>
            <div className="mb-3 flex flex-wrap gap-2">
              {AllergenEnum.options.map((a) => {
                const active = (prefs.allergens ?? []).includes(a);
                return (
                  <Chip
                    key={a}
                    active={active}
                    onClick={() => {
                      const set = new Set(prefs.allergens ?? []);
                      if (active) set.delete(a);
                      else set.add(a);
                      pushPrefs({ allergens: Array.from(set) });
                    }}
                  >
                    {a.replace("_", " ")}
                  </Chip>
                );
              })}
            </div>

            <div className="mb-2 grid grid-cols-2 gap-4">
              <div>
                <div className="mb-2 text-xs text-neutral-600">
                  Budget (1=cheap)
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3].map((n) => (
                    <Chip
                      key={n}
                      active={prefs.budgetBand === n}
                      onClick={() => pushPrefs({ budgetBand: n })}
                    >
                      {n}
                    </Chip>
                  ))}
                </div>
              </div>
              <div>
                <div className="mb-2 text-xs text-neutral-600">
                  Time (1=≤30m)
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3].map((n) => (
                    <Chip
                      key={n}
                      active={prefs.timeBand === n}
                      onClick={() => pushPrefs({ timeBand: n })}
                    >
                      {n}
                    </Chip>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border p-3">
              <div className="mb-1 text-sm font-semibold">Merged constraints</div>
              <pre className="max-h-40 overflow-auto rounded bg-neutral-50 p-2 text-xs">
                {JSON.stringify(state.party.constraints, null, 2)}
              </pre>
              <div className="mt-2">
                <button
                  className="rounded-md border px-3 py-1 text-sm"
                  onClick={onHostSpin}
                >
                  Host Spin
                </button>
              </div>
              {lastSpin && (
                <>
                  <div className="mt-3 text-sm font-semibold">
                    Last Spin (live)
                  </div>
                  <pre className="max-h-40 overflow-auto rounded bg-neutral-50 p-2 text-xs">
                    {JSON.stringify(lastSpin, null, 2)}
                  </pre>
                </>
              )}
            </div>

            <div className="mt-4 rounded-2xl border p-3">
              <div className="mb-2 text-sm font-semibold">Live Party Overview</div>
              {partyMembers.length === 0 ? (
                <div className="text-xs text-neutral-500">No members yet.</div>
              ) : (
                <ul className="space-y-1 text-xs">
                  {partyMembers.map((m) => (
                    <li key={m.id} className="border-b pb-1">
                      <span className="font-medium">
                        {m.nickname ?? m.id.slice(0, 6)}
                      </span>
                      {" — "}
                      {memberPrefs[m.id]
                        ? JSON.stringify(memberPrefs[m.id])
                        : "no preferences yet"}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        ) : (
          <div className="text-sm text-neutral-600">
            Create a party or join with a 6-char code.
          </div>
        )}
      </div>
    </div>
  );
}

export default PartyClient;
