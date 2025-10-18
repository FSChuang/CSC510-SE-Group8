"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents, SessionState } from "../../ws-server/src/types";
import { z } from "zod";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:7071";

export default function PartyClient() {
  const [code, setCode] = useState<string>("");
  const [nickname, setNickname] = useState<string>("");
  const [session, setSession] = useState<SessionState | null>(null);
  const [isHost, setIsHost] = useState(false);
  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const [powerUps, setPowerUps] = useState({ healthy: 0.5, cheap: 0.5, t30: 0.5 });

  const canCreate = useMemo(() => nickname.trim().length > 0, [nickname]);
  const canJoin = useMemo(() => nickname.trim().length > 0 && code.trim().length === 6, [nickname, code]);

  useEffect(() => {
    const socket = io(WS_URL, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("session_state", (s) => setSession(s));
    socket.on("spin_result", (payload) => {
      console.log("Spin:", payload.result.join(", "), "seed:", payload.seed);
    });
    socket.on("error_msg", (e) => {
      console.warn("Party error:", e.code, e.message);
    });

    const iv = setInterval(() => {
      socket.emit("heartbeat");
    }, 15000);

    return () => {
      clearInterval(iv);
      socket.disconnect();
    };
  }, []);

  function createSession() {
    socketRef.current?.emit("create_session", { nickname }, (resp: any) => {
      if (resp?.ok && resp.code) {
        setCode(resp.code);
        setIsHost(true);
      }
    });
  }

  function joinSession() {
    socketRef.current?.emit("join_session", { code: code.toUpperCase(), nickname }, (resp: any) => {
      if (resp?.ok) setIsHost(false);
    });
  }

  function doSpin() {
    socketRef.current?.emit("spin_request", { seed: Math.random().toString(36).slice(2, 8) });
  }

  function updatePowerUps(partial: Partial<typeof powerUps>) {
    const next = { ...powerUps, ...partial };
    setPowerUps(next);
    socketRef.current?.emit("update_powerups", next);
  }

  return (
    <div className="rounded-md border bg-white p-4 space-y-3">
      <div className="flex gap-2">
        <input
          placeholder="Nickname"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          className="border px-2 py-1 rounded"
        />
        <button
          onClick={createSession}
          disabled={!canCreate}
          className="px-3 py-1 rounded bg-emerald-600 text-white disabled:opacity-50"
        >
          Create
        </button>
        <input
          placeholder="CODE"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          maxLength={6}
          className="border px-2 py-1 rounded w-24 text-center tracking-widest"
        />
        <button
          onClick={joinSession}
          disabled={!canJoin}
          className="px-3 py-1 rounded bg-blue-600 text-white disabled:opacity-50"
        >
          Join
        </button>
        {isHost && (
          <button onClick={doSpin} className="ml-auto px-3 py-1 rounded bg-black text-white">
            Host Spin
          </button>
        )}
      </div>

      {session && (
        <div className="text-sm">
          <div className="mb-2">
            <strong>Code:</strong> <span className="font-mono">{session.code}</span>
          </div>
          <div className="mb-2">
            <strong>Members:</strong>{" "}
            {session.members.map((m) => (
              <span key={m.id} className="mr-2">{m.nickname}</span>
            ))}
          </div>
          <div className="mb-2">
            <strong>Merged:</strong>{" "}
            <span className="font-mono">
              budget≤{session.mergedConstraints.budgetMax ?? "∞"}; time≤{session.mergedConstraints.timeMaxMin ?? "∞"}m
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <label className="text-xs">
              Healthy
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={powerUps.healthy}
                onChange={(e) => updatePowerUps({ healthy: parseFloat(e.target.value) })}
                className="w-full"
              />
            </label>
            <label className="text-xs">
              Cheap
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={powerUps.cheap}
                onChange={(e) => updatePowerUps({ cheap: parseFloat(e.target.value) })}
                className="w-full"
              />
            </label>
            <label className="text-xs">
              ≤30m
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={powerUps.t30}
                onChange={(e) => updatePowerUps({ t30: parseFloat(e.target.value) })}
                className="w-full"
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
