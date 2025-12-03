/**
 * Unit tests for notification error handling
 *
 * @module __tests__/lib/notifications/errors.test
 */

import {
  type NotificationError,
  createNotificationError,
  exceptionToNotificationError,
  isRetryableError,
  isUserError,
  isServerError,
  getErrorStatusCode,
  getUserFriendlyMessage,
  formatErrorResponse,
  toNextResponse,
  logNotificationError,
  getRetryDelay,
  fromZodError,
  NOTIFICATION_ERROR_CODES,
} from '@/lib/notifications/errors';

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('Notification Errors', () => {
  describe('createNotificationError', () => {
    it('should create USER_NOT_FOUND error with correct structure', () => {
      const error = createNotificationError('USER_NOT_FOUND', 'User does not exist', {
        userId: 'user-123',
      });

      expect(error).toMatchObject({
        type: 'USER_NOT_FOUND',
        message: 'User does not exist',
        userId: 'user-123',
      });
      expect(error.correlationId).toMatch(/^[0-9a-f-]{36}$/);
    });

    it('should create RATE_LIMITED error with retryAfter and limit', () => {
      const error = createNotificationError('RATE_LIMITED', 'Too many requests', {
        userId: 'user-123',
        retryAfter: 120,
        limit: 50,
        notificationType: 'BOOKING_CONFIRMED',
      });

      expect(error).toMatchObject({
        type: 'RATE_LIMITED',
        message: 'Too many requests',
        userId: 'user-123',
        retryAfter: 120,
        limit: 50,
        notificationType: 'BOOKING_CONFIRMED',
      });
    });

    it('should create INVALID_INPUT error with validation errors', () => {
      const validationErrors = {
        email: ['Invalid email format', 'Email required'],
        name: ['Name too short'],
      };

      const error = createNotificationError('INVALID_INPUT', 'Validation failed', {
        field: 'email',
        validationErrors,
      });

      expect(error).toMatchObject({
        type: 'INVALID_INPUT',
        message: 'Validation failed',
        field: 'email',
        validationErrors,
      });
    });

    it('should create DELIVERY_ERROR with channel and retryable flag', () => {
      const error = createNotificationError('DELIVERY_ERROR', 'Push failed', {
        channel: 'PUSH',
        notificationId: 'notif-123',
        retryable: true,
        originalError: new Error('FCM service unavailable'),
      });

      expect(error).toMatchObject({
        type: 'DELIVERY_ERROR',
        message: 'Push failed',
        channel: 'PUSH',
        notificationId: 'notif-123',
        retryable: true,
      });
      expect(error.originalError).toBe('FCM service unavailable');
    });

    it('should create DATABASE_ERROR with operation context', () => {
      const error = createNotificationError('DATABASE_ERROR', 'Query failed', {
        operation: 'create',
        originalError: new Error('Connection timeout'),
      });

      expect(error).toMatchObject({
        type: 'DATABASE_ERROR',
        message: 'Query failed',
        operation: 'create',
        originalError: 'Connection timeout',
      });
    });

    it('should create EXPIRED error with expiresAt timestamp', () => {
      const expiresAt = new Date('2025-01-15T12:00:00Z');
      const error = createNotificationError('EXPIRED', 'Notification expired', {
        notificationId: 'notif-123',
        expiresAt,
      });

      expect(error).toMatchObject({
        type: 'EXPIRED',
        message: 'Notification expired',
        notificationId: 'notif-123',
        expiresAt,
      });
    });

    it('should use provided correlationId if available', () => {
      const correlationId = '12345678-1234-1234-1234-123456789012';
      const error = createNotificationError('INTERNAL_ERROR', 'Something broke', {
        correlationId,
      });

      expect(error.correlationId).toBe(correlationId);
    });
  });

  describe('exceptionToNotificationError', () => {
    it('should convert Error with "user not found" message', () => {
      const exception = new Error('User not found: user-123');
      const error = exceptionToNotificationError(exception, { userId: 'user-123' });

      expect(error.type).toBe('USER_NOT_FOUND');
      expect(error.message).toContain('User not found');
    });

    it('should convert Error with "notification not found" message', () => {
      const exception = new Error('Notification does not exist');
      const error = exceptionToNotificationError(exception, { notificationId: 'notif-123' });

      expect(error.type).toBe('NOTIFICATION_NOT_FOUND');
    });

    it('should convert Error with "rate limit" message', () => {
      const exception = new Error('Rate limit exceeded');
      const error = exceptionToNotificationError(exception, {
        userId: 'user-123',
        retryAfter: 60,
      });

      expect(error.type).toBe('RATE_LIMITED');
      expect(error).toMatchObject({
        userId: 'user-123',
        retryAfter: 60,
      });
    });

    it('should convert Error with "invalid" or "validation" message', () => {
      const exception = new Error('Invalid input provided');
      const error = exceptionToNotificationError(exception, { field: 'email' });

      expect(error.type).toBe('INVALID_INPUT');
      expect(error).toMatchObject({ field: 'email' });
    });

    it('should convert database errors', () => {
      const exception = new Error('Prisma query failed');
      const error = exceptionToNotificationError(exception, { operation: 'create' });

      expect(error.type).toBe('DATABASE_ERROR');
      expect(error).toMatchObject({ operation: 'create' });
    });

    it('should convert queue errors', () => {
      const exception = new Error('QStash publish failed');
      const error = exceptionToNotificationError(exception, { queueName: 'notifications' });

      expect(error.type).toBe('QUEUE_ERROR');
    });

    it('should convert delivery errors', () => {
      const exception = new Error('Failed to send notification');
      const error = exceptionToNotificationError(exception, {
        channel: 'EMAIL',
        notificationId: 'notif-123',
      });

      expect(error.type).toBe('DELIVERY_ERROR');
      expect(error).toMatchObject({
        channel: 'EMAIL',
        notificationId: 'notif-123',
      });
    });

    it('should default to INTERNAL_ERROR for unknown errors', () => {
      const exception = new Error('Something weird happened');
      const error = exceptionToNotificationError(exception);

      expect(error.type).toBe('INTERNAL_ERROR');
    });

    it('should handle non-Error exceptions', () => {
      const error = exceptionToNotificationError('string error');

      expect(error.type).toBe('INTERNAL_ERROR');
      expect(error.message).toBe('Unknown error occurred');
    });
  });

  describe('isRetryableError', () => {
    it('should identify retryable errors', () => {
      expect(isRetryableError(createNotificationError('RATE_LIMITED', 'test', {}))).toBe(true);
      expect(isRetryableError(createNotificationError('QUEUE_ERROR', 'test', {}))).toBe(true);
      expect(isRetryableError(createNotificationError('DATABASE_ERROR', 'test', { operation: 'create' }))).toBe(true);
      expect(isRetryableError(createNotificationError('INTERNAL_ERROR', 'test', {}))).toBe(true);
    });

    it('should identify DELIVERY_ERROR based on retryable flag', () => {
      const retryable = createNotificationError('DELIVERY_ERROR', 'test', {
        channel: 'PUSH',
        notificationId: 'test',
        retryable: true,
      });
      const notRetryable = createNotificationError('DELIVERY_ERROR', 'test', {
        channel: 'PUSH',
        notificationId: 'test',
        retryable: false,
      });

      expect(isRetryableError(retryable)).toBe(true);
      expect(isRetryableError(notRetryable)).toBe(false);
    });

    it('should identify non-retryable errors', () => {
      expect(isRetryableError(createNotificationError('USER_NOT_FOUND', 'test', { userId: 'test' }))).toBe(false);
      expect(isRetryableError(createNotificationError('INVALID_INPUT', 'test', { field: 'test' }))).toBe(false);
      expect(isRetryableError(createNotificationError('EXPIRED', 'test', { notificationId: 'test', expiresAt: new Date() }))).toBe(false);
    });
  });

  describe('isUserError', () => {
    it('should identify user errors', () => {
      expect(isUserError(createNotificationError('USER_NOT_FOUND', 'test', { userId: 'test' }))).toBe(true);
      expect(isUserError(createNotificationError('INVALID_INPUT', 'test', { field: 'test' }))).toBe(true);
      expect(isUserError(createNotificationError('NOTIFICATION_NOT_FOUND', 'test', { notificationId: 'test' }))).toBe(true);
      expect(isUserError(createNotificationError('UNAUTHORIZED', 'test', { userId: 'test', notificationId: 'test', reason: 'test' }))).toBe(true);
      expect(isUserError(createNotificationError('EXPIRED', 'test', { notificationId: 'test', expiresAt: new Date() }))).toBe(true);
    });

    it('should not identify server errors as user errors', () => {
      expect(isUserError(createNotificationError('DATABASE_ERROR', 'test', { operation: 'create' }))).toBe(false);
      expect(isUserError(createNotificationError('QUEUE_ERROR', 'test', {}))).toBe(false);
    });
  });

  describe('isServerError', () => {
    it('should identify server errors', () => {
      expect(isServerError(createNotificationError('QUEUE_ERROR', 'test', {}))).toBe(true);
      expect(isServerError(createNotificationError('DATABASE_ERROR', 'test', { operation: 'create' }))).toBe(true);
      expect(isServerError(createNotificationError('INTERNAL_ERROR', 'test', {}))).toBe(true);
      expect(isServerError(createNotificationError('TEMPLATE_ERROR', 'test', { templateType: 'test' }))).toBe(true);
    });

    it('should not identify user errors as server errors', () => {
      expect(isServerError(createNotificationError('USER_NOT_FOUND', 'test', { userId: 'test' }))).toBe(false);
      expect(isServerError(createNotificationError('INVALID_INPUT', 'test', { field: 'test' }))).toBe(false);
    });
  });

  describe('getErrorStatusCode', () => {
    it('should return correct status codes', () => {
      expect(getErrorStatusCode(createNotificationError('USER_NOT_FOUND', 'test', { userId: 'test' }))).toBe(404);
      expect(getErrorStatusCode(createNotificationError('NOTIFICATION_NOT_FOUND', 'test', { notificationId: 'test' }))).toBe(404);
      expect(getErrorStatusCode(createNotificationError('UNAUTHORIZED', 'test', { userId: 'test', notificationId: 'test', reason: 'test' }))).toBe(401);
      expect(getErrorStatusCode(createNotificationError('RATE_LIMITED', 'test', {}))).toBe(429);
      expect(getErrorStatusCode(createNotificationError('INVALID_INPUT', 'test', { field: 'test' }))).toBe(400);
      expect(getErrorStatusCode(createNotificationError('EXPIRED', 'test', { notificationId: 'test', expiresAt: new Date() }))).toBe(410);
      expect(getErrorStatusCode(createNotificationError('TOKEN_VALIDATION_ERROR', 'test', { reason: 'test' }))).toBe(422);
      expect(getErrorStatusCode(createNotificationError('DELIVERY_ERROR', 'test', { channel: 'PUSH', notificationId: 'test', retryable: true }))).toBe(502);
      expect(getErrorStatusCode(createNotificationError('DATABASE_ERROR', 'test', { operation: 'create' }))).toBe(500);
      expect(getErrorStatusCode(createNotificationError('INTERNAL_ERROR', 'test', {}))).toBe(500);
    });
  });

  describe('getUserFriendlyMessage', () => {
    it('should return user-friendly messages', () => {
      expect(getUserFriendlyMessage(createNotificationError('USER_NOT_FOUND', 'test', { userId: 'test' }))).toContain('User not found');
      expect(getUserFriendlyMessage(createNotificationError('RATE_LIMITED', 'test', { retryAfter: 60 }))).toContain('60 seconds');
      expect(getUserFriendlyMessage(createNotificationError('INVALID_INPUT', 'test', { field: 'email' }))).toContain('email');
      expect(getUserFriendlyMessage(createNotificationError('DELIVERY_ERROR', 'test', { channel: 'PUSH', notificationId: 'test', retryable: true }))).toContain('PUSH');
    });

    it('should not expose sensitive information', () => {
      const error = createNotificationError('DATABASE_ERROR', 'Connection string exposed', {
        operation: 'create',
        originalError: new Error('postgresql://user:pass@localhost'),
      });
      const message = getUserFriendlyMessage(error);

      expect(message).not.toContain('postgresql://');
      expect(message).not.toContain('user:pass');
    });
  });

  describe('formatErrorResponse', () => {
    it('should format error for API response', () => {
      const error = createNotificationError('RATE_LIMITED', 'Too many requests', {
        userId: 'user-123',
        retryAfter: 120,
        limit: 50,
      });

      const response = formatErrorResponse(error);

      expect(response).toMatchObject({
        error: 'RATE_LIMITED',
        correlationId: error.correlationId,
        statusCode: 429,
      });
      expect(response.details).toMatchObject({
        retryAfter: 120,
        limit: 50,
      });
      expect(response.message).toBeTruthy();
    });

    it('should include validation errors in details', () => {
      const error = createNotificationError('INVALID_INPUT', 'Validation failed', {
        field: 'email',
        validationErrors: { email: ['Invalid format'] },
      });

      const response = formatErrorResponse(error);

      expect(response.details).toMatchObject({
        field: 'email',
        validationErrors: { email: ['Invalid format'] },
      });
    });

    it('should not include details for errors without extra info', () => {
      const error = createNotificationError('INTERNAL_ERROR', 'Something broke', {});
      const response = formatErrorResponse(error);

      expect(response.details).toBeUndefined();
    });
  });

  describe('toNextResponse', () => {
    it('should format error for Next.js API response', () => {
      const error = createNotificationError('USER_NOT_FOUND', 'User not found', {
        userId: 'user-123',
      });

      const response = toNextResponse(error);

      expect(response.status).toBe(404);
      expect(response.body).toMatchObject({
        error: 'USER_NOT_FOUND',
        statusCode: 404,
      });
    });
  });

  describe('getRetryDelay', () => {
    it('should return null for non-retryable errors', () => {
      const error = createNotificationError('USER_NOT_FOUND', 'test', { userId: 'test' });
      expect(getRetryDelay(error, 1)).toBeNull();
    });

    it('should return retryAfter for RATE_LIMITED errors', () => {
      const error = createNotificationError('RATE_LIMITED', 'test', { retryAfter: 120 });
      expect(getRetryDelay(error, 1)).toBe(120000); // 120 seconds in ms
    });

    it('should use exponential backoff for DATABASE_ERROR', () => {
      const error = createNotificationError('DATABASE_ERROR', 'test', { operation: 'create' });

      expect(getRetryDelay(error, 0)).toBe(1000); // 2^0 * 1000 = 1s
      expect(getRetryDelay(error, 1)).toBe(2000); // 2^1 * 1000 = 2s
      expect(getRetryDelay(error, 2)).toBe(4000); // 2^2 * 1000 = 4s
      expect(getRetryDelay(error, 3)).toBe(8000); // 2^3 * 1000 = 8s
    });

    it('should use exponential backoff with jitter for retryable DELIVERY_ERROR', () => {
      const error = createNotificationError('DELIVERY_ERROR', 'test', {
        channel: 'PUSH',
        notificationId: 'test',
        retryable: true,
      });

      const delay = getRetryDelay(error, 2);
      expect(delay).toBeGreaterThanOrEqual(4000); // Base delay 2^2 * 1000
      expect(delay).toBeLessThan(5000); // Base + max jitter (1000ms)
    });

    it('should return null for non-retryable DELIVERY_ERROR', () => {
      const error = createNotificationError('DELIVERY_ERROR', 'test', {
        channel: 'PUSH',
        notificationId: 'test',
        retryable: false,
      });

      expect(getRetryDelay(error, 1)).toBeNull();
    });
  });

  describe('fromZodError', () => {
    it('should convert Zod validation errors', () => {
      const zodError = {
        errors: [
          { path: ['email'], message: 'Invalid email format' },
          { path: ['email'], message: 'Email is required' },
          { path: ['name'], message: 'Name is too short' },
        ],
      };

      const error = fromZodError(zodError);

      expect(error.type).toBe('INVALID_INPUT');
      expect(error.field).toBe('email'); // First field
      expect(error.validationErrors).toEqual({
        email: ['Invalid email format', 'Email is required'],
        name: ['Name is too short'],
      });
    });

    it('should handle nested paths', () => {
      const zodError = {
        errors: [
          { path: ['user', 'profile', 'email'], message: 'Invalid' },
        ],
      };

      const error = fromZodError(zodError);

      expect(error.field).toBe('user.profile.email');
      expect(error.validationErrors).toEqual({
        'user.profile.email': ['Invalid'],
      });
    });

    it('should use provided correlationId', () => {
      const zodError = {
        errors: [{ path: ['field'], message: 'Invalid' }],
      };

      const correlationId = '12345678-1234-1234-1234-123456789012';
      const error = fromZodError(zodError, correlationId);

      expect(error.correlationId).toBe(correlationId);
    });
  });

  describe('NOTIFICATION_ERROR_CODES', () => {
    it('should export all error code constants', () => {
      expect(NOTIFICATION_ERROR_CODES).toMatchObject({
        USER_NOT_FOUND: 'USER_NOT_FOUND',
        RATE_LIMITED: 'RATE_LIMITED',
        INVALID_INPUT: 'INVALID_INPUT',
        QUEUE_ERROR: 'QUEUE_ERROR',
        DATABASE_ERROR: 'DATABASE_ERROR',
        DELIVERY_ERROR: 'DELIVERY_ERROR',
        TOKEN_VALIDATION_ERROR: 'TOKEN_VALIDATION_ERROR',
        NOTIFICATION_NOT_FOUND: 'NOTIFICATION_NOT_FOUND',
        UNAUTHORIZED: 'UNAUTHORIZED',
        EXPIRED: 'EXPIRED',
        TEMPLATE_ERROR: 'TEMPLATE_ERROR',
        PREFERENCE_ERROR: 'PREFERENCE_ERROR',
        INTERNAL_ERROR: 'INTERNAL_ERROR',
      });
    });
  });
});
