/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Auth Guards - Authorization helpers
 * Reusable authorization checks with Result pattern
 */

import { auth } from '@/auth';
import { UserRole } from '@/app/generated/prisma';
import type { AuthUser } from './types';
import { Result, ok, err } from '@/lib/result';
import { AuthError, createAuthError } from './errors';
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
    return err(createAuthError('UNAUTHORIZED', 'Authentication required'));
  }

  // Use cached getCurrentUser() instead of direct DB query
  const user = await getCurrentUser();

  if (!user) {
    return err(createAuthError('NOT_FOUND', 'User not found', { resource: 'user' }));
  }

  // Check if user is active
  if (!user.isActive) {
    return err(
      createAuthError('ACCOUNT_INACTIVE', 'Account is not active', { userId: user.id })
    );
  }

  if (user.isSuspended) {
    return err(
      createAuthError('ACCOUNT_SUSPENDED', 'Account has been suspended', { userId: user.id })
    );
  }

  return ok(user);
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
    return err(
      createAuthError('INVALID_ROLE', 'Insufficient permissions', {
        required: allowedRoles.join(', '),
        actual: user.primaryRole,
      })
    );
  }

  return ok(user);
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
    return ok(user);
  }

  // Check ownership
  const ownershipResult = await authDal.checkStudioOwnership(user.id, studioId);

  if (!ownershipResult.ok) {
    return err(ownershipResult.error);
  }

  if (!ownershipResult.value) {
    return err(
      createAuthError('FORBIDDEN', 'You do not own this studio', {
        resource: 'studio',
        studioId,
        userId: user.id,
      })
    );
  }

  return ok(user);
}

/**
 * Check if user has permission (without throwing)
 * Useful for conditional UI rendering
 */
export async function hasPermission(allowedRoles: UserRole[]): Promise<boolean> {
  const result = await requireRole(allowedRoles);
  return result.ok;
}
