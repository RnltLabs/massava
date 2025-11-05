/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * NextAuth Redirect Logic Tests
 * Verifies role-based redirects work correctly after authentication
 */

import { describe, it, expect } from 'vitest';

/**
 * Mock redirect callback to test logic
 * This simulates the NextAuth redirect callback behavior
 */
function mockRedirectCallback(
  url: string,
  baseUrl: string,
  accountType?: string
): string {
  try {
    const urlObj = new URL(url, baseUrl);
    const callbackUrl = urlObj.searchParams.get('callbackUrl');

    // Inject accountType as query param if provided
    if (accountType) {
      urlObj.searchParams.set('accountType', accountType);
    }
    const finalAccountType = urlObj.searchParams.get('accountType');

    // Determine redirect based on accountType hint or callback URL patterns
    const isBusinessUser =
      finalAccountType === 'studio' ||
      callbackUrl?.includes('/dashboard/owner') ||
      callbackUrl?.includes('/business') ||
      url.includes('/dashboard/owner') ||
      url.includes('/business');

    // Redirect business users to business portal (studio owner dashboard)
    if (isBusinessUser) {
      // If callback URL is provided and is a business route, use it
      if (
        callbackUrl &&
        (callbackUrl.includes('/dashboard/owner') || callbackUrl.includes('/business'))
      ) {
        // Ensure the callback URL is safe (same origin)
        if (callbackUrl.startsWith(baseUrl) || callbackUrl.startsWith('/')) {
          return callbackUrl.startsWith('/') ? `${baseUrl}${callbackUrl}` : callbackUrl;
        }
      }
      // Otherwise redirect to business dashboard
      return `${baseUrl}/dashboard/owner`;
    }

    // Redirect customers to homepage or callback URL
    if (callbackUrl) {
      // Ensure the callback URL is safe (same origin)
      if (callbackUrl.startsWith(baseUrl)) {
        return callbackUrl;
      }
      if (callbackUrl.startsWith('/')) {
        return `${baseUrl}${callbackUrl}`;
      }
    }

    // Default: if URL is on same origin, use it
    if (url.startsWith(baseUrl)) return url;
    if (url.startsWith('/')) return `${baseUrl}${url}`;

    // Otherwise, redirect to homepage (customer landing page)
    return baseUrl;
  } catch (error) {
    console.error('[NextAuth] Redirect error:', error);
    // Safe fallback to homepage
    return baseUrl;
  }
}

describe('NextAuth Redirect Logic', () => {
  const baseUrl = 'http://localhost:3000';

  describe('Studio Owner Redirects', () => {
    it('should redirect studio owners to /dashboard/owner by default', () => {
      const result = mockRedirectCallback(
        `${baseUrl}/api/auth/callback/credentials`,
        baseUrl,
        'studio'
      );

      expect(result).toBe(`${baseUrl}/dashboard/owner`);
    });

    it('should preserve business callback URL for studio owners', () => {
      const callbackUrl = '/dashboard/owner/settings';
      const result = mockRedirectCallback(
        `${baseUrl}/api/auth/callback/credentials?callbackUrl=${encodeURIComponent(callbackUrl)}`,
        baseUrl,
        'studio'
      );

      expect(result).toBe(`${baseUrl}${callbackUrl}`);
    });

    it('should redirect to /dashboard/owner when callback contains /business', () => {
      const callbackUrl = '/business';
      const result = mockRedirectCallback(
        `${baseUrl}/api/auth/callback/credentials?callbackUrl=${encodeURIComponent(callbackUrl)}`,
        baseUrl
      );

      expect(result).toBe(`${baseUrl}/dashboard/owner`);
    });

    it('should detect business user from URL pattern', () => {
      const result = mockRedirectCallback(
        `${baseUrl}/dashboard/owner/calendar`,
        baseUrl
      );

      expect(result).toBe(`${baseUrl}/dashboard/owner`);
    });
  });

  describe('Customer Redirects', () => {
    it('should redirect customers to homepage by default', () => {
      const result = mockRedirectCallback(
        `${baseUrl}/api/auth/callback/credentials`,
        baseUrl,
        'customer'
      );

      expect(result).toBe(baseUrl);
    });

    it('should preserve customer callback URL', () => {
      const callbackUrl = '/search';
      const result = mockRedirectCallback(
        `${baseUrl}/api/auth/callback/credentials?callbackUrl=${encodeURIComponent(callbackUrl)}`,
        baseUrl,
        'customer'
      );

      expect(result).toBe(`${baseUrl}${callbackUrl}`);
    });

    it('should redirect to homepage when no callbackUrl', () => {
      const result = mockRedirectCallback(
        `${baseUrl}/api/auth/callback/google`,
        baseUrl,
        'customer'
      );

      expect(result).toBe(baseUrl);
    });

    it('should preserve booking callback URLs for customers', () => {
      const callbackUrl = '/booking/studio123/slot456';
      const result = mockRedirectCallback(
        `${baseUrl}/api/auth/callback/credentials?callbackUrl=${encodeURIComponent(callbackUrl)}`,
        baseUrl,
        'customer'
      );

      expect(result).toBe(`${baseUrl}${callbackUrl}`);
    });
  });

  describe('Security - Malicious Redirects', () => {
    it('should block external domain redirects', () => {
      const maliciousUrl = 'https://evil.com/phishing';
      const result = mockRedirectCallback(
        `${baseUrl}/api/auth/callback/credentials?callbackUrl=${encodeURIComponent(maliciousUrl)}`,
        baseUrl,
        'customer'
      );

      // Should fallback to safe baseUrl
      expect(result).toBe(baseUrl);
    });

    it('should block protocol-relative URLs', () => {
      const maliciousUrl = '//evil.com/phishing';
      const result = mockRedirectCallback(
        `${baseUrl}/api/auth/callback/credentials?callbackUrl=${encodeURIComponent(maliciousUrl)}`,
        baseUrl,
        'customer'
      );

      // Should fallback to safe baseUrl
      expect(result).toBe(baseUrl);
    });

    it('should only allow same-origin callback URLs', () => {
      const result = mockRedirectCallback(
        `${baseUrl}/api/auth/callback/credentials?callbackUrl=${encodeURIComponent(baseUrl + '/safe-path')}`,
        baseUrl,
        'customer'
      );

      expect(result).toBe(`${baseUrl}/safe-path`);
    });
  });

  describe('OAuth Redirects', () => {
    it('should redirect Google OAuth studio users to business dashboard', () => {
      const result = mockRedirectCallback(
        `${baseUrl}/api/auth/callback/google`,
        baseUrl,
        'studio'
      );

      expect(result).toBe(`${baseUrl}/dashboard/owner`);
    });

    it('should redirect Google OAuth customers to homepage', () => {
      const result = mockRedirectCallback(
        `${baseUrl}/api/auth/callback/google`,
        baseUrl,
        'customer'
      );

      expect(result).toBe(baseUrl);
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing accountType gracefully', () => {
      const result = mockRedirectCallback(
        `${baseUrl}/api/auth/callback/credentials`,
        baseUrl
      );

      // Should default to customer (homepage)
      expect(result).toBe(baseUrl);
    });

    it('should handle malformed URLs gracefully', () => {
      const result = mockRedirectCallback(
        'not-a-valid-url',
        baseUrl,
        'customer'
      );

      // Should fallback to baseUrl
      expect(result).toBe(baseUrl);
    });

    it('should handle relative URLs correctly', () => {
      const result = mockRedirectCallback(
        '/dashboard',
        baseUrl,
        'customer'
      );

      expect(result).toBe(`${baseUrl}/dashboard`);
    });
  });
});
