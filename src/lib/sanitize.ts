import DOMPurify from 'dompurify';

// Strips scripts/event handlers/etc before any dangerouslySetInnerHTML render.
// Required whenever the HTML source is AI-generated or user-supplied (email bodies,
// AI summaries) rather than a hardcoded string authored in this codebase.
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
}
