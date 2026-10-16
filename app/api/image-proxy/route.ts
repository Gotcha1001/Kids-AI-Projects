// app/api/image-proxy/route.ts
// Fetches a remote picture server-side so react-pdf can embed it (no CORS).
// Signed-in users only, https only, no private/internal hosts, images only, size capped.
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_BYTES = 8 * 1024 * 1024;
const MAX_REDIRECTS = 3;
const TIMEOUT_MS = 10_000;
const BLOCKED_HOST =
  /^(localhost|0\.|10\.|127\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|\[?::1?\]?$|\[?f[cd][0-9a-f]{2}:)/i;

function isAllowedUrl(raw: string): URL | null {
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:") return null;
    if (BLOCKED_HOST.test(url.hostname) || url.hostname.endsWith(".internal"))
      return null;
    return url;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const target = req.nextUrl.searchParams.get("url");
  const initial: URL | null = target ? isAllowedUrl(target) : null;
  if (!initial)
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });

  // Explicit type: breaks the circular inference and keeps it non-null in the loop.
  let current: URL = initial;

  try {
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      const res: Response = await fetch(current, {
        redirect: "manual",
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: {
          "User-Agent": "ProjectKidsBot/1.0",
          Accept: "image/jpeg,image/png,image/*",
        },
      });

      if (res.status >= 300 && res.status < 400) {
        const location: string | null = res.headers.get("location");
        const next: URL | null = location
          ? isAllowedUrl(new URL(location, current).toString())
          : null;
        if (!next)
          return NextResponse.json(
            { error: "Blocked redirect" },
            { status: 400 },
          );
        current = next;
        continue;
      }

      const type = res.headers.get("content-type") ?? "";
      if (!res.ok || !type.startsWith("image/") || type.includes("svg")) {
        return NextResponse.json({ error: "Not an image" }, { status: 415 });
      }
      const declared = Number(res.headers.get("content-length") ?? "0");
      if (declared > MAX_BYTES)
        return NextResponse.json({ error: "Too large" }, { status: 413 });

      const buffer = await res.arrayBuffer();
      if (buffer.byteLength > MAX_BYTES)
        return NextResponse.json({ error: "Too large" }, { status: 413 });

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type": type,
          "Cache-Control": "private, max-age=3600",
        },
      });
    }
    return NextResponse.json({ error: "Too many redirects" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Fetch failed" }, { status: 502 });
  }
}
