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
import type { AuthUser, StudioOwnership } from './types';
import { Result, ok, err } from '@/lib/result';
import { AuthError, createAuthError, exceptionToAuthError } from './errors';
import {
  getSessionFromCache,
  setSessionInCache,
} from './session-cache';
import { logger } from '@/lib/logger';

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
   * Phase 2: Now uses Redis cache for improved performance
   */
  async getUserWithRoles(userId: string): Promise<Result<AuthUser, AuthError>> {
    try {
      // Try cache first (FAST PATH: ~5ms)
      const cached = await getSessionFromCache(userId);
      if (cached) {
        logger.debug('DAL cache hit: user retrieved from Redis', { userId });
        return {
          ok: true,
          value: {
            id: cached.userId,
            email: cached.email,
            name: cached.name,
            image: cached.image,
            primaryRole: cached.role,
            roles: [cached.role], // Simplified in cache
            emailVerified: null, // Not in cache
            isActive: true, // Assume active if cached
            isSuspended: false, // Assume not suspended if cached
          },
        };
      }

      logger.debug('DAL cache miss: loading user from database', { userId });

      // Cache miss - load from database (SLOW PATH: ~80ms)
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
        return err(createAuthError('NOT_FOUND', 'User not found', { resource: 'user' }));
      }

      const authUser: AuthUser = {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        primaryRole: user.primaryRole,
        roles: [user.primaryRole, ...user.roles.map((r) => r.role)],
        emailVerified: user.emailVerified,
        isActive: user.isActive,
        isSuspended: user.isSuspended,
      };

      // Cache for next time (fire-and-forget)
      setSessionInCache(user.id, {
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.primaryRole,
        image: user.image,
        createdAt: new Date().toISOString(),
        lastAccessedAt: new Date().toISOString(),
      }).catch((err) => {
        logger.warn('Failed to cache session in DAL', {
          userId: user.id,
          error: err instanceof Error ? err.message : String(err)
        });
      });

      return {
        ok: true,
        value: authUser,
      };
    } catch (error) {
      logger.error('getUserWithRoles failed', {
        userId,
        error: error instanceof Error ? error.message : String(error),
        action: 'GET_USER_WITH_ROLES'
      });
      return err(createAuthError('DATABASE_ERROR', 'Failed to fetch user', {
        originalError: error instanceof Error ? error.message : String(error)
      }));
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
      logger.error('checkStudioOwnership failed', {
        userId,
        studioId,
        error: error instanceof Error ? error.message : String(error),
        action: 'CHECK_STUDIO_OWNERSHIP'
      });
      return err(createAuthError('DATABASE_ERROR', 'Failed to check studio ownership', {
        originalError: error instanceof Error ? error.message : String(error)
      }));
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
      logger.error('getUserByEmail failed', {
        email,
        error: error instanceof Error ? error.message : String(error),
        action: 'GET_USER_BY_EMAIL'
      });
      return err(createAuthError('DATABASE_ERROR', 'Failed to fetch user by email', {
        originalError: error instanceof Error ? error.message : String(error)
      }));
    }
  }
}

/**
 * Singleton instance
 */
export const authDal: IAuthDal = new AuthDalPrisma();
