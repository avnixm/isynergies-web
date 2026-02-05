import DOMPurify from 'isomorphic-dompurify';

/** Allowed tags for team member name/position and similar rich text. */
const ALLOWED_TAGS = [
  'strong',
  'b',
  'em',
  'i',
  'br',
  'p',
  'ul',
  'ol',
  'li',
  'span',
  'a',
];

/** Only href on <a>; no event handlers or style. */
const ALLOWED_ATTR = ['href'];

/**
 * Sanitizes HTML for safe display (team member name, position, etc.).
 * Uses an allowlist: strong, b, em, i, br, p, ul, ol, li, span, and a with safe href (http, https, mailto).
 * Removes script, style, event handlers, and unsafe attributes.
 */
export function sanitizeHtml(html: string): string {
  if (typeof html !== 'string') return '';
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ADD_ATTR: [],
  });
}

/** Strip HTML tags for use in alt text, title, and aria-label. */
export function stripHtml(html: string): string {
  if (typeof html !== 'string') return '';
  return html.replace(/<[^>]*>/g, '').trim() || html;
}
