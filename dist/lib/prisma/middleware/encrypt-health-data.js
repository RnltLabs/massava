"use strict";
/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Prisma Middleware for Automatic Health Data Encryption
 *
 * GDPR Art. 9 Compliance - Encrypts Booking.message field automatically
 * Applies encryption on create/update, decryption on read operations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHealthDataEncryptionExtension = createHealthDataEncryptionExtension;
exports.createPrismaClientWithEncryption = createPrismaClientWithEncryption;
const prisma_1 = require("@/app/generated/prisma");
const health_data_1 = require("../../encryption/health-data");
const health_data_access_logger_1 = require("../../audit/health-data-access-logger");
function createHealthDataEncryptionExtension() {
    const bookingHandlers = {
        async create({ args, query }) {
            await encryptMessageField({ action: 'create', args: args, model: 'NewBooking' });
            const result = await query(args);
            // @ts-expect-error - Type mismatch from Prisma extension
            await decryptMessageField(result, { action: 'create', model: 'NewBooking' });
            return result;
        },
        async update({ args, query }) {
            await encryptMessageField({ action: 'update', args: args, model: 'NewBooking' });
            const result = await query(args);
            // @ts-expect-error - Type mismatch from Prisma extension
            await decryptMessageField(result, { action: 'update', model: 'NewBooking' });
            return result;
        },
        async upsert({ args, query }) {
            await encryptMessageField({ action: 'upsert', args: args, model: 'NewBooking' });
            const result = await query(args);
            // @ts-expect-error - Type mismatch from Prisma extension
            await decryptMessageField(result, { action: 'upsert', model: 'NewBooking' });
            return result;
        },
        async findUnique({ args, query }) {
            const result = await query(args);
            // @ts-expect-error - Type mismatch from Prisma extension
            await decryptMessageField(result, { action: 'findUnique', model: 'NewBooking' });
            return result;
        },
        async findFirst({ args, query }) {
            const result = await query(args);
            // @ts-expect-error - Type mismatch from Prisma extension
            await decryptMessageField(result, { action: 'findFirst', model: 'NewBooking' });
            return result;
        },
        async findMany({ args, query }) {
            const result = await query(args);
            // @ts-expect-error - Type mismatch from Prisma extension
            await decryptMessageField(result, { action: 'findMany', model: 'NewBooking' });
            return result;
        },
    };
    return prisma_1.Prisma.defineExtension({
        name: 'healthDataEncryption',
        query: {
            newBooking: bookingHandlers, // Unified booking model
        },
    });
}
/**
 * Type guard to check if value is an object with string properties
 */
function isRecordWithStringProp(value, prop) {
    return typeof value === 'object' && value !== null && prop in value;
}
/**
 * Safely extract string property from unknown object
 */
function extractStringProp(obj, prop) {
    if (isRecordWithStringProp(obj, prop)) {
        const value = obj[prop];
        return typeof value === 'string' ? value : undefined;
    }
    return undefined;
}
/**
 * Encrypt message field in create/update/upsert operations
 */
async function encryptMessageField(params) {
    let messageToEncrypt;
    let userId;
    // Extract message and userId from different operation types
    if (params.action === 'create') {
        const data = params.args.data;
        messageToEncrypt = extractStringProp(data, 'message');
        userId = extractStringProp(data, 'customerId');
    }
    else if (params.action === 'update') {
        const data = params.args.data;
        const where = params.args.where;
        messageToEncrypt = extractStringProp(data, 'message');
        userId = extractStringProp(where, 'customerId');
    }
    else if (params.action === 'upsert') {
        // For upsert, check both create and update data
        const createData = params.args.create;
        const updateData = params.args.update;
        messageToEncrypt = extractStringProp(createData, 'message') || extractStringProp(updateData, 'message');
        userId = extractStringProp(createData, 'customerId') || extractStringProp(updateData, 'customerId');
    }
    // Only encrypt if message exists and is not already encrypted
    if (messageToEncrypt && !(0, health_data_1.isEncrypted)(messageToEncrypt)) {
        try {
            const encrypted = (0, health_data_1.encryptToString)(messageToEncrypt);
            // Update the params with encrypted message
            if (params.action === 'create') {
                const data = params.args.data;
                if (data) {
                    data.message = encrypted;
                }
            }
            else if (params.action === 'update') {
                const data = params.args.data;
                if (data) {
                    data.message = encrypted;
                }
            }
            else if (params.action === 'upsert') {
                const createData = params.args.create;
                const updateData = params.args.update;
                if (createData && 'message' in createData) {
                    createData.message = encrypted;
                }
                if (updateData && 'message' in updateData) {
                    updateData.message = encrypted;
                }
            }
            // Audit log: Health data encrypted (write operation)
            const where = params.args.where;
            const bookingId = extractStringProp(where, 'id') || 'new';
            await (0, health_data_access_logger_1.logHealthDataAccess)({
                action: 'ENCRYPT',
                userId: userId || 'unknown',
                bookingId,
                timestamp: new Date(),
            });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to encrypt health data: ${errorMessage}. Please check HEALTH_DATA_ENCRYPTION_KEY configuration.`);
        }
    }
}
/**
 * Decrypt message field in read operations
 * Uses batch logging for findMany to improve performance
 */
async function decryptMessageField(result, params) {
    if (!result)
        return;
    // Handle single result (findUnique, findFirst, create, update)
    if (result && typeof result === 'object' && !Array.isArray(result)) {
        if (result.message && (0, health_data_1.isEncrypted)(result.message)) {
            try {
                result.message = (0, health_data_1.decryptFromString)(result.message);
                // Audit log: Health data accessed (read operation)
                await (0, health_data_access_logger_1.logHealthDataAccess)({
                    action: 'DECRYPT',
                    userId: result.customerId || 'unknown',
                    bookingId: result.id || 'unknown',
                    timestamp: new Date(),
                });
            }
            catch (error) {
                // Leave encrypted data as-is rather than throwing
                // This allows system to continue functioning even if decryption fails
                result.message = '[Content temporarily unavailable]';
            }
        }
    }
    // Handle array results (findMany) - Use BATCH logging for performance
    if (Array.isArray(result)) {
        const auditLogs = [];
        for (const booking of result) {
            if (booking.message && (0, health_data_1.isEncrypted)(booking.message)) {
                try {
                    booking.message = (0, health_data_1.decryptFromString)(booking.message);
                    // Collect audit logs for batch insert
                    auditLogs.push({
                        action: 'DECRYPT',
                        userId: booking.customerId || 'unknown',
                        bookingId: booking.id || 'unknown',
                        timestamp: new Date(),
                    });
                }
                catch (error) {
                    booking.message = '[Content temporarily unavailable]';
                }
            }
        }
        // Batch insert all audit logs at once (performance optimization)
        if (auditLogs.length > 0) {
            await (0, health_data_access_logger_1.logHealthDataAccessBatch)(auditLogs);
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
function createPrismaClientWithEncryption() {
    const client = new prisma_1.PrismaClient();
    return client.$extends(createHealthDataEncryptionExtension());
}
