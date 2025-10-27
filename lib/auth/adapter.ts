/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Custom Prisma Adapter for Unified User Model
 * Maps NextAuth to our new User/NewAccount/NewSession models
 */

import { PrismaClient, UserRole } from '@/app/generated/prisma';
import type { Adapter } from 'next-auth/adapters';

export function UnifiedUserAdapter(prisma: PrismaClient): Adapter {
  return {
    async createUser(data) {
      const user = await prisma.user.create({
        data: {
          email: data.email,
          emailVerified: data.emailVerified,
          name: data.name,
          image: data.image,
          primaryRole: UserRole.CUSTOMER, // Default role for OAuth users
        },
      });

      // Create role assignment
      await prisma.userRoleAssignment.create({
        data: {
          userId: user.id,
          role: UserRole.CUSTOMER,
          grantedBy: 'OAUTH_SIGNUP',
        },
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

      if (!user) return null;

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

      if (!user) return null;

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

      if (!account) return null;

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

      if (!session) return null;

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
      } catch {
        return null;
      }
    },
  };
}
