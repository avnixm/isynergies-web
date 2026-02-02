/**
 * In-memory rate limiter. Effective per Node process (single instance).
 * For multi-instance production (e.g. Vercel serverless), use Redis (e.g. Upstash)
 * or Vercel's rate limiting.
 */

function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;
  return 'unknown';
}

interface Entry {
  count: number;
  resetAt: number;
}

const store = new Map<string, Entry>();

const CLEANUP_INTERVAL_MS = 60_000;
let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function cleanup() {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt <= now) store.delete(key);
  }
}

function ensureCleanup() {
  if (!cleanupTimer) {
    cleanupTimer = setInterval(cleanup, CLEANUP_INTERVAL_MS);
    if (cleanupTimer.unref) cleanupTimer.unref();
  }
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check rate limit. Key is typically prefix:ip (e.g. "login:1.2.3.4").
 * Returns { ok: false } if over limit; caller should return 429.
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  ensureCleanup();
  const now = Date.now();
  let entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    entry = { count: 1, resetAt: now + windowMs };
    store.set(key, entry);
    return { ok: true, remaining: limit - 1, resetAt: entry.resetAt };
  }

  entry.count += 1;
  if (entry.count > limit) {
    return { ok: false, remaining: 0, resetAt: entry.resetAt };
  }
  return {
    ok: true,
    remaining: limit - entry.count,
    resetAt: entry.resetAt,
  };
}

export function getRateLimitKey(request: Request, prefix: string): string {
  const ip = getClientIp(request);
  return `${prefix}:${ip}`;
}
