type RedisClient = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, opts?: { ex?: number }): Promise<void>;
  incr(key: string): Promise<number>;
  del(key: string): Promise<void>;
};

class NoopRedis implements RedisClient {
  async get() { return null; }
  async set() { /* noop */ }
  async incr() { return 0; }
  async del() { /* noop */ }
}

let client: RedisClient | null = null;

export function getRedis(): RedisClient {
  if (client) return client;
  const url = process.env.UPSTASH_REDIS_URL;
  const token = process.env.UPSTASH_REDIS_TOKEN;
  if (url && token) {
    // Lazy import to avoid bundling
    const realClient: RedisClient = {
      async get(key) {
        const res = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data.result ?? null;
      },
      async set(key, value, opts) {
        const ex = opts?.ex ? `?ex=${opts.ex}` : "";
        await fetch(`${url}/set/${encodeURIComponent(key)}/${encodeURIComponent(value)}${ex}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      },
      async incr(key) {
        const res = await fetch(`${url}/incr/${encodeURIComponent(key)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json().catch(() => null);
        return data?.result ?? 0;
      },
      async del(key) {
        await fetch(`${url}/del/${encodeURIComponent(key)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    };
    client = realClient;
  } else {
    client = new NoopRedis();
  }
  return client!;
}
