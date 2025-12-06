/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Geocoding Service - Error Types
 * Discriminated union for type-safe error handling
 *
 * @module lib/services/geocoding/errors
 */

import { logger, generateCorrelationId } from '@/lib/logger';
import type { GeocodingProviderName } from './types';

/**
 * Error code constants for geocoding errors
 */
export const GEOCODING_ERROR_CODES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
  RATE_LIMITED: 'RATE_LIMITED',
  INVALID_RESPONSE: 'INVALID_RESPONSE',
  PROVIDER_UNAVAILABLE: 'PROVIDER_UNAVAILABLE',
  ALL_PROVIDERS_FAILED: 'ALL_PROVIDERS_FAILED',
  CORS_ERROR: 'CORS_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
} as const;

/**
 * Discriminated union of all possible geocoding errors
 * Each error type has a unique 'type' field for exhaustive pattern matching
 */
export type GeocodingError =
  | {
      readonly type: 'NETWORK_ERROR';
      readonly message: string;
      readonly correlationId: string;
      readonly provider: GeocodingProviderName;
      readonly originalError?: string;
      readonly statusCode?: number;
    }
  | {
      readonly type: 'TIMEOUT';
      readonly message: string;
      readonly correlationId: string;
      readonly provider: GeocodingProviderName;
      readonly timeoutMs: number;
    }
  | {
      readonly type: 'RATE_LIMITED';
      readonly message: string;
      readonly correlationId: string;
      readonly provider: GeocodingProviderName;
      readonly retryAfterMs: number;
    }
  | {
      readonly type: 'INVALID_RESPONSE';
      readonly message: string;
      readonly correlationId: string;
      readonly provider: GeocodingProviderName;
      readonly expectedFormat?: string;
      readonly receivedData?: string;
    }
  | {
      readonly type: 'PROVIDER_UNAVAILABLE';
      readonly message: string;
      readonly correlationId: string;
      readonly provider: GeocodingProviderName;
      readonly reason: string;
      readonly availableAt?: Date;
    }
  | {
      readonly type: 'ALL_PROVIDERS_FAILED';
      readonly message: string;
      readonly correlationId: string;
      readonly failedProviders: readonly GeocodingProviderName[];
      readonly errors: readonly GeocodingError[];
    }
  | {
      readonly type: 'CORS_ERROR';
      readonly message: string;
      readonly correlationId: string;
      readonly provider: GeocodingProviderName;
      readonly requestUrl: string;
    }
  | {
      readonly type: 'INVALID_INPUT';
      readonly message: string;
      readonly correlationId: string;
      readonly field: string;
      readonly value?: string;
      readonly constraint: string;
    };

/**
 * Context type for error creation
 */
type ErrorContext = Record<string, unknown>;

/**
 * Helper to safely extract string from context
 */
function getString(context: ErrorContext | undefined, key: string, defaultVal: string): string {
  const val = context?.[key];
  return typeof val === 'string' ? val : defaultVal;
}

/**
 * Helper to safely extract number from context
 */
function getNumber(context: ErrorContext | undefined, key: string, defaultVal: number): number {
  const val = context?.[key];
  return typeof val === 'number' ? val : defaultVal;
}

/**
 * Helper to safely extract provider from context
 */
function getProvider(context: ErrorContext | undefined): GeocodingProviderName {
  const val = context?.provider;
  if (val === 'photon' || val === 'radar') {
    return val;
  }
  return 'photon';
}

/**
 * Helper to safely extract Date from context
 */
function getDate(context: ErrorContext | undefined, key: string): Date | undefined {
  const val = context?.[key];
  return val instanceof Date ? val : undefined;
}

/**
 * Helper to extract original error message
 */
function getOriginalError(context: ErrorContext | undefined): string | undefined {
  const val = context?.originalError;
  if (val instanceof Error) return val.message;
  if (typeof val === 'string') return val;
  return undefined;
}

/**
 * Create a typed geocoding error with proper logging
 *
 * @param type - Error type from discriminated union
 * @param message - Human-readable error message
 * @param context - Additional context for the error
 * @returns Typed GeocodingError
 *
 * @example
 * ```typescript
 * const error = createGeocodingError('TIMEOUT', 'Request timed out', {
 *   provider: 'photon',
 *   timeoutMs: 5000,
 *   correlationId: 'abc-123'
 * });
 * ```
 */
export function createGeocodingError(
  type: GeocodingError['type'],
  message: string,
  context?: ErrorContext
): GeocodingError {
  const correlationId = getString(context, 'correlationId', generateCorrelationId());
  const provider = getProvider(context);

  let error: GeocodingError;

  switch (type) {
    case 'NETWORK_ERROR': {
      const originalError = getOriginalError(context);
      const statusCode = context?.statusCode;
      error = {
        type: 'NETWORK_ERROR',
        message,
        correlationId,
        provider,
        ...(originalError && { originalError }),
        ...(typeof statusCode === 'number' && { statusCode }),
      };
      break;
    }

    case 'TIMEOUT':
      error = {
        type: 'TIMEOUT',
        message,
        correlationId,
        provider,
        timeoutMs: getNumber(context, 'timeoutMs', 5000),
      };
      break;

    case 'RATE_LIMITED':
      error = {
        type: 'RATE_LIMITED',
        message,
        correlationId,
        provider,
        retryAfterMs: getNumber(context, 'retryAfterMs', 60000),
      };
      break;

    case 'INVALID_RESPONSE': {
      const expectedFormat = getString(context, 'expectedFormat', '');
      const receivedData = getString(context, 'receivedData', '');
      error = {
        type: 'INVALID_RESPONSE',
        message,
        correlationId,
        provider,
        ...(expectedFormat && { expectedFormat }),
        ...(receivedData && { receivedData: receivedData.slice(0, 200) }), // Truncate for safety
      };
      break;
    }

    case 'PROVIDER_UNAVAILABLE': {
      const availableAt = getDate(context, 'availableAt');
      error = {
        type: 'PROVIDER_UNAVAILABLE',
        message,
        correlationId,
        provider,
        reason: getString(context, 'reason', 'Unknown'),
        ...(availableAt && { availableAt }),
      };
      break;
    }

    case 'ALL_PROVIDERS_FAILED': {
      const failedProviders = Array.isArray(context?.failedProviders)
        ? (context.failedProviders as readonly GeocodingProviderName[])
        : (['photon'] as const);
      const errors = Array.isArray(context?.errors)
        ? (context.errors as readonly GeocodingError[])
        : ([] as const);
      error = {
        type: 'ALL_PROVIDERS_FAILED',
        message,
        correlationId,
        failedProviders,
        errors,
      };
      break;
    }

    case 'CORS_ERROR':
      error = {
        type: 'CORS_ERROR',
        message,
        correlationId,
        provider,
        requestUrl: getString(context, 'requestUrl', 'unknown'),
      };
      break;

    case 'INVALID_INPUT': {
      const value = getString(context, 'value', '');
      error = {
        type: 'INVALID_INPUT',
        message,
        correlationId,
        field: getString(context, 'field', 'query'),
        constraint: getString(context, 'constraint', 'unknown'),
        ...(value && { value }),
      };
      break;
    }
  }

  // Log error with appropriate level
  logGeocodingError(error);

  return error;
}

/**
 * Determine if an error should trigger fallback to another provider
 *
 * @param error - The geocoding error to check
 * @returns True if fallback should be attempted
 *
 * @example
 * ```typescript
 * if (shouldTriggerFallback(error)) {
 *   return tryNextProvider(query, options);
 * }
 * ```
 */
export function shouldTriggerFallback(error: GeocodingError): boolean {
  switch (error.type) {
    // These errors indicate provider-specific issues - try fallback
    case 'NETWORK_ERROR':
    case 'TIMEOUT':
    case 'RATE_LIMITED':
    case 'INVALID_RESPONSE':
    case 'PROVIDER_UNAVAILABLE':
    case 'CORS_ERROR':
      return true;

    // Input errors are user's fault - don't fallback
    case 'INVALID_INPUT':
      return false;

    // All providers already failed - no fallback possible
    case 'ALL_PROVIDERS_FAILED':
      return false;

    default: {
      // Exhaustive check
      const _exhaustive: never = error;
      return false;
    }
  }
}

/**
 * Determine if an error is retryable (same provider)
 *
 * @param error - The geocoding error to check
 * @returns True if the request should be retried
 *
 * @example
 * ```typescript
 * if (isRetryableError(error) && attempts < maxRetries) {
 *   await delay(getRetryDelay(error));
 *   return retry(query, options);
 * }
 * ```
 */
export function isRetryableError(error: GeocodingError): boolean {
  switch (error.type) {
    // Network issues are often transient - retry
    case 'NETWORK_ERROR':
    case 'TIMEOUT':
      return true;

    // Rate limited - retry after delay
    case 'RATE_LIMITED':
      return true;

    // Server returned garbage - unlikely to improve, don't retry
    case 'INVALID_RESPONSE':
      return false;

    // Provider down - don't retry same provider
    case 'PROVIDER_UNAVAILABLE':
      return false;

    // Already tried everything
    case 'ALL_PROVIDERS_FAILED':
      return false;

    // CORS is a config issue - won't fix itself
    case 'CORS_ERROR':
      return false;

    // User error - won't fix itself
    case 'INVALID_INPUT':
      return false;

    default: {
      const _exhaustive: never = error;
      return false;
    }
  }
}

/**
 * Check if error is caused by user input (not provider issue)
 *
 * @param error - The geocoding error to check
 * @returns True if the error is due to invalid user input
 */
export function isUserError(error: GeocodingError): boolean {
  return error.type === 'INVALID_INPUT';
}

/**
 * Check if error is a server/provider error
 *
 * @param error - The geocoding error to check
 * @returns True if the error is a server-side issue
 */
export function isServerError(error: GeocodingError): boolean {
  return [
    'NETWORK_ERROR',
    'TIMEOUT',
    'RATE_LIMITED',
    'INVALID_RESPONSE',
    'PROVIDER_UNAVAILABLE',
    'ALL_PROVIDERS_FAILED',
  ].includes(error.type);
}

/**
 * Get retry delay in milliseconds for retryable errors
 *
 * @param error - The geocoding error
 * @param attemptNumber - Current attempt number (1-based)
 * @returns Delay in milliseconds, or null if error is not retryable
 */
export function getRetryDelay(error: GeocodingError, attemptNumber: number): number | null {
  if (!isRetryableError(error)) {
    return null;
  }

  switch (error.type) {
    case 'RATE_LIMITED':
      // Use the provider's suggested retry time
      return error.retryAfterMs;

    case 'TIMEOUT':
      // Short delay, then retry
      return Math.min(1000 * attemptNumber, 3000);

    case 'NETWORK_ERROR':
      // Exponential backoff: 500ms, 1s, 2s, 4s (max)
      return Math.min(500 * Math.pow(2, attemptNumber - 1), 4000);

    default:
      return null;
  }
}

/**
 * Get user-friendly error message (safe for display)
 *
 * @param error - The geocoding error
 * @returns Sanitized message suitable for UI display
 */
export function getUserFriendlyMessage(error: GeocodingError): string {
  switch (error.type) {
    case 'NETWORK_ERROR':
      return 'Unable to connect to address search service. Please check your internet connection.';

    case 'TIMEOUT':
      return 'Address search took too long. Please try again.';

    case 'RATE_LIMITED':
      return 'Too many search requests. Please wait a moment and try again.';

    case 'INVALID_RESPONSE':
      return 'Address search service returned unexpected data. Please try again.';

    case 'PROVIDER_UNAVAILABLE':
      return 'Address search service is temporarily unavailable. Please try again later.';

    case 'ALL_PROVIDERS_FAILED':
      return 'Address search is currently unavailable. Please try again later or enter the address manually.';

    case 'CORS_ERROR':
      return 'Address search is blocked by browser security. Please contact support.';

    case 'INVALID_INPUT':
      return `Invalid search input: ${error.constraint}`;

    default: {
      const _exhaustive: never = error;
      return 'An unexpected error occurred. Please try again.';
    }
  }
}

/**
 * Log geocoding error with appropriate log level
 */
function logGeocodingError(error: GeocodingError): void {
  const baseContext = {
    errorType: error.type,
    correlationId: error.correlationId,
  };

  if (isUserError(error)) {
    // User errors are debug level (expected behavior)
    logger.debug('Geocoding user error', {
      ...baseContext,
      message: error.message,
    });
    return;
  }

  if (error.type === 'ALL_PROVIDERS_FAILED') {
    // All providers failing is critical
    logger.error('All geocoding providers failed', {
      ...baseContext,
      failedProviders: error.failedProviders,
      message: error.message,
    });
    return;
  }

  if (error.type === 'RATE_LIMITED') {
    // Rate limiting is a warning (expected under load)
    logger.warn('Geocoding rate limited', {
      ...baseContext,
      provider: error.provider,
      retryAfterMs: error.retryAfterMs,
    });
    return;
  }

  // All other errors are warnings (recoverable via fallback)
  logger.warn('Geocoding error', {
    ...baseContext,
    provider: 'provider' in error ? error.provider : 'unknown',
    message: error.message,
  });
}

/**
 * Convert native Error/exception to GeocodingError
 *
 * @param error - The caught error/exception
 * @param provider - The provider that threw the error
 * @param correlationId - Correlation ID for tracking
 * @returns Typed GeocodingError
 */
export function exceptionToGeocodingError(
  error: unknown,
  provider: GeocodingProviderName,
  correlationId?: string
): GeocodingError {
  const corrId = correlationId ?? generateCorrelationId();

  // Handle AbortError (timeout or cancellation)
  if (error instanceof Error && error.name === 'AbortError') {
    return createGeocodingError('TIMEOUT', 'Request was aborted or timed out', {
      provider,
      correlationId: corrId,
      timeoutMs: 5000,
    });
  }

  // Handle TypeError (usually network issues in fetch)
  if (error instanceof TypeError) {
    const message = error.message.toLowerCase();

    // Check for CORS errors
    if (message.includes('cors') || message.includes('cross-origin')) {
      return createGeocodingError('CORS_ERROR', 'Cross-origin request blocked', {
        provider,
        correlationId: corrId,
        requestUrl: 'unknown',
      });
    }

    return createGeocodingError('NETWORK_ERROR', 'Network request failed', {
      provider,
      correlationId: corrId,
      originalError: error.message,
    });
  }

  // Handle generic Error
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Check for rate limiting
    if (message.includes('rate limit') || message.includes('too many')) {
      return createGeocodingError('RATE_LIMITED', error.message, {
        provider,
        correlationId: corrId,
        retryAfterMs: 60000,
      });
    }

    // Check for timeout
    if (message.includes('timeout') || message.includes('timed out')) {
      return createGeocodingError('TIMEOUT', error.message, {
        provider,
        correlationId: corrId,
        timeoutMs: 5000,
      });
    }

    // Default to network error for unknown errors
    return createGeocodingError('NETWORK_ERROR', error.message, {
      provider,
      correlationId: corrId,
      originalError: error.message,
    });
  }

  // Handle non-Error throws
  return createGeocodingError('NETWORK_ERROR', 'Unknown error occurred', {
    provider,
    correlationId: corrId,
    originalError: String(error),
  });
}
