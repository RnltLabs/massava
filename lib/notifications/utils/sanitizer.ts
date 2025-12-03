/**
 * Notification Content Sanitizer
 *
 * Prevents XSS attacks by sanitizing notification content before storage and display.
 * Strips HTML tags, escapes special characters, validates URLs, and enforces length limits.
 *
 * @module lib/notifications/utils/sanitizer
 */

import { logger } from '@/lib/logger';

// ============================================
// Constants
// ============================================

/**
 * Maximum allowed length for notification title
 */
export const MAX_TITLE_LENGTH = 100;

/**
 * Maximum allowed length for notification body
 */
export const MAX_BODY_LENGTH = 500;

/**
 * Regex to strip all HTML tags
 * Matches: <tag>, </tag>, <tag attr="value">, <!-- comment -->
 * Note: We process this BEFORE escaping to avoid double-escaping
 */
const HTML_TAG_REGEX = /<[^>]*>/g;

/**
 * Regex to detect potentially dangerous protocols in URLs
 * Prevents: javascript:, data:, vbscript:, file:, about:
 */
const DANGEROUS_PROTOCOL_REGEX = /^(javascript|data|vbscript|file|about):/i;

/**
 * Regex to validate safe URL protocols
 * Allows: http://, https://, mailto:, tel:, sms:, and relative paths starting with / (but not //)
 * Rejects: protocol-relative URLs (//) for security
 */
const SAFE_URL_REGEX = /^(https?:\/\/[^\s<>]+|mailto:[^\s<>]+|tel:[^\s<>]+|sms:[^\s<>]+|\/(?!\/)[^\s<>]*)$/i;

/**
 * Characters that need HTML entity escaping to prevent XSS
 */
const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
} as const;

// ============================================
// Core Sanitization Functions
// ============================================

/**
 * Strip all HTML tags from a string
 *
 * Removes all HTML elements including:
 * - Opening tags: <script>, <div class="foo">
 * - Closing tags: </script>, </div>
 * - Self-closing tags: <br/>, <img src="..."/>
 * - HTML comments: <!-- comment -->
 *
 * @param {string} input - String potentially containing HTML
 * @returns {string} String with all HTML tags removed
 *
 * @example
 * ```typescript
 * stripHtmlTags('<script>alert("xss")</script>Hello')
 * // Returns: 'alert("xss")Hello'
 *
 * stripHtmlTags('Hello <b>World</b>!')
 * // Returns: 'Hello World!'
 * ```
 */
function stripHtmlTags(input: string): string {
  return input.replace(HTML_TAG_REGEX, '');
}

/**
 * Escape special HTML characters to prevent XSS
 *
 * Converts characters that have special meaning in HTML to their entity equivalents:
 * - & → &amp;
 * - < → &lt;
 * - > → &gt;
 * - " → &quot;
 * - ' → &#x27;
 * - / → &#x2F;
 *
 * @param {string} input - String to escape
 * @returns {string} String with HTML entities escaped
 *
 * @example
 * ```typescript
 * escapeHtml('<script>alert("xss")</script>')
 * // Returns: '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;'
 *
 * escapeHtml("It's a test & demo")
 * // Returns: 'It&#x27;s a test &amp; demo'
 * ```
 */
function escapeHtml(input: string): string {
  return input.replace(/[&<>"'/]/g, (char) => HTML_ESCAPE_MAP[char] || char);
}

/**
 * Truncate string to maximum length with ellipsis
 *
 * If string exceeds maxLength, truncates and adds '...' suffix.
 * Ensures the final string (including ellipsis) doesn't exceed maxLength.
 *
 * @param {string} input - String to truncate
 * @param {number} maxLength - Maximum allowed length
 * @returns {string} Truncated string
 *
 * @example
 * ```typescript
 * truncate('This is a very long notification message', 20)
 * // Returns: 'This is a very lo...'
 *
 * truncate('Short', 20)
 * // Returns: 'Short'
 * ```
 */
function truncate(input: string, maxLength: number): string {
  if (input.length <= maxLength) {
    return input;
  }
  return input.substring(0, maxLength - 3) + '...';
}

/**
 * Validate and sanitize a URL or relative path
 *
 * Security checks:
 * 1. Rejects javascript:, data:, vbscript:, file:, about: protocols
 * 2. Only allows http:, https:, mailto:, tel:, sms:, and relative paths (/)
 * 3. Strips HTML tags from URL
 * 4. Trims whitespace
 *
 * @param {string} url - URL to validate
 * @returns {string | null} Sanitized URL or null if invalid/dangerous
 *
 * @example
 * ```typescript
 * validateUrl('https://example.com/page')
 * // Returns: 'https://example.com/page'
 *
 * validateUrl('/booking/123')
 * // Returns: '/booking/123'
 *
 * validateUrl('javascript:alert("xss")')
 * // Returns: null (dangerous protocol rejected)
 *
 * validateUrl('<img src=x onerror=alert(1)>')
 * // Returns: null (contains HTML tags)
 * ```
 */
function validateUrl(url: string): string | null {
  const trimmed = url.trim();

  // Empty URL is allowed (optional field)
  if (!trimmed) {
    return null;
  }

  // Strip any HTML tags
  const stripped = stripHtmlTags(trimmed);

  // Reject if HTML was stripped (URL shouldn't contain tags)
  if (stripped !== trimmed) {
    logger.warn('Rejected URL containing HTML tags', { url: trimmed });
    return null;
  }

  // Check for dangerous protocols
  if (DANGEROUS_PROTOCOL_REGEX.test(stripped)) {
    logger.warn('Rejected URL with dangerous protocol', { url: stripped });
    return null;
  }

  // Verify URL matches safe pattern
  if (!SAFE_URL_REGEX.test(stripped)) {
    logger.warn('Rejected URL with invalid format', { url: stripped });
    return null;
  }

  return stripped;
}

// ============================================
// Public Sanitization API
// ============================================

/**
 * Sanitization result with change detection
 */
export interface SanitizationResult {
  /** Sanitized value */
  value: string;
  /** Whether sanitization modified the original input */
  wasModified: boolean;
}

/**
 * Sanitize notification title
 *
 * Applies the following transformations:
 * 1. Strips all HTML tags
 * 2. Escapes special HTML characters
 * 3. Trims whitespace
 * 4. Truncates to MAX_TITLE_LENGTH (100 chars)
 *
 * @param {string} title - Raw notification title
 * @returns {SanitizationResult} Sanitized title and modification flag
 *
 * @example
 * ```typescript
 * sanitizeTitle('<script>alert("xss")</script>Booking Confirmed')
 * // Returns: { value: 'alert(&quot;xss&quot;)Booking Confirmed', wasModified: true }
 *
 * sanitizeTitle('New Booking')
 * // Returns: { value: 'New Booking', wasModified: false }
 * ```
 */
export function sanitizeTitle(title: string): SanitizationResult {
  const original = title;

  // 1. Strip HTML tags
  let sanitized = stripHtmlTags(title);

  // 2. Escape special characters
  sanitized = escapeHtml(sanitized);

  // 3. Trim whitespace
  sanitized = sanitized.trim();

  // 4. Truncate to max length
  sanitized = truncate(sanitized, MAX_TITLE_LENGTH);

  return {
    value: sanitized,
    wasModified: sanitized !== original,
  };
}

/**
 * Sanitize notification body
 *
 * Applies the following transformations:
 * 1. Strips all HTML tags
 * 2. Escapes special HTML characters
 * 3. Trims whitespace
 * 4. Truncates to MAX_BODY_LENGTH (500 chars)
 *
 * @param {string} body - Raw notification body
 * @returns {SanitizationResult} Sanitized body and modification flag
 *
 * @example
 * ```typescript
 * sanitizeBody('Your booking at <b>Studio XYZ</b> is confirmed!')
 * // Returns: { value: 'Your booking at Studio XYZ is confirmed!', wasModified: true }
 *
 * sanitizeBody('Regular notification text')
 * // Returns: { value: 'Regular notification text', wasModified: false }
 * ```
 */
export function sanitizeBody(body: string): SanitizationResult {
  const original = body;

  // 1. Strip HTML tags
  let sanitized = stripHtmlTags(body);

  // 2. Escape special characters
  sanitized = escapeHtml(sanitized);

  // 3. Trim whitespace
  sanitized = sanitized.trim();

  // 4. Truncate to max length
  sanitized = truncate(sanitized, MAX_BODY_LENGTH);

  return {
    value: sanitized,
    wasModified: sanitized !== original,
  };
}

/**
 * Sanitize action URL
 *
 * Validates and sanitizes URLs to prevent XSS and protocol injection:
 * 1. Strips HTML tags
 * 2. Validates protocol is safe (http, https, mailto, tel, sms, or relative path)
 * 3. Rejects dangerous protocols (javascript:, data:, vbscript:)
 *
 * @param {string | undefined} actionUrl - URL to sanitize
 * @returns {string | null} Sanitized URL or null if invalid/dangerous
 *
 * @example
 * ```typescript
 * sanitizeActionUrl('https://example.com/booking/123')
 * // Returns: 'https://example.com/booking/123'
 *
 * sanitizeActionUrl('/app/bookings/456')
 * // Returns: '/app/bookings/456'
 *
 * sanitizeActionUrl('javascript:alert("xss")')
 * // Returns: null
 *
 * sanitizeActionUrl(undefined)
 * // Returns: null
 * ```
 */
export function sanitizeActionUrl(actionUrl: string | undefined): string | null {
  if (!actionUrl) {
    return null;
  }

  return validateUrl(actionUrl);
}

/**
 * Deeply sanitize all string values in metadata object
 *
 * Recursively processes metadata to prevent script injection in JSON values:
 * 1. Strips HTML tags from all string values
 * 2. Escapes special characters
 * 3. Recursively processes nested objects and arrays
 * 4. Preserves non-string types (numbers, booleans, null)
 *
 * @param {Record<string, unknown>} metadata - Metadata object to sanitize
 * @returns {Record<string, unknown>} Sanitized metadata object
 *
 * @example
 * ```typescript
 * sanitizeMetadata({
 *   studioName: '<script>alert(1)</script>Studio ABC',
 *   appointmentTime: '2025-01-15T14:00:00Z',
 *   nested: {
 *     description: 'Test <b>HTML</b>',
 *     count: 5,
 *   },
 * })
 * // Returns: {
 * //   studioName: 'alert(1)Studio ABC',
 * //   appointmentTime: '2025-01-15T14:00:00Z',
 * //   nested: {
 * //     description: 'Test HTML',
 * //     count: 5,
 * //   },
 * // }
 * ```
 */
export function sanitizeMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(metadata)) {
    if (typeof value === 'string') {
      // Sanitize string values
      let clean = stripHtmlTags(value);
      clean = escapeHtml(clean);
      sanitized[key] = clean;
    } else if (Array.isArray(value)) {
      // Recursively sanitize arrays
      sanitized[key] = value.map((item) => {
        if (typeof item === 'string') {
          let clean = stripHtmlTags(item);
          clean = escapeHtml(clean);
          return clean;
        } else if (item && typeof item === 'object') {
          return sanitizeMetadata(item as Record<string, unknown>);
        }
        return item;
      });
    } else if (value && typeof value === 'object' && value !== null) {
      // Recursively sanitize nested objects
      sanitized[key] = sanitizeMetadata(value as Record<string, unknown>);
    } else {
      // Preserve other types (number, boolean, null)
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Sanitize complete notification content
 *
 * One-stop function to sanitize all user-provided notification fields.
 * Logs warnings if any sanitization modified the input (potential XSS attempt).
 *
 * @param {Object} content - Notification content to sanitize
 * @param {string} [content.title] - Notification title
 * @param {string} [content.body] - Notification body
 * @param {string} [content.actionUrl] - Action URL
 * @param {Record<string, unknown>} [content.metadata] - Metadata object
 * @returns {Object} Sanitized notification content
 *
 * @example
 * ```typescript
 * const result = sanitizeNotificationContent({
 *   title: '<script>XSS</script>Booking',
 *   body: 'Your booking is <b>confirmed</b>!',
 *   actionUrl: 'javascript:alert(1)',
 *   metadata: { studioName: 'Test <img src=x onerror=alert(1)>' },
 * });
 *
 * // Returns:
 * // {
 * //   title: 'XSSBooking',
 * //   body: 'Your booking is confirmed!',
 * //   actionUrl: null,
 * //   metadata: { studioName: 'Test ' },
 * //   wasModified: true,
 * // }
 * ```
 */
export function sanitizeNotificationContent(content: {
  title?: string;
  body?: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}): {
  title?: string;
  body?: string;
  actionUrl: string | null;
  metadata?: Record<string, unknown>;
  wasModified: boolean;
} {
  let wasModified = false;

  // Sanitize title
  let title: string | undefined;
  if (content.title) {
    const titleResult = sanitizeTitle(content.title);
    title = titleResult.value;
    if (titleResult.wasModified) {
      wasModified = true;
      logger.warn('Notification title was sanitized', {
        original: content.title,
        sanitized: title,
      });
    }
  }

  // Sanitize body
  let body: string | undefined;
  if (content.body) {
    const bodyResult = sanitizeBody(content.body);
    body = bodyResult.value;
    if (bodyResult.wasModified) {
      wasModified = true;
      logger.warn('Notification body was sanitized', {
        original: content.body,
        sanitized: body,
      });
    }
  }

  // Sanitize action URL
  const actionUrl = sanitizeActionUrl(content.actionUrl);
  if (content.actionUrl && !actionUrl) {
    wasModified = true;
    logger.warn('Notification actionUrl was rejected', {
      original: content.actionUrl,
    });
  } else if (content.actionUrl && actionUrl !== content.actionUrl) {
    wasModified = true;
    logger.warn('Notification actionUrl was sanitized', {
      original: content.actionUrl,
      sanitized: actionUrl,
    });
  }

  // Sanitize metadata
  let metadata: Record<string, unknown> | undefined;
  if (content.metadata) {
    const originalJson = JSON.stringify(content.metadata);
    metadata = sanitizeMetadata(content.metadata);
    const sanitizedJson = JSON.stringify(metadata);

    if (originalJson !== sanitizedJson) {
      wasModified = true;
      logger.warn('Notification metadata was sanitized', {
        original: content.metadata,
        sanitized: metadata,
      });
    }
  }

  return {
    title,
    body,
    actionUrl,
    metadata,
    wasModified,
  };
}
