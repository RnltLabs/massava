"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.authDal = void 0;
const prisma_1 = require("@/lib/prisma");
const session_cache_1 = require("./session-cache");
const logger_1 = require("@/lib/logger");
/**
 * Prisma implementation of Auth DAL
 */
class AuthDalPrisma {
    /**
     * Get user with all roles
     * Phase 2: Now uses Redis cache for improved performance
     */
    async getUserWithRoles(userId) {
        try {
            // Try cache first (FAST PATH: ~5ms)
            const cached = await (0, session_cache_1.getSessionFromCache)(userId);
            if (cached) {
                logger_1.logger.debug('DAL cache hit: user retrieved from Redis', { userId });
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
            logger_1.logger.debug('DAL cache miss: loading user from database', { userId });
            // Cache miss - load from database (SLOW PATH: ~80ms)
            const user = await prisma_1.prisma.user.findUnique({
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
            const authUser = {
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
            (0, session_cache_1.setSessionInCache)(user.id, {
                userId: user.id,
                email: user.email,
                name: user.name,
                role: user.primaryRole,
                image: user.image,
                createdAt: new Date().toISOString(),
                lastAccessedAt: new Date().toISOString(),
            }).catch((err) => {
                logger_1.logger.warn('Failed to cache session in DAL', {
                    userId: user.id,
                    error: err instanceof Error ? err.message : String(err)
                });
            });
            return {
                ok: true,
                value: authUser,
            };
        }
        catch (error) {
            logger_1.logger.error('getUserWithRoles failed', {
                userId,
                error: error instanceof Error ? error.message : String(error),
                action: 'GET_USER_WITH_ROLES'
            });
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
    async checkStudioOwnership(userId, studioId) {
        try {
            const ownership = await prisma_1.prisma.studioOwnership.findFirst({
                where: {
                    userId,
                    studioId,
                },
            });
            return {
                ok: true,
                value: !!ownership,
            };
        }
        catch (error) {
            logger_1.logger.error('checkStudioOwnership failed', {
                userId,
                studioId,
                error: error instanceof Error ? error.message : String(error),
                action: 'CHECK_STUDIO_OWNERSHIP'
            });
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
    async getUserByEmail(email) {
        try {
            const user = await prisma_1.prisma.user.findUnique({
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
        }
        catch (error) {
            logger_1.logger.error('getUserByEmail failed', {
                email,
                error: error instanceof Error ? error.message : String(error),
                action: 'GET_USER_BY_EMAIL'
            });
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
exports.authDal = new AuthDalPrisma();
