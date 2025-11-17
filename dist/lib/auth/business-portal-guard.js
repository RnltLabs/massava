"use strict";
/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Business Portal Access Guard
 * Implements MASTER_ORCHESTRATION_PLAN.md - Task 2.1: Middleware Protection
 *
 * Purpose: Protect /business/* routes to restrict access to STUDIO_OWNER and STUDIO_STAFF only
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessPortalAccessDeniedError = exports.BUSINESS_PORTAL_ROLES = void 0;
exports.isBusinessPortalUser = isBusinessPortalUser;
exports.hasBusinessPortalAccess = hasBusinessPortalAccess;
exports.requireBusinessAccess = requireBusinessAccess;
exports.requireBusinessAccessResult = requireBusinessAccessResult;
exports.getBusinessPortalRedirect = getBusinessPortalRedirect;
exports.getUnauthorizedRedirect = getUnauthorizedRedirect;
exports.getBusinessSignInRedirect = getBusinessSignInRedirect;
const prisma_1 = require("@/app/generated/prisma");
const result_1 = require("@/lib/result");
/**
 * Roles allowed to access the business portal
 */
exports.BUSINESS_PORTAL_ROLES = [
    prisma_1.UserRole.STUDIO_OWNER,
    prisma_1.UserRole.SUPER_ADMIN, // Super admin has access to everything
];
/**
 * Error thrown when user attempts to access business portal without authorization
 */
class BusinessPortalAccessDeniedError extends Error {
    constructor(message = 'Access to business portal denied', userId, userRole) {
        super(message);
        this.userId = userId;
        this.userRole = userRole;
        this.name = 'BusinessPortalAccessDeniedError';
    }
}
exports.BusinessPortalAccessDeniedError = BusinessPortalAccessDeniedError;
/**
 * Check if a user has access to the business portal
 *
 * @param user - User object from NextAuth session
 * @returns true if user has STUDIO_OWNER, STUDIO_STAFF, or SUPER_ADMIN role
 */
function isBusinessPortalUser(user) {
    if (!user.primaryRole) {
        return false;
    }
    // Check primary role
    if (exports.BUSINESS_PORTAL_ROLES.includes(user.primaryRole)) {
        return true;
    }
    // Check additional roles (if user has multiple roles)
    if (user.roles && user.roles.length > 0) {
        return user.roles.some((role) => exports.BUSINESS_PORTAL_ROLES.includes(role));
    }
    return false;
}
/**
 * Check if a session has business portal access
 *
 * @param session - NextAuth session object
 * @returns true if session user has business portal access
 */
function hasBusinessPortalAccess(session) {
    if (!session || !session.user) {
        return false;
    }
    return isBusinessPortalUser(session.user);
}
/**
 * Require business portal access - throws error if user doesn't have access
 * Use this in Server Actions and API routes to enforce business portal access
 *
 * @param user - User object from NextAuth session
 * @throws BusinessPortalAccessDeniedError if user doesn't have access
 * @deprecated Use requireBusinessAccessResult instead for Result-based error handling
 */
function requireBusinessAccess(user) {
    if (!user) {
        throw new BusinessPortalAccessDeniedError('Authentication required to access business portal');
    }
    if (!isBusinessPortalUser(user)) {
        throw new BusinessPortalAccessDeniedError('Business portal access restricted to studio owners and staff', user.id, user.primaryRole);
    }
}
/**
 * Require business portal access - Result-based (no exceptions)
 * Preferred over requireBusinessAccess for new code
 *
 * @param user - User object from NextAuth session
 * @returns Ok(void) if user has access, Err(BusinessPortalAccessDeniedError) otherwise
 */
function requireBusinessAccessResult(user) {
    if (!user) {
        return (0, result_1.err)(new BusinessPortalAccessDeniedError('Authentication required to access business portal'));
    }
    if (!isBusinessPortalUser(user)) {
        return (0, result_1.err)(new BusinessPortalAccessDeniedError('Business portal access restricted to studio owners and staff', user.id, user.primaryRole));
    }
    return (0, result_1.ok)(undefined);
}
/**
 * Get appropriate redirect URL based on user's role
 *
 * @param user - User object from NextAuth session (optional)
 * @returns Redirect URL appropriate for the user's role
 */
function getBusinessPortalRedirect(user) {
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
function getUnauthorizedRedirect(requestedPath) {
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
function getBusinessSignInRedirect(callbackPath = '/business') {
    const params = new URLSearchParams();
    params.set('callbackUrl', callbackPath);
    return `/auth/signin?${params.toString()}`;
}
