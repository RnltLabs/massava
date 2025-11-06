/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Auth Guards - Authorization helpers
 * Reusable authorization checks with Result pattern
 */

import { auth } from '@/auth';
import { UserRole } from '@/app/generated/prisma';
import type { AuthUser, Result, AuthError } from './types';
import { authDal } from './dal';
import { getCurrentUser } from './permissions';

/**
 * Require authentication
 * Returns authenticated user or error
 * Uses cached getCurrentUser() for improved performance
 */
export async function requireAuth(): Promise<Result<AuthUser, AuthError>> {
  const session = await auth();

  if (!session || !session.user) {
    return {
      ok: false,
      error: {
        type: 'UNAUTHORIZED',
        message: 'Authentication required',
      },
    };
  }

  // Use cached getCurrentUser() instead of direct DB query
  const user = await getCurrentUser();

  if (!user) {
    return {
      ok: false,
      error: {
        type: 'NOT_FOUND',
        message: 'User not found',
      },
    };
  }

  // Check if user is active
  if (!user.isActive || user.isSuspended) {
    return {
      ok: false,
      error: {
        type: 'FORBIDDEN',
        message: 'Account is not active',
      },
    };
  }

  return {
    ok: true,
    value: user,
  };
}

/**
 * Require specific role(s)
 */
export async function requireRole(
  allowedRoles: UserRole[]
): Promise<Result<AuthUser, AuthError>> {
  const authResult = await requireAuth();

  if (!authResult.ok) {
    return authResult;
  }

  const user = authResult.value;

  // Check if user has any of the allowed roles
  const hasRole = allowedRoles.some(
    (role) => user.primaryRole === role || user.roles.includes(role)
  );

  if (!hasRole) {
    return {
      ok: false,
      error: {
        type: 'FORBIDDEN',
        message: 'Insufficient permissions',
      },
    };
  }

  return authResult;
}

/**
 * Require business access (STUDIO_OWNER or SUPER_ADMIN)
 */
export async function requireBusinessAccess(): Promise<Result<AuthUser, AuthError>> {
  return requireRole([UserRole.STUDIO_OWNER, UserRole.SUPER_ADMIN]);
}

/**
 * Require studio ownership
 * Verifies user owns the specified studio
 */
export async function requireStudioOwnership(
  studioId: string
): Promise<Result<AuthUser, AuthError>> {
  const authResult = await requireAuth();

  if (!authResult.ok) {
    return authResult;
  }

  const user = authResult.value;

  // Super admins can access any studio
  if (user.primaryRole === UserRole.SUPER_ADMIN) {
    return authResult;
  }

  // Check ownership
  const ownershipResult = await authDal.checkStudioOwnership(user.id, studioId);

  if (!ownershipResult.ok) {
    return {
      ok: false,
      error: ownershipResult.error,
    };
  }

  if (!ownershipResult.value) {
    return {
      ok: false,
      error: {
        type: 'FORBIDDEN',
        message: 'You do not own this studio',
      },
    };
  }

  return authResult;
}

/**
 * Check if user has permission (without throwing)
 * Useful for conditional UI rendering
 */
export async function hasPermission(allowedRoles: UserRole[]): Promise<boolean> {
  const result = await requireRole(allowedRoles);
  return result.ok;
}
