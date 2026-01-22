/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Tests for Geocoding Error Utilities
 *
 * @module __tests__/lib/services/geocoding/errors.test
 */

import {
  createGeocodingError,
  shouldTriggerFallback,
  isRetryableError,
  isUserError,
  isServerError,
  getRetryDelay,
  getUserFriendlyMessage,
  exceptionToGeocodingError,
  GEOCODING_ERROR_CODES,
  type GeocodingError,
} from '@/lib/services/geocoding/errors';

// Mock logger to prevent console output during tests
jest.mock('@/lib/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
  generateCorrelationId: () => 'generated-correlation-id',
}));

describe('Geocoding Errors', () => {
  describe('GEOCODING_ERROR_CODES', () => {
    it('should define all error codes as constants', () => {
      expect(GEOCODING_ERROR_CODES.NETWORK_ERROR).toBe('NETWORK_ERROR');
      expect(GEOCODING_ERROR_CODES.TIMEOUT).toBe('TIMEOUT');
      expect(GEOCODING_ERROR_CODES.RATE_LIMITED).toBe('RATE_LIMITED');
      expect(GEOCODING_ERROR_CODES.INVALID_RESPONSE).toBe('INVALID_RESPONSE');
      expect(GEOCODING_ERROR_CODES.PROVIDER_UNAVAILABLE).toBe('PROVIDER_UNAVAILABLE');
      expect(GEOCODING_ERROR_CODES.ALL_PROVIDERS_FAILED).toBe('ALL_PROVIDERS_FAILED');
      expect(GEOCODING_ERROR_CODES.CORS_ERROR).toBe('CORS_ERROR');
      expect(GEOCODING_ERROR_CODES.INVALID_INPUT).toBe('INVALID_INPUT');
    });
  });

  describe('createGeocodingError', () => {
    describe('NETWORK_ERROR', () => {
      it('should create NETWORK_ERROR with all fields', () => {
        const error = createGeocodingError('NETWORK_ERROR', 'Connection failed', {
          provider: 'photon',
          correlationId: 'test-123',
          originalError: new Error('Fetch failed'),
          statusCode: 500,
        });

        expect(error.type).toBe('NETWORK_ERROR');
        expect(error.message).toBe('Connection failed');
        expect(error.correlationId).toBe('test-123');
        expect(error.provider).toBe('photon');
        if (error.type === 'NETWORK_ERROR') {
          expect(error.originalError).toBe('Fetch failed');
          expect(error.statusCode).toBe(500);
        }
      });

      it('should handle string originalError', () => {
        const error = createGeocodingError('NETWORK_ERROR', 'Failed', {
          provider: 'photon',
          originalError: 'String error message',
        });

        if (error.type === 'NETWORK_ERROR') {
          expect(error.originalError).toBe('String error message');
        }
      });

      it('should omit optional fields when not provided', () => {
        const error = createGeocodingError('NETWORK_ERROR', 'Failed', {
          provider: 'photon',
        });

        if (error.type === 'NETWORK_ERROR') {
          expect(error.originalError).toBeUndefined();
          expect(error.statusCode).toBeUndefined();
        }
      });
    });

    describe('TIMEOUT', () => {
      it('should create TIMEOUT error with timeoutMs', () => {
        const error = createGeocodingError('TIMEOUT', 'Request timed out', {
          provider: 'radar',
          correlationId: 'timeout-123',
          timeoutMs: 8000,
        });

        expect(error.type).toBe('TIMEOUT');
        expect(error.message).toBe('Request timed out');
        if (error.type === 'TIMEOUT') {
          expect(error.timeoutMs).toBe(8000);
        }
      });

      it('should use default timeout if not provided', () => {
        const error = createGeocodingError('TIMEOUT', 'Timed out', {
          provider: 'photon',
        });

        if (error.type === 'TIMEOUT') {
          expect(error.timeoutMs).toBe(5000); // default
        }
      });
    });

    describe('RATE_LIMITED', () => {
      it('should create RATE_LIMITED error with retryAfterMs', () => {
        const error = createGeocodingError('RATE_LIMITED', 'Too many requests', {
          provider: 'radar',
          retryAfterMs: 30000,
        });

        expect(error.type).toBe('RATE_LIMITED');
        if (error.type === 'RATE_LIMITED') {
          expect(error.retryAfterMs).toBe(30000);
        }
      });

      it('should use default retryAfterMs if not provided', () => {
        const error = createGeocodingError('RATE_LIMITED', 'Rate limited', {
          provider: 'photon',
        });

        if (error.type === 'RATE_LIMITED') {
          expect(error.retryAfterMs).toBe(60000); // default
        }
      });
    });

    describe('INVALID_RESPONSE', () => {
      it('should create INVALID_RESPONSE with format details', () => {
        const error = createGeocodingError('INVALID_RESPONSE', 'Bad JSON', {
          provider: 'photon',
          expectedFormat: '{ features: [] }',
          receivedData: '{ invalid: true }',
        });

        expect(error.type).toBe('INVALID_RESPONSE');
        if (error.type === 'INVALID_RESPONSE') {
          expect(error.expectedFormat).toBe('{ features: [] }');
          expect(error.receivedData).toBe('{ invalid: true }');
        }
      });

      it('should truncate long receivedData', () => {
        const longData = 'x'.repeat(500);
        const error = createGeocodingError('INVALID_RESPONSE', 'Bad response', {
          provider: 'photon',
          receivedData: longData,
        });

        if (error.type === 'INVALID_RESPONSE') {
          expect(error.receivedData!.length).toBe(200);
        }
      });
    });

    describe('PROVIDER_UNAVAILABLE', () => {
      it('should create PROVIDER_UNAVAILABLE with reason', () => {
        const availableAt = new Date('2025-01-01T12:00:00Z');
        const error = createGeocodingError('PROVIDER_UNAVAILABLE', 'Service down', {
          provider: 'radar',
          reason: 'Circuit breaker open',
          availableAt,
        });

        expect(error.type).toBe('PROVIDER_UNAVAILABLE');
        if (error.type === 'PROVIDER_UNAVAILABLE') {
          expect(error.reason).toBe('Circuit breaker open');
          expect(error.availableAt).toEqual(availableAt);
        }
      });

      it('should use default reason if not provided', () => {
        const error = createGeocodingError('PROVIDER_UNAVAILABLE', 'Down', {
          provider: 'photon',
        });

        if (error.type === 'PROVIDER_UNAVAILABLE') {
          expect(error.reason).toBe('Unknown');
        }
      });
    });

    describe('ALL_PROVIDERS_FAILED', () => {
      it('should create ALL_PROVIDERS_FAILED with nested errors', () => {
        const nestedErrors: GeocodingError[] = [
          createGeocodingError('TIMEOUT', 'Photon timed out', { provider: 'photon' }),
          createGeocodingError('NETWORK_ERROR', 'Radar network error', { provider: 'radar' }),
        ];

        const error = createGeocodingError('ALL_PROVIDERS_FAILED', 'All failed', {
          failedProviders: ['photon', 'radar'],
          errors: nestedErrors,
        });

        expect(error.type).toBe('ALL_PROVIDERS_FAILED');
        if (error.type === 'ALL_PROVIDERS_FAILED') {
          expect(error.failedProviders).toContain('photon');
          expect(error.failedProviders).toContain('radar');
          expect(error.errors).toHaveLength(2);
        }
      });

      it('should use default failedProviders if not provided', () => {
        const error = createGeocodingError('ALL_PROVIDERS_FAILED', 'Failed', {});

        if (error.type === 'ALL_PROVIDERS_FAILED') {
          expect(error.failedProviders).toEqual(['photon']);
          expect(error.errors).toEqual([]);
        }
      });
    });

    describe('CORS_ERROR', () => {
      it('should create CORS_ERROR with requestUrl', () => {
        const error = createGeocodingError('CORS_ERROR', 'CORS blocked', {
          provider: 'photon',
          requestUrl: 'https://photon.komoot.io/api',
        });

        expect(error.type).toBe('CORS_ERROR');
        if (error.type === 'CORS_ERROR') {
          expect(error.requestUrl).toBe('https://photon.komoot.io/api');
        }
      });

      it('should use default requestUrl if not provided', () => {
        const error = createGeocodingError('CORS_ERROR', 'Blocked', {
          provider: 'photon',
        });

        if (error.type === 'CORS_ERROR') {
          expect(error.requestUrl).toBe('unknown');
        }
      });
    });

    describe('INVALID_INPUT', () => {
      it('should create INVALID_INPUT with field and constraint', () => {
        const error = createGeocodingError('INVALID_INPUT', 'Query too short', {
          field: 'query',
          value: 'ab',
          constraint: 'Minimum 3 characters required',
        });

        expect(error.type).toBe('INVALID_INPUT');
        if (error.type === 'INVALID_INPUT') {
          expect(error.field).toBe('query');
          expect(error.value).toBe('ab');
          expect(error.constraint).toBe('Minimum 3 characters required');
        }
      });

      it('should use default field if not provided', () => {
        const error = createGeocodingError('INVALID_INPUT', 'Invalid', {
          constraint: 'Some constraint',
        });

        if (error.type === 'INVALID_INPUT') {
          expect(error.field).toBe('query');
        }
      });
    });

    describe('correlation ID handling', () => {
      it('should use provided correlationId', () => {
        const error = createGeocodingError('NETWORK_ERROR', 'Failed', {
          provider: 'photon',
          correlationId: 'my-custom-id',
        });

        expect(error.correlationId).toBe('my-custom-id');
      });

      it('should generate correlationId if not provided', () => {
        const error = createGeocodingError('NETWORK_ERROR', 'Failed', {
          provider: 'photon',
        });

        expect(error.correlationId).toBe('generated-correlation-id');
      });
    });

    describe('provider handling', () => {
      it('should use provided provider', () => {
        const error = createGeocodingError('NETWORK_ERROR', 'Failed', {
          provider: 'radar',
        });

        if (error.type === 'NETWORK_ERROR') {
          expect(error.provider).toBe('radar');
        }
      });

      it('should default to photon if provider not provided', () => {
        const error = createGeocodingError('NETWORK_ERROR', 'Failed', {});

        if (error.type === 'NETWORK_ERROR') {
          expect(error.provider).toBe('photon');
        }
      });
    });
  });

  describe('shouldTriggerFallback', () => {
    const fallbackErrors: GeocodingError['type'][] = [
      'NETWORK_ERROR',
      'TIMEOUT',
      'RATE_LIMITED',
      'INVALID_RESPONSE',
      'PROVIDER_UNAVAILABLE',
      'CORS_ERROR',
    ];

    const noFallbackErrors: GeocodingError['type'][] = [
      'INVALID_INPUT',
      'ALL_PROVIDERS_FAILED',
    ];

    it.each(fallbackErrors)('should return true for %s', (errorType) => {
      const error = createGeocodingError(errorType, 'Test error', {
        provider: 'photon',
        failedProviders: ['photon'],
      });

      expect(shouldTriggerFallback(error)).toBe(true);
    });

    it.each(noFallbackErrors)('should return false for %s', (errorType) => {
      const error = createGeocodingError(errorType, 'Test error', {
        provider: 'photon',
        field: 'query',
        constraint: 'test',
        failedProviders: ['photon'],
      });

      expect(shouldTriggerFallback(error)).toBe(false);
    });
  });

  describe('isRetryableError', () => {
    const retryableErrors: GeocodingError['type'][] = [
      'NETWORK_ERROR',
      'TIMEOUT',
      'RATE_LIMITED',
    ];

    const nonRetryableErrors: GeocodingError['type'][] = [
      'INVALID_RESPONSE',
      'PROVIDER_UNAVAILABLE',
      'ALL_PROVIDERS_FAILED',
      'CORS_ERROR',
      'INVALID_INPUT',
    ];

    it.each(retryableErrors)('should return true for %s', (errorType) => {
      const error = createGeocodingError(errorType, 'Test error', {
        provider: 'photon',
      });

      expect(isRetryableError(error)).toBe(true);
    });

    it.each(nonRetryableErrors)('should return false for %s', (errorType) => {
      const error = createGeocodingError(errorType, 'Test error', {
        provider: 'photon',
        field: 'query',
        constraint: 'test',
        failedProviders: ['photon'],
      });

      expect(isRetryableError(error)).toBe(false);
    });
  });

  describe('isUserError', () => {
    it('should return true for INVALID_INPUT', () => {
      const error = createGeocodingError('INVALID_INPUT', 'Bad input', {
        field: 'query',
        constraint: 'test',
      });

      expect(isUserError(error)).toBe(true);
    });

    it('should return false for server errors', () => {
      const error = createGeocodingError('NETWORK_ERROR', 'Network failed', {
        provider: 'photon',
      });

      expect(isUserError(error)).toBe(false);
    });
  });

  describe('isServerError', () => {
    const serverErrors: GeocodingError['type'][] = [
      'NETWORK_ERROR',
      'TIMEOUT',
      'RATE_LIMITED',
      'INVALID_RESPONSE',
      'PROVIDER_UNAVAILABLE',
      'ALL_PROVIDERS_FAILED',
    ];

    it.each(serverErrors)('should return true for %s', (errorType) => {
      const error = createGeocodingError(errorType, 'Test', {
        provider: 'photon',
        failedProviders: ['photon'],
      });

      expect(isServerError(error)).toBe(true);
    });

    it('should return false for INVALID_INPUT', () => {
      const error = createGeocodingError('INVALID_INPUT', 'Bad input', {
        field: 'query',
        constraint: 'test',
      });

      expect(isServerError(error)).toBe(false);
    });

    it('should return false for CORS_ERROR', () => {
      const error = createGeocodingError('CORS_ERROR', 'CORS blocked', {
        provider: 'photon',
      });

      expect(isServerError(error)).toBe(false);
    });
  });

  describe('getRetryDelay', () => {
    it('should return retryAfterMs for RATE_LIMITED', () => {
      const error = createGeocodingError('RATE_LIMITED', 'Rate limited', {
        provider: 'photon',
        retryAfterMs: 30000,
      });

      expect(getRetryDelay(error, 1)).toBe(30000);
    });

    it('should return short delay for TIMEOUT', () => {
      const error = createGeocodingError('TIMEOUT', 'Timed out', {
        provider: 'photon',
      });

      expect(getRetryDelay(error, 1)).toBe(1000);
      expect(getRetryDelay(error, 2)).toBe(2000);
      expect(getRetryDelay(error, 3)).toBe(3000);
      expect(getRetryDelay(error, 10)).toBe(3000); // Max 3s
    });

    it('should return exponential backoff for NETWORK_ERROR', () => {
      const error = createGeocodingError('NETWORK_ERROR', 'Network failed', {
        provider: 'photon',
      });

      expect(getRetryDelay(error, 1)).toBe(500);   // 500 * 2^0
      expect(getRetryDelay(error, 2)).toBe(1000);  // 500 * 2^1
      expect(getRetryDelay(error, 3)).toBe(2000);  // 500 * 2^2
      expect(getRetryDelay(error, 4)).toBe(4000);  // 500 * 2^3 (max)
      expect(getRetryDelay(error, 10)).toBe(4000); // Max 4s
    });

    it('should return null for non-retryable errors', () => {
      const error = createGeocodingError('INVALID_INPUT', 'Bad input', {
        field: 'query',
        constraint: 'test',
      });

      expect(getRetryDelay(error, 1)).toBeNull();
    });
  });

  describe('getUserFriendlyMessage', () => {
    it('should return user-friendly message for NETWORK_ERROR', () => {
      const error = createGeocodingError('NETWORK_ERROR', 'Technical error', {
        provider: 'photon',
      });

      const message = getUserFriendlyMessage(error);
      expect(message).toContain('internet connection');
    });

    it('should return user-friendly message for TIMEOUT', () => {
      const error = createGeocodingError('TIMEOUT', 'Technical error', {
        provider: 'photon',
      });

      const message = getUserFriendlyMessage(error);
      expect(message).toContain('took too long');
    });

    it('should return user-friendly message for RATE_LIMITED', () => {
      const error = createGeocodingError('RATE_LIMITED', 'Technical error', {
        provider: 'photon',
      });

      const message = getUserFriendlyMessage(error);
      expect(message).toContain('Too many');
    });

    it('should return user-friendly message for INVALID_RESPONSE', () => {
      const error = createGeocodingError('INVALID_RESPONSE', 'Technical error', {
        provider: 'photon',
      });

      const message = getUserFriendlyMessage(error);
      expect(message).toContain('unexpected data');
    });

    it('should return user-friendly message for PROVIDER_UNAVAILABLE', () => {
      const error = createGeocodingError('PROVIDER_UNAVAILABLE', 'Technical error', {
        provider: 'photon',
        reason: 'Down',
      });

      const message = getUserFriendlyMessage(error);
      expect(message).toContain('temporarily unavailable');
    });

    it('should return user-friendly message for ALL_PROVIDERS_FAILED', () => {
      const error = createGeocodingError('ALL_PROVIDERS_FAILED', 'Technical error', {
        failedProviders: ['photon'],
      });

      const message = getUserFriendlyMessage(error);
      expect(message).toContain('currently unavailable');
    });

    it('should return user-friendly message for CORS_ERROR', () => {
      const error = createGeocodingError('CORS_ERROR', 'Technical error', {
        provider: 'photon',
      });

      const message = getUserFriendlyMessage(error);
      expect(message).toContain('blocked by browser');
    });

    it('should include constraint for INVALID_INPUT', () => {
      const error = createGeocodingError('INVALID_INPUT', 'Technical error', {
        field: 'query',
        constraint: 'Minimum 3 characters',
      });

      const message = getUserFriendlyMessage(error);
      expect(message).toContain('Minimum 3 characters');
    });
  });

  describe('exceptionToGeocodingError', () => {
    describe('AbortError handling', () => {
      it('should convert AbortError to TIMEOUT', () => {
        const abortError = new Error('The operation was aborted');
        abortError.name = 'AbortError';

        const error = exceptionToGeocodingError(abortError, 'photon', 'test-123');

        expect(error.type).toBe('TIMEOUT');
        expect(error.correlationId).toBe('test-123');
      });
    });

    describe('TypeError handling', () => {
      it('should convert CORS-related TypeError to CORS_ERROR', () => {
        const corsError = new TypeError('CORS error occurred');

        const error = exceptionToGeocodingError(corsError, 'photon');

        expect(error.type).toBe('CORS_ERROR');
      });

      it('should convert cross-origin TypeError to CORS_ERROR', () => {
        const corsError = new TypeError('cross-origin request blocked');

        const error = exceptionToGeocodingError(corsError, 'photon');

        expect(error.type).toBe('CORS_ERROR');
      });

      it('should convert generic TypeError to NETWORK_ERROR', () => {
        const typeError = new TypeError('Failed to fetch');

        const error = exceptionToGeocodingError(typeError, 'radar');

        expect(error.type).toBe('NETWORK_ERROR');
        if (error.type === 'NETWORK_ERROR') {
          expect(error.provider).toBe('radar');
        }
      });
    });

    describe('generic Error handling', () => {
      it('should detect rate limit in error message', () => {
        const rateLimitError = new Error('Rate limit exceeded');

        const error = exceptionToGeocodingError(rateLimitError, 'photon');

        expect(error.type).toBe('RATE_LIMITED');
      });

      it('should detect "too many" in error message as rate limit', () => {
        const tooManyError = new Error('Too many requests');

        const error = exceptionToGeocodingError(tooManyError, 'photon');

        expect(error.type).toBe('RATE_LIMITED');
      });

      it('should detect timeout in error message', () => {
        const timeoutError = new Error('Request timed out');

        const error = exceptionToGeocodingError(timeoutError, 'photon');

        expect(error.type).toBe('TIMEOUT');
      });

      it('should convert unknown Error to NETWORK_ERROR', () => {
        const unknownError = new Error('Something went wrong');

        const error = exceptionToGeocodingError(unknownError, 'photon');

        expect(error.type).toBe('NETWORK_ERROR');
      });
    });

    describe('non-Error handling', () => {
      it('should handle string throws', () => {
        const error = exceptionToGeocodingError('String error', 'photon');

        expect(error.type).toBe('NETWORK_ERROR');
        if (error.type === 'NETWORK_ERROR') {
          expect(error.originalError).toBe('String error');
        }
      });

      it('should handle number throws', () => {
        const error = exceptionToGeocodingError(500, 'photon');

        expect(error.type).toBe('NETWORK_ERROR');
        if (error.type === 'NETWORK_ERROR') {
          expect(error.originalError).toBe('500');
        }
      });

      it('should handle null throws', () => {
        const error = exceptionToGeocodingError(null, 'photon');

        expect(error.type).toBe('NETWORK_ERROR');
      });

      it('should handle undefined throws', () => {
        const error = exceptionToGeocodingError(undefined, 'photon');

        expect(error.type).toBe('NETWORK_ERROR');
      });

      it('should handle object throws', () => {
        const error = exceptionToGeocodingError({ code: 500 }, 'photon');

        expect(error.type).toBe('NETWORK_ERROR');
      });
    });

    describe('correlation ID handling', () => {
      it('should use provided correlationId', () => {
        const error = exceptionToGeocodingError(
          new Error('Test'),
          'photon',
          'custom-correlation-id'
        );

        expect(error.correlationId).toBe('custom-correlation-id');
      });

      it('should generate correlationId if not provided', () => {
        const error = exceptionToGeocodingError(new Error('Test'), 'photon');

        expect(error.correlationId).toBe('generated-correlation-id');
      });
    });
  });

  describe('error type exhaustiveness', () => {
    // This test ensures the switch statements handle all error types
    it('should handle all error types in shouldTriggerFallback', () => {
      const allTypes: GeocodingError['type'][] = [
        'NETWORK_ERROR',
        'TIMEOUT',
        'RATE_LIMITED',
        'INVALID_RESPONSE',
        'PROVIDER_UNAVAILABLE',
        'ALL_PROVIDERS_FAILED',
        'CORS_ERROR',
        'INVALID_INPUT',
      ];

      allTypes.forEach(type => {
        const error = createGeocodingError(type, 'Test', {
          provider: 'photon',
          field: 'query',
          constraint: 'test',
          failedProviders: ['photon'],
        });

        // Should not throw
        expect(() => shouldTriggerFallback(error)).not.toThrow();
      });
    });

    it('should handle all error types in isRetryableError', () => {
      const allTypes: GeocodingError['type'][] = [
        'NETWORK_ERROR',
        'TIMEOUT',
        'RATE_LIMITED',
        'INVALID_RESPONSE',
        'PROVIDER_UNAVAILABLE',
        'ALL_PROVIDERS_FAILED',
        'CORS_ERROR',
        'INVALID_INPUT',
      ];

      allTypes.forEach(type => {
        const error = createGeocodingError(type, 'Test', {
          provider: 'photon',
          field: 'query',
          constraint: 'test',
          failedProviders: ['photon'],
        });

        // Should not throw
        expect(() => isRetryableError(error)).not.toThrow();
      });
    });

    it('should handle all error types in getUserFriendlyMessage', () => {
      const allTypes: GeocodingError['type'][] = [
        'NETWORK_ERROR',
        'TIMEOUT',
        'RATE_LIMITED',
        'INVALID_RESPONSE',
        'PROVIDER_UNAVAILABLE',
        'ALL_PROVIDERS_FAILED',
        'CORS_ERROR',
        'INVALID_INPUT',
      ];

      allTypes.forEach(type => {
        const error = createGeocodingError(type, 'Test', {
          provider: 'photon',
          field: 'query',
          constraint: 'test',
          failedProviders: ['photon'],
        });

        // Should not throw and should return a string
        const message = getUserFriendlyMessage(error);
        expect(typeof message).toBe('string');
        expect(message.length).toBeGreaterThan(0);
      });
    });
  });
});
