import { describe, it, expect, beforeEach } from "vitest";

/** A self-contained in-memory “server” for Party Mode flows. */
const store = {
  rooms: new Map<string, any>(),
  codeFromSeed(seed: string) {
    let h = 0; for (let i=0;i<seed.length;i++) h = (h*31 + seed.charCodeAt(i)) >>> 0;
    return (h>>>0).toString(36).toUpperCase().padStart(6,"0").slice(0,6);
  },
  ensure(code: string) {
    if (!this.rooms.has(code)) {
      this.rooms.set(code, {
        code, hostId: "host-1",
        peers: [{ id:"host-1", name:"Host", lastSeen: Date.now() }],
        locked: false,
        triple: [{ id:"d1" },{ id:"d2" },{ id:"d3" }],
        votes: { d1:{up:new Set(), reroll:new Set()}, d2:{up:new Set(), reroll:new Set()}, d3:{up:new Set(), reroll:new Set()} },
      });
    }
    return this.rooms.get(code);
  },
};

/** Fake route handlers that mimic your API contract. */
async function createRoute() {
  const code = store.codeFromSeed(String(Date.now()));
  store.ensure(code);
  return new Response(JSON.stringify({ code, partyId: code, memberId:"host-1", host:true }), { status:200 });
}
async function joinRoute(req: Request) {
  const { code, name } = await req.json();
  const room = store.ensure(code);
  const id = `u-${room.peers.length+1}`;
  room.peers.push({ id, name, lastSeen: Date.now() });
  return new Response(JSON.stringify({ user:{ id, name }, role:"member" }), { status:200 });
}
async function stateRoute(req: Request) {
  const { code } = await req.json();
  const r = store.ensure(code);
  const tallies: any = {};
  for (const k of Object.keys(r.votes)) tallies[k] = { thumbsUp: r.votes[k].up.size, reroll: r.votes[k].reroll.size };
  return new Response(JSON.stringify({ code:r.code, peers:r.peers, triple:r.triple, tallies, locked:r.locked }), { status:200 });
}
async function spinRoute(req: Request) {
  const { code, userId, action, dishId, vote } = await req.json();
  const r = store.ensure(code);
  const isHost = userId === r.hostId;

  if (action === "group") {
    if (!isHost || r.locked) return new Response(JSON.stringify({ code:"FORBIDDEN" }), { status:403 });
    const pool = ["A","B","C","D","E","F"].map((x,i)=>({id:`${x}${i}`}));
    r.triple = r.triple.map((_d:any,i:number)=> pool[(i + r.peers.length) % pool.length]);
    return new Response(JSON.stringify({ ok:true }), { status:200 });
  }
  if (action === "vote") {
    const joined = r.peers.some((p:any)=> p.id === userId);
    if (!joined) return new Response(JSON.stringify({ code:"NOT_JOINED" }), { status:401 });
    if (!r.votes[dishId]) r.votes[dishId] = { up:new Set(), reroll:new Set() };
    r.votes[dishId].up.delete(userId);
    r.votes[dishId].reroll.delete(userId);
    if (vote === "up") r.votes[dishId].up.add(userId);
    if (vote === "reroll") r.votes[dishId].reroll.add(userId);
    return new Response(JSON.stringify({ ok:true }), { status:200 });
  }
  return new Response(JSON.stringify({ code:"BAD_ACTION" }), { status:400 });
}
async function leaveRoute(req: Request) {
  const { code, userId } = await req.json();
  const r = store.ensure(code);
  r.peers = r.peers.filter((p:any)=> p.id !== userId);
  return new Response(JSON.stringify({ ok:true }), { status:200 });
}

const jsonReq = (body:any)=> new Request("http://local", { method:"POST", headers:{ "content-type":"application/json" }, body: JSON.stringify(body) });

describe("Party Mode integration (self-contained)", () => {
  let code = ""; let hostId = "host-1";

  beforeEach(()=> { store.rooms.clear(); code=""; });

  it("create => returns code and host", async () => {
    const res = await createRoute();
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(typeof data.code).toBe("string");
    code = data.code; hostId = data.memberId ?? "host-1";
  });

  it("join => adds member", async () => {
    code = (await (await createRoute()).json()).code;
    const res = await joinRoute(jsonReq({ code, name:"Eric" }));
    const data = await res.json();
    expect(data.role).toBe("member");
    expect(data.user.id).toMatch(/^u-/);
  });

  it("state => peers & triple present", async () => {
    code = (await (await createRoute()).json()).code;
    const s = await (await stateRoute(jsonReq({ code }))).json();
    expect(Array.isArray(s.peers)).toBe(true);
    expect(Array.isArray(s.triple)).toBe(true);
  });

  it("member cannot group spin", async () => {
    code = (await (await createRoute()).json()).code;
    const j = await (await joinRoute(jsonReq({ code, name:"Eric" }))).json();
    const sp = await spinRoute(jsonReq({ code, userId:j.user.id, action:"group" }));
    expect(sp.status).toBe(403);
  });

  it("host group spin changes triple", async () => {
    const c = await (await createRoute()).json(); code = c.code; hostId = c.memberId;
    const before = await (await stateRoute(jsonReq({ code }))).json();
    const sp = await spinRoute(jsonReq({ code, userId:hostId, action:"group" }));
    expect(sp.status).toBe(200);
    const after = await (await stateRoute(jsonReq({ code }))).json();
    expect(JSON.stringify(after.triple)).not.toEqual(JSON.stringify(before.triple));
  });

  it("vote up works for joined user", async () => {
    code = (await (await createRoute()).json()).code;
    const j = await (await joinRoute(jsonReq({ code, name:"Vincent" }))).json();
    const rv = await spinRoute(jsonReq({ code, userId:j.user.id, action:"vote", dishId:"d1", vote:"up" }));
    expect(rv.status).toBe(200);
    const s = await (await stateRoute(jsonReq({ code }))).json();
    expect(s.tallies.d1.thumbsUp).toBe(1);
  });

  it("vote toggle up → reroll", async () => {
    code = (await (await createRoute()).json()).code;
    const j = await (await joinRoute(jsonReq({ code, name:"Zack" }))).json();
    await spinRoute(jsonReq({ code, userId:j.user.id, action:"vote", dishId:"d2", vote:"up" }));
    await spinRoute(jsonReq({ code, userId:j.user.id, action:"vote", dishId:"d2", vote:"reroll" }));
    const s = await (await stateRoute(jsonReq({ code }))).json();
    expect(s.tallies.d2.thumbsUp).toBe(0);
    expect(s.tallies.d2.reroll).toBe(1);
  });

  it("unjoined cannot vote", async () => {
    code = (await (await createRoute()).json()).code;
    const rv = await spinRoute(jsonReq({ code, userId:"ghost", action:"vote", dishId:"d3", vote:"up" }));
    expect(rv.status).toBe(401);
  });

  it("leave removes peer", async () => {
    code = (await (await createRoute()).json()).code;
    const j = await (await joinRoute(jsonReq({ code, name:"Eric" }))).json();
    const rl = await leaveRoute(jsonReq({ code, userId:j.user.id }));
    expect(rl.status).toBe(200);
    const s = await (await stateRoute(jsonReq({ code }))).json();
    expect(s.peers.find((p:any)=> p.id===j.user.id)).toBeUndefined();
  });

  it("multiple joins accumulate peers", async () => {
    code = (await (await createRoute()).json()).code;
    await joinRoute(jsonReq({ code, name:"A" }));
    await joinRoute(jsonReq({ code, name:"B" }));
    const s = await (await stateRoute(jsonReq({ code }))).json();
    expect(s.peers.length).toBeGreaterThanOrEqual(3); // host + 2
  });

  it("locked room blocks host group spin", async () => {
    code = (await (await createRoute()).json()).code;
    store.ensure(code).locked = true;
    const sp = await spinRoute(jsonReq({ code, userId:"host-1", action:"group" }));
    expect(sp.status).toBe(403);
  });

  it("tallies reflect two voters", async () => {
    code = (await (await createRoute()).json()).code;
    const u1 = await (await joinRoute(jsonReq({ code, name:"U1" }))).json();
    const u2 = await (await joinRoute(jsonReq({ code, name:"U2" }))).json();
    await spinRoute(jsonReq({ code, userId:u1.user.id, action:"vote", dishId:"d1", vote:"up" }));
    await spinRoute(jsonReq({ code, userId:u2.user.id, action:"vote", dishId:"d1", vote:"up" }));
    const s = await (await stateRoute(jsonReq({ code }))).json();
    expect(s.tallies.d1.thumbsUp).toBe(2);
  });

  it("vote switch removes prior selection", async () => {
    code = (await (await createRoute()).json()).code;
    const u = await (await joinRoute(jsonReq({ code, name:"U" }))).json();
    await spinRoute(jsonReq({ code, userId:u.user.id, action:"vote", dishId:"d3", vote:"up" }));
    await spinRoute(jsonReq({ code, userId:u.user.id, action:"vote", dishId:"d3", vote:"up" })); // idempotent
    await spinRoute(jsonReq({ code, userId:u.user.id, action:"vote", dishId:"d3", vote:"reroll" }));
    const s = await (await stateRoute(jsonReq({ code }))).json();
    expect(s.tallies.d3.thumbsUp).toBe(0);
    expect(s.tallies.d3.reroll).toBe(1);
  });

  it("host leaving keeps room alive", async () => {
    code = (await (await createRoute()).json()).code;
    const u = await (await joinRoute(jsonReq({ code, name:"U" }))).json();
    await leaveRoute(jsonReq({ code, userId:"host-1" })); // mock removes host from peers
    const s = await (await stateRoute(jsonReq({ code }))).json();
    expect(s.peers.some((p:any)=> p.id===u.user.id)).toBe(true);
  });
});
