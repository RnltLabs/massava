/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Prisma Client with Health Data Encryption Extension
 *
 * Type-safe implementation using Prisma Client Extensions API.
 * Replaces deprecated $use() middleware pattern with modern $extends() API.
 */

import { PrismaClient } from '@/app/generated/prisma'
import { createHealthDataEncryptionExtension } from '@/lib/prisma/middleware/encrypt-health-data'

/**
 * Global Prisma client cache for development
 * Prevents hot-reload from creating multiple client instances
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Create Prisma client with optional health data encryption extension
 *
 * In production: Requires HEALTH_DATA_ENCRYPTION_KEY for GDPR Art. 9 compliance
 * In development: Warns if encryption key is missing but continues
 *
 * @throws {Error} If HEALTH_DATA_ENCRYPTION_KEY is missing in production
 * @returns Extended Prisma client with encryption capabilities
 */
function createPrismaClient() {
  const client = new PrismaClient()

  // Check if we're in build phase (Next.js build, Prisma generate, etc.)
  const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build' ||
                       process.env.npm_lifecycle_event === 'build';

  // Production RUNTIME: Enforce encryption key presence (GDPR Art. 9 requirement)
  // Skip validation during build phase to allow Docker builds
  if (process.env.NODE_ENV === 'production' && !isBuildPhase) {
    if (!process.env.HEALTH_DATA_ENCRYPTION_KEY) {
      throw new Error(
        'HEALTH_DATA_ENCRYPTION_KEY must be set in production environment. ' +
        'This is required for GDPR Art. 9 compliance (health data encryption).'
      )
    }
    return client.$extends(createHealthDataEncryptionExtension())
  }

  // Development/Test/Build: Warn but allow running without encryption
  if (process.env.HEALTH_DATA_ENCRYPTION_KEY) {
    return client.$extends(createHealthDataEncryptionExtension())
  }

  if (process.env.NODE_ENV !== 'test' && !isBuildPhase) {
    console.warn(
      '[Prisma] Health data encryption disabled. Set HEALTH_DATA_ENCRYPTION_KEY to enable.'
    )
  }

  return client
}

/**
 * Global Prisma client instance
 * Typed as PrismaClient to maintain API compatibility
 *
 * Note: When encryption extension is applied, the client is extended but cast
 * to PrismaClient type to maintain backward compatibility with existing code.
 * The extension works transparently at runtime.
 */
export const prisma = globalForPrisma.prisma ?? (createPrismaClient() as unknown as PrismaClient)

/**
 * Type of the extended Prisma client
 * Use this type when you need to pass the Prisma client as a parameter
 */
export type ExtendedPrismaClient = PrismaClient

// Cache client in development to prevent hot-reload issues
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
