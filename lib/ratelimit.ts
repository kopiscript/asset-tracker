/**
 * lib/ratelimit.ts
 * Thin wrapper over @upstash/ratelimit. Per-IP sliding-window limits.
 *
 * Fails OPEN when Upstash is not configured: if UPSTASH_REDIS_REST_URL /
 * UPSTASH_REDIS_REST_TOKEN are absent, rateLimit() always allows the request,
 * so local dev and any environment without Upstash keep working. Set both env
 * vars (in Vercel: Production + Preview) to turn enforcement on — no code change.
 */
import { Ratelimit, type Duration } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? Redis.fromEnv()
    : null;

const limiters = new Map<string, Ratelimit>();

/**
 * Returns true if the request is allowed, false if it exceeded the limit.
 * Always returns true when Upstash is not configured (fail open).
 *
 * @param name        logical bucket name (e.g. "register")
 * @param identifier  per-caller key, usually the client IP
 * @param limit       max requests per window
 * @param window      sliding window, e.g. "60 s", "1 m", "1 h"
 */
export async function rateLimit(
  name: string,
  identifier: string,
  limit: number,
  window: Duration
): Promise<boolean> {
  if (!redis) return true;
  let limiter = limiters.get(name);
  if (!limiter) {
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, window),
      prefix: `rl:${name}`,
      analytics: false,
    });
    limiters.set(name, limiter);
  }
  const { success } = await limiter.limit(identifier);
  return success;
}

/** Best-effort client IP from proxy headers (Vercel sets x-forwarded-for). */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
