"use strict";
/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Business Portal Guard - Unit Tests
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const prisma_1 = require("@/app/generated/prisma");
const business_portal_guard_1 = require("./business-portal-guard");
(0, vitest_1.describe)('business-portal-guard', () => {
    (0, vitest_1.describe)('BUSINESS_PORTAL_ROLES', () => {
        (0, vitest_1.it)('should include STUDIO_OWNER', () => {
            (0, vitest_1.expect)(business_portal_guard_1.BUSINESS_PORTAL_ROLES).toContain(prisma_1.UserRole.STUDIO_OWNER);
        });
        (0, vitest_1.it)('should include SUPER_ADMIN', () => {
            (0, vitest_1.expect)(business_portal_guard_1.BUSINESS_PORTAL_ROLES).toContain(prisma_1.UserRole.SUPER_ADMIN);
        });
        (0, vitest_1.it)('should not include CUSTOMER', () => {
            (0, vitest_1.expect)(business_portal_guard_1.BUSINESS_PORTAL_ROLES).not.toContain(prisma_1.UserRole.CUSTOMER);
        });
        (0, vitest_1.it)('should not include GUEST', () => {
            (0, vitest_1.expect)(business_portal_guard_1.BUSINESS_PORTAL_ROLES).not.toContain(prisma_1.UserRole.GUEST);
        });
    });
    (0, vitest_1.describe)('isBusinessPortalUser', () => {
        (0, vitest_1.it)('should return true for STUDIO_OWNER', () => {
            const user = { primaryRole: prisma_1.UserRole.STUDIO_OWNER };
            (0, vitest_1.expect)((0, business_portal_guard_1.isBusinessPortalUser)(user)).toBe(true);
        });
        (0, vitest_1.it)('should return true for SUPER_ADMIN', () => {
            const user = { primaryRole: prisma_1.UserRole.SUPER_ADMIN };
            (0, vitest_1.expect)((0, business_portal_guard_1.isBusinessPortalUser)(user)).toBe(true);
        });
        (0, vitest_1.it)('should return false for CUSTOMER', () => {
            const user = { primaryRole: prisma_1.UserRole.CUSTOMER };
            (0, vitest_1.expect)((0, business_portal_guard_1.isBusinessPortalUser)(user)).toBe(false);
        });
        (0, vitest_1.it)('should return false for GUEST', () => {
            const user = { primaryRole: prisma_1.UserRole.GUEST };
            (0, vitest_1.expect)((0, business_portal_guard_1.isBusinessPortalUser)(user)).toBe(false);
        });
        (0, vitest_1.it)('should return false when primaryRole is undefined', () => {
            const user = {};
            (0, vitest_1.expect)((0, business_portal_guard_1.isBusinessPortalUser)(user)).toBe(false);
        });
        (0, vitest_1.it)('should check roles array when primaryRole is CUSTOMER but roles include STUDIO_OWNER', () => {
            const user = {
                primaryRole: prisma_1.UserRole.CUSTOMER,
                roles: [prisma_1.UserRole.CUSTOMER, prisma_1.UserRole.STUDIO_OWNER],
            };
            (0, vitest_1.expect)((0, business_portal_guard_1.isBusinessPortalUser)(user)).toBe(true);
        });
        (0, vitest_1.it)('should return false when neither primaryRole nor roles grant access', () => {
            const user = {
                primaryRole: prisma_1.UserRole.CUSTOMER,
                roles: [prisma_1.UserRole.CUSTOMER, prisma_1.UserRole.GUEST],
            };
            (0, vitest_1.expect)((0, business_portal_guard_1.isBusinessPortalUser)(user)).toBe(false);
        });
    });
    (0, vitest_1.describe)('hasBusinessPortalAccess', () => {
        (0, vitest_1.it)('should return true for session with STUDIO_OWNER', () => {
            const session = {
                user: {
                    id: 'user-1',
                    email: 'owner@example.com',
                    primaryRole: prisma_1.UserRole.STUDIO_OWNER,
                },
                expires: '2025-12-31',
            };
            (0, vitest_1.expect)((0, business_portal_guard_1.hasBusinessPortalAccess)(session)).toBe(true);
        });
        (0, vitest_1.it)('should return false for session with CUSTOMER', () => {
            const session = {
                user: {
                    id: 'user-2',
                    email: 'customer@example.com',
                    primaryRole: prisma_1.UserRole.CUSTOMER,
                },
                expires: '2025-12-31',
            };
            (0, vitest_1.expect)((0, business_portal_guard_1.hasBusinessPortalAccess)(session)).toBe(false);
        });
        (0, vitest_1.it)('should return false for null session', () => {
            (0, vitest_1.expect)((0, business_portal_guard_1.hasBusinessPortalAccess)(null)).toBe(false);
        });
        (0, vitest_1.it)('should return false for session without user', () => {
            const session = {
                expires: '2025-12-31',
            };
            (0, vitest_1.expect)((0, business_portal_guard_1.hasBusinessPortalAccess)(session)).toBe(false);
        });
    });
    (0, vitest_1.describe)('requireBusinessAccess', () => {
        (0, vitest_1.it)('should not throw for STUDIO_OWNER', () => {
            const user = {
                id: 'user-1',
                primaryRole: prisma_1.UserRole.STUDIO_OWNER,
            };
            (0, vitest_1.expect)(() => (0, business_portal_guard_1.requireBusinessAccess)(user)).not.toThrow();
        });
        (0, vitest_1.it)('should not throw for SUPER_ADMIN', () => {
            const user = {
                id: 'user-2',
                primaryRole: prisma_1.UserRole.SUPER_ADMIN,
            };
            (0, vitest_1.expect)(() => (0, business_portal_guard_1.requireBusinessAccess)(user)).not.toThrow();
        });
        (0, vitest_1.it)('should throw BusinessPortalAccessDeniedError for CUSTOMER', () => {
            const user = {
                id: 'user-3',
                primaryRole: prisma_1.UserRole.CUSTOMER,
            };
            (0, vitest_1.expect)(() => (0, business_portal_guard_1.requireBusinessAccess)(user)).toThrow(business_portal_guard_1.BusinessPortalAccessDeniedError);
        });
        (0, vitest_1.it)('should throw BusinessPortalAccessDeniedError when user is undefined', () => {
            (0, vitest_1.expect)(() => (0, business_portal_guard_1.requireBusinessAccess)(undefined)).toThrow(business_portal_guard_1.BusinessPortalAccessDeniedError);
        });
        (0, vitest_1.it)('should include userId and userRole in error', () => {
            const user = {
                id: 'user-4',
                primaryRole: prisma_1.UserRole.CUSTOMER,
            };
            try {
                (0, business_portal_guard_1.requireBusinessAccess)(user);
                vitest_1.expect.fail('Should have thrown error');
            }
            catch (error) {
                (0, vitest_1.expect)(error).toBeInstanceOf(business_portal_guard_1.BusinessPortalAccessDeniedError);
                const accessError = error;
                (0, vitest_1.expect)(accessError.userId).toBe('user-4');
                (0, vitest_1.expect)(accessError.userRole).toBe(prisma_1.UserRole.CUSTOMER);
            }
        });
    });
    (0, vitest_1.describe)('getBusinessPortalRedirect', () => {
        (0, vitest_1.it)('should return /business/dashboard for STUDIO_OWNER', () => {
            const user = { primaryRole: prisma_1.UserRole.STUDIO_OWNER };
            (0, vitest_1.expect)((0, business_portal_guard_1.getBusinessPortalRedirect)(user)).toBe('/business/dashboard');
        });
        (0, vitest_1.it)('should return /business/dashboard for SUPER_ADMIN', () => {
            const user = { primaryRole: prisma_1.UserRole.SUPER_ADMIN };
            (0, vitest_1.expect)((0, business_portal_guard_1.getBusinessPortalRedirect)(user)).toBe('/business/dashboard');
        });
        (0, vitest_1.it)('should return /unauthorized for CUSTOMER', () => {
            const user = { primaryRole: prisma_1.UserRole.CUSTOMER };
            (0, vitest_1.expect)((0, business_portal_guard_1.getBusinessPortalRedirect)(user)).toBe('/unauthorized');
        });
        (0, vitest_1.it)('should return sign-in URL when user is undefined', () => {
            (0, vitest_1.expect)((0, business_portal_guard_1.getBusinessPortalRedirect)(undefined)).toBe('/auth/signin?callbackUrl=/business');
        });
    });
    (0, vitest_1.describe)('getUnauthorizedRedirect', () => {
        (0, vitest_1.it)('should return /unauthorized with no parameters', () => {
            (0, vitest_1.expect)((0, business_portal_guard_1.getUnauthorizedRedirect)()).toBe('/unauthorized');
        });
        (0, vitest_1.it)('should include requested path in query string', () => {
            const result = (0, business_portal_guard_1.getUnauthorizedRedirect)('/business/studios');
            (0, vitest_1.expect)(result).toBe('/unauthorized?requested=%2Fbusiness%2Fstudios');
        });
        (0, vitest_1.it)('should handle paths with special characters', () => {
            const result = (0, business_portal_guard_1.getUnauthorizedRedirect)('/business/studios?id=123&name=Test Studio');
            (0, vitest_1.expect)(result).toContain('/unauthorized?requested=');
            (0, vitest_1.expect)(decodeURIComponent(result)).toContain('/business/studios?id=123&name=Test Studio');
        });
    });
    (0, vitest_1.describe)('getBusinessSignInRedirect', () => {
        (0, vitest_1.it)('should return sign-in URL with default callback', () => {
            (0, vitest_1.expect)((0, business_portal_guard_1.getBusinessSignInRedirect)()).toBe('/auth/signin?callbackUrl=%2Fbusiness');
        });
        (0, vitest_1.it)('should return sign-in URL with custom callback path', () => {
            (0, vitest_1.expect)((0, business_portal_guard_1.getBusinessSignInRedirect)('/business/studios/new')).toBe('/auth/signin?callbackUrl=%2Fbusiness%2Fstudios%2Fnew');
        });
        (0, vitest_1.it)('should URL-encode callback path', () => {
            const result = (0, business_portal_guard_1.getBusinessSignInRedirect)('/business/studios?tab=settings');
            (0, vitest_1.expect)(result).toContain('callbackUrl=');
            (0, vitest_1.expect)(decodeURIComponent(result)).toContain('/business/studios?tab=settings');
        });
    });
    (0, vitest_1.describe)('BusinessPortalAccessDeniedError', () => {
        (0, vitest_1.it)('should create error with default message', () => {
            const error = new business_portal_guard_1.BusinessPortalAccessDeniedError();
            (0, vitest_1.expect)(error.message).toBe('Access to business portal denied');
            (0, vitest_1.expect)(error.name).toBe('BusinessPortalAccessDeniedError');
        });
        (0, vitest_1.it)('should create error with custom message', () => {
            const error = new business_portal_guard_1.BusinessPortalAccessDeniedError('Custom error message');
            (0, vitest_1.expect)(error.message).toBe('Custom error message');
        });
        (0, vitest_1.it)('should store userId and userRole', () => {
            const error = new business_portal_guard_1.BusinessPortalAccessDeniedError('Access denied', 'user-123', prisma_1.UserRole.CUSTOMER);
            (0, vitest_1.expect)(error.userId).toBe('user-123');
            (0, vitest_1.expect)(error.userRole).toBe(prisma_1.UserRole.CUSTOMER);
        });
        (0, vitest_1.it)('should be instance of Error', () => {
            const error = new business_portal_guard_1.BusinessPortalAccessDeniedError();
            (0, vitest_1.expect)(error).toBeInstanceOf(Error);
        });
    });
});
