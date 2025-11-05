/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Prisma Client with Health Data Encryption Middleware
 */

import { PrismaClient } from '@/app/generated/prisma'
import { applyHealthDataEncryption } from '@/lib/prisma/middleware/encrypt-health-data'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Create Prisma client
export const prisma = globalForPrisma.prisma ?? new PrismaClient()

// Apply health data encryption middleware (GDPR Art. 9 compliance)
// This automatically encrypts Booking.message field on write, decrypts on read
if (process.env.HEALTH_DATA_ENCRYPTION_KEY) {
  applyHealthDataEncryption(prisma)
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
