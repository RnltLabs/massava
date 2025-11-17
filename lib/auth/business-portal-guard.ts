/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Business Portal Access Guard
 * Implements MASTER_ORCHESTRATION_PLAN.md - Task 2.1: Middleware Protection
 *
 * Purpose: Protect /business/* routes to restrict access to STUDIO_OWNER and STUDIO_STAFF only
 */

import { UserRole } from '@/app/generated/prisma';
import { Session } from 'next-auth';
import { Result, ok, err } from '@/lib/result';
import { AuthError, createAuthError } from './errors';

/**
 * Roles allowed to access the business portal
 */
export const BUSINESS_PORTAL_ROLES: UserRole[] = [
  UserRole.STUDIO_OWNER,
  UserRole.SUPER_ADMIN, // Super admin has access to everything
];


/**
 * Check if a user has access to the business portal
 *
 * @param user - User object from NextAuth session
 * @returns true if user has STUDIO_OWNER, STUDIO_STAFF, or SUPER_ADMIN role
 */
export function isBusinessPortalUser(user: {
  primaryRole?: UserRole;
  roles?: UserRole[];
}): boolean {
  if (!user.primaryRole) {
    return false;
  }

  // Check primary role
  if (BUSINESS_PORTAL_ROLES.includes(user.primaryRole)) {
    return true;
  }

  // Check additional roles (if user has multiple roles)
  if (user.roles && user.roles.length > 0) {
    return user.roles.some((role) => BUSINESS_PORTAL_ROLES.includes(role));
  }

  return false;
}

/**
 * Check if a session has business portal access
 *
 * @param session - NextAuth session object
 * @returns true if session user has business portal access
 */
export function hasBusinessPortalAccess(session: Session | null): boolean {
  if (!session || !session.user) {
    return false;
  }

  return isBusinessPortalUser(session.user);
}

/**
 * Require business portal access - Result-based (no exceptions)
 *
 * @param user - User object from NextAuth session
 * @returns Ok(void) if user has access, Err(AuthError) otherwise
 */
export function requireBusinessAccess(user?: {
  id?: string;
  primaryRole?: UserRole;
  roles?: UserRole[];
}): Result<void, AuthError> {
  if (!user) {
    return err(
      createAuthError(
        'UNAUTHORIZED',
        'Authentication required to access business portal'
      )
    );
  }

  if (!isBusinessPortalUser(user)) {
    return err(
      createAuthError(
        'FORBIDDEN',
        'Business portal access restricted to studio owners and staff',
        {
          userId: user.id,
          required: BUSINESS_PORTAL_ROLES.join(', '),
          actual: user.primaryRole || 'unknown',
        }
      )
    );
  }

  return ok(undefined);
}

/**
 * Get appropriate redirect URL based on user's role
 *
 * @param user - User object from NextAuth session (optional)
 * @returns Redirect URL appropriate for the user's role
 */
export function getBusinessPortalRedirect(user?: {
  primaryRole?: UserRole;
  roles?: UserRole[];
}): string {
  if (!user) {
    // Not authenticated - redirect to sign in with callback to business portal
    return '/auth/signin?callbackUrl=/business';
  }

  if (isBusinessPortalUser(user)) {
    // User has access - redirect to business dashboard
    return '/business/dashboard';
  }

  // User doesn't have access - redirect to unauthorized page
  return '/unauthorized';
}

/**
 * Get redirect URL for unauthorized access attempts
 *
 * @param requestedPath - The path the user tried to access
 * @returns URL to redirect unauthorized users
 */
export function getUnauthorizedRedirect(requestedPath?: string): string {
  const params = new URLSearchParams();

  if (requestedPath) {
    params.set('requested', requestedPath);
  }

  const queryString = params.toString();
  return `/unauthorized${queryString ? `?${queryString}` : ''}`;
}

/**
 * Get sign-in redirect URL with callback to business portal
 *
 * @param callbackPath - Path to redirect to after sign in (default: /business)
 * @returns Sign-in URL with callback parameter
 */
export function getBusinessSignInRedirect(callbackPath: string = '/business'): string {
  const params = new URLSearchParams();
  params.set('callbackUrl', callbackPath);
  return `/auth/signin?${params.toString()}`;
}
