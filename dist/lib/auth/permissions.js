"use strict";
/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Permission Checking Utilities
 * Runtime permission checks for API routes and server actions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentUser = getCurrentUser;
exports.checkPermission = checkPermission;
exports.requirePermission = requirePermission;
exports.requirePermissionResult = requirePermissionResult;
exports.checkStudioAccess = checkStudioAccess;
exports.requireStudioAccess = requireStudioAccess;
exports.requireStudioAccessResult = requireStudioAccessResult;
exports.getUserStudios = getUserStudios;
exports.requireAuth = requireAuth;
exports.requirePermissionAPI = requirePermissionAPI;
exports.requireStudioAccessAPI = requireStudioAccessAPI;
const prisma_1 = require("@/lib/prisma");
const auth_1 = require("@/auth");
const prisma_2 = require("@/app/generated/prisma");
const rbac_1 = require("./rbac");
const server_1 = require("next/server");
const result_1 = require("@/lib/result");
const session_cache_1 = require("./session-cache");
const logger_1 = require("@/lib/logger");
/**
 * Get current user from session with all roles
 * Uses Redis cache for ~94% latency reduction (80ms → 5ms)
 */
async function getCurrentUser() {
    const session = await (0, auth_1.auth)();
    if (!session?.user?.email || !session?.user?.id) {
        return null;
    }
    // 1. Try cache first (FAST PATH: ~5ms)
    const cached = await (0, session_cache_1.getSessionFromCache)(session.user.id);
    if (cached) {
        logger_1.logger.debug('Session cache hit in permissions check', {
            userId: session.user.id,
            action: 'GET_CURRENT_USER'
        });
        return {
            id: cached.userId,
            email: cached.email,
            name: cached.name,
            image: cached.image,
            primaryRole: cached.role,
            roles: [cached.role], // Simplified in cache (only primary role)
            emailVerified: null, // Not stored in cache
            isActive: true, // Assume active if cached
            isSuspended: false, // Assume not suspended if cached
        };
    }
    logger_1.logger.debug('Session cache miss in permissions check', {
        userId: session.user.id,
        action: 'GET_CURRENT_USER'
    });
    // 2. Cache miss - load from database (SLOW PATH: ~80ms)
    const user = await prisma_1.prisma.user.findUnique({
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
    // 3. Build full AuthUser object
    const authUser = {
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
    // 4. Cache for next time (fire-and-forget, don't await)
    (0, session_cache_1.setSessionInCache)(user.id, {
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.primaryRole,
        image: user.image,
        createdAt: new Date().toISOString(),
        lastAccessedAt: new Date().toISOString(),
    }).catch((err) => {
        // Log cache write errors but don't fail the request
        logger_1.logger.warn('Failed to cache session in permissions', {
            userId: user.id,
            error: err instanceof Error ? err.message : String(err),
            action: 'CACHE_SESSION'
        });
    });
    return authUser;
}
/**
 * Check if current user has a specific permission
 */
async function checkPermission(permission) {
    const user = await getCurrentUser();
    if (!user) {
        // Guest user - check GUEST role permissions
        return (0, rbac_1.hasPermission)(prisma_2.UserRole.GUEST, permission);
    }
    // Check if any of the user's roles has this permission
    return user.roles.some((role) => (0, rbac_1.hasPermission)(role, permission));
}
/**
 * Require a specific permission or throw an error
 * @deprecated Use requirePermissionResult instead for Result-based error handling
 */
async function requirePermission(permission) {
    const user = await getCurrentUser();
    if (!user) {
        throw new Error('Authentication required');
    }
    const hasAccess = user.roles.some((role) => (0, rbac_1.hasPermission)(role, permission));
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
async function requirePermissionResult(permission) {
    const user = await getCurrentUser();
    if (!user) {
        return (0, result_1.err)('Authentication required');
    }
    const hasAccess = user.roles.some((role) => (0, rbac_1.hasPermission)(role, permission));
    if (!hasAccess) {
        return (0, result_1.err)(`Missing permission: ${permission}`);
    }
    return (0, result_1.ok)(user);
}
/**
 * Check if current user can access a specific studio
 */
async function checkStudioAccess(studioId) {
    const user = await getCurrentUser();
    if (!user) {
        return false;
    }
    // Check if user is SUPER_ADMIN
    if (user.primaryRole === prisma_2.UserRole.SUPER_ADMIN) {
        return true;
    }
    // Check if user owns this studio
    const ownership = await prisma_1.prisma.studioOwnership.findUnique({
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
async function requireStudioAccess(studioId) {
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
async function requireStudioAccessResult(studioId) {
    const user = await getCurrentUser();
    if (!user) {
        return (0, result_1.err)('Authentication required');
    }
    const hasAccess = await checkStudioAccess(studioId);
    if (!hasAccess) {
        return (0, result_1.err)('Access denied: You do not own this studio');
    }
    return (0, result_1.ok)(user);
}
/**
 * Get all studios accessible by current user
 */
async function getUserStudios() {
    const user = await getCurrentUser();
    if (!user) {
        return [];
    }
    // SUPER_ADMIN can access all studios
    if (user.primaryRole === prisma_2.UserRole.SUPER_ADMIN) {
        const allStudios = await prisma_1.prisma.studio.findMany({
            select: { id: true },
        });
        return allStudios.map((s) => s.id);
    }
    // Get studios owned by user
    const ownerships = await prisma_1.prisma.studioOwnership.findMany({
        where: { userId: user.id },
        select: { studioId: true },
    });
    return ownerships.map((o) => o.studioId);
}
/**
 * API Route Helper: Require authentication
 */
async function requireAuth() {
    const user = await getCurrentUser();
    if (!user) {
        return {
            user: null,
            response: server_1.NextResponse.json({ error: 'Authentifizierung erforderlich' }, { status: 401 }),
        };
    }
    return { user, response: null };
}
/**
 * API Route Helper: Require permission
 */
async function requirePermissionAPI(request, permission) {
    const authResult = await requireAuth();
    if (authResult.response) {
        return authResult;
    }
    const user = authResult.user;
    const hasAccess = user.roles.some((role) => (0, rbac_1.hasPermission)(role, permission));
    if (!hasAccess) {
        return {
            user: null,
            response: server_1.NextResponse.json({ error: 'Zugriff verweigert: Fehlende Berechtigung' }, { status: 403 }),
        };
    }
    return { user, response: null };
}
/**
 * API Route Helper: Require studio access
 */
async function requireStudioAccessAPI(request, studioId) {
    const authResult = await requireAuth();
    if (authResult.response) {
        return authResult;
    }
    const user = authResult.user;
    const hasAccess = await checkStudioAccess(studioId);
    if (!hasAccess) {
        return {
            user: null,
            response: server_1.NextResponse.json({ error: 'Zugriff verweigert: Studio gehört Ihnen nicht' }, { status: 403 }),
        };
    }
    return { user, response: null };
}
