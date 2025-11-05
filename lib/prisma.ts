/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Prisma Client with Health Data Encryption Extension
 */

import { PrismaClient } from '@/app/generated/prisma'
import { createHealthDataEncryptionExtension } from '@/lib/prisma/middleware/encrypt-health-data'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const client = new PrismaClient()

  // Apply health data encryption extension (GDPR Art. 9 compliance)
  // This automatically encrypts Booking.message field on write, decrypts on read
  if (process.env.HEALTH_DATA_ENCRYPTION_KEY) {
    return client.$extends(createHealthDataEncryptionExtension()) as unknown as PrismaClient
  }

  return client
}

// Create Prisma client with extensions
export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
