/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

import { PrismaClient } from '@/app/generated/prisma';

/**
 * Prisma Client Instance
 *
 * Singleton pattern to avoid multiple Prisma Client instances in development.
 * In production, Next.js will create a new instance on each serverless function invocation.
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}
