const buckets = new Map<string, number[]>();

/**
 * Fixed-window style limiter (dev-friendly, in-memory).
 * Cache key shape for adapter should match docs/adapter-venue-spec.md §4.6 later.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): boolean {
  const now = Date.now();
  const prev = buckets.get(key) ?? [];
  const pruned = prev.filter((t) => now - t < windowMs);
  if (pruned.length >= limit) {
    buckets.set(key, pruned);
    return false;
  }
  pruned.push(now);
  buckets.set(key, pruned);
  return true;
}
