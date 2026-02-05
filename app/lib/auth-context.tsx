'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { clearAdminCache, getCachedUser, setCachedUser } from '@/app/admin/dashboard/_lib/cache';

/**
 * Admin auth: one place for session state. Cookie sent via credentials: 'include'.
 * Dev logs use [Auth] prefix. Debounces checks; silent recheck on focus (no full-screen loader).
 */

export type AuthStatus =
  | 'checking'
  | 'authenticated'
  | 'unauthenticated'
  | 'session_expired'
  | 'error';

export type AuthUser = { id: number; username: string; email?: string } | null;

type AuthContextValue = {
  status: AuthStatus;
  user: AuthUser;
  error: string | null;
  isTransientError: boolean;
  retryCount: number;
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
  clearSessionExpired: () => void;
  showSessionExpiredModal: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function authLog(event: string, data?: Record<string, unknown>) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Auth] ${event}`, data ?? '');
  }
}

const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 3000, 10000];
const MIN_CHECK_INTERVAL_MS = 5000;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('checking');
  const [user, setUser] = useState<AuthUser>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [showSessionExpiredModal, setShowSessionExpiredModal] = useState(false);

  const wasAuthenticatedRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isCheckingRef = useRef(false);
  const lastCheckTimeRef = useRef(0);

  const isTransientError = status === 'error';

  const clearAuth = useCallback(() => {
    clearAdminCache();
    setUser(null);
  }, []);

  const checkAuth = useCallback(async (isRetry = false, silentRecheck = false): Promise<void> => {
    const now = Date.now();
    if (!isRetry && now - lastCheckTimeRef.current < MIN_CHECK_INTERVAL_MS) {
      authLog('Debounced - too soon since last check', { timeSinceLastCheck: now - lastCheckTimeRef.current });
      return;
    }
    if (isCheckingRef.current && !isRetry) {
      authLog('Skipped - check already in progress');
      return;
    }

    isCheckingRef.current = true;
    lastCheckTimeRef.current = now;
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    const cached = getCachedUser();
    if (cached != null && !wasAuthenticatedRef.current) setUser(cached as AuthUser);
    if (!silentRecheck && !isRetry && !wasAuthenticatedRef.current && cached == null) setStatus('checking');

    try {
      authLog(silentRecheck ? 'Tab focused - checking auth' : 'Checking auth...', { retryCount: isRetry ? retryCount + 1 : 0 });
      const response = await fetch('/api/admin/auth/me', {
        credentials: 'include',
        signal: abortControllerRef.current.signal,
      });

      if (response.ok) {
        const data = await response.json();
        authLog('Auth success', { user: data.user?.username });
        setUser(data.user);
        setCachedUser(data.user);
        setStatus('authenticated');
        setError(null);
        setRetryCount(0);
        wasAuthenticatedRef.current = true;
        isCheckingRef.current = false;
        return;
      }

      if (response.status === 401 || response.status === 403) {
        authLog('Auth failed - 401/403', { status: response.status });
        clearAuth();
        if (wasAuthenticatedRef.current) {
          setStatus('session_expired');
          setShowSessionExpiredModal(true);
        } else {
          setStatus('unauthenticated');
        }
        setError('Session expired. Please log in again.');
        setRetryCount(0);
        isCheckingRef.current = false;
        return;
      }

      if (response.status === 404) {
        authLog('Auth failed - user not found', { status: response.status });
        clearAuth();
        setStatus('unauthenticated');
        setError('User account not found.');
        setRetryCount(0);
        isCheckingRef.current = false;
        return;
      }

      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || `Server error (${response.status})`;
      authLog('Auth check failed - server error', { status: response.status, error: errorMessage });
      const currentRetry = isRetry ? retryCount + 1 : 1;
      if (currentRetry <= MAX_RETRIES) {
        setRetryCount(currentRetry);
        setStatus('error');
        setError(errorMessage);
        const delay = RETRY_DELAYS[currentRetry - 1] ?? RETRY_DELAYS[RETRY_DELAYS.length - 1];
        authLog(`Scheduling retry ${currentRetry}/${MAX_RETRIES} in ${delay}ms`);
        isCheckingRef.current = false;
        setTimeout(() => checkAuth(true), delay);
        return;
      }
      setStatus('error');
      setError(`${errorMessage}. Please check your connection.`);
      isCheckingRef.current = false;
      return;
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        authLog('Request aborted');
        isCheckingRef.current = false;
        return;
      }
      const errorMessage = err instanceof Error ? err.message : 'Network error';
      authLog('Auth check failed - network error', { error: errorMessage });
      const currentRetry = isRetry ? retryCount + 1 : 1;
      if (currentRetry <= MAX_RETRIES) {
        setRetryCount(currentRetry);
        setStatus('error');
        setError('Connection error. Retrying...');
        const delay = RETRY_DELAYS[currentRetry - 1] ?? RETRY_DELAYS[RETRY_DELAYS.length - 1];
        authLog(`Scheduling retry ${currentRetry}/${MAX_RETRIES} in ${delay}ms`);
        isCheckingRef.current = false;
        setTimeout(() => checkAuth(true), delay);
        return;
      }
      setStatus('error');
      setError('Unable to verify session. Please check your connection.');
      isCheckingRef.current = false;
    }
  }, [clearAuth, retryCount]);

  const logout = useCallback(async () => {
    authLog('Logging out');
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {
      // ignore
    }
    clearAuth();
    setStatus('unauthenticated');
    setError(null);
    setRetryCount(0);
    wasAuthenticatedRef.current = false;
    setShowSessionExpiredModal(false);
  }, [clearAuth]);

  const clearSessionExpired = useCallback(() => setShowSessionExpiredModal(false), []);

  useEffect(() => {
    checkAuth();
    const runSilentRecheck = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') checkAuth(false, true);
    };
    window.addEventListener('focus', runSilentRecheck);
    document.addEventListener('visibilitychange', runSilentRecheck);
    return () => {
      window.removeEventListener('focus', runSilentRecheck);
      document.removeEventListener('visibilitychange', runSilentRecheck);
      abortControllerRef.current?.abort();
    };
  }, [checkAuth]);

  const value: AuthContextValue = {
    status,
    user,
    error,
    isTransientError,
    retryCount,
    checkAuth,
    logout,
    clearSessionExpired,
    showSessionExpiredModal,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
