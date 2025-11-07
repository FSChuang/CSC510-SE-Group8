import { describe, it, expect } from "vitest";
import { z } from "zod";

/** A tiny in-test “party-lib” so we don't import from the app. */
const DietEnum = z.enum(["omnivore", "vegetarian", "vegan", "pescatarian", "keto", "none"]);
const AllergenEnum = z.enum([
  "gluten","dairy","egg","soy","peanut","tree_nut","shellfish","fish","sesame",
]);

const PrefsSchema = z.object({
  diet: DietEnum,
  allergens: z.array(AllergenEnum),
  budget: z.enum(["low", "medium", "high"]),
  timeLimit: z.number().int().min(5).max(240),
});

function formatRoomCode(raw: string) { return raw.replace(/[^A-Za-z0-9]/g, "").toUpperCase(); }
function isValidRoomCode(code: string) { return /^[A-Z0-9]{6}$/.test(code); }
function partyCodeFromSeed(seed: string) {
  let h = 0; for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return (h >>> 0).toString(36).toUpperCase().padStart(6, "0").slice(0, 6);
}
function seeded(seed: number) {
  let s = seed >>> 0;
  return () => { s ^= s<<13; s ^= s>>>17; s ^= s<<5; s >>>= 0; return (s & 0xffffffff)/0x100000000; };
}
function nextSpinTriple(prev: any[], unlocked: boolean[], rng = Math.random) {
  const pool = ["A","B","C","D","E","F"].map((x,i)=>({id:`${x}${i}`}));
  return prev.map((d,i)=> unlocked[i] ? pool[Math.floor(rng()*pool.length)] : (d ?? null));
}

const HEARTBEAT_MS = 15_000;
const PEER_TTL_MS  = 120_000;
function shouldSendHeartbeat(last: number, now: number, interval: number){ return now-last >= interval; }
function updatePresenceBeat(peer:any, now:number){ return {...peer, lastSeen: now}; }
function sortPeersStable(peers:any[]){ return [...peers].sort((a,b)=> (b.lastSeen-a.lastSeen) || (a.id<b.id?-1:a.id>b.id?1:0)); }
function prunePeersByTTL(peers:any[], now:number, ttl:number){ return peers.filter(p=> now-p.lastSeen <= ttl); }
function roleFromState(state:any, uid:string){ return state.hostId===uid?"host":"member"; }
function canGroupSpin(role:"host"|"member", locked:boolean){ return role==="host" && !locked; }
function canSpinIndividually(_role:"host"|"member", slotLocked:boolean){ return !slotLocked; }
function canVoteOnDish(joined:boolean){ return !!joined; }
function reconcileWithServer(client:any, server:any){ return {...client, ...server}; }

describe("Enums & schema", () => {
  it("valid PrefsSchema parses", () => {
    const v = PrefsSchema.parse({ diet: "omnivore", allergens: [], budget: "medium", timeLimit: 30 });
    expect(v.timeLimit).toBe(30);
  });
  it("invalid diet rejected", () => {
    // @ts-expect-error
    expect(()=> PrefsSchema.parse({ diet: "keto_bro", allergens: [], budget: "low", timeLimit: 20 })).toThrow();
  });
  it("allergens enum enforced", () => {
    const v = PrefsSchema.parse({ diet: "vegetarian", allergens: ["peanut"], budget: "high", timeLimit: 15 });
    expect(v.allergens).toEqual(["peanut"]);
  });
  it("timeLimit negative rejected", () => {
    expect(()=> PrefsSchema.parse({ diet:"omnivore", allergens:[], budget:"low", timeLimit:-1 })).toThrow();
  });
});

describe("Room codes", () => {
  it("formatRoomCode strips & uppercases", ()=> {
    expect(formatRoomCode("  ab-12 cd ")).toBe("AB12CD");
  });
  it("isValidRoomCode true for 6 alnum", ()=> {
    expect(isValidRoomCode("AB12CD")).toBe(true);
  });
  it("isValidRoomCode false otherwise", ()=> {
    expect(isValidRoomCode("abc123")).toBe(false);
  });
  it("partyCodeFromSeed deterministic", ()=> {
    expect(partyCodeFromSeed("seed")).toBe(partyCodeFromSeed("seed"));
  });
});

describe("Presence", () => {
  it("heartbeat/ttl sane", ()=> {
    expect(HEARTBEAT_MS).toBeGreaterThan(0);
    expect(PEER_TTL_MS).toBeGreaterThan(HEARTBEAT_MS);
  });
  it("shouldSendHeartbeat true/false", ()=> {
    const now=100_000;
    expect(shouldSendHeartbeat(now-HEARTBEAT_MS-1, now, HEARTBEAT_MS)).toBe(true);
    expect(shouldSendHeartbeat(now-1_000, now, HEARTBEAT_MS)).toBe(false);
  });
  it("updatePresenceBeat bumps lastSeen", ()=> {
    const now=Date.now(); const p={id:"u", lastSeen: now-10_000};
    expect(updatePresenceBeat(p, now).lastSeen).toBe(now);
  });
  it("sortPeersStable by time desc then id", ()=> {
    const now=Date.now();
    const peers=[{id:"b",lastSeen:now-2000},{id:"a",lastSeen:now-1000},{id:"c",lastSeen:now-1000}];
    expect(sortPeersStable(peers).map(p=>p.id)).toEqual(["a","c","b"]);
  });
  it("prunePeersByTTL keeps within TTL, drops beyond", ()=> {
    const now=Date.now();
    expect(prunePeersByTTL([{id:"x",lastSeen:now-PEER_TTL_MS+1000}], now, PEER_TTL_MS)).toHaveLength(1);
    expect(prunePeersByTTL([{id:"y",lastSeen:now-PEER_TTL_MS-1}],   now, PEER_TTL_MS)).toHaveLength(0);
  });
});

describe("Permissions & spin", () => {
  it("roleFromState host/member", ()=> {
    const s={hostId:"h1", peers:[{id:"h1"},{id:"m1"}]};
    expect(roleFromState(s,"h1")).toBe("host");
    expect(roleFromState(s,"m1")).toBe("member");
  });
  it("group spin host only", ()=> {
    expect(canGroupSpin("host", false)).toBe(true);
    expect(canGroupSpin("member", false)).toBe(false);
  });
  it("slot lock prevents individual spin", ()=> {
    expect(canSpinIndividually("member", true)).toBe(false);
  });
  it("vote requires joined", ()=> {
    expect(canVoteOnDish(true)).toBe(true);
    expect(canVoteOnDish(false)).toBe(false);
  });
  it("reconcile favors server", ()=> {
    const merged = reconcileWithServer({ locked:false }, { locked:true, triple:[1,2,3] });
    expect(merged.locked).toBe(true);
    expect(merged.triple).toEqual([1,2,3]);
  });
  it("seeded RNG deterministic", ()=> {
    const r1=seeded(123), r2=seeded(123);
    expect([r1(),r1(),r1()].map(x=>Math.floor(x*1e6)))
      .toEqual([r2(),r2(),r2()].map(x=>Math.floor(x*1e6)));
  });
  it("nextSpinTriple changes only unlocked", ()=> {
    const prev=[{id:"a"},{id:"b"},{id:"c"}]; const unlocked=[false,true,false];
    const out=nextSpinTriple(prev, unlocked, seeded(7));
    expect(out[0]).toBe(prev[0]); expect(out[2]).toBe(prev[2]); expect(out[1]).not.toBe(prev[1]);
  });
  it("nextSpinTriple keeps fully locked", ()=> {
    const prev=[null,{id:"x"},null]; const unlocked=[false,false,false];
    expect(nextSpinTriple(prev, unlocked)).toEqual(prev);
  });
});
