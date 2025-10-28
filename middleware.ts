/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Internationalization Middleware with basePath support
 */

import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n';
import { NextRequest, NextResponse } from 'next/server';

// Since migration to massava.app, no basePath is used
// Previously: '/massava' for rnltlabs.de/massava subdomain
const basePath = '';

const intlMiddleware = createMiddleware({
  // A list of all locales that are supported
  locales,

  // Used when no locale matches
  defaultLocale,

  // Always use prefix (e.g., /de/studios instead of /studios)
  localePrefix: 'always',

  // Enable locale detection from cookies
  localeDetection: true,
});

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // If we have a basePath, check if the request is for a route under basePath
  if (basePath && pathname.startsWith(basePath)) {
    // Extract the path after basePath
    const pathAfterBasePath = pathname.slice(basePath.length) || '/';

    // Temporarily modify pathname for next-intl processing
    const originalPathname = request.nextUrl.pathname;
    request.nextUrl.pathname = pathAfterBasePath;

    // Run next-intl middleware
    const response = intlMiddleware(request);

    // Restore original pathname
    request.nextUrl.pathname = originalPathname;

    // If next-intl redirects, we need to add basePath back to the redirect URL
    if (response && response.headers.get('location')) {
      const location = response.headers.get('location');
      if (location && !location.startsWith('http')) {
        // Relative redirect - add basePath back
        const newLocation = basePath + location;
        return NextResponse.redirect(new URL(newLocation, request.url));
      }
    }

    return response;
  }

  // For non-basePath routes or when no basePath is configured, run middleware normally
  return intlMiddleware(request);
}

export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
