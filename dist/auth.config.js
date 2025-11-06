"use strict";
/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * NextAuth Configuration - Edge Runtime Compatible
 *
 * This file contains ONLY Edge-safe configuration:
 * - Providers (without database operations)
 * - JWT callbacks (without Prisma)
 * - Session callbacks
 * - Redirect logic
 *
 * NO PRISMA IMPORTS ALLOWED - Edge Runtime compatible!
 *
 * The full auth configuration with Prisma adapter is in auth.ts
 * The middleware uses this file to avoid Edge Runtime errors.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authConfig = void 0;
const google_1 = __importDefault(require("next-auth/providers/google"));
const credentials_1 = __importDefault(require("next-auth/providers/credentials"));
/**
 * Edge-safe NextAuth configuration
 * Used by middleware.ts (Edge Runtime)
 */
exports.authConfig = {
    basePath: process.env.NEXTAUTH_BASEPATH || '/api/auth',
    session: {
        strategy: 'jwt',
        // P0.6 FIX: Reduced from 30 days to 24 hours (session fixation protection)
        maxAge: 24 * 60 * 60, // 24 hours
        updateAge: 2 * 60 * 60, // Refresh session every 2 hours
    },
    pages: {
        signIn: '/auth/signin',
        error: '/auth/error',
    },
    providers: [
        // Google OAuth
        (0, google_1.default)({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            // P0.3 FIX: SECURITY - Disabled dangerous email account linking
            allowDangerousEmailAccountLinking: false,
        }),
        // Credentials Provider
        (0, credentials_1.default)({
            id: 'credentials',
            name: 'Email and Password',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
                accountType: { label: 'Account Type', type: 'text' },
            },
            // NOTE: authorize() is handled in auth.ts (Node.js runtime with Prisma)
            // This is just the provider definition for Edge compatibility
            async authorize() {
                // This will never be called from middleware
                // Actual authorization happens in auth.ts
                return null;
            },
        }),
        // Magic Link Provider
        (0, credentials_1.default)({
            id: 'magic-link',
            name: 'Magic Link',
            credentials: {
                email: { label: 'Email', type: 'email' },
            },
            async authorize() {
                // Handled in auth.ts
                return null;
            },
        }),
    ],
    callbacks: {
        // Edge-safe JWT callback (NO database access)
        async jwt({ token }) {
            // All JWT logic is handled in auth.ts (Node.js runtime)
            // This is just a passthrough for Edge compatibility
            return token;
        },
        // Edge-safe session callback (NO database access)
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                session.user.primaryRole = token.primaryRole;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                session.user.roles = token.roles;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                session.user.accountType = token.accountType || 'customer';
            }
            return session;
        },
        // Edge-safe redirect callback
        async redirect({ url, baseUrl }) {
            try {
                const urlObj = new URL(url, baseUrl);
                const callbackUrl = urlObj.searchParams.get('callbackUrl');
                const accountType = urlObj.searchParams.get('accountType');
                const isAuthCallback = url.includes('/api/auth/callback/') || url.includes('/api/auth/signin');
                const isBusinessUser = accountType === 'studio' ||
                    callbackUrl?.includes('/dashboard/owner') ||
                    callbackUrl?.includes('/business');
                if (isBusinessUser) {
                    if (callbackUrl && (callbackUrl.includes('/dashboard/owner') || callbackUrl.includes('/business'))) {
                        if (callbackUrl.startsWith(baseUrl)) {
                            return callbackUrl;
                        }
                        if (callbackUrl.startsWith('/') && !callbackUrl.startsWith('//')) {
                            return `${baseUrl}${callbackUrl}`;
                        }
                    }
                    return `${baseUrl}/dashboard/owner`;
                }
                if (callbackUrl) {
                    if (callbackUrl.startsWith(baseUrl)) {
                        return callbackUrl;
                    }
                    if (callbackUrl.startsWith('/') && !callbackUrl.startsWith('//')) {
                        return `${baseUrl}${callbackUrl}`;
                    }
                }
                if (isAuthCallback) {
                    return baseUrl;
                }
                if (url.startsWith(baseUrl) && !isAuthCallback)
                    return url;
                if (url.startsWith('/') && !isAuthCallback)
                    return `${baseUrl}${url}`;
                return baseUrl;
            }
            catch (error) {
                console.error('[NextAuth Edge] Redirect error:', error);
                return baseUrl;
            }
        },
        // Edge-safe authorized callback (for middleware)
        authorized({ auth }) {
            // Simple check: user is logged in
            // Role-based checks happen in layouts/pages
            return !!auth?.user;
        },
    },
};
