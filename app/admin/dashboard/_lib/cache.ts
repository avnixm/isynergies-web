/**
 * In-memory cache for admin dashboard to reduce repeated API calls.
 * Survives client-side navigation; cleared on logout.
 * Auth user is also persisted to sessionStorage so it survives full page reloads
 * (e.g. when proxy causes reloads), avoiding "Checking admin session" flash.
 */

const AUTH_TTL_MS = 30 * 60 * 1000; // 30 minutes
const STATS_TTL_MS = 2 * 60 * 1000; // 2 minutes
const AUTH_STORAGE_KEY = 'admin_auth_cache';

let authCache: { user: unknown; expiresAt: number } | null = null;
const genericCache = new Map<string, { value: unknown; expiresAt: number }>();

function getAuthFromStorage(): { user: unknown; expiresAt: number } | null {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { user: unknown; expiresAt: number };
    if (Date.now() >= parsed.expiresAt) {
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function getCachedUser(): unknown | null {
  if (authCache && Date.now() < authCache.expiresAt) return authCache.user;
  if (authCache && Date.now() >= authCache.expiresAt) authCache = null;
  const stored = getAuthFromStorage();
  if (stored) {
    authCache = stored; // hydrate in-memory
    return stored.user;
  }
  return null;
}

export function setCachedUser(user: unknown): void {
  const entry = { user, expiresAt: Date.now() + AUTH_TTL_MS };
  authCache = entry;
  if (typeof sessionStorage !== 'undefined') {
    try {
      sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(entry));
    } catch {
      // ignore quota / private mode
    }
  }
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
  if (typeof sessionStorage !== 'undefined') {
    try {
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {
      // ignore
    }
  }
}
