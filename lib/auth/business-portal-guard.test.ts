/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Business Portal Guard - Unit Tests
 */

import { describe, it, expect } from 'vitest';
import { UserRole } from '@/app/generated/prisma';
import {
  isBusinessPortalUser,
  hasBusinessPortalAccess,
  requireBusinessAccess,
  getBusinessPortalRedirect,
  getUnauthorizedRedirect,
  getBusinessSignInRedirect,
  BUSINESS_PORTAL_ROLES,
} from './business-portal-guard';

describe('business-portal-guard', () => {
  describe('BUSINESS_PORTAL_ROLES', () => {
    it('should include STUDIO_OWNER', () => {
      expect(BUSINESS_PORTAL_ROLES).toContain(UserRole.STUDIO_OWNER);
    });

    it('should include SUPER_ADMIN', () => {
      expect(BUSINESS_PORTAL_ROLES).toContain(UserRole.SUPER_ADMIN);
    });

    it('should not include CUSTOMER', () => {
      expect(BUSINESS_PORTAL_ROLES).not.toContain(UserRole.CUSTOMER);
    });

    it('should not include GUEST', () => {
      expect(BUSINESS_PORTAL_ROLES).not.toContain(UserRole.GUEST);
    });
  });

  describe('isBusinessPortalUser', () => {
    it('should return true for STUDIO_OWNER', () => {
      const user = { primaryRole: UserRole.STUDIO_OWNER };
      expect(isBusinessPortalUser(user)).toBe(true);
    });

    it('should return true for SUPER_ADMIN', () => {
      const user = { primaryRole: UserRole.SUPER_ADMIN };
      expect(isBusinessPortalUser(user)).toBe(true);
    });

    it('should return false for CUSTOMER', () => {
      const user = { primaryRole: UserRole.CUSTOMER };
      expect(isBusinessPortalUser(user)).toBe(false);
    });

    it('should return false for GUEST', () => {
      const user = { primaryRole: UserRole.GUEST };
      expect(isBusinessPortalUser(user)).toBe(false);
    });

    it('should return false when primaryRole is undefined', () => {
      const user = {};
      expect(isBusinessPortalUser(user)).toBe(false);
    });

    it('should check roles array when primaryRole is CUSTOMER but roles include STUDIO_OWNER', () => {
      const user = {
        primaryRole: UserRole.CUSTOMER,
        roles: [UserRole.CUSTOMER, UserRole.STUDIO_OWNER],
      };
      expect(isBusinessPortalUser(user)).toBe(true);
    });

    it('should return false when neither primaryRole nor roles grant access', () => {
      const user = {
        primaryRole: UserRole.CUSTOMER,
        roles: [UserRole.CUSTOMER, UserRole.GUEST],
      };
      expect(isBusinessPortalUser(user)).toBe(false);
    });
  });

  describe('hasBusinessPortalAccess', () => {
    it('should return true for session with STUDIO_OWNER', () => {
      const session = {
        user: {
          id: 'user-1',
          email: 'owner@example.com',
          primaryRole: UserRole.STUDIO_OWNER,
        },
        expires: '2025-12-31',
      };
      expect(hasBusinessPortalAccess(session)).toBe(true);
    });

    it('should return false for session with CUSTOMER', () => {
      const session = {
        user: {
          id: 'user-2',
          email: 'customer@example.com',
          primaryRole: UserRole.CUSTOMER,
        },
        expires: '2025-12-31',
      };
      expect(hasBusinessPortalAccess(session)).toBe(false);
    });

    it('should return false for null session', () => {
      expect(hasBusinessPortalAccess(null)).toBe(false);
    });

    it('should return false for session without user', () => {
      const session = {
        expires: '2025-12-31',
      } as any;
      expect(hasBusinessPortalAccess(session)).toBe(false);
    });
  });

  describe('requireBusinessAccess', () => {
    it('should return ok for STUDIO_OWNER', () => {
      const user = {
        id: 'user-1',
        primaryRole: UserRole.STUDIO_OWNER,
      };
      const result = requireBusinessAccess(user);
      expect(result.ok).toBe(true);
    });

    it('should return ok for SUPER_ADMIN', () => {
      const user = {
        id: 'user-2',
        primaryRole: UserRole.SUPER_ADMIN,
      };
      const result = requireBusinessAccess(user);
      expect(result.ok).toBe(true);
    });

    it('should return error for CUSTOMER', () => {
      const user = {
        id: 'user-3',
        primaryRole: UserRole.CUSTOMER,
      };
      const result = requireBusinessAccess(user);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('FORBIDDEN');
      }
    });

    it('should return error when user is undefined', () => {
      const result = requireBusinessAccess(undefined);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('UNAUTHORIZED');
      }
    });

    it('should include userId and role in error context', () => {
      const user = {
        id: 'user-4',
        primaryRole: UserRole.CUSTOMER,
      };

      const result = requireBusinessAccess(user);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('FORBIDDEN');
        expect(result.error.message).toContain('Business portal access');
      }
    });
  });

  describe('getBusinessPortalRedirect', () => {
    it('should return /business/dashboard for STUDIO_OWNER', () => {
      const user = { primaryRole: UserRole.STUDIO_OWNER };
      expect(getBusinessPortalRedirect(user)).toBe('/business/dashboard');
    });

    it('should return /business/dashboard for SUPER_ADMIN', () => {
      const user = { primaryRole: UserRole.SUPER_ADMIN };
      expect(getBusinessPortalRedirect(user)).toBe('/business/dashboard');
    });

    it('should return /unauthorized for CUSTOMER', () => {
      const user = { primaryRole: UserRole.CUSTOMER };
      expect(getBusinessPortalRedirect(user)).toBe('/unauthorized');
    });

    it('should return sign-in URL when user is undefined', () => {
      expect(getBusinessPortalRedirect(undefined)).toBe(
        '/auth/signin?callbackUrl=/business'
      );
    });
  });

  describe('getUnauthorizedRedirect', () => {
    it('should return /unauthorized with no parameters', () => {
      expect(getUnauthorizedRedirect()).toBe('/unauthorized');
    });

    it('should include requested path in query string', () => {
      const result = getUnauthorizedRedirect('/business/studios');
      expect(result).toBe('/unauthorized?requested=%2Fbusiness%2Fstudios');
    });

    it('should handle paths with special characters', () => {
      const result = getUnauthorizedRedirect('/business/studios?id=123&name=Test Studio');
      expect(result).toContain('/unauthorized?requested=');
      expect(decodeURIComponent(result)).toContain('/business/studios?id=123&name=Test Studio');
    });
  });

  describe('getBusinessSignInRedirect', () => {
    it('should return sign-in URL with default callback', () => {
      expect(getBusinessSignInRedirect()).toBe(
        '/auth/signin?callbackUrl=%2Fbusiness'
      );
    });

    it('should return sign-in URL with custom callback path', () => {
      expect(getBusinessSignInRedirect('/business/studios/new')).toBe(
        '/auth/signin?callbackUrl=%2Fbusiness%2Fstudios%2Fnew'
      );
    });

    it('should URL-encode callback path', () => {
      const result = getBusinessSignInRedirect('/business/studios?tab=settings');
      expect(result).toContain('callbackUrl=');
      expect(decodeURIComponent(result)).toContain('/business/studios?tab=settings');
    });
  });

});
