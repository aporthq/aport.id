/**
 * IP-based rate limiting using Cloudflare KV
 *
 * Sliding window implementation: stores an array of request timestamps
 * per IP. Fails open — if KV errors, the request is allowed through.
 *
 * See PRD E3. ~2 req/sec (120/min) allows rapid creation and retries.
 */
import type { AppEnv } from "./types";
import { getCorsHeaders } from "./cors";
import { errorResponse } from "./response";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  /** Unix ms timestamp when the oldest request in the window expires */
  resetAt: number;
}

interface RateLimitOptions {
  maxRequests?: number;
  windowMs?: number;
}

const DEFAULT_MAX_REQUESTS = 120;
const DEFAULT_WINDOW_MS = 60 * 1000; // 1 minute (~2 req/sec)
const LOCALHOST_MULTIPLIER = 10;

const KV_PREFIX = "rl:";

/**
 * Extract the client IP from the request, checking common headers.
 */
export function getClientIp(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function isLocalhost(ip: string): boolean {
  return ip === "127.0.0.1" || ip === "::1" || ip === "localhost";
}

/**
 * Check whether an IP is within the rate limit window.
 *
 * Uses a sliding window: timestamps of past requests are stored in KV as
 * a JSON array. Expired entries are pruned on each check.
 *
 * Fails open — any KV error returns `{ allowed: true }`.
 */
export async function checkRateLimit(
  kv: KVNamespace,
  ip: string,
  opts?: RateLimitOptions,
): Promise<RateLimitResult> {
  const windowMs = opts?.windowMs ?? DEFAULT_WINDOW_MS;
  let maxRequests = opts?.maxRequests ?? DEFAULT_MAX_REQUESTS;

  if (isLocalhost(ip)) {
    maxRequests *= LOCALHOST_MULTIPLIER;
  }

  const now = Date.now();
  const windowStart = now - windowMs;
  const key = `${KV_PREFIX}${ip}`;

  try {
    const raw = await kv.get(key);
    let timestamps: number[] = raw ? JSON.parse(raw) : [];

    // Prune entries outside the current window
    timestamps = timestamps.filter((t) => t > windowStart);

    if (timestamps.length >= maxRequests) {
      // Find when the oldest request in the window expires
      const oldest = Math.min(...timestamps);
      return {
        allowed: false,
        remaining: 0,
        resetAt: oldest + windowMs,
      };
    }

    // Record this request
    timestamps.push(now);

    // TTL = window duration in seconds (rounded up) so KV auto-cleans
    const ttlSeconds = Math.ceil(windowMs / 1000);
    await kv.put(key, JSON.stringify(timestamps), {
      expirationTtl: ttlSeconds,
    });

    return {
      allowed: true,
      remaining: maxRequests - timestamps.length,
      resetAt: timestamps[0] + windowMs,
    };
  } catch (err) {
    // Fail open — don't block users if KV is broken
    console.error("[rate-limit] KV error, failing open:", err);
    return {
      allowed: true,
      remaining: maxRequests,
      resetAt: now + windowMs,
    };
  }
}

/**
 * Wrap a PagesFunction handler with IP-based rate limiting.
 *
 * If the request is rate-limited, returns a 429 response with a
 * Retry-After header. Otherwise delegates to the wrapped handler.
 */
export function withRateLimit(
  handler: PagesFunction<AppEnv>,
  opts?: RateLimitOptions,
): PagesFunction<AppEnv> {
  return async (context) => {
    const { env, request } = context;
    const ip = getClientIp(request);
    const result = await checkRateLimit(env.APORT_ID_KV, ip, opts);

    if (!result.allowed) {
      const retryAfterSecs = Math.ceil(
        Math.max(0, result.resetAt - Date.now()) / 1000,
      );
      const cors = getCorsHeaders(request);
      return errorResponse("Too many requests. Please try again later.", 429, {
        ...cors,
        "Retry-After": String(retryAfterSecs),
      });
    }

    return handler(context);
  };
}
