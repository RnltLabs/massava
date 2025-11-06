"use strict";
/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * NextAuth Configuration - Node.js Runtime with Prisma
 *
 * This file extends auth.config.ts with:
 * - Prisma adapter (database operations)
 * - Full JWT callbacks (with database access)
 * - Authorization logic (with bcrypt)
 * - Role management
 *
 * PRISMA IMPORTS ALLOWED - Node.js runtime only!
 *
 * Middleware uses auth.config.ts (Edge-safe)
 * App routes use this file (Node.js with database access)
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = exports.signOut = exports.signIn = exports.handlers = void 0;
const prisma_1 = require("@/lib/prisma");
const next_auth_1 = __importDefault(require("next-auth"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_2 = require("@/app/generated/prisma");
const adapter_1 = require("@/lib/auth/adapter");
const auth_config_1 = require("./auth.config");
console.log('[NextAuth] Initializing with basePath:', process.env.NEXTAUTH_BASEPATH || '/api/auth');
_a = (0, next_auth_1.default)({
    ...auth_config_1.authConfig,
    // Add Prisma adapter (Node.js only)
    adapter: (0, adapter_1.UnifiedUserAdapter)(prisma_1.prisma),
    providers: [
        // Extend providers with authorization logic
        ...auth_config_1.authConfig.providers.map((provider) => {
            // Override Credentials provider with full authorization
            if (provider.id === 'credentials') {
                return {
                    ...provider,
                    async authorize(credentials) {
                        if (!credentials?.email || !credentials?.password) {
                            return null;
                        }
                        const accountType = credentials.accountType;
                        // Database query with Prisma
                        const user = await prisma_1.prisma.user.findUnique({
                            where: { email: credentials.email },
                            include: {
                                roles: {
                                    select: {
                                        role: true,
                                    },
                                },
                            },
                        });
                        if (user && user.password) {
                            // Verify password with bcrypt
                            const isPasswordValid = await bcryptjs_1.default.compare(credentials.password, user.password);
                            if (!isPasswordValid) {
                                return null;
                            }
                            // Check email verification
                            if (!user.emailVerified) {
                                throw new Error('Email not verified');
                            }
                            // Check if account is suspended
                            if (user.isSuspended) {
                                throw new Error('Account suspended');
                            }
                            return {
                                id: user.id,
                                email: user.email,
                                name: user.name,
                                image: user.image,
                                primaryRole: user.primaryRole,
                                roles: [user.primaryRole, ...user.roles.map((r) => r.role)],
                                accountType: accountType || 'customer',
                            };
                        }
                        return null;
                    },
                };
            }
            // Override Magic Link provider with authorization
            if (provider.id === 'magic-link') {
                return {
                    ...provider,
                    async authorize(credentials) {
                        if (!credentials?.email) {
                            return null;
                        }
                        const user = await prisma_1.prisma.user.findUnique({
                            where: { email: credentials.email },
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
                        if (user.isSuspended) {
                            throw new Error('Account suspended');
                        }
                        // Mark email as verified (magic link implies verification)
                        if (!user.emailVerified) {
                            await prisma_1.prisma.user.update({
                                where: { id: user.id },
                                data: { emailVerified: new Date() },
                            });
                        }
                        return {
                            id: user.id,
                            email: user.email,
                            name: user.name,
                            image: user.image,
                            primaryRole: user.primaryRole,
                            roles: [user.primaryRole, ...user.roles.map((r) => r.role)],
                        };
                    },
                };
            }
            return provider;
        }),
    ],
    callbacks: {
        // Full JWT callback with database access
        async jwt({ token, user, account, trigger }) {
            // Initial sign in
            if (user) {
                token.id = user.id;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                token.primaryRole = user.primaryRole || prisma_2.UserRole.CUSTOMER;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                token.roles = user.roles || [prisma_2.UserRole.CUSTOMER];
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                token.accountType = user.accountType || 'customer';
                // P0.6 FIX: Session versioning
                token.sessionVersion = 1;
                token.issuedAt = Date.now();
            }
            // P0.6 FIX: On session update/refresh, verify roles haven't changed
            if (trigger === 'update' || (!user && !account)) {
                const dbUser = await prisma_1.prisma.user.findUnique({
                    where: { id: token.id },
                    select: {
                        primaryRole: true,
                        isSuspended: true,
                        isActive: true,
                        updatedAt: true,
                        roles: {
                            select: {
                                role: true,
                            },
                        },
                    },
                });
                if (!dbUser || dbUser.isSuspended || !dbUser.isActive) {
                    throw new Error('Session invalid');
                }
                const currentRoles = [dbUser.primaryRole, ...dbUser.roles.map((r) => r.role)];
                const rolesChanged = JSON.stringify(token.roles) !== JSON.stringify(currentRoles);
                if (rolesChanged) {
                    token.sessionVersion = (token.sessionVersion || 1) + 1;
                    token.primaryRole = dbUser.primaryRole;
                    token.roles = currentRoles;
                }
            }
            // OAuth sign in - fetch roles from database
            if (account && account.provider === 'google') {
                const dbUser = await prisma_1.prisma.user.findUnique({
                    where: { id: token.id },
                    include: {
                        roles: {
                            select: {
                                role: true,
                            },
                        },
                    },
                });
                if (dbUser) {
                    token.primaryRole = dbUser.primaryRole;
                    token.roles = [
                        dbUser.primaryRole,
                        ...dbUser.roles.map((r) => r.role),
                    ];
                    token.sessionVersion = 1;
                    token.issuedAt = Date.now();
                }
            }
            return token;
        },
        // Use Edge-safe session callback from auth.config.ts
        session: auth_config_1.authConfig.callbacks?.session,
    },
    events: {
        async signIn({ user }) {
            // Update last login time
            await prisma_1.prisma.user.update({
                where: { id: user.id },
                data: { updatedAt: new Date() },
            });
        },
    },
}), exports.handlers = _a.handlers, exports.signIn = _a.signIn, exports.signOut = _a.signOut, exports.auth = _a.auth;
