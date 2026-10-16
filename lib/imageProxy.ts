// lib/imageProxy.ts
// react-pdf fetches pictures in the browser, and most websites block that (CORS).
// We load each picture through our own /api/image-proxy and embed it as a data URL.

export function proxiedImageUrl(url: string): string {
  return `/api/image-proxy?url=${encodeURIComponent(url)}`;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      typeof reader.result === "string"
        ? resolve(reader.result)
        : reject(new Error("Unexpected reader result"));
    reader.onerror = () => reject(reader.error ?? new Error("Read failed"));
    reader.readAsDataURL(blob);
  });
}

/** Returns { originalUrl: dataUrl } for every picture that loaded. Failures are skipped. */
export async function loadImageDataUrls(
  urls: string[],
): Promise<Record<string, string>> {
  const entries = await Promise.all(
    urls.map(async (url): Promise<[string, string] | null> => {
      try {
        const res = await fetch(proxiedImageUrl(url));
        if (!res.ok) return null;
        const blob = await res.blob();
        if (!blob.type.startsWith("image/")) return null;
        return [url, await blobToDataUrl(blob)];
      } catch {
        return null;
      }
    }),
  );
  const out: Record<string, string> = {};
  for (const entry of entries) {
    if (entry) out[entry[0]] = entry[1];
  }
  return out;
}
