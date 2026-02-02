'use client';

import { useEffect, useCallback, useRef, useState } from 'react';

// ============================================================================
// DRAFT PERSISTENCE HOOK
// ============================================================================
// Automatically saves form state to localStorage with debouncing.
// Allows users to restore unsaved work after session expiration or page reload.
// ============================================================================

export type DraftMeta = {
  savedAt: number;
  version: number;
  route: string;
};

export type StoredDraft<T> = {
  data: T;
  meta: DraftMeta;
};

export type UseDraftPersistenceOptions<T> = {
  /** Entity type, e.g., 'team-member', 'project' */
  entity: string;
  /** Entity ID (use 'new' for new entities) */
  id: string | number;
  /** Current route/page path */
  route: string;
  /** Debounce delay in ms (default: 500) */
  debounceMs?: number;
  /** Version number for schema changes (default: 1) */
  version?: number;
  /** Optional: compare with server data timestamp to decide if draft is stale */
  serverUpdatedAt?: number;
};

export type UseDraftPersistenceReturn<T> = {
  /** Whether a restorable draft exists */
  hasDraft: boolean;
  /** The draft data if available */
  draftData: T | null;
  /** Draft metadata */
  draftMeta: DraftMeta | null;
  /** Save current form data to draft */
  saveDraft: (data: T) => void;
  /** Clear the draft (call on successful save) */
  clearDraft: () => void;
  /** Restore draft (returns data, you handle populating form) */
  restoreDraft: () => T | null;
  /** Dismiss draft without restoring */
  dismissDraft: () => void;
  /** Whether form has unsaved changes (for dirty checking) */
  isDirty: boolean;
  /** Mark form as dirty (call on any change) */
  setDirty: (dirty: boolean) => void;
};

// Generate storage key
function getDraftKey(entity: string, id: string | number, route: string): string {
  return `draft:${entity}:${id}:${route.replace(/\//g, '_')}`;
}

// Dev-only logging
function draftLog(event: string, data?: Record<string, unknown>) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Draft] ${event}`, data ?? '');
  }
}

export function useDraftPersistence<T extends Record<string, unknown>>(
  options: UseDraftPersistenceOptions<T>
): UseDraftPersistenceReturn<T> {
  const { 
    entity, 
    id, 
    route, 
    debounceMs = 500, 
    version = 1,
    serverUpdatedAt 
  } = options;

  const [hasDraft, setHasDraft] = useState(false);
  const [draftData, setDraftData] = useState<T | null>(null);
  const [draftMeta, setDraftMeta] = useState<DraftMeta | null>(null);
  const [isDirty, setDirty] = useState(false);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const storageKey = getDraftKey(entity, id, route);

  // Load draft on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed: StoredDraft<T> = JSON.parse(stored);
        
        // Check version compatibility
        if (parsed.meta.version !== version) {
          draftLog('Draft version mismatch, ignoring', { 
            stored: parsed.meta.version, 
            current: version 
          });
          localStorage.removeItem(storageKey);
          return;
        }

        // Check if draft is older than server data
        if (serverUpdatedAt && parsed.meta.savedAt < serverUpdatedAt) {
          draftLog('Draft is older than server data, ignoring', {
            draftTime: parsed.meta.savedAt,
            serverTime: serverUpdatedAt,
          });
          localStorage.removeItem(storageKey);
          return;
        }

        draftLog('Found restorable draft', { 
          entity, 
          id, 
          savedAt: new Date(parsed.meta.savedAt).toISOString() 
        });
        
        setHasDraft(true);
        setDraftData(parsed.data);
        setDraftMeta(parsed.meta);
      }
    } catch (err) {
      draftLog('Error loading draft', { error: err });
      localStorage.removeItem(storageKey);
    }
  }, [storageKey, version, serverUpdatedAt, entity, id]);

  // Save draft with debounce
  const saveDraft = useCallback((data: T) => {
    if (typeof window === 'undefined') return;

    // Clear previous debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      try {
        const draft: StoredDraft<T> = {
          data,
          meta: {
            savedAt: Date.now(),
            version,
            route,
          },
        };
        
        localStorage.setItem(storageKey, JSON.stringify(draft));
        draftLog('Draft saved', { entity, id });
        
        // Update local state
        setHasDraft(true);
        setDraftData(data);
        setDraftMeta(draft.meta);
      } catch (err) {
        draftLog('Error saving draft', { error: err });
      }
    }, debounceMs);

    setDirty(true);
  }, [storageKey, version, route, debounceMs, entity, id]);

  // Clear draft (call after successful save)
  const clearDraft = useCallback(() => {
    if (typeof window === 'undefined') return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    try {
      localStorage.removeItem(storageKey);
      draftLog('Draft cleared', { entity, id });
    } catch (err) {
      draftLog('Error clearing draft', { error: err });
    }

    setHasDraft(false);
    setDraftData(null);
    setDraftMeta(null);
    setDirty(false);
  }, [storageKey, entity, id]);

  // Restore draft
  const restoreDraft = useCallback((): T | null => {
    draftLog('Draft restored', { entity, id });
    setHasDraft(false); // Hide the restore prompt
    setDirty(true);
    return draftData;
  }, [draftData, entity, id]);

  // Dismiss draft without restoring
  const dismissDraft = useCallback(() => {
    clearDraft();
    draftLog('Draft dismissed', { entity, id });
  }, [clearDraft, entity, id]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    hasDraft,
    draftData,
    draftMeta,
    saveDraft,
    clearDraft,
    restoreDraft,
    dismissDraft,
    isDirty,
    setDirty,
  };
}

// ============================================================================
// BEFOREUNLOAD GUARD HOOK
// ============================================================================
// Shows browser warning when user tries to leave with unsaved changes
// ============================================================================

export function useBeforeUnloadGuard(isDirty: boolean, message?: string) {
  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Modern browsers ignore custom message, but we set it anyway
      e.returnValue = message || 'You have unsaved changes. Are you sure you want to leave?';
      return e.returnValue;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty, message]);
}

// ============================================================================
// DRAFT RESTORE PROMPT COMPONENT
// ============================================================================
// Reusable component to show "Restore draft?" prompt
// ============================================================================

export type DraftRestorePromptProps = {
  savedAt: number;
  onRestore: () => void;
  onDismiss: () => void;
};
