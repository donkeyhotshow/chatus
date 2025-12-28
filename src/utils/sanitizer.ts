/**
 * XSS Sanitization Utilities
 * P0-4 FIX: Security - Prevent XSS attacks
 *
 * Uses DOMPurify for HTML sanitization with strict configuration
 */

import DOMPurify from 'dompurify';

// Configure DOMPurify for strict sanitization
const SANITIZE_CONFIG = {
  ALLOWED_TAGS: [], // No HTML tags allowed by default
  ALLOWED_ATTR: [], // No attributes allowed
  KEEP_CONTENT: true, // Keep text content
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
};

// Config for allowing basic formatting (bold, italic, links)
const SANITIZE_CONFIG_BASIC = {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'br'],
  ALLOWED_ATTR: ['href', 'target', 'rel'],
  ALLOW_DATA_ATTR: false,
  ADD_ATTR: ['target'], // Force target="_blank" for links
  FORCE_BODY: true,
};

// Config for search highlighting
const SANITIZE_CONFIG_HIGHLIGHT = {
  ALLOWED_TAGS: ['mark', 'span'],
  ALLOWED_ATTR: ['class'],
  KEEP_CONTENT: true,
};

/**
 * Sanitize plain text - removes ALL HTML
 * Use for user-generated content like messages
 */
export function sanitizeText(text: string): string {
  if (!text || typeof text !== 'string') return '';
  if (typeof window === 'undefined') {
    // Server-side: basic escape
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
  return DOMPurify.sanitize(text, SANITIZE_CONFIG) as string;
}

/**
 * Sanitize HTML with basic formatting allowed
 * Use for rich text content where some formatting is needed
 */
export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== 'string') return '';
  if (typeof window === 'undefined') return sanitizeText(html);

  // Add rel="noopener noreferrer" to all links
  const clean = DOMPurify.sanitize(html, SANITIZE_CONFIG_BASIC) as string;
  return clean.replace(/<a /g, '<a rel="noopener noreferrer" ');
}

/**
 * Sanitize search highlight HTML
 * Only allows <mark> and <span> tags for highlighting
 */
export function sanitizeHighlight(html: string): string {
  if (!html || typeof html !== 'string') return '';
  if (typeof window === 'undefined') return sanitizeText(html);
  return DOMPurify.sanitize(html, SANITIZE_CONFIG_HIGHLIGHT) as string;
}

/**
 * Escape HTML entities for safe display
 * Use when you need to display HTML as text
 */
export function escapeHtml(text: string): string {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Validate and sanitize URL
 * Prevents javascript: and data: URLs
 */
export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== 'string') return '';

  const trimmed = url.trim().toLowerCase();

  // Block dangerous protocols
  if (
    trimmed.startsWith('javascript:') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('vbscript:')
  ) {
    return '';
  }

  // Allow http, https, mailto, tel
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('mailto:') ||
    trimmed.startsWith('tel:') ||
    trimmed.startsWith('/')
  ) {
    return url;
  }

  // Default: prepend https://
  return `https://${url}`;
}

/**
 * Check if content contains potential XSS
 * Returns true if suspicious content detected
 */
export function containsXss(content: string): boolean {
  if (!content || typeof content !== 'string') return false;

  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi, // onclick=, onerror=, etc.
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
    /<svg.*?onload/gi,
    /expression\s*\(/gi,
    /url\s*\(\s*['"]?\s*javascript:/gi,
  ];

  return xssPatterns.some(pattern => pattern.test(content));
}
