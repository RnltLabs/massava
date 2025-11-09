/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Middleware Chain - Edge Runtime Compatible
 * Implements:
 * 1. Internationalization (next-intl)
 * 2. Business Portal Protection (RBAC)
 *
 * CRITICAL: Uses auth.config.ts (Edge-safe) NOT auth.ts (Node.js with Prisma)
 * This prevents Edge Runtime errors when importing Prisma Client
 *
 * Task 2.1: Middleware Protection (MASTER_ORCHESTRATION_PLAN.md)
 * Phase 1: Config Split (Security Migration)
 */

import { NextRequest, NextResponse } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n';
import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

// Initialize NextAuth with Edge-safe config (NO Prisma)
const { auth } = NextAuth(authConfig);

// Create i18n middleware
const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
  localeDetection: true,
});

/**
 * Routes that require a registered studio
 * Users without a studio will be redirected to /business/onboarding
 */
const STUDIO_REQUIRED_ROUTES = [
  '/business/bookings',
  '/business/calendar',
  '/business/settings',
  '/business/more',
  '/business/actions',
  '/business/help',
];

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
 * Check if a path requires a registered studio
 */
function requiresStudio(pathname: string): boolean {
  const pathWithoutLocale = pathname.replace(/^\/(de|en|th|zh|vi|pl|ru)/, '');

  return STUDIO_REQUIRED_ROUTES.some((route) =>
    pathWithoutLocale.startsWith(route)
  );
}

/**
 * Check if user has business portal access
 * Uses string comparison to avoid type mismatch between Prisma and edge-compatible UserRole enums
 */
function hasBusinessAccess(session: { user?: { primaryRole?: string; roles?: string[] } } | null): boolean {
  if (!session?.user?.primaryRole) {
    return false;
  }

  const primaryRole = session.user.primaryRole;
  const roles = session.user.roles || [];

  // Check if user has STUDIO_OWNER or SUPER_ADMIN role (string comparison)
  return (
    primaryRole === 'STUDIO_OWNER' ||
    primaryRole === 'SUPER_ADMIN' ||
    roles.includes('STUDIO_OWNER') ||
    roles.includes('SUPER_ADMIN')
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

    // Check if route requires studio ownership
    if (requiresStudio(pathname)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const hasStudio = (session.user as any)?.hasStudio ?? false;

      if (!hasStudio) {
        // Extract locale from pathname
        const locale = pathname.match(/^\/(de|en|th|zh|vi|pl|ru)/)?.[1] || 'en';
        const onboardingUrl = new URL(`/${locale}/business/onboarding`, request.url);
        return NextResponse.redirect(onboardingUrl);
      }
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
