import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import seedrandom from "seedrandom";
import { CreateSessionZ, JoinSessionZ, UpdateConstraintsZ, UpdatePowerUpsZ, SpinReqZ, type ClientToServerEvents, type ServerToClientEvents, type SessionMember, type SessionState } from "./types.js";
import { mergeConstraints } from "./merge.js";

// Minimal scoring duplicate for determinism (no shared import to keep server independent)
type Dish = { name: string; category: "meat" | "veg" | "staple" | "soup"; tags: string[]; time_min?: number; price_cents?: number; healthScore?: number; };
const DISHES: Dish[] = [
  { name: "Grilled Chicken", category: "meat", tags: ["protein"], time_min: 25, price_cents: 500, healthScore: 0.7 },
  { name: "Tofu Steak", category: "meat", tags: ["vegetarian"], time_min: 15, price_cents: 300, healthScore: 0.8 },
  { name: "Lentil Curry", category: "veg", tags: ["vegan"], time_min: 30, price_cents: 250, healthScore: 0.85 },
  { name: "Fried Rice", category: "staple", tags: ["rice"], time_min: 18, price_cents: 180, healthScore: 0.55 },
  { name: "Miso Soup", category: "soup", tags: ["umami"], time_min: 7, price_cents: 100, healthScore: 0.8 }
];

function softmax(xs: number[], t = 0.6) {
  const maxX = Math.max(...xs);
  const exps = xs.map((x) => Math.exp((x - maxX) / t));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / (sum || 1));
}
function pick<T>(rng: seedrandom.prng, xs: T[], ps: number[]) {
  let r = rng.quick();
  let acc = 0;
  for (let i = 0; i < xs.length; i++) {
    acc += ps[i];
    if (r <= acc) return xs[i];
  }
  return xs[xs.length - 1];
}
function score(d: Dish, pu: { healthy?: number; cheap?: number; t30?: number }) {
  const invPrice = 1 - Math.min(1, (d.price_cents ?? 0) / 1000);
  const invTime = 1 - Math.min(1, (d.time_min ?? 0) / 60);
  let s = 0;
  s += 3 * (pu.healthy ?? 0) * (d.healthScore ?? 0.5);
  s += 3 * (pu.cheap ?? 0) * invPrice;
  if ((pu.t30 ?? 0) > 0) {
    const over = (d.time_min ?? 0) > 30 ? -1 : 0;
    s += over * (pu.t30 ?? 0) + 2 * (pu.t30 ?? 0) * invTime;
  }
  return s;
}

// In-memory rooms (MVP)
type Room = {
  code: string;
  hostId: string;
  members: Map<string, SessionMember>;
  powerUps: { healthy: number; cheap: number; t30: number };
  state: Record<string, unknown>;
  expiresAt: number;
};
const rooms = new Map<string, Room>();

const appServer = http.createServer();
const io = new Server<ClientToServerEvents, ServerToClientEvents>(appServer, {
  cors: { origin: true, credentials: true }
});

const PORT = parseInt(process.env.PORT || "7071", 10);

io.on("connection", (socket) => {
  let currentRoom: Room | null = null;

  function emitState() {
    if (!currentRoom) return;
    const s: SessionState = {
      code: currentRoom.code,
      members: Array.from(currentRoom.members.values()),
      mergedConstraints: mergeConstraints(Array.from(currentRoom.members.values())),
      state: currentRoom.state
    };
    io.to(roomName(currentRoom.code)).emit("session_state", s);
  }

  socket.on("create_session", (payload, cb) => {
    const parsed = CreateSessionZ.safeParse(payload);
    if (!parsed.success) return socket.emit("error_msg", { code: "BAD_INPUT", message: "Invalid create_session" });
    const code = makeCode();
    currentRoom = {
      code,
      hostId: socket.id,
      members: new Map<string, SessionMember>(),
      powerUps: { healthy: 0.5, cheap: 0.5, t30: 0.5 },
      state: {},
      expiresAt: Date.now() + 2 * 60 * 60 * 1000
    };
    rooms.set(code, currentRoom);
    const member: SessionMember = { id: socket.id, nickname: parsed.data.nickname, constraints: {} };
    currentRoom.members.set(socket.id, member);

    socket.join(roomName(code));
    cb?.({ ok: true, code });
    emitState();
  });

  socket.on("join_session", (payload, cb) => {
    const parsed = JoinSessionZ.safeParse(payload);
    if (!parsed.success) return socket.emit("error_msg", { code: "BAD_INPUT", message: "Invalid join_session" });
    const room = rooms.get(parsed.data.code);
    if (!room) return socket.emit("error_msg", { code: "NO_ROOM", message: "Session not found" });
    currentRoom = room;
    const member: SessionMember = { id: socket.id, nickname: parsed.data.nickname, constraints: {} };
    room.members.set(socket.id, member);
    socket.join(roomName(room.code));
    io.to(roomName(room.code)).emit("member_joined", member);
    cb?.({ ok: true });
    emitState();
  });

  socket.on("update_constraints", (payload) => {
    if (!currentRoom) return;
    const parsed = UpdateConstraintsZ.safeParse(payload);
    if (!parsed.success) return;
    const m = currentRoom.members.get(socket.id);
    if (!m) return;
    m.constraints = { ...m.constraints, ...parsed.data };
    emitState();
  });

  socket.on("update_powerups", (payload) => {
    if (!currentRoom) return;
    const parsed = UpdatePowerUpsZ.safeParse(payload);
    if (!parsed.success) return;
    currentRoom.powerUps = { ...currentRoom.powerUps, ...parsed.data };
    emitState();
  });

  socket.on("spin_request", (payload) => {
    if (!currentRoom) return;
    if (socket.id !== currentRoom.hostId) {
      return socket.emit("error_msg", { code: "HOST_ONLY", message: "Only host can spin" });
    }
    const parsed = SpinReqZ.safeParse(payload);
    if (!parsed.success) return;
    const rng = seedrandom(parsed.data.seed || makeCode());
    const cats: Dish["category"][] = ["meat", "veg", "staple", "soup"];
    const mc = mergeConstraints(Array.from(currentRoom.members.values()));

    const result: string[] = [];
    for (const c of cats) {
      // simple filter: if t30 set -> timeMaxMin = min(timeMaxMin, 30)
      const tmax = mc.timeMaxMin ?? ((currentRoom!.powerUps.t30 ?? 0) > 0 ? 30 : undefined);
      const pool = DISHES.filter((d) => d.category === c).filter((d) => {
        if (tmax != null && (d.time_min ?? 0) > tmax) return false;
        return true;
      });
      const scores = pool.map((d) => score(d, currentRoom!.powerUps));
      const probs = softmax(scores, 0.6);
      const pick = pick(rng as any, pool, probs);
      result.push(pick.name);
    }
    io.to(roomName(currentRoom.code)).emit("spin_result", { result, seed: parsed.data.seed || "" });
    currentRoom.state = { lastResult: result };
    emitState();
  });

  socket.on("heartbeat", () => {
    // presence / extend TTL
    if (currentRoom) currentRoom.expiresAt = Date.now() + 2 * 60 * 60 * 1000;
  });

  socket.on("disconnect", () => {
    if (!currentRoom) return;
    const wasHost = currentRoom.hostId === socket.id;
    currentRoom.members.delete(socket.id);
    io.to(roomName(currentRoom.code)).emit("member_left", socket.id);
    if (wasHost) {
      // end session
      io.to(roomName(currentRoom.code)).emit("error_msg", { code: "SESSION_END", message: "Host left; session closed" });
      rooms.delete(currentRoom.code);
    } else {
      emitState();
    }
  });
});

setInterval(() => {
  const now = Date.now();
  for (const [code, room] of rooms) {
    if (room.expiresAt < now) {
      io.to(roomName(code)).emit("error_msg", { code: "SESSION_EXPIRED", message: "Session expired" });
      rooms.delete(code);
    }
  }
}, 60_000);

appServer.listen(PORT, () => {
  console.log(`ws-server listening on :${PORT}`);
});

function makeCode() {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return s;
}
function roomName(code: string) {
  return `session:${code}`;
}
