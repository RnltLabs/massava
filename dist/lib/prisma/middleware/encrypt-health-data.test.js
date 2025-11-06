"use strict";
/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Prisma Health Data Encryption Middleware Tests
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const encrypt_health_data_1 = require("./encrypt-health-data");
const health_data_1 = require("../../encryption/health-data");
// Mock the audit logger
vitest_1.vi.mock('../../audit/health-data-access-logger', () => ({
    logHealthDataAccess: vitest_1.vi.fn(),
}));
// Test encryption key
const TEST_KEY = 'a'.repeat(64);
(0, vitest_1.describe)('Prisma Health Data Encryption Middleware', () => {
    const originalEnv = process.env.HEALTH_DATA_ENCRYPTION_KEY;
    (0, vitest_1.beforeEach)(() => {
        process.env.HEALTH_DATA_ENCRYPTION_KEY = TEST_KEY;
    });
    (0, vitest_1.afterEach)(() => {
        process.env.HEALTH_DATA_ENCRYPTION_KEY = originalEnv;
    });
    (0, vitest_1.describe)('Encryption on write operations', () => {
        (0, vitest_1.it)('should encrypt message field on booking.create', async () => {
            const middleware = (0, encrypt_health_data_1.encryptHealthDataMiddleware)();
            const params = {
                model: 'Booking',
                action: 'create',
                args: {
                    data: {
                        studioId: 'studio-123',
                        customerId: 'user-123',
                        customerName: 'John Doe',
                        customerEmail: 'john@example.com',
                        customerPhone: '+49123456789',
                        message: 'I have chronic back pain',
                        preferredDate: 'Next Monday',
                        preferredTime: 'afternoon',
                    },
                },
            };
            const next = vitest_1.vi.fn(async () => ({ id: 'booking-123', ...params.args.data }));
            await middleware(params, next);
            // Message should be encrypted
            (0, vitest_1.expect)(params.args.data.message).not.toBe('I have chronic back pain');
            (0, vitest_1.expect)((0, health_data_1.isEncrypted)(params.args.data.message)).toBe(true);
        });
        (0, vitest_1.it)('should encrypt message field on booking.update', async () => {
            const middleware = (0, encrypt_health_data_1.encryptHealthDataMiddleware)();
            const params = {
                model: 'Booking',
                action: 'update',
                args: {
                    where: { id: 'booking-123' },
                    data: {
                        message: 'Updated health information',
                    },
                },
            };
            const next = vitest_1.vi.fn(async () => ({ id: 'booking-123', ...params.args.data }));
            await middleware(params, next);
            // Message should be encrypted
            (0, vitest_1.expect)(params.args.data.message).not.toBe('Updated health information');
            (0, vitest_1.expect)((0, health_data_1.isEncrypted)(params.args.data.message)).toBe(true);
        });
        (0, vitest_1.it)('should not re-encrypt already encrypted message', async () => {
            const middleware = (0, encrypt_health_data_1.encryptHealthDataMiddleware)();
            const alreadyEncrypted = JSON.stringify({
                encrypted: 'abc',
                iv: 'def',
                authTag: 'ghi',
                salt: 'jkl',
            });
            const params = {
                model: 'Booking',
                action: 'create',
                args: {
                    data: {
                        message: alreadyEncrypted,
                        studioId: 'studio-123',
                        customerId: 'user-123',
                    },
                },
            };
            const next = vitest_1.vi.fn(async () => ({ id: 'booking-123', ...params.args.data }));
            await middleware(params, next);
            // Message should remain the same
            (0, vitest_1.expect)(params.args.data.message).toBe(alreadyEncrypted);
        });
        (0, vitest_1.it)('should not encrypt if message is not provided', async () => {
            const middleware = (0, encrypt_health_data_1.encryptHealthDataMiddleware)();
            const params = {
                model: 'Booking',
                action: 'create',
                args: {
                    data: {
                        studioId: 'studio-123',
                        customerId: 'user-123',
                        // No message field
                    },
                },
            };
            const next = vitest_1.vi.fn(async () => ({ id: 'booking-123', ...params.args.data }));
            await middleware(params, next);
            // Should not throw error
            (0, vitest_1.expect)(next).toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('Decryption on read operations', () => {
        (0, vitest_1.it)('should decrypt message field on booking.findUnique', async () => {
            const middleware = (0, encrypt_health_data_1.encryptHealthDataMiddleware)();
            // First encrypt a message
            const createParams = {
                model: 'Booking',
                action: 'create',
                args: {
                    data: {
                        message: 'I have chronic back pain',
                        studioId: 'studio-123',
                        customerId: 'user-123',
                    },
                },
            };
            let encryptedMessage = '';
            const createNext = vitest_1.vi.fn(async () => {
                encryptedMessage = createParams.args.data.message;
                return { id: 'booking-123', message: encryptedMessage };
            });
            await middleware(createParams, createNext);
            // Now read it back
            const findParams = {
                model: 'Booking',
                action: 'findUnique',
                args: {
                    where: { id: 'booking-123' },
                },
            };
            const findNext = vitest_1.vi.fn(async () => ({
                id: 'booking-123',
                message: encryptedMessage,
                customerId: 'user-123',
            }));
            const result = await middleware(findParams, findNext);
            // Message should be decrypted
            (0, vitest_1.expect)(result.message).toBe('I have chronic back pain');
        });
        (0, vitest_1.it)('should decrypt message field on booking.findMany', async () => {
            const middleware = (0, encrypt_health_data_1.encryptHealthDataMiddleware)();
            // First encrypt messages
            const createParams1 = {
                model: 'Booking',
                action: 'create',
                args: {
                    data: {
                        message: 'Back pain',
                        studioId: 'studio-123',
                        customerId: 'user-123',
                    },
                },
            };
            const createParams2 = {
                model: 'Booking',
                action: 'create',
                args: {
                    data: {
                        message: 'Knee injury',
                        studioId: 'studio-123',
                        customerId: 'user-123',
                    },
                },
            };
            let encryptedMessage1 = '';
            let encryptedMessage2 = '';
            const createNext1 = vitest_1.vi.fn(async () => {
                encryptedMessage1 = createParams1.args.data.message;
                return { id: 'booking-1', message: encryptedMessage1 };
            });
            const createNext2 = vitest_1.vi.fn(async () => {
                encryptedMessage2 = createParams2.args.data.message;
                return { id: 'booking-2', message: encryptedMessage2 };
            });
            await middleware(createParams1, createNext1);
            await middleware(createParams2, createNext2);
            // Now read them back
            const findParams = {
                model: 'Booking',
                action: 'findMany',
                args: {},
            };
            const findNext = vitest_1.vi.fn(async () => [
                { id: 'booking-1', message: encryptedMessage1, customerId: 'user-123' },
                { id: 'booking-2', message: encryptedMessage2, customerId: 'user-123' },
            ]);
            const result = await middleware(findParams, findNext);
            // Messages should be decrypted
            (0, vitest_1.expect)(result[0].message).toBe('Back pain');
            (0, vitest_1.expect)(result[1].message).toBe('Knee injury');
        });
        (0, vitest_1.it)('should handle null message gracefully', async () => {
            const middleware = (0, encrypt_health_data_1.encryptHealthDataMiddleware)();
            const findParams = {
                model: 'Booking',
                action: 'findUnique',
                args: {
                    where: { id: 'booking-123' },
                },
            };
            const findNext = vitest_1.vi.fn(async () => ({
                id: 'booking-123',
                message: null,
                customerId: 'user-123',
            }));
            const result = await middleware(findParams, findNext);
            // Should not throw error
            (0, vitest_1.expect)(result.message).toBeNull();
        });
        (0, vitest_1.it)('should not decrypt plaintext message', async () => {
            const middleware = (0, encrypt_health_data_1.encryptHealthDataMiddleware)();
            const findParams = {
                model: 'Booking',
                action: 'findUnique',
                args: {
                    where: { id: 'booking-123' },
                },
            };
            const findNext = vitest_1.vi.fn(async () => ({
                id: 'booking-123',
                message: 'Plain text message',
                customerId: 'user-123',
            }));
            const result = await middleware(findParams, findNext);
            // Should remain as plaintext
            (0, vitest_1.expect)(result.message).toBe('Plain text message');
        });
    });
    (0, vitest_1.describe)('Model filtering', () => {
        (0, vitest_1.it)('should not process non-Booking models', async () => {
            const middleware = (0, encrypt_health_data_1.encryptHealthDataMiddleware)();
            const params = {
                model: 'User',
                action: 'create',
                args: {
                    data: {
                        email: 'test@example.com',
                        message: 'This should not be encrypted',
                    },
                },
            };
            const next = vitest_1.vi.fn(async () => params.args.data);
            await middleware(params, next);
            // Message should NOT be encrypted
            (0, vitest_1.expect)(params.args.data.message).toBe('This should not be encrypted');
        });
    });
    (0, vitest_1.describe)('End-to-end encryption/decryption', () => {
        (0, vitest_1.it)('should handle full create and read cycle', async () => {
            const middleware = (0, encrypt_health_data_1.encryptHealthDataMiddleware)();
            const originalMessage = 'Patient has diabetes and requires special care';
            // Create booking with health data
            const createParams = {
                model: 'Booking',
                action: 'create',
                args: {
                    data: {
                        studioId: 'studio-123',
                        customerId: 'user-123',
                        customerName: 'Jane Smith',
                        customerEmail: 'jane@example.com',
                        customerPhone: '+49987654321',
                        message: originalMessage,
                        preferredDate: 'Tomorrow',
                        preferredTime: 'morning',
                    },
                },
            };
            let encryptedMessage = '';
            const createNext = vitest_1.vi.fn(async () => {
                encryptedMessage = createParams.args.data.message;
                return { id: 'booking-123', ...createParams.args.data };
            });
            const createResult = await middleware(createParams, createNext);
            // Verify encryption happened
            (0, vitest_1.expect)(createResult.message).not.toBe(originalMessage);
            (0, vitest_1.expect)((0, health_data_1.isEncrypted)(encryptedMessage)).toBe(true);
            // Read booking back
            const findParams = {
                model: 'Booking',
                action: 'findUnique',
                args: {
                    where: { id: 'booking-123' },
                },
            };
            const findNext = vitest_1.vi.fn(async () => ({
                id: 'booking-123',
                message: encryptedMessage,
                customerId: 'user-123',
            }));
            const findResult = await middleware(findParams, findNext);
            // Verify decryption restored original message
            (0, vitest_1.expect)(findResult.message).toBe(originalMessage);
        });
    });
});
