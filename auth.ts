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

import { prisma } from '@/lib/prisma';
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { PrismaClient, UserRole } from '@/app/generated/prisma';
import { UnifiedUserAdapter } from '@/lib/auth/adapter';
import { authConfig } from './auth.config';


console.log('[NextAuth] Initializing with basePath:', process.env.NEXTAUTH_BASEPATH || '/api/auth');

/**
 * Helper function to check if user owns a studio
 * Used to determine sidebar visibility and route access
 */
async function checkStudioOwnership(userId: string): Promise<boolean> {
  try {
    const ownership = await prisma.studioOwnership.findFirst({
      where: {
        userId,
      },
    });
    return !!ownership;
  } catch (error) {
    console.error('[NextAuth] Error checking studio ownership:', error);
    return false;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,

  // Add Prisma adapter (Node.js only)
  adapter: UnifiedUserAdapter(prisma),

  providers: [
    // Include OAuth providers from Edge-safe config
    ...authConfig.providers,

    // Define Credentials provider directly (NOT via override)
    // This is required because NextAuth v5 doesn't support provider overriding via spread
    Credentials({
      id: 'credentials',
      name: 'Email and Password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        accountType: { label: 'Account Type', type: 'text' },
      },
      async authorize(credentials) {
        const timestamp = new Date().toISOString();
        console.log('[auth.ts] ===== AUTHORIZE CALLED AT', timestamp, '=====');
        console.log('[auth.ts] authorize() called with email:', credentials?.email);

        if (!credentials?.email || !credentials?.password) {
          console.log('[auth.ts] Missing credentials');
          return null;
        }

        const accountType = credentials.accountType as 'customer' | 'studio' | undefined;
        console.log('[auth.ts] Account type:', accountType);

        // Database query with Prisma
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: {
            roles: {
              select: {
                role: true,
              },
            },
          },
        });

        console.log('[auth.ts] User found:', !!user, 'Has password:', !!user?.password);

        if (!user || !user.password) {
          console.log('[auth.ts] No user or no password - returning null');
          return null;
        }

        // Verify password with bcrypt
        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        console.log('[auth.ts] Password valid:', isPasswordValid);

        if (!isPasswordValid) {
          console.log('[auth.ts] Password mismatch - returning null');
          return null;
        }

        // Email verification is NOT blocking login anymore
        // Users can log in with unverified email but will see verification reminder
        // This improves UX for users who just registered during booking flow
        if (!user.emailVerified) {
          console.log('[auth.ts] Email not verified - allowing login anyway');
        }

        // Check if account is suspended
        if (user.isSuspended) {
          console.log('[auth.ts] Account suspended');
          throw new Error('Account suspended');
        }

        console.log('[auth.ts] Authorization successful, returning user object');
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          primaryRole: user.primaryRole,
          roles: [user.primaryRole, ...user.roles.map((r) => r.role)],
          accountType: accountType || 'customer',
        };
      },
    }),

    // Define Magic Link provider directly (NOT via override)
    Credentials({
      id: 'magic-link',
      name: 'Magic Link',
      credentials: {
        email: { label: 'Email', type: 'email' },
      },
      async authorize(credentials) {
        if (!credentials?.email) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
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
          await prisma.user.update({
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
    }),
  ],

  callbacks: {
    // Full JWT callback with database access
    async jwt({ token, user, account, trigger }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        token.primaryRole = (user as any).primaryRole || UserRole.CUSTOMER;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        token.roles = (user as any).roles || [UserRole.CUSTOMER];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        token.accountType = (user as any).accountType || 'customer';

        // Check studio ownership for progressive onboarding UX
        token.hasStudio = user.id ? await checkStudioOwnership(user.id) : false;

        // P0.6 FIX: Session versioning
        token.sessionVersion = 1;
        token.issuedAt = Date.now();
      }

      // P0.6 FIX: On session update/refresh, verify roles haven't changed
      if (trigger === 'update' || (!user && !account)) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
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
          token.sessionVersion = ((token.sessionVersion as number) || 1) + 1;
          token.primaryRole = dbUser.primaryRole;
          token.roles = currentRoles;
        }

        // Re-check studio ownership on session update
        token.hasStudio = await checkStudioOwnership(token.id as string);
      }

      // OAuth sign in - fetch roles from database
      if (account && account.provider === 'google') {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
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

          // Check studio ownership for OAuth users
          token.hasStudio = await checkStudioOwnership(dbUser.id);
        }
      }

      return token;
    },

    // Use Edge-safe session callback from auth.config.ts
    session: authConfig.callbacks?.session,
  },

  events: {
    async signIn({ user }) {
      // Update last login time
      await prisma.user.update({
        where: { id: user.id },
        data: { updatedAt: new Date() },
      });
    },
  },
});
