/**
 * In-memory sliding-window rate limiter.
 *
 * Scoped to a single server instance, which is the right size for this MVP:
 * it stops a runaway client or a casual abuser from burning through the SMS
 * budget without adding infrastructure. When ZENO scales to multiple instances
 * this moves to a shared store (e.g. Redis) behind the same function signature.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export type RateLimitResult = {
  allowed: boolean;
  /** Seconds until the caller may retry, when blocked. */
  retryAfter: number;
};

export function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || now >= existing.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { allowed: true, retryAfter: 0 };
  }

  if (existing.count >= limit) {
    return {
      allowed: false,
      retryAfter: Math.ceil((existing.resetAt - now) / 1000),
    };
  }

  existing.count += 1;
  return { allowed: true, retryAfter: 0 };
}

// Opportunistic cleanup so the map cannot grow without bound.
export function pruneRateLimits() {
  const now = Date.now();

  for (const [key, bucket] of buckets) {
    if (now >= bucket.resetAt) {
      buckets.delete(key);
    }
  }
}
