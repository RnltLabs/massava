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

import NextAuth from 'next-auth';
import bcrypt from 'bcryptjs';
import { PrismaClient, UserRole } from '@/app/generated/prisma';
import { UnifiedUserAdapter } from '@/lib/auth/adapter';
import { authConfig } from './auth.config';

const prisma = new PrismaClient();

console.log('[NextAuth] Initializing with basePath:', process.env.NEXTAUTH_BASEPATH || '/api/auth');

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,

  // Add Prisma adapter (Node.js only)
  adapter: UnifiedUserAdapter(prisma),

  providers: [
    // Extend providers with authorization logic
    ...authConfig.providers.map((provider) => {
      // Override Credentials provider with full authorization
      if (provider.id === 'credentials') {
        return {
          ...provider,
          async authorize(credentials: Record<string, unknown> | undefined) {
            if (!credentials?.email || !credentials?.password) {
              return null;
            }

            const accountType = credentials.accountType as 'customer' | 'studio' | undefined;

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

            if (user && user.password) {
              // Verify password with bcrypt
              const isPasswordValid = await bcrypt.compare(
                credentials.password as string,
                user.password
              );

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
          async authorize(credentials: Record<string, unknown> | undefined) {
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
        token.primaryRole = (user as any).primaryRole || UserRole.CUSTOMER;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        token.roles = (user as any).roles || [UserRole.CUSTOMER];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        token.accountType = (user as any).accountType || 'customer';

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
