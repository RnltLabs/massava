"use strict";
/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Auth Guards - Authorization helpers
 * Reusable authorization checks with Result pattern
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
exports.requireRole = requireRole;
exports.requireBusinessAccess = requireBusinessAccess;
exports.requireStudioOwnership = requireStudioOwnership;
exports.hasPermission = hasPermission;
const auth_1 = require("@/auth");
const prisma_1 = require("@/app/generated/prisma");
const dal_1 = require("./dal");
const permissions_1 = require("./permissions");
/**
 * Require authentication
 * Returns authenticated user or error
 * Uses cached getCurrentUser() for improved performance
 */
async function requireAuth() {
    const session = await (0, auth_1.auth)();
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
    const user = await (0, permissions_1.getCurrentUser)();
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
async function requireRole(allowedRoles) {
    const authResult = await requireAuth();
    if (!authResult.ok) {
        return authResult;
    }
    const user = authResult.value;
    // Check if user has any of the allowed roles
    const hasRole = allowedRoles.some((role) => user.primaryRole === role || user.roles.includes(role));
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
async function requireBusinessAccess() {
    return requireRole([prisma_1.UserRole.STUDIO_OWNER, prisma_1.UserRole.SUPER_ADMIN]);
}
/**
 * Require studio ownership
 * Verifies user owns the specified studio
 */
async function requireStudioOwnership(studioId) {
    const authResult = await requireAuth();
    if (!authResult.ok) {
        return authResult;
    }
    const user = authResult.value;
    // Super admins can access any studio
    if (user.primaryRole === prisma_1.UserRole.SUPER_ADMIN) {
        return authResult;
    }
    // Check ownership
    const ownershipResult = await dal_1.authDal.checkStudioOwnership(user.id, studioId);
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
async function hasPermission(allowedRoles) {
    const result = await requireRole(allowedRoles);
    return result.ok;
}
