/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Prisma Middleware for Automatic Health Data Encryption
 * 
 * GDPR Art. 9 Compliance - Encrypts Booking.message field automatically
 * Applies encryption on create/update, decryption on read operations
 */

import { Prisma, PrismaClient } from '@/app/generated/prisma';
import {
  encryptToString,
  decryptFromString,
  isEncrypted,
} from '../../encryption/health-data';
import {
  logHealthDataAccess,
  logHealthDataAccessBatch,
  type HealthDataAccessLog,
} from '../../audit/health-data-access-logger';

/**
 * Parameters for encryption operations
 * Flexible type to accept Prisma's generated types
 */
interface EncryptParams {
  action: 'create' | 'update' | 'upsert';
  args: Record<string, unknown>;
  model: string;
}

/**
 * Parameters for decryption operations
 */
interface DecryptParams {
  action: 'findUnique' | 'findFirst' | 'findMany' | 'create' | 'update' | 'upsert';
  model: string;
}

/**
 * Booking result type (single or array)
 * Flexible type to accept any booking-like object
 */
type BookingResult = {
  id?: string | null;
  customerId?: string | null;
  message?: string | null;
} | null;

type BookingArrayResult = Array<{
  id?: string | null;
  customerId?: string | null;
  message?: string | null;
}> | null;

/**
 * Prisma Client Extension to automatically encrypt/decrypt health data in Booking.message field
 *
 * Supports both legacy `booking` and unified `newBooking` models.
 *
 * Encryption happens on:
 * - booking/newBooking.create
 * - booking/newBooking.update
 * - booking/newBooking.upsert
 *
 * Decryption happens on:
 * - booking/newBooking.findUnique
 * - booking/newBooking.findFirst
 * - booking/newBooking.findMany
 *
 * Only encrypts if message field is present and not already encrypted.
 */
export function createHealthDataEncryptionExtension() {
  const bookingHandlers = {
    async create({ args, query }: any) {
      await encryptMessageField({ action: 'create', args, model: 'NewBooking' });
      const result = await query(args);
      await decryptMessageField(result, { action: 'create', model: 'NewBooking' });
      return result;
    },
    async update({ args, query }: any) {
      await encryptMessageField({ action: 'update', args, model: 'NewBooking' });
      const result = await query(args);
      await decryptMessageField(result, { action: 'update', model: 'NewBooking' });
      return result;
    },
    async upsert({ args, query }: any) {
      await encryptMessageField({ action: 'upsert', args, model: 'NewBooking' });
      const result = await query(args);
      await decryptMessageField(result, { action: 'upsert', model: 'NewBooking' });
      return result;
    },
    async findUnique({ args, query }: any) {
      const result = await query(args);
      await decryptMessageField(result, { action: 'findUnique', model: 'NewBooking' });
      return result;
    },
    async findFirst({ args, query }: any) {
      const result = await query(args);
      await decryptMessageField(result, { action: 'findFirst', model: 'NewBooking' });
      return result;
    },
    async findMany({ args, query }: any) {
      const result = await query(args);
      await decryptMessageField(result, { action: 'findMany', model: 'NewBooking' });
      return result;
    },
  };

  return Prisma.defineExtension({
    name: 'healthDataEncryption',
    query: {
      newBooking: bookingHandlers, // Unified booking model
    },
  });
}

/**
 * Type guard to check if value is an object with string properties
 */
function isRecordWithStringProp(value: unknown, prop: string): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && prop in value;
}

/**
 * Safely extract string property from unknown object
 */
function extractStringProp(obj: unknown, prop: string): string | undefined {
  if (isRecordWithStringProp(obj, prop)) {
    const value = (obj as Record<string, unknown>)[prop];
    return typeof value === 'string' ? value : undefined;
  }
  return undefined;
}

/**
 * Encrypt message field in create/update/upsert operations
 */
async function encryptMessageField(params: EncryptParams): Promise<void> {
  let messageToEncrypt: string | undefined;
  let userId: string | undefined;

  // Extract message and userId from different operation types
  if (params.action === 'create') {
    const data = params.args.data as Record<string, unknown> | undefined;
    messageToEncrypt = extractStringProp(data, 'message');
    userId = extractStringProp(data, 'customerId');
  } else if (params.action === 'update') {
    const data = params.args.data as Record<string, unknown> | undefined;
    const where = params.args.where as Record<string, unknown> | undefined;
    messageToEncrypt = extractStringProp(data, 'message');
    userId = extractStringProp(where, 'customerId');
  } else if (params.action === 'upsert') {
    // For upsert, check both create and update data
    const createData = params.args.create as Record<string, unknown> | undefined;
    const updateData = params.args.update as Record<string, unknown> | undefined;
    messageToEncrypt = extractStringProp(createData, 'message') || extractStringProp(updateData, 'message');
    userId = extractStringProp(createData, 'customerId') || extractStringProp(updateData, 'customerId');
  }

  // Only encrypt if message exists and is not already encrypted
  if (messageToEncrypt && !isEncrypted(messageToEncrypt)) {
    try {
      const encrypted = encryptToString(messageToEncrypt);

      // Update the params with encrypted message
      if (params.action === 'create') {
        const data = params.args.data as Record<string, unknown> | undefined;
        if (data) {
          data.message = encrypted;
        }
      } else if (params.action === 'update') {
        const data = params.args.data as Record<string, unknown> | undefined;
        if (data) {
          data.message = encrypted;
        }
      } else if (params.action === 'upsert') {
        const createData = params.args.create as Record<string, unknown> | undefined;
        const updateData = params.args.update as Record<string, unknown> | undefined;
        if (createData && 'message' in createData) {
          createData.message = encrypted;
        }
        if (updateData && 'message' in updateData) {
          updateData.message = encrypted;
        }
      }

      // Audit log: Health data encrypted (write operation)
      const where = params.args.where as Record<string, unknown> | undefined;
      const bookingId = extractStringProp(where, 'id') || 'new';

      await logHealthDataAccess({
        action: 'ENCRYPT',
        userId: userId || 'unknown',
        bookingId,
        timestamp: new Date(),
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to encrypt health data: ${errorMessage}. Please check HEALTH_DATA_ENCRYPTION_KEY configuration.`);
    }
  }
}

/**
 * Decrypt message field in read operations
 * Uses batch logging for findMany to improve performance
 */
async function decryptMessageField(
  result: BookingResult | BookingArrayResult,
  params: DecryptParams
): Promise<void> {
  if (!result) return;

  // Handle single result (findUnique, findFirst, create, update)
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
        // Leave encrypted data as-is rather than throwing
        // This allows system to continue functioning even if decryption fails
        result.message = '[Content temporarily unavailable]';
      }
    }
  }

  // Handle array results (findMany) - Use BATCH logging for performance
  if (Array.isArray(result)) {
    const auditLogs: HealthDataAccessLog[] = [];

    for (const booking of result) {
      if (booking.message && isEncrypted(booking.message)) {
        try {
          booking.message = decryptFromString(booking.message);

          // Collect audit logs for batch insert
          auditLogs.push({
            action: 'DECRYPT',
            userId: booking.customerId || 'unknown',
            bookingId: booking.id || 'unknown',
            timestamp: new Date(),
          });
        } catch (error) {
          booking.message = '[Content temporarily unavailable]';
        }
      }
    }

    // Batch insert all audit logs at once (performance optimization)
    if (auditLogs.length > 0) {
      await logHealthDataAccessBatch(auditLogs);
    }
  }
}

/**
 * Apply health data encryption extension to Prisma client
 *
 * Usage:
 * ```typescript
 * import { createPrismaClientWithEncryption } from '@/lib/prisma/middleware/encrypt-health-data'
 *
 * const prisma = createPrismaClientWithEncryption()
 * ```
 */
export function createPrismaClientWithEncryption() {
  const client = new PrismaClient();
  return client.$extends(createHealthDataEncryptionExtension());
}
