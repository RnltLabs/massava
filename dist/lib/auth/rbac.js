"use strict";
/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Role-Based Access Control (RBAC) Definitions
 * Implements STRATEGY.md Section 3 (RBAC)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROLE_HIERARCHY = exports.ROLE_PERMISSIONS = void 0;
exports.hasPermission = hasPermission;
exports.hasAnyPermission = hasAnyPermission;
exports.hasAllPermissions = hasAllPermissions;
exports.getPermissionsForRole = getPermissionsForRole;
exports.canAccessStudio = canAccessStudio;
exports.isRoleHigherThan = isRoleHigherThan;
exports.isRoleAtLeast = isRoleAtLeast;
const prisma_1 = require("@/app/generated/prisma");
// Permission matrix by role
exports.ROLE_PERMISSIONS = {
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
function hasPermission(role, permission) {
    return exports.ROLE_PERMISSIONS[role].includes(permission);
}
/**
 * Check if a user has any of the specified permissions
 */
function hasAnyPermission(role, permissions) {
    return permissions.some((permission) => hasPermission(role, permission));
}
/**
 * Check if a user has all of the specified permissions
 */
function hasAllPermissions(role, permissions) {
    return permissions.every((permission) => hasPermission(role, permission));
}
/**
 * Get all permissions for a role
 */
function getPermissionsForRole(role) {
    return exports.ROLE_PERMISSIONS[role];
}
/**
 * Check if a role can access a specific studio
 * (used for studio-scoped permissions)
 */
function canAccessStudio(role, userId, studioOwnerId, studioOwnerIds = []) {
    // SUPER_ADMIN can access all studios
    if (role === prisma_1.UserRole.SUPER_ADMIN) {
        return true;
    }
    // STUDIO_OWNER can access own studios
    if (role === prisma_1.UserRole.STUDIO_OWNER) {
        // Check single owner ID or array of owner IDs
        return (studioOwnerId === userId || studioOwnerIds.includes(userId));
    }
    // CUSTOMER and GUEST cannot access studio management
    return false;
}
/**
 * Role hierarchy (for role comparisons)
 */
exports.ROLE_HIERARCHY = {
    [prisma_1.UserRole.SUPER_ADMIN]: 4,
    [prisma_1.UserRole.STUDIO_OWNER]: 3,
    [prisma_1.UserRole.CUSTOMER]: 2,
    [prisma_1.UserRole.GUEST]: 1,
};
/**
 * Check if role A is higher than role B in hierarchy
 */
function isRoleHigherThan(roleA, roleB) {
    return exports.ROLE_HIERARCHY[roleA] > exports.ROLE_HIERARCHY[roleB];
}
/**
 * Check if role A is equal to or higher than role B
 */
function isRoleAtLeast(roleA, roleB) {
    return exports.ROLE_HIERARCHY[roleA] >= exports.ROLE_HIERARCHY[roleB];
}
