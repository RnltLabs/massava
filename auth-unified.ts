/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * NextAuth Configuration - Unified User Model
 * Phase 3: RBAC + Passwordless Authentication
 */

import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { PrismaClient, UserRole } from '@/app/generated/prisma';
import { UnifiedUserAdapter } from '@/lib/auth/adapter';

const prisma = new PrismaClient();

// Log basePath for debugging
console.log('[NextAuth] Initializing with basePath:', process.env.NEXTAUTH_BASEPATH || '/api/auth');

export const { handlers, signIn, signOut, auth } = NextAuth({
  // NextAuth basePath must be ABSOLUTE path including Next.js basePath
  // Use NEXTAUTH_BASEPATH env var to set the full path at runtime
  // This is set in deployment configs to /massava/api/auth for staging/production
  // Defaults to /api/auth for local development
  basePath: process.env.NEXTAUTH_BASEPATH || '/api/auth',
  adapter: UnifiedUserAdapter(prisma),
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days (STRATEGY.md Section 8.2 - Phase 2)
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
      allowDangerousEmailAccountLinking: true, // Allow linking to existing email
    }),

    // Credentials Provider - Unified for all users
    Credentials({
      id: 'credentials',
      name: 'Email and Password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Find user by email (unified model)
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

        // Check if user exists and has a password
        if (!user || !user.password) {
          // Generic error to prevent enumeration
          return null;
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        // Check if account is suspended
        if (user.isSuspended) {
          throw new Error('Account suspended');
        }

        // Return user with role information
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

    // Magic Link Provider (custom credentials)
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

        // Find user by email
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

        // Check if account is suspended
        if (user.isSuspended) {
          throw new Error('Account suspended');
        }

        // Mark email as verified (magic link implies email verification)
        if (!user.emailVerified) {
          await prisma.user.update({
            where: { id: user.id },
            data: { emailVerified: new Date() },
          });
        }

        // Return user with role information
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
    async jwt({ token, user, account }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        token.primaryRole = (user as any).primaryRole || UserRole.CUSTOMER;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        token.roles = (user as any).roles || [UserRole.CUSTOMER];
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
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).primaryRole = token.primaryRole;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).roles = token.roles;
      }

      return session;
    },

    async signIn({ user, account }) {
      // Allow all sign-ins by default
      // Suspended account check is done in authorize()

      // For OAuth sign-in, check if we need to assign STUDIO_OWNER role
      // (if user previously registered as studio owner but signed in via OAuth)
      if (account?.provider === 'google') {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
          include: {
            ownedStudios: true,
          },
        });

        // If user owns studios but doesn't have STUDIO_OWNER role, add it
        if (
          existingUser &&
          existingUser.ownedStudios.length > 0 &&
          existingUser.primaryRole === UserRole.CUSTOMER
        ) {
          await prisma.user.update({
            where: { id: existingUser.id },
            data: { primaryRole: UserRole.STUDIO_OWNER },
          });

          // Ensure role assignment exists
          const roleExists = await prisma.userRoleAssignment.findFirst({
            where: {
              userId: existingUser.id,
              role: UserRole.STUDIO_OWNER,
            },
          });

          if (!roleExists) {
            await prisma.userRoleAssignment.create({
              data: {
                userId: existingUser.id,
                role: UserRole.STUDIO_OWNER,
                grantedBy: 'OAUTH_UPGRADE',
              },
            });
          }
        }
      }

      return true;
    },
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
