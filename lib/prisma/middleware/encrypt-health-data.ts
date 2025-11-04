/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Prisma Middleware for Automatic Health Data Encryption
 * 
 * GDPR Art. 9 Compliance - Encrypts Booking.message field automatically
 * Applies encryption on create/update, decryption on read operations
 */

import { Prisma } from '@/app/generated/prisma';
import {
  encryptToString,
  decryptFromString,
  isEncrypted,
} from '../../encryption/health-data';
import { logHealthDataAccess } from '../../audit/health-data-access-logger';

/**
 * Prisma middleware to automatically encrypt/decrypt health data in Booking.message field
 * 
 * Encryption happens on:
 * - booking.create
 * - booking.update
 * - booking.upsert
 * 
 * Decryption happens on:
 * - booking.findUnique
 * - booking.findFirst
 * - booking.findMany
 * 
 * Only encrypts if message field is present and not already encrypted.
 */
export function encryptHealthDataMiddleware(): Prisma.Middleware {
  return async (params, next) => {
    // Only process Booking model
    if (params.model !== 'Booking') {
      return next(params);
    }

    // Handle encryption on write operations
    if (
      params.action === 'create' ||
      params.action === 'update' ||
      params.action === 'upsert'
    ) {
      await encryptMessageField(params);
    }

    // Execute the query
    const result = await next(params);

    // Handle decryption on read operations
    if (
      params.action === 'findUnique' ||
      params.action === 'findFirst' ||
      params.action === 'findMany'
    ) {
      await decryptMessageField(result, params);
    }

    return result;
  };
}

/**
 * Encrypt message field in create/update/upsert operations
 */
async function encryptMessageField(params: Prisma.MiddlewareParams): Promise<void> {
  let messageToEncrypt: string | undefined;
  let userId: string | undefined;

  // Extract message and userId from different operation types
  if (params.action === 'create') {
    messageToEncrypt = params.args.data?.message;
    userId = params.args.data?.customerId;
  } else if (params.action === 'update') {
    messageToEncrypt = params.args.data?.message;
    userId = params.args.where?.customerId;
  } else if (params.action === 'upsert') {
    // For upsert, check both create and update data
    messageToEncrypt = params.args.create?.message || params.args.update?.message;
    userId = params.args.create?.customerId || params.args.update?.customerId;
  }

  // Only encrypt if message exists and is not already encrypted
  if (messageToEncrypt && !isEncrypted(messageToEncrypt)) {
    try {
      const encrypted = encryptToString(messageToEncrypt);

      // Update the params with encrypted message
      if (params.action === 'create') {
        params.args.data.message = encrypted;
      } else if (params.action === 'update') {
        params.args.data.message = encrypted;
      } else if (params.action === 'upsert') {
        if (params.args.create?.message) {
          params.args.create.message = encrypted;
        }
        if (params.args.update?.message) {
          params.args.update.message = encrypted;
        }
      }

      // Audit log: Health data encrypted (write operation)
      await logHealthDataAccess({
        action: 'ENCRYPT',
        userId: userId || 'unknown',
        bookingId: params.args.where?.id || 'new',
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Failed to encrypt health data:', error);
      throw new Error('Failed to encrypt health data. Please check HEALTH_DATA_ENCRYPTION_KEY configuration.');
    }
  }
}

/**
 * Decrypt message field in read operations
 */
async function decryptMessageField(
  result: any,
  params: Prisma.MiddlewareParams
): Promise<void> {
  if (!result) return;

  // Handle single result (findUnique, findFirst)
  if (result && typeof result === 'object' && !Array.isArray(result)) {
    if (result.message && isEncrypted(result.message)) {
      try {
        result.message = decryptFromString(result.message);

        // Audit log: Health data accessed (read operation)
        await logHealthDataAccess({
          action: 'DECRYPT',
          userId: result.customerId || 'unknown',
          bookingId: result.id || 'unknown',
          timestamp: new Date(),
        });
      } catch (error) {
        console.error('Failed to decrypt health data:', error);
        // Leave encrypted data as-is rather than throwing
        // This allows system to continue functioning even if decryption fails
        result.message = '[ENCRYPTED - Decryption failed]';
      }
    }
  }

  // Handle array results (findMany)
  if (Array.isArray(result)) {
    for (const booking of result) {
      if (booking.message && isEncrypted(booking.message)) {
        try {
          booking.message = decryptFromString(booking.message);

          // Audit log: Health data accessed (read operation)
          await logHealthDataAccess({
            action: 'DECRYPT',
            userId: booking.customerId || 'unknown',
            bookingId: booking.id || 'unknown',
            timestamp: new Date(),
          });
        } catch (error) {
          console.error('Failed to decrypt health data:', error);
          booking.message = '[ENCRYPTED - Decryption failed]';
        }
      }
    }
  }
}

/**
 * Apply health data encryption middleware to Prisma client
 * 
 * Usage:
 * ```typescript
 * import { prisma } from '@/lib/prisma'
 * import { applyHealthDataEncryption } from '@/lib/prisma/middleware/encrypt-health-data'
 * 
 * applyHealthDataEncryption(prisma)
 * ```
 */
export function applyHealthDataEncryption(prismaClient: any): void {
  prismaClient.$use(encryptHealthDataMiddleware());
}
