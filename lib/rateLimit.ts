// Simple in-memory rate limiter (best-effort on serverless hosting).
const WINDOW_MS = 60_000; // 1 minute
const hits = new Map<string, number[]>();

export function checkRateLimit(
  key: string,
  limit = 20,
): { ok: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);

  if (recent.length >= limit) {
    const retryAfterSeconds = Math.ceil((WINDOW_MS - (now - recent[0])) / 1000);
    hits.set(key, recent);
    return { ok: false, retryAfterSeconds };
  }

  recent.push(now);
  hits.set(key, recent);

  // Keep the map from growing forever
  if (hits.size > 5000) {
    for (const [k, v] of hits) {
      if (v.every((t) => now - t >= WINDOW_MS)) hits.delete(k);
    }
  }
  return { ok: true, retryAfterSeconds: 0 };
}

export function clientKey(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0].trim() || "unknown";
}
