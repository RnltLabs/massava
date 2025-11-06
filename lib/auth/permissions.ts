/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Permission Checking Utilities
 * Runtime permission checks for API routes and server actions
 */

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { UserRole } from '@/app/generated/prisma';
import { hasPermission, Permission } from './rbac';
import { NextRequest, NextResponse } from 'next/server';
import { Result, ok, err } from '@/lib/result';
import { AuthUser } from './types';

/**
 * Get current user from session with all roles
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const session = await auth();

  if (!session?.user?.email) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      roles: {
        select: {
          role: true,
        },
      },
    },
  });

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
    primaryRole: user.primaryRole,
    roles: [
      user.primaryRole,
      ...user.roles.map((r) => r.role),
    ].filter((role, index, self) => self.indexOf(role) === index), // Remove duplicates
    emailVerified: user.emailVerified,
    isActive: user.isActive,
    isSuspended: user.isSuspended,
  };
}

/**
 * Check if current user has a specific permission
 */
export async function checkPermission(
  permission: Permission
): Promise<boolean> {
  const user = await getCurrentUser();

  if (!user) {
    // Guest user - check GUEST role permissions
    return hasPermission(UserRole.GUEST, permission);
  }

  // Check if any of the user's roles has this permission
  return user.roles.some((role) => hasPermission(role, permission));
}

/**
 * Require a specific permission or throw an error
 * @deprecated Use requirePermissionResult instead for Result-based error handling
 */
export async function requirePermission(
  permission: Permission
): Promise<AuthUser> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('Authentication required');
  }

  const hasAccess = user.roles.some((role) =>
    hasPermission(role, permission)
  );

  if (!hasAccess) {
    throw new Error(`Missing permission: ${permission}`);
  }

  return user;
}

/**
 * Require a specific permission - Result-based (no exceptions)
 * Preferred over requirePermission for new code
 *
 * @param permission - Required permission
 * @returns Ok(AuthUser) if user has permission, Err(string) otherwise
 */
export async function requirePermissionResult(
  permission: Permission
): Promise<Result<AuthUser, string>> {
  const user = await getCurrentUser();

  if (!user) {
    return err('Authentication required');
  }

  const hasAccess = user.roles.some((role) =>
    hasPermission(role, permission)
  );

  if (!hasAccess) {
    return err(`Missing permission: ${permission}`);
  }

  return ok(user);
}

/**
 * Check if current user can access a specific studio
 */
export async function checkStudioAccess(studioId: string): Promise<boolean> {
  const user = await getCurrentUser();

  if (!user) {
    return false;
  }

  // Check if user is SUPER_ADMIN
  if (user.primaryRole === UserRole.SUPER_ADMIN) {
    return true;
  }

  // Check if user owns this studio
  const ownership = await prisma.studioOwnership.findUnique({
    where: {
      userId_studioId: {
        userId: user.id,
        studioId: studioId,
      },
    },
  });

  return !!ownership;
}

/**
 * Require studio access or throw an error
 * @deprecated Use requireStudioAccessResult instead for Result-based error handling
 */
export async function requireStudioAccess(
  studioId: string
): Promise<AuthUser> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('Authentication required');
  }

  const hasAccess = await checkStudioAccess(studioId);

  if (!hasAccess) {
    throw new Error('Access denied: You do not own this studio');
  }

  return user;
}

/**
 * Require studio access - Result-based (no exceptions)
 * Preferred over requireStudioAccess for new code
 *
 * @param studioId - Studio ID to check access for
 * @returns Ok(AuthUser) if user has access, Err(string) otherwise
 */
export async function requireStudioAccessResult(
  studioId: string
): Promise<Result<AuthUser, string>> {
  const user = await getCurrentUser();

  if (!user) {
    return err('Authentication required');
  }

  const hasAccess = await checkStudioAccess(studioId);

  if (!hasAccess) {
    return err('Access denied: You do not own this studio');
  }

  return ok(user);
}

/**
 * Get all studios accessible by current user
 */
export async function getUserStudios(): Promise<string[]> {
  const user = await getCurrentUser();

  if (!user) {
    return [];
  }

  // SUPER_ADMIN can access all studios
  if (user.primaryRole === UserRole.SUPER_ADMIN) {
    const allStudios = await prisma.studio.findMany({
      select: { id: true },
    });
    return allStudios.map((s) => s.id);
  }

  // Get studios owned by user
  const ownerships = await prisma.studioOwnership.findMany({
    where: { userId: user.id },
    select: { studioId: true },
  });

  return ownerships.map((o) => o.studioId);
}

/**
 * API Route Helper: Require authentication
 */
export async function requireAuth(): Promise<{ user: AuthUser; response: null } | { user: null; response: NextResponse }> {
  const user = await getCurrentUser();

  if (!user) {
    return {
      user: null,
      response: NextResponse.json(
        { error: 'Authentifizierung erforderlich' },
        { status: 401 }
      ),
    };
  }

  return { user, response: null };
}

/**
 * API Route Helper: Require permission
 */
export async function requirePermissionAPI(
  request: NextRequest,
  permission: Permission
): Promise<{ user: AuthUser; response: null } | { user: null; response: NextResponse }> {
  const authResult = await requireAuth();

  if (authResult.response) {
    return authResult;
  }

  const user = authResult.user!;
  const hasAccess = user.roles.some((role) =>
    hasPermission(role, permission)
  );

  if (!hasAccess) {
    return {
      user: null,
      response: NextResponse.json(
        { error: 'Zugriff verweigert: Fehlende Berechtigung' },
        { status: 403 }
      ),
    };
  }

  return { user, response: null };
}

/**
 * API Route Helper: Require studio access
 */
export async function requireStudioAccessAPI(
  request: NextRequest,
  studioId: string
): Promise<{ user: AuthUser; response: null } | { user: null; response: NextResponse }> {
  const authResult = await requireAuth();

  if (authResult.response) {
    return authResult;
  }

  const user = authResult.user!;
  const hasAccess = await checkStudioAccess(studioId);

  if (!hasAccess) {
    return {
      user: null,
      response: NextResponse.json(
        { error: 'Zugriff verweigert: Studio gehört Ihnen nicht' },
        { status: 403 }
      ),
    };
  }

  return { user, response: null };
}
