/**
 * Sanitize HTML from CMS/content to prevent stored XSS.
 * Uses DOMPurify with a safe allowlist (no scripts, no event handlers).
 */

import DOMPurify from 'isomorphic-dompurify';

const SAFE_CONFIG = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'sub', 'sup',
    'a', 'ul', 'ol', 'li', 'span', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'blockquote', 'hr',
  ],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
  ADD_ATTR: ['target', 'rel'],
} as const;

/**
 * Sanitize HTML for safe display. Use for any CMS/content rendered via dangerouslySetInnerHTML.
 */
export function sanitizeHtml(html: string | null | undefined): string {
  if (html == null || typeof html !== 'string') return '';
  const out = DOMPurify.sanitize(html, SAFE_CONFIG as Record<string, unknown>);
  return typeof out === 'string' ? out : String(out);
}
