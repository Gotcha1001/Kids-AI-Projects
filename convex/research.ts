// convex/research.ts
// Plain helper module (no Convex functions here) used by generate.ts.
// Finds REAL sources + pictures so the bibliography never contains invented URLs.
// Runs in the default Convex runtime: fetch, AbortController and setTimeout are available.
import { isYoungAudience, type AgeGroup } from "./constants";

export interface SourceItem {
  title: string;
  url: string;
  snippet: string;
}

export interface ImageItem {
  url: string;
  caption: string;
  pdfSafe: boolean; // jpg/png only - react-pdf cannot draw webp/gif
}

export interface ResearchResult {
  sources: SourceItem[];
  images: ImageItem[];
}

export interface ResearchKeys {
  tavily?: string;
  serpapi?: string;
}

interface RawImage {
  url: string;
  description: string;
}

const MAX_SOURCES = 6;
const MAX_IMAGES = 8;
const MIN_GOOD_IMAGES = 4;
const MIN_SNIPPET_LENGTH = 60;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/** Like fetchWithTimeout, but the timer also covers reading the JSON body. */
async function fetchJsonWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<{ ok: boolean; status: number; json: unknown }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    const json = (await res.json().catch(() => null)) as unknown;
    return { ok: res.ok, status: res.status, json };
  } finally {
    clearTimeout(timer);
  }
}

/* ------------------------------- Tavily ------------------------------- */

async function tavilySearch(
  topic: string,
  apiKey: string,
  ageGroup: AgeGroup,
): Promise<{ sources: SourceItem[]; images: RawImage[] }> {
  const young = isYoungAudience(ageGroup);
  const res = await fetchJsonWithTimeout(
    "https://api.tavily.com/search",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        // "for kids" nudges younger levels towards child-friendly pages;
        // university level gets broader, more authoritative results
        query: young ? `${topic} facts for kids` : `${topic} overview`,
        search_depth: young ? "basic" : "advanced",
        max_results: MAX_SOURCES,
        include_images: true,
        include_image_descriptions: true,
      }),
    },
    20_000,
  );
  if (!res.ok) throw new Error(`Tavily responded with ${res.status}`);

  const json = res.json;
  const sources: SourceItem[] = [];
  const images: RawImage[] = [];
  if (!isRecord(json)) return { sources, images };

  if (Array.isArray(json.results)) {
    for (const item of json.results) {
      if (!isRecord(item)) continue;
      const url = typeof item.url === "string" ? item.url : "";
      const title = typeof item.title === "string" ? item.title.trim() : "";
      const snippet =
        typeof item.content === "string" ? item.content.trim() : "";
      if (!isHttpUrl(url) || !title || snippet.length < MIN_SNIPPET_LENGTH)
        continue;
      sources.push({ title, url, snippet });
    }
  }

  if (Array.isArray(json.images)) {
    for (const item of json.images) {
      // Tavily returns strings, or {url, description} when descriptions are on
      if (typeof item === "string") {
        images.push({ url: item, description: "" });
      } else if (isRecord(item) && typeof item.url === "string") {
        images.push({
          url: item.url,
          description:
            typeof item.description === "string" ? item.description.trim() : "",
        });
      }
    }
  }
  return { sources, images };
}

/* ------------------------------- SerpAPI ------------------------------ */

async function serpImageSearch(
  topic: string,
  apiKey: string,
): Promise<RawImage[]> {
  const params = new URLSearchParams({
    engine: "google_images",
    q: topic,
    safe: "active", // SafeSearch ON - this is a kids' app
    api_key: apiKey,
  });
  const res = await fetchJsonWithTimeout(
    `https://serpapi.com/search.json?${params.toString()}`,
    { method: "GET" },
    20_000,
  );
  if (!res.ok) throw new Error(`SerpAPI responded with ${res.status}`);

  const json = res.json;
  const out: RawImage[] = [];
  if (!isRecord(json) || !Array.isArray(json.images_results)) return out;

  for (const item of json.images_results) {
    if (!isRecord(item)) continue;
    const url =
      typeof item.original === "string"
        ? item.original
        : typeof item.thumbnail === "string"
          ? item.thumbnail
          : "";
    if (!url) continue;
    out.push({
      url,
      description: typeof item.title === "string" ? item.title.trim() : "",
    });
  }
  return out.slice(0, 12);
}

/* --------------------------- image verification ------------------------ */

interface ProbeResult {
  ok: boolean;
  pdfSafe: boolean;
}

const BAD_URL_HINTS = ["logo", "icon", "sprite", "avatar", "favicon", "banner"];

async function probeImage(url: string): Promise<ProbeResult> {
  const bad: ProbeResult = { ok: false, pdfSafe: false };
  if (!isHttpUrl(url)) return bad;
  const lower = url.toLowerCase();
  if (
    BAD_URL_HINTS.some((hint) => lower.includes(hint)) ||
    lower.endsWith(".svg")
  ) {
    return bad;
  }
  try {
    let res = await fetchWithTimeout(url, { method: "HEAD" }, 6_000);
    if (!res.ok || !res.headers.get("content-type")) {
      // Some servers reject HEAD - ask for the first byte instead
      res = await fetchWithTimeout(
        url,
        { method: "GET", headers: { Range: "bytes=0-0" } },
        6_000,
      );
      await res.body?.cancel().catch(() => undefined);
    }
    const type = (res.headers.get("content-type") ?? "").toLowerCase();
    if (!res.ok || !type.startsWith("image/") || type.includes("svg"))
      return bad;
    const pdfSafe =
      type.includes("jpeg") || type.includes("jpg") || type.includes("png");
    return { ok: true, pdfSafe };
  } catch {
    return bad;
  }
}

function buildCaption(topic: string, raw: RawImage): string {
  const base = raw.description ? raw.description : `A picture about ${topic}`;
  const trimmed = base.length > 140 ? `${base.slice(0, 137)}…` : base;
  const host = hostOf(raw.url);
  return host ? `${trimmed} (${host})` : trimmed;
}

async function verifyImages(
  topic: string,
  candidates: RawImage[],
): Promise<ImageItem[]> {
  const unique = Array.from(
    new Map(candidates.map((c) => [c.url, c] as const)).values(),
  ).slice(0, 14);

  const probes = await Promise.all(unique.map((c) => probeImage(c.url)));
  const verified: ImageItem[] = [];
  unique.forEach((raw, i) => {
    const probe = probes[i];
    if (!probe.ok) return;
    verified.push({
      url: raw.url,
      caption: buildCaption(topic, raw),
      pdfSafe: probe.pdfSafe,
    });
  });
  // PDF-safe pictures first so the cover and early sections can always use them
  return verified.sort((a, b) => Number(b.pdfSafe) - Number(a.pdfSafe));
}

/* ------------------------------- public API --------------------------- */

export async function researchTopic(
  topic: string,
  keys: ResearchKeys,
  ageGroup: AgeGroup,
): Promise<ResearchResult> {
  let sources: SourceItem[] = [];
  let candidates: RawImage[] = [];

  if (keys.tavily) {
    try {
      const found = await tavilySearch(topic, keys.tavily, ageGroup);
      sources = found.sources;
      candidates = found.images;
    } catch (e) {
      console.error("[research] Tavily failed:", e);
    }
  }

  console.log("[research] tavily done", {
    sources: sources.length,
    candidateImages: candidates.length,
  });
  let images = await verifyImages(topic, candidates);
  console.log("[research] verified images:", images.length);

  // Fallback / top-up: SerpAPI Google Images with SafeSearch
  if (images.length < MIN_GOOD_IMAGES && keys.serpapi) {
    try {
      const extra = await serpImageSearch(topic, keys.serpapi);
      const more = await verifyImages(topic, [...candidates, ...extra]);
      if (more.length > images.length) images = more;
    } catch (e) {
      console.error("[research] SerpAPI failed:", e);
    }
  }

  return {
    sources: sources.slice(0, MAX_SOURCES),
    images: images.slice(0, MAX_IMAGES),
  };
}
