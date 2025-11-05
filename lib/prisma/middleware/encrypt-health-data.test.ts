/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Prisma Health Data Encryption Middleware Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { encryptHealthDataMiddleware } from './encrypt-health-data';
import { isEncrypted } from '../../encryption/health-data';

// Mock the audit logger
vi.mock('../../audit/health-data-access-logger', () => ({
  logHealthDataAccess: vi.fn(),
}));

// Test encryption key
const TEST_KEY = 'a'.repeat(64);

describe('Prisma Health Data Encryption Middleware', () => {
  const originalEnv = process.env.HEALTH_DATA_ENCRYPTION_KEY;

  beforeEach(() => {
    process.env.HEALTH_DATA_ENCRYPTION_KEY = TEST_KEY;
  });

  afterEach(() => {
    process.env.HEALTH_DATA_ENCRYPTION_KEY = originalEnv;
  });

  describe('Encryption on write operations', () => {
    it('should encrypt message field on booking.create', async () => {
      const middleware = encryptHealthDataMiddleware();
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

      const next = vi.fn(async () => ({ id: 'booking-123', ...params.args.data }));

      await middleware(params as any, next);

      // Message should be encrypted
      expect(params.args.data.message).not.toBe('I have chronic back pain');
      expect(isEncrypted(params.args.data.message)).toBe(true);
    });

    it('should encrypt message field on booking.update', async () => {
      const middleware = encryptHealthDataMiddleware();
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

      const next = vi.fn(async () => ({ id: 'booking-123', ...params.args.data }));

      await middleware(params as any, next);

      // Message should be encrypted
      expect(params.args.data.message).not.toBe('Updated health information');
      expect(isEncrypted(params.args.data.message)).toBe(true);
    });

    it('should not re-encrypt already encrypted message', async () => {
      const middleware = encryptHealthDataMiddleware();
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

      const next = vi.fn(async () => ({ id: 'booking-123', ...params.args.data }));

      await middleware(params as any, next);

      // Message should remain the same
      expect(params.args.data.message).toBe(alreadyEncrypted);
    });

    it('should not encrypt if message is not provided', async () => {
      const middleware = encryptHealthDataMiddleware();
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

      const next = vi.fn(async () => ({ id: 'booking-123', ...params.args.data }));

      await middleware(params as any, next);

      // Should not throw error
      expect(next).toHaveBeenCalled();
    });
  });

  describe('Decryption on read operations', () => {
    it('should decrypt message field on booking.findUnique', async () => {
      const middleware = encryptHealthDataMiddleware();

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
      const createNext = vi.fn(async () => {
        encryptedMessage = createParams.args.data.message;
        return { id: 'booking-123', message: encryptedMessage };
      });

      await middleware(createParams as any, createNext);

      // Now read it back
      const findParams = {
        model: 'Booking',
        action: 'findUnique',
        args: {
          where: { id: 'booking-123' },
        },
      };

      const findNext = vi.fn(async () => ({
        id: 'booking-123',
        message: encryptedMessage,
        customerId: 'user-123',
      }));

      const result = await middleware(findParams as any, findNext);

      // Message should be decrypted
      expect(result.message).toBe('I have chronic back pain');
    });

    it('should decrypt message field on booking.findMany', async () => {
      const middleware = encryptHealthDataMiddleware();

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

      const createNext1 = vi.fn(async () => {
        encryptedMessage1 = createParams1.args.data.message;
        return { id: 'booking-1', message: encryptedMessage1 };
      });

      const createNext2 = vi.fn(async () => {
        encryptedMessage2 = createParams2.args.data.message;
        return { id: 'booking-2', message: encryptedMessage2 };
      });

      await middleware(createParams1 as any, createNext1);
      await middleware(createParams2 as any, createNext2);

      // Now read them back
      const findParams = {
        model: 'Booking',
        action: 'findMany',
        args: {},
      };

      const findNext = vi.fn(async () => [
        { id: 'booking-1', message: encryptedMessage1, customerId: 'user-123' },
        { id: 'booking-2', message: encryptedMessage2, customerId: 'user-123' },
      ]);

      const result = await middleware(findParams as any, findNext);

      // Messages should be decrypted
      expect(result[0].message).toBe('Back pain');
      expect(result[1].message).toBe('Knee injury');
    });

    it('should handle null message gracefully', async () => {
      const middleware = encryptHealthDataMiddleware();

      const findParams = {
        model: 'Booking',
        action: 'findUnique',
        args: {
          where: { id: 'booking-123' },
        },
      };

      const findNext = vi.fn(async () => ({
        id: 'booking-123',
        message: null,
        customerId: 'user-123',
      }));

      const result = await middleware(findParams as any, findNext);

      // Should not throw error
      expect(result.message).toBeNull();
    });

    it('should not decrypt plaintext message', async () => {
      const middleware = encryptHealthDataMiddleware();

      const findParams = {
        model: 'Booking',
        action: 'findUnique',
        args: {
          where: { id: 'booking-123' },
        },
      };

      const findNext = vi.fn(async () => ({
        id: 'booking-123',
        message: 'Plain text message',
        customerId: 'user-123',
      }));

      const result = await middleware(findParams as any, findNext);

      // Should remain as plaintext
      expect(result.message).toBe('Plain text message');
    });
  });

  describe('Model filtering', () => {
    it('should not process non-Booking models', async () => {
      const middleware = encryptHealthDataMiddleware();

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

      const next = vi.fn(async () => params.args.data);

      await middleware(params as any, next);

      // Message should NOT be encrypted
      expect(params.args.data.message).toBe('This should not be encrypted');
    });
  });

  describe('End-to-end encryption/decryption', () => {
    it('should handle full create and read cycle', async () => {
      const middleware = encryptHealthDataMiddleware();
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
      const createNext = vi.fn(async () => {
        encryptedMessage = createParams.args.data.message;
        return { id: 'booking-123', ...createParams.args.data };
      });

      const createResult = await middleware(createParams as any, createNext);

      // Verify encryption happened
      expect(createResult.message).not.toBe(originalMessage);
      expect(isEncrypted(encryptedMessage)).toBe(true);

      // Read booking back
      const findParams = {
        model: 'Booking',
        action: 'findUnique',
        args: {
          where: { id: 'booking-123' },
        },
      };

      const findNext = vi.fn(async () => ({
        id: 'booking-123',
        message: encryptedMessage,
        customerId: 'user-123',
      }));

      const findResult = await middleware(findParams as any, findNext);

      // Verify decryption restored original message
      expect(findResult.message).toBe(originalMessage);
    });
  });
});
