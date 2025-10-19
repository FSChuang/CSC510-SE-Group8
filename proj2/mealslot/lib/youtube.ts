import "server-only";

/**
 * YouTube adapter:
 * - If YOUTUBE_API_KEY is present, queries the YouTube Data API v3 (search.list).
 * - Otherwise returns deterministic stub videos.
 */

export type YtStub = { id: string; title: string; url: string; thumbnail?: string };

function fnv1a(s: string): string {
  // small stable hash used for stub video IDs
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36).slice(0, 11);
}

function stubVideos(query: string): YtStub[] {
  const salts = ["a", "b", "c", "d"];
  return salts.map((salt, i) => {
    const id = fnv1a(`${query}|${salt}`);
    return {
      id,
      title: `${query} tutorial #${i + 1}`,
      url: `https://www.youtube.com/watch?v=${id}`,
      thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
    };
  });
}

export async function videoStubsFor(query: string): Promise<YtStub[]> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return stubVideos(query);

  try {
    const params = new URLSearchParams({
      key,
      q: query,
      type: "video",
      maxResults: "4",
      safeSearch: "strict",
      videoEmbeddable: "true",
      part: "snippet"
    });
    const url = `https://www.googleapis.com/youtube/v3/search?${params.toString()}`;
    const res = await fetch(url, { method: "GET" });
    if (!res.ok) throw new Error(`YouTube ${res.status}`);
    const data = (await res.json()) as {
      items?: { id?: { videoId?: string }; snippet?: { title?: string; thumbnails?: any } }[];
    };

    const out: YtStub[] =
      data.items?.map((it) => {
        const id = it.id?.videoId || fnv1a(`fallback|${query}`);
        const title = it.snippet?.title || `${query} tutorial`;
        const thumb =
          it.snippet?.thumbnails?.high?.url ||
          it.snippet?.thumbnails?.medium?.url ||
          it.snippet?.thumbnails?.default?.url;
        return { id, title, url: `https://www.youtube.com/watch?v=${id}`, thumbnail: thumb };
      }) ?? [];

    if (out.length >= 3) return out.slice(0, 4);
    // Pad with deterministic stubs for UX reliability
    const padded = [...out];
    const stubs = stubVideos(query);
    while (padded.length < 4) padded.push(stubs[padded.length]);
    return padded.slice(0, 4);
  } catch {
    // Fail safe: never break the app
    return stubVideos(query);
  }
}
