/**
 * In-memory cache for admin dashboard to reduce repeated API calls.
 * Survives client-side navigation; cleared on logout.
 */

const AUTH_TTL_MS = 30 * 60 * 1000; // 30 minutes
const STATS_TTL_MS = 2 * 60 * 1000; // 2 minutes

let authCache: { user: unknown; expiresAt: number } | null = null;
const genericCache = new Map<string, { value: unknown; expiresAt: number }>();

export function getCachedUser(): unknown | null {
  if (!authCache) return null;
  if (Date.now() >= authCache.expiresAt) {
    authCache = null;
    return null;
  }
  return authCache.user;
}

export function setCachedUser(user: unknown): void {
  authCache = { user, expiresAt: Date.now() + AUTH_TTL_MS };
}

export function getCached<T>(key: string): T | null {
  const entry = genericCache.get(key);
  if (!entry) return null;
  if (Date.now() >= entry.expiresAt) {
    genericCache.delete(key);
    return null;
  }
  return entry.value as T;
}

export function setCached<T>(key: string, value: T, ttlMs: number = STATS_TTL_MS): void {
  genericCache.set(key, { value, expiresAt: Date.now() + ttlMs });
}

/** Call on logout to clear all admin dashboard cache. */
export function clearAdminCache(): void {
  authCache = null;
  genericCache.clear();
}
