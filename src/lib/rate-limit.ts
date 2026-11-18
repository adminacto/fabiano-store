import "server-only";

/**
 * Скользящее окно в памяти процесса — для разработки и одного инстанса.
 * В production при нескольких инстансах заменяется на Redis (REDIS_URL), интерфейс тот же.
 */
const buckets = new Map<string, number[]>();

export interface RateLimitResult {
  ok: boolean;
  retryAfterSec: number;
}

export function rateLimit(key: string, limit: number, windowSec: number, now = Date.now()): RateLimitResult {
  const windowMs = windowSec * 1000;
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    return { ok: false, retryAfterSec: Math.ceil((windowMs - (now - hits[0]!)) / 1000) };
  }
  hits.push(now);
  buckets.set(key, hits);
  if (buckets.size > 10_000) {
    for (const [k, v] of buckets) if (v.every((t) => now - t >= windowMs)) buckets.delete(k);
  }
  return { ok: true, retryAfterSec: 0 };
}
