/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@/app/generated/prisma';

const prisma = new PrismaClient();

// Detect basePath based on NEXTAUTH_URL or environment
// In staging: NEXTAUTH_URL=https://staging.rnltlabs.de/massava -> basePath=/massava/api/auth
// In dev: NEXTAUTH_URL=http://localhost:3000 -> basePath=/api/auth
function getServerBasePath(): string {
  const nextAuthUrl = process.env.NEXTAUTH_URL || '';
  if (nextAuthUrl.includes('/massava')) {
    return '/massava/api/auth';
  }
  return '/api/auth';
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  basePath: getServerBasePath(),
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days (STRATEGY.md Section 8.2 - Phase 2)
  },
  pages: {
    signIn: '/auth/signin',
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      id: 'studio-credentials',
      name: 'Studio Owner Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.studioOwner.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          userType: 'studioOwner',
        };
      },
    }),
    Credentials({
      id: 'customer-credentials',
      name: 'Customer Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const customer = await prisma.customer.findUnique({
          where: { email: credentials.email as string },
        });

        if (!customer || !customer.password) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          customer.password
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: customer.id,
          email: customer.email,
          name: customer.name,
          image: customer.image,
          userType: 'customer',
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        token.userType = (user as any).userType || 'studioOwner'; // Default to studioOwner for Google auth
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).userType = token.userType;
      }
      return session;
    },
  },
});
