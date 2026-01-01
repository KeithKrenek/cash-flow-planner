import DOMPurify from 'dompurify';

/**
 * Sanitize text input by stripping all HTML tags.
 * This is the most restrictive sanitization, returning only plain text.
 */
export function sanitizeText(input: string | null | undefined): string {
  if (!input) {
    return '';
  }

  // DOMPurify with empty ALLOWED_TAGS strips all HTML
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  }).trim();
}

/**
 * Sanitize a transaction description.
 * Strips HTML and enforces max length.
 */
export function sanitizeDescription(
  description: string | null | undefined
): string {
  const cleaned = sanitizeText(description);
  // Max length from database constraint
  return cleaned.slice(0, 200);
}

/**
 * Sanitize an account name.
 * Strips HTML and enforces max length.
 */
export function sanitizeAccountName(name: string | null | undefined): string {
  const cleaned = sanitizeText(name);
  // Max length from database constraint
  return cleaned.slice(0, 100);
}

/**
 * Sanitize checkpoint notes.
 * Strips HTML and enforces max length.
 */
export function sanitizeNotes(notes: string | null | undefined): string {
  const cleaned = sanitizeText(notes);
  // Max length from database constraint
  return cleaned.slice(0, 500);
}

/**
 * Sanitize a category name.
 * Strips HTML and enforces max length.
 */
export function sanitizeCategory(category: string | null | undefined): string {
  const cleaned = sanitizeText(category);
  // Max length from database constraint
  return cleaned.slice(0, 50);
}

/**
 * Check if a string contains potential XSS patterns.
 * This is for detection/logging, not sanitization.
 */
export function containsXSSPatterns(input: string): boolean {
  const xssPatterns = [
    /<script\b[^>]*>/i,
    /javascript:/i,
    /on\w+\s*=/i, // onclick=, onerror=, etc.
    /<\s*img[^>]+onerror/i,
    /<\s*svg[^>]+onload/i,
    /data:\s*text\/html/i,
    /<\s*iframe/i,
    /<\s*object/i,
    /<\s*embed/i,
    /<\s*link/i,
    /<\s*meta/i,
    /<\s*style/i,
    /expression\s*\(/i, // CSS expression
    /url\s*\(\s*["']?\s*javascript:/i,
  ];

  return xssPatterns.some((pattern) => pattern.test(input));
}

/**
 * Escape HTML entities for safe display.
 * Use this when you need to display user content as text,
 * not when storing in the database (use sanitize functions for that).
 */
export function escapeHtml(input: string): string {
  const escapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };

  return input.replace(/[&<>"'/]/g, (char) => escapeMap[char] || char);
}

/**
 * Remove null bytes and other problematic control characters.
 */
export function removeControlChars(input: string): string {
  // Remove null bytes and other control chars except newlines and tabs
  // eslint-disable-next-line no-control-regex
  return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

/**
 * Full sanitization pipeline for user input.
 * Removes control chars, strips HTML, and trims whitespace.
 */
export function sanitizeInput(input: string | null | undefined): string {
  if (!input) {
    return '';
  }

  let cleaned = removeControlChars(input);
  cleaned = sanitizeText(cleaned);
  return cleaned.trim();
}
