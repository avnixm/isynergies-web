'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { clearAdminCache, getCachedUser, setCachedUser } from '@/app/admin/dashboard/_lib/cache';

// ============================================================================
// AUTH CONTEXT - Resilient authentication state management
// ============================================================================
// Key behaviors:
// - Only redirects on confirmed 401/403 (token invalid/expired)
// - Retries on transient failures (5xx, network errors) with exponential backoff
// - Shows session expired modal instead of hard reload
// - Debounces auth checks to prevent spam
// - Logs auth events in dev mode for debugging
// ============================================================================

export type AuthStatus = 
  | 'checking'      // Initial check in progress
  | 'authenticated' // User is authenticated
  | 'unauthenticated' // No token or confirmed 401
  | 'session_expired' // Was authenticated, now 401
  | 'error'         // Transient error, still might be valid

export type AuthUser = {
  id: number;
  username: string;
  email?: string;
} | null;

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

// Dev-only logging
function authLog(event: string, data?: Record<string, unknown>) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Auth] ${event}`, data ?? '');
  }
}

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 3000, 10000]; // 1s, 3s, 10s

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('checking');
  const [user, setUser] = useState<AuthUser>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [showSessionExpiredModal, setShowSessionExpiredModal] = useState(false);

  // Track if we were previously authenticated (to show "expired" vs "unauthenticated")
  const wasAuthenticatedRef = useRef(false);
  
  // Abort controller for canceling stale requests
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Debounce: prevent multiple simultaneous auth checks
  const isCheckingRef = useRef(false);
  const lastCheckTimeRef = useRef(0);
  const MIN_CHECK_INTERVAL = 5000; // 5 seconds minimum between checks

  const isTransientError = status === 'error';

  const getToken = useCallback(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('admin_token');
  }, []);

  const clearAuth = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_token');
    }
    clearAdminCache();
    setUser(null);
  }, []);

  const checkAuth = useCallback(async (isRetry = false): Promise<void> => {
    const now = Date.now();
    
    // Debounce: don't check too frequently unless it's a retry
    if (!isRetry && now - lastCheckTimeRef.current < MIN_CHECK_INTERVAL) {
      authLog('Debounced - too soon since last check', { 
        timeSinceLastCheck: now - lastCheckTimeRef.current 
      });
      return;
    }

    // Prevent concurrent checks
    if (isCheckingRef.current && !isRetry) {
      authLog('Skipped - check already in progress');
      return;
    }

    isCheckingRef.current = true;
    lastCheckTimeRef.current = now;

    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const token = getToken();

    if (!token) {
      authLog('No token found');
      setStatus('unauthenticated');
      setUser(null);
      setError(null);
      setRetryCount(0);
      isCheckingRef.current = false;
      return;
    }

    // Instant display from cache while revalidating
    const cached = getCachedUser();
    if (cached != null) {
      authLog('Using cached user (no /me flash)');
      if (!wasAuthenticatedRef.current) {
        setUser(cached as AuthUser);
        // Avoid "Checking admin session" screen on full reload (e.g. cPanel proxy):
        // show dashboard immediately and revalidate in background.
        setStatus('authenticated');
        wasAuthenticatedRef.current = true;
      }
    } else {
      authLog('No cache, fetching /me');
    }

    // Only show full-screen "Checking admin session" when we have no token or no cache.
    // If we have a token and cached user, we already set status to 'authenticated' above.
    const hasToken = !!token;
    const hasCache = cached != null;
    if (!isRetry && !wasAuthenticatedRef.current && !(hasToken && hasCache)) {
      setStatus('checking');
    }

    try {
      authLog('Checking auth...', { retryCount: isRetry ? retryCount + 1 : 0 });

      const response = await fetch('/api/admin/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
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

      // Handle different error codes
      if (response.status === 401 || response.status === 403) {
        // Confirmed unauthorized - token is invalid
        authLog('Auth failed - 401/403', { status: response.status });
        clearAuth();
        
        if (wasAuthenticatedRef.current) {
          // User was logged in, session expired
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
        // User not found in DB - treat as unauthorized
        authLog('Auth failed - user not found', { status: response.status });
        clearAuth();
        setStatus('unauthenticated');
        setError('User account not found.');
        setRetryCount(0);
        isCheckingRef.current = false;
        return;
      }

      // 5xx errors - transient, should retry
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || `Server error (${response.status})`;
      authLog('Auth check failed - server error', { status: response.status, error: errorMessage });

      // Retry with backoff for 5xx errors
      const currentRetry = isRetry ? retryCount + 1 : 1;
      if (currentRetry <= MAX_RETRIES) {
        setRetryCount(currentRetry);
        setStatus('error');
        setError(errorMessage);
        
        const delay = RETRY_DELAYS[currentRetry - 1] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
        authLog(`Scheduling retry ${currentRetry}/${MAX_RETRIES} in ${delay}ms`);
        
        isCheckingRef.current = false;
        setTimeout(() => checkAuth(true), delay);
        return;
      }

      // Max retries reached - stay in error state but don't kick user out
      authLog('Max retries reached - staying in error state');
      setStatus('error');
      setError(`${errorMessage}. Please check your connection.`);
      isCheckingRef.current = false;

    } catch (err: unknown) {
      // Handle abort (not an error)
      if (err instanceof Error && err.name === 'AbortError') {
        authLog('Request aborted');
        isCheckingRef.current = false;
        return;
      }

      // Network error - transient, should retry
      const errorMessage = err instanceof Error ? err.message : 'Network error';
      authLog('Auth check failed - network error', { error: errorMessage });

      const currentRetry = isRetry ? retryCount + 1 : 1;
      if (currentRetry <= MAX_RETRIES) {
        setRetryCount(currentRetry);
        setStatus('error');
        setError('Connection error. Retrying...');
        
        const delay = RETRY_DELAYS[currentRetry - 1] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
        authLog(`Scheduling retry ${currentRetry}/${MAX_RETRIES} in ${delay}ms`);
        
        isCheckingRef.current = false;
        setTimeout(() => checkAuth(true), delay);
        return;
      }

      // Max retries reached
      authLog('Max retries reached after network error');
      setStatus('error');
      setError('Unable to verify session. Please check your connection.');
      isCheckingRef.current = false;
    }
  }, [getToken, clearAuth, retryCount]);

  const logout = useCallback(async () => {
    authLog('Logging out');
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' });
    } catch {
      // Ignore logout API errors
    }
    clearAuth();
    setStatus('unauthenticated');
    setError(null);
    setRetryCount(0);
    wasAuthenticatedRef.current = false;
    setShowSessionExpiredModal(false);
  }, [clearAuth]);

  const clearSessionExpired = useCallback(() => {
    setShowSessionExpiredModal(false);
  }, []);

  // Initial auth check on mount
  useEffect(() => {
    checkAuth();
    
    // Check auth on tab focus (but debounced)
    const handleFocus = () => {
      authLog('Tab focused - checking auth');
      checkAuth();
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
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

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
