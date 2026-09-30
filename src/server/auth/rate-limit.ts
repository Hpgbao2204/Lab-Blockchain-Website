/** Small in-memory limiter for login attempts (per process; good enough for one small app). */
const hits = new Map<string, { n: number; reset: number }>();

export function rateLimit(key: string, max = 8, windowMs = 10 * 60_000): boolean {
  const now = Date.now();
  const h = hits.get(key);
  if (!h || h.reset < now) {
    hits.set(key, { n: 1, reset: now + windowMs });
    return true;
  }
  h.n += 1;
  return h.n <= max;
}

export const resetRateLimit = (key: string) => hits.delete(key);
