/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Role-Based Access Control (RBAC) Definitions
 * Implements STRATEGY.md Section 3 (RBAC)
 */

import { UserRole } from '@/app/generated/prisma';

// Permission types
export type Permission =
  // Platform Management
  | 'platform:view_all_studios'
  | 'platform:suspend_studio'
  | 'platform:delete_any_studio'
  | 'platform:view_all_users'
  | 'platform:analytics'
  | 'platform:settings'
  // Studio Management
  | 'studio:create'
  | 'studio:edit_own'
  | 'studio:delete_own'
  | 'studio:view_public'
  // Bookings
  | 'booking:view_all'
  | 'booking:view_studio'
  | 'booking:create'
  | 'booking:view_own'
  | 'booking:cancel_own'
  | 'booking:confirm'
  // Services
  | 'service:create'
  | 'service:view'
  // User Management
  | 'user:export_own_data'
  | 'user:delete_own_account';

// Permission matrix by role
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  SUPER_ADMIN: [
    // Platform Management - Full access
    'platform:view_all_studios',
    'platform:suspend_studio',
    'platform:delete_any_studio',
    'platform:view_all_users',
    'platform:analytics',
    'platform:settings',
    // Studio Management - Full access
    'studio:create',
    'studio:edit_own',
    'studio:delete_own',
    'studio:view_public',
    // Bookings - Full access
    'booking:view_all',
    'booking:view_studio',
    'booking:create',
    'booking:view_own',
    'booking:cancel_own',
    'booking:confirm',
    // Services - Full access
    'service:create',
    'service:view',
    // User Management
    'user:export_own_data',
    'user:delete_own_account',
  ],

  STUDIO_OWNER: [
    // Studio Management
    'studio:create',
    'studio:edit_own',
    'studio:delete_own',
    'studio:view_public',
    // Bookings
    'booking:view_studio', // Own studios only
    'booking:create',
    'booking:view_own',
    'booking:cancel_own',
    'booking:confirm', // Own studios only
    // Services
    'service:create', // Own studios only
    'service:view',
    // User Management
    'user:export_own_data',
    'user:delete_own_account',
  ],

  CUSTOMER: [
    // Studio Management
    'studio:view_public',
    // Bookings
    'booking:create',
    'booking:view_own',
    'booking:cancel_own',
    // Services
    'service:view',
    // User Management
    'user:export_own_data',
    'user:delete_own_account',
  ],

  GUEST: [
    // Studio Management
    'studio:view_public',
    // Services
    'service:view',
  ],
};

/**
 * Check if a user role has a specific permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

/**
 * Check if a user has any of the specified permissions
 */
export function hasAnyPermission(
  role: UserRole,
  permissions: Permission[]
): boolean {
  return permissions.some((permission) => hasPermission(role, permission));
}

/**
 * Check if a user has all of the specified permissions
 */
export function hasAllPermissions(
  role: UserRole,
  permissions: Permission[]
): boolean {
  return permissions.every((permission) => hasPermission(role, permission));
}

/**
 * Get all permissions for a role
 */
export function getPermissionsForRole(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role];
}

/**
 * Check if a role can access a specific studio
 * (used for studio-scoped permissions)
 */
export function canAccessStudio(
  role: UserRole,
  userId: string,
  studioOwnerId: string | null,
  studioOwnerIds: string[] = []
): boolean {
  // SUPER_ADMIN can access all studios
  if (role === UserRole.SUPER_ADMIN) {
    return true;
  }

  // STUDIO_OWNER can access own studios
  if (role === UserRole.STUDIO_OWNER) {
    // Check single owner ID or array of owner IDs
    return (
      studioOwnerId === userId || studioOwnerIds.includes(userId)
    );
  }

  // CUSTOMER and GUEST cannot access studio management
  return false;
}

/**
 * Role hierarchy (for role comparisons)
 */
export const ROLE_HIERARCHY = {
  [UserRole.SUPER_ADMIN]: 4,
  [UserRole.STUDIO_OWNER]: 3,
  [UserRole.CUSTOMER]: 2,
  [UserRole.GUEST]: 1,
};

/**
 * Check if role A is higher than role B in hierarchy
 */
export function isRoleHigherThan(roleA: UserRole, roleB: UserRole): boolean {
  return ROLE_HIERARCHY[roleA] > ROLE_HIERARCHY[roleB];
}

/**
 * Check if role A is equal to or higher than role B
 */
export function isRoleAtLeast(roleA: UserRole, roleB: UserRole): boolean {
  return ROLE_HIERARCHY[roleA] >= ROLE_HIERARCHY[roleB];
}
