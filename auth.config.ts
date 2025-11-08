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

import type { NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';

/**
 * Edge-safe NextAuth configuration
 * Used by middleware.ts (Edge Runtime)
 */
export const authConfig = {
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
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      // P0.3 FIX: SECURITY - Disabled dangerous email account linking
      allowDangerousEmailAccountLinking: false,
    }),

    // NOTE: Credentials providers are defined in auth.ts (not here)
    // They require database access via Prisma, which is not available in Edge runtime
    // Edge-safe config only includes OAuth providers
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
        session.user.id = token.id as string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).primaryRole = token.primaryRole;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).roles = token.roles;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).accountType = token.accountType || 'customer';
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
                               callbackUrl?.includes('/business');

        if (isBusinessUser) {
          if (callbackUrl && callbackUrl.includes('/business')) {
            if (callbackUrl.startsWith(baseUrl)) {
              return callbackUrl;
            }
            if (callbackUrl.startsWith('/') && !callbackUrl.startsWith('//')) {
              return `${baseUrl}${callbackUrl}`;
            }
          }
          return `${baseUrl}/business`;
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

        if (url.startsWith(baseUrl) && !isAuthCallback) return url;
        if (url.startsWith('/') && !isAuthCallback) return `${baseUrl}${url}`;

        return baseUrl;
      } catch (error) {
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
} satisfies NextAuthConfig;
