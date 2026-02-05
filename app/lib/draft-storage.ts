const DRAFT_PREFIX = 'draft:';

export type TeamMemberDraft = {
  name: string;
  position: string;
  image: string;
  displayOrder: number;
};

/**
 * Build localStorage key for a team member draft.
 * @param entity - e.g. 'team_member'
 * @param id - member id for edit, or undefined for "new"
 */
export function draftKey(entity: string, id?: number | null): string {
  if (id != null) {
    return `${DRAFT_PREFIX}${entity}:edit:${id}`;
  }
  return `${DRAFT_PREFIX}${entity}:new`;
}

/**
 * Get a draft from localStorage (client only).
 */
export function getDraft<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * Write a draft to localStorage (client only).
 */
export function setDraft<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota / private mode
  }
}

/**
 * Remove a draft from localStorage (client only).
 */
export function removeDraft(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

const DEBOUNCE_MS = 400;
const debounceTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * Debounced write: updates localStorage after DEBOUNCE_MS of no further calls for the same key.
 */
export function setDraftDebounced<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  const existing = debounceTimeouts.get(key);
  if (existing) clearTimeout(existing);
  debounceTimeouts.set(
    key,
    setTimeout(() => {
      debounceTimeouts.delete(key);
      setDraft(key, value);
    }, DEBOUNCE_MS)
  );
}
