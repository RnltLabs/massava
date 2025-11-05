/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * NextAuth Redirect Verification Script
 * Simulates redirect scenarios to verify role-based routing
 */

/**
 * Mock redirect callback (extracted from auth-unified.ts for testing)
 */
function simulateRedirect(
  url: string,
  baseUrl: string
): string {
  try {
    const urlObj = new URL(url, baseUrl);
    const callbackUrl = urlObj.searchParams.get('callbackUrl');
    const accountType = urlObj.searchParams.get('accountType');

    // Check if this is an auth callback URL (should not be used as final destination)
    const isAuthCallback = url.includes('/api/auth/callback/') || url.includes('/api/auth/signin');

    // Determine redirect based on accountType hint or callback URL patterns
    const isBusinessUser = accountType === 'studio' ||
                           callbackUrl?.includes('/dashboard/owner') ||
                           callbackUrl?.includes('/business');

    // Redirect business users to business portal (studio owner dashboard)
    if (isBusinessUser) {
      // If callback URL is provided and is a business route, use it
      if (callbackUrl && (callbackUrl.includes('/dashboard/owner') || callbackUrl.includes('/business'))) {
        // Ensure the callback URL is safe (same origin)
        if (callbackUrl.startsWith(baseUrl)) {
          return callbackUrl;
        }
        // Only allow absolute paths starting with single slash (not protocol-relative //)
        if (callbackUrl.startsWith('/') && !callbackUrl.startsWith('//')) {
          return `${baseUrl}${callbackUrl}`;
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
      // Only allow absolute paths starting with single slash (not protocol-relative //)
      if (callbackUrl.startsWith('/') && !callbackUrl.startsWith('//')) {
        return `${baseUrl}${callbackUrl}`;
      }
    }

    // If this is an auth callback URL without a callbackUrl param, redirect to homepage
    if (isAuthCallback) {
      return baseUrl;
    }

    // Default: if URL is safe and not an auth callback, use it
    if (url.startsWith(baseUrl) && !isAuthCallback) return url;
    if (url.startsWith('/') && !isAuthCallback) return `${baseUrl}${url}`;

    // Otherwise, redirect to homepage (customer landing page)
    return baseUrl;
  } catch (error) {
    console.error('[NextAuth] Redirect error:', error);
    // Safe fallback to homepage
    return baseUrl;
  }
}

interface TestCase {
  name: string;
  url: string;
  expected: string;
  accountType?: string;
  callbackUrl?: string;
}

const baseUrl = 'http://localhost:3000';

const testCases: TestCase[] = [
  // Studio Owner Cases
  {
    name: 'Studio owner default redirect',
    url: `${baseUrl}/api/auth/callback/credentials?accountType=studio`,
    expected: `${baseUrl}/dashboard/owner`,
  },
  {
    name: 'Studio owner with business callback',
    url: `${baseUrl}/api/auth/callback/credentials?accountType=studio&callbackUrl=${encodeURIComponent('/dashboard/owner/settings')}`,
    expected: `${baseUrl}/dashboard/owner/settings`,
  },
  {
    name: 'Studio owner with /business callback',
    url: `${baseUrl}/api/auth/callback/credentials?callbackUrl=${encodeURIComponent('/business')}`,
    expected: `${baseUrl}/business`,
  },
  {
    name: 'Direct access to business route (not auth callback)',
    url: `${baseUrl}/dashboard/owner/calendar`,
    expected: `${baseUrl}/dashboard/owner/calendar`,
  },

  // Customer Cases
  {
    name: 'Customer default redirect',
    url: `${baseUrl}/api/auth/callback/credentials?accountType=customer`,
    expected: baseUrl,
  },
  {
    name: 'Customer with callback URL',
    url: `${baseUrl}/api/auth/callback/credentials?accountType=customer&callbackUrl=${encodeURIComponent('/search')}`,
    expected: `${baseUrl}/search`,
  },
  {
    name: 'Customer with booking callback',
    url: `${baseUrl}/api/auth/callback/credentials?accountType=customer&callbackUrl=${encodeURIComponent('/booking/studio123/slot456')}`,
    expected: `${baseUrl}/booking/studio123/slot456`,
  },
  {
    name: 'Customer OAuth (Google)',
    url: `${baseUrl}/api/auth/callback/google`,
    expected: baseUrl,
  },

  // Security Cases
  {
    name: 'Block external domain',
    url: `${baseUrl}/api/auth/callback/credentials?callbackUrl=${encodeURIComponent('https://evil.com/phishing')}`,
    expected: baseUrl,
  },
  {
    name: 'Block protocol-relative URL',
    url: `${baseUrl}/api/auth/callback/credentials?callbackUrl=${encodeURIComponent('//evil.com/phishing')}`,
    expected: baseUrl,
  },
  {
    name: 'Allow same-origin callback',
    url: `${baseUrl}/api/auth/callback/credentials?callbackUrl=${encodeURIComponent(baseUrl + '/safe-path')}`,
    expected: `${baseUrl}/safe-path`,
  },

  // Edge Cases
  {
    name: 'No accountType (default to customer)',
    url: `${baseUrl}/api/auth/callback/credentials`,
    expected: baseUrl,
  },
  {
    name: 'Relative URL',
    url: '/dashboard',
    expected: `${baseUrl}/dashboard`,
  },
];

console.log('🔐 NextAuth Redirect Verification\n');
console.log('=' .repeat(80));
console.log('\n');

let passed = 0;
let failed = 0;

for (const test of testCases) {
  const result = simulateRedirect(test.url, baseUrl);
  const success = result === test.expected;

  if (success) {
    console.log(`✅ PASS: ${test.name}`);
    passed++;
  } else {
    console.log(`❌ FAIL: ${test.name}`);
    console.log(`   Expected: ${test.expected}`);
    console.log(`   Got:      ${result}`);
    failed++;
  }
}

console.log('\n' + '=' .repeat(80));
console.log(`\n📊 Results: ${passed} passed, ${failed} failed out of ${testCases.length} tests\n`);

if (failed === 0) {
  console.log('✨ All tests passed! NextAuth redirect logic is working correctly.\n');
  process.exit(0);
} else {
  console.log('⚠️  Some tests failed. Please review the implementation.\n');
  process.exit(1);
}
