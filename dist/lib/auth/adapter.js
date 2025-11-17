"use strict";
/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Custom Prisma Adapter for Unified User Model
 * Maps NextAuth to our new User/NewAccount/NewSession models
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnifiedUserAdapter = UnifiedUserAdapter;
const prisma_1 = require("@/app/generated/prisma");
const session_cache_1 = require("./session-cache");
const logger_1 = require("@/lib/logger");
function UnifiedUserAdapter(prisma) {
    return {
        async createUser(data) {
            const user = await prisma.user.create({
                data: {
                    email: data.email,
                    emailVerified: data.emailVerified,
                    name: data.name,
                    image: data.image,
                    primaryRole: prisma_1.UserRole.CUSTOMER, // Default role for OAuth users
                },
            });
            // Create role assignment
            await prisma.userRoleAssignment.create({
                data: {
                    userId: user.id,
                    role: prisma_1.UserRole.CUSTOMER,
                    grantedBy: 'OAUTH_SIGNUP',
                },
            });
            // Warm cache on user creation (Phase 2: Cache optimization)
            (0, session_cache_1.setSessionInCache)(user.id, {
                userId: user.id,
                email: user.email,
                name: user.name,
                role: user.primaryRole,
                image: user.image,
                createdAt: new Date().toISOString(),
                lastAccessedAt: new Date().toISOString(),
            }).catch((err) => {
                logger_1.logger.warn('Failed to cache new user session in adapter', {
                    userId: user.id,
                    error: err instanceof Error ? err.message : String(err),
                    action: 'CREATE_USER'
                });
            });
            return {
                id: user.id,
                email: user.email,
                emailVerified: user.emailVerified,
                name: user.name,
                image: user.image,
            };
        },
        async getUser(id) {
            const user = await prisma.user.findUnique({
                where: { id },
            });
            if (!user)
                return null;
            return {
                id: user.id,
                email: user.email,
                emailVerified: user.emailVerified,
                name: user.name,
                image: user.image,
            };
        },
        async getUserByEmail(email) {
            const user = await prisma.user.findUnique({
                where: { email },
            });
            if (!user)
                return null;
            return {
                id: user.id,
                email: user.email,
                emailVerified: user.emailVerified,
                name: user.name,
                image: user.image,
            };
        },
        async getUserByAccount({ providerAccountId, provider }) {
            const account = await prisma.newAccount.findUnique({
                where: {
                    provider_providerAccountId: {
                        provider,
                        providerAccountId,
                    },
                },
                include: { user: true },
            });
            if (!account)
                return null;
            return {
                id: account.user.id,
                email: account.user.email,
                emailVerified: account.user.emailVerified,
                name: account.user.name,
                image: account.user.image,
            };
        },
        async updateUser({ id, ...data }) {
            const user = await prisma.user.update({
                where: { id },
                data: {
                    email: data.email,
                    emailVerified: data.emailVerified,
                    name: data.name,
                    image: data.image,
                },
            });
            // Invalidate cache on user update (Phase 2: Cache invalidation)
            await (0, session_cache_1.invalidateSessionCache)(id);
            return {
                id: user.id,
                email: user.email,
                emailVerified: user.emailVerified,
                name: user.name,
                image: user.image,
            };
        },
        async deleteUser(userId) {
            await prisma.user.delete({
                where: { id: userId },
            });
            // Invalidate cache on user deletion (Phase 2: Cache invalidation)
            await (0, session_cache_1.invalidateSessionCache)(userId);
        },
        async linkAccount(data) {
            await prisma.newAccount.create({
                data: {
                    userId: data.userId,
                    type: data.type,
                    provider: data.provider,
                    providerAccountId: data.providerAccountId,
                    refresh_token: data.refresh_token,
                    access_token: data.access_token,
                    expires_at: data.expires_at,
                    token_type: data.token_type,
                    scope: data.scope,
                    id_token: data.id_token,
                    session_state: data.session_state,
                },
            });
        },
        async unlinkAccount({ providerAccountId, provider }) {
            await prisma.newAccount.delete({
                where: {
                    provider_providerAccountId: {
                        provider,
                        providerAccountId,
                    },
                },
            });
        },
        async createSession(data) {
            const session = await prisma.newSession.create({
                data: {
                    sessionToken: data.sessionToken,
                    userId: data.userId,
                    expires: data.expires,
                },
            });
            return {
                sessionToken: session.sessionToken,
                userId: session.userId,
                expires: session.expires,
            };
        },
        async getSessionAndUser(sessionToken) {
            const session = await prisma.newSession.findUnique({
                where: { sessionToken },
                include: { user: true },
            });
            if (!session)
                return null;
            return {
                session: {
                    sessionToken: session.sessionToken,
                    userId: session.userId,
                    expires: session.expires,
                },
                user: {
                    id: session.user.id,
                    email: session.user.email,
                    emailVerified: session.user.emailVerified,
                    name: session.user.name,
                    image: session.user.image,
                },
            };
        },
        async updateSession({ sessionToken, ...data }) {
            const session = await prisma.newSession.update({
                where: { sessionToken },
                data: {
                    expires: data.expires,
                },
            });
            return {
                sessionToken: session.sessionToken,
                userId: session.userId,
                expires: session.expires,
            };
        },
        async deleteSession(sessionToken) {
            await prisma.newSession.delete({
                where: { sessionToken },
            });
        },
        async createVerificationToken(data) {
            const token = await prisma.verificationToken.create({
                data: {
                    identifier: data.identifier,
                    token: data.token,
                    expires: data.expires,
                },
            });
            return {
                identifier: token.identifier,
                token: token.token,
                expires: token.expires,
            };
        },
        async useVerificationToken({ identifier, token }) {
            try {
                const verificationToken = await prisma.verificationToken.delete({
                    where: {
                        identifier_token: {
                            identifier,
                            token,
                        },
                    },
                });
                return {
                    identifier: verificationToken.identifier,
                    token: verificationToken.token,
                    expires: verificationToken.expires,
                };
            }
            catch {
                return null;
            }
        },
    };
}
