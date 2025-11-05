/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Auth Data Access Layer (DAL)
 * Abstracts database operations from auth logic
 * Prevents circular dependencies and improves testability
 *
 * Phase 1: Basic implementation with Prisma
 * Phase 2: Add caching layer (Redis)
 * Phase 3: Add monitoring/metrics
 */

import { prisma } from '@/lib/prisma';
import { UserRole } from '@/app/generated/prisma';
import type { AuthUser, StudioOwnership, Result, AuthError } from './types';

/**
 * Data Access Layer Interface
 * Allows for easy mocking in tests and future implementation swaps
 */
export interface IAuthDal {
  getUserWithRoles(userId: string): Promise<Result<AuthUser, AuthError>>;
  checkStudioOwnership(userId: string, studioId: string): Promise<Result<boolean, AuthError>>;
  getUserByEmail(email: string): Promise<Result<AuthUser | null, AuthError>>;
}

/**
 * Prisma implementation of Auth DAL
 */
class AuthDalPrisma implements IAuthDal {
  /**
   * Get user with all roles
   */
  async getUserWithRoles(userId: string): Promise<Result<AuthUser, AuthError>> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          primaryRole: true,
          emailVerified: true,
          isActive: true,
          isSuspended: true,
          roles: {
            select: {
              role: true,
            },
          },
        },
      });

      if (!user) {
        return {
          ok: false,
          error: {
            type: 'NOT_FOUND',
            message: 'User not found',
          },
        };
      }

      return {
        ok: true,
        value: {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          primaryRole: user.primaryRole,
          roles: [user.primaryRole, ...user.roles.map((r) => r.role)],
          emailVerified: user.emailVerified,
          isActive: user.isActive,
          isSuspended: user.isSuspended,
        },
      };
    } catch (error) {
      console.error('[AuthDAL] getUserWithRoles error:', error);
      return {
        ok: false,
        error: {
          type: 'INVALID_SESSION',
          message: 'Failed to fetch user',
        },
      };
    }
  }

  /**
   * Check if user owns a specific studio
   */
  async checkStudioOwnership(
    userId: string,
    studioId: string
  ): Promise<Result<boolean, AuthError>> {
    try {
      const ownership = await prisma.studioOwnership.findFirst({
        where: {
          userId,
          studioId,
        },
      });

      return {
        ok: true,
        value: !!ownership,
      };
    } catch (error) {
      console.error('[AuthDAL] checkStudioOwnership error:', error);
      return {
        ok: false,
        error: {
          type: 'INVALID_SESSION',
          message: 'Failed to check studio ownership',
        },
      };
    }
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<Result<AuthUser | null, AuthError>> {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          primaryRole: true,
          emailVerified: true,
          isActive: true,
          isSuspended: true,
          roles: {
            select: {
              role: true,
            },
          },
        },
      });

      if (!user) {
        return {
          ok: true,
          value: null,
        };
      }

      return {
        ok: true,
        value: {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          primaryRole: user.primaryRole,
          roles: [user.primaryRole, ...user.roles.map((r) => r.role)],
          emailVerified: user.emailVerified,
          isActive: user.isActive,
          isSuspended: user.isSuspended,
        },
      };
    } catch (error) {
      console.error('[AuthDAL] getUserByEmail error:', error);
      return {
        ok: false,
        error: {
          type: 'INVALID_SESSION',
          message: 'Failed to fetch user by email',
        },
      };
    }
  }
}

/**
 * Singleton instance
 */
export const authDal: IAuthDal = new AuthDalPrisma();
