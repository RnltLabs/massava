/**
 * URL Validation Utilities
 *
 * Security utilities for validating URLs to prevent open redirect vulnerabilities.
 * Used for notification action URLs and deep links.
 *
 * @module lib/utils/url-validation
 */

/**
 * Allowed hostnames for internal navigation
 * Add your domains here (without protocol)
 */
const ALLOWED_HOSTS = [
  'localhost',
  'massava.app',
  'www.massava.app',
  'staging.massava.app',
  'dev.massava.app',
];

/**
 * Check if a URL is safe for internal navigation
 *
 * Validates that the URL is either:
 * - A relative path (starts with /)
 * - An absolute URL pointing to an allowed domain
 *
 * Rejects:
 * - External URLs (different domain)
 * - Protocol-relative URLs (//example.com)
 * - javascript: URLs
 * - data: URLs
 * - vbscript: URLs
 *
 * @param url - URL to validate
 * @returns True if URL is safe for navigation
 *
 * @example
 * ```typescript
 * isInternalUrl('/bookings')         // true (relative)
 * isInternalUrl('/de/settings')      // true (relative)
 * isInternalUrl('https://massava.app/bookings') // true (allowed host)
 * isInternalUrl('https://evil.com')  // false (external)
 * isInternalUrl('javascript:alert(1)') // false (dangerous protocol)
 * ```
 */
export function isInternalUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  // Trim whitespace
  const trimmedUrl = url.trim();

  // Reject empty URLs
  if (!trimmedUrl) {
    return false;
  }

  // Reject dangerous protocols
  const lowerUrl = trimmedUrl.toLowerCase();
  if (
    lowerUrl.startsWith('javascript:') ||
    lowerUrl.startsWith('data:') ||
    lowerUrl.startsWith('vbscript:')
  ) {
    return false;
  }

  // Reject protocol-relative URLs (//example.com)
  if (trimmedUrl.startsWith('//')) {
    return false;
  }

  // Allow relative paths (start with /)
  if (trimmedUrl.startsWith('/') && !trimmedUrl.startsWith('//')) {
    return true;
  }

  // Parse absolute URLs
  try {
    const parsed = new URL(trimmedUrl);

    // Only allow http/https protocols
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }

    // Check if hostname is in allowed list
    const hostname = parsed.hostname.toLowerCase();
    return ALLOWED_HOSTS.some((allowed) => {
      // Exact match or subdomain match
      return hostname === allowed || hostname.endsWith(`.${allowed}`);
    });
  } catch {
    // Invalid URL - reject
    return false;
  }
}

/**
 * Sanitize a URL for safe navigation
 *
 * Returns the URL if safe, or '/' as fallback
 *
 * @param url - URL to sanitize
 * @param fallback - Fallback URL if invalid (default: '/')
 * @returns Safe URL for navigation
 */
export function sanitizeNavigationUrl(url: string, fallback = '/'): string {
  return isInternalUrl(url) ? url : fallback;
}
