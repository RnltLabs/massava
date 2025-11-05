/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Middleware Chain
 * Implements:
 * 1. Internationalization (next-intl)
 * 2. Business Portal Protection (RBAC)
 *
 * Task 2.1: Middleware Protection (MASTER_ORCHESTRATION_PLAN.md)
 */

import { NextRequest, NextResponse } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n';
import { auth } from './auth-unified';
import { UserRole } from '@/lib/types/user-role';

// Create i18n middleware
const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
  localeDetection: true,
});

/**
 * Check if a path is a business portal route
 */
function isBusinessPortalRoute(pathname: string): boolean {
  // Remove locale prefix (e.g., /de/business -> /business)
  const pathWithoutLocale = pathname.replace(/^\/(de|en|th|zh|vi|pl|ru)/, '');

  return (
    pathWithoutLocale.startsWith('/business') ||
    pathWithoutLocale.startsWith('/api/business')
  );
}

/**
 * Check if user has business portal access
 */
function hasBusinessAccess(session: { user?: { primaryRole?: UserRole; roles?: UserRole[] } } | null): boolean {
  if (!session?.user?.primaryRole) {
    return false;
  }

  const primaryRole = session.user.primaryRole;
  const roles = session.user.roles || [];

  // Check if user has STUDIO_OWNER or SUPER_ADMIN role
  return (
    primaryRole === UserRole.STUDIO_OWNER ||
    primaryRole === UserRole.SUPER_ADMIN ||
    roles.includes(UserRole.STUDIO_OWNER) ||
    roles.includes(UserRole.SUPER_ADMIN)
  );
}

/**
 * Main middleware function
 */
export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Step 1: Apply i18n middleware
  const intlResponse = intlMiddleware(request);

  // Step 2: Check if this is a business portal route
  if (isBusinessPortalRoute(pathname)) {
    // Get session
    const session = await auth();

    // Not authenticated - redirect to sign-in with callback
    if (!session) {
      const signInUrl = new URL('/auth/signin', request.url);
      signInUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(signInUrl);
    }

    // Authenticated but no business access - redirect to unauthorized
    if (!hasBusinessAccess(session)) {
      const unauthorizedUrl = new URL('/unauthorized', request.url);
      unauthorizedUrl.searchParams.set('requested', pathname);
      return NextResponse.redirect(unauthorizedUrl);
    }
  }

  // Return i18n response if no business portal protection needed
  return intlResponse;
}

export const config = {
  // Match all pathnames except for
  // - API routes (handled separately)
  // - Static files (images, fonts, etc.)
  // - Next.js internals
  matcher: [
    // Include all routes
    '/((?!api|_next|_vercel|.*\\..*).*)',
    // Include /api/business routes for API protection
    '/api/business/:path*',
  ],
};
