/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Auth Error Types
 * Discriminated union for type-safe error handling with Result pattern
 */

import { logger } from '@/lib/logger';
import { randomUUID } from 'crypto';

/**
 * Discriminated union of all possible auth errors
 * Each error type has a unique 'type' field for exhaustive matching
 */
export type AuthError =
  | { type: 'UNAUTHORIZED'; message: string; correlationId: string }
  | { type: 'FORBIDDEN'; message: string; correlationId: string; required?: string; actual?: string }
  | { type: 'NOT_FOUND'; message: string; correlationId: string; resource: string }
  | { type: 'INVALID_INPUT'; message: string; correlationId: string; field: string }
  | { type: 'INVALID_ROLE'; message: string; correlationId: string; required: string; actual: string }
  | { type: 'ACCOUNT_INACTIVE'; message: string; correlationId: string; userId: string }
  | { type: 'ACCOUNT_SUSPENDED'; message: string; correlationId: string; userId: string }
  | { type: 'RATE_LIMITED'; message: string; correlationId: string; retryAfter: number }
  | { type: 'INVALID_TOKEN'; message: string; correlationId: string }
  | { type: 'TOKEN_EXPIRED'; message: string; correlationId: string }
  | { type: 'TOKEN_REVOKED'; message: string; correlationId: string }
  | { type: 'INTERNAL_ERROR'; message: string; correlationId: string; originalError?: string }
  | { type: 'DATABASE_ERROR'; message: string; correlationId: string; originalError?: string }
  | { type: 'CACHE_ERROR'; message: string; correlationId: string; originalError?: string }
  | { type: 'INVALID_SESSION'; message: string; correlationId: string };

/**
 * Create auth error with proper logging and correlation ID
 */
export function createAuthError(
  type: AuthError['type'],
  message: string,
  context?: Record<string, any>
): AuthError {
  const correlationId = randomUUID();

  // Base error with required fields
  const baseError = { type, message, correlationId } as any;

  // Add context-specific properties based on error type
  switch (type) {
    case 'NOT_FOUND':
      baseError.resource = context?.resource || 'unknown';
      break;
    case 'INVALID_ROLE':
      baseError.required = context?.required || 'unknown';
      baseError.actual = context?.actual || 'unknown';
      break;
    case 'FORBIDDEN':
      if (context?.required) baseError.required = context.required;
      if (context?.actual) baseError.actual = context.actual;
      break;
    case 'RATE_LIMITED':
      baseError.retryAfter = context?.retryAfter || 60;
      break;
    case 'INVALID_INPUT':
      baseError.field = context?.field || 'unknown';
      break;
    case 'ACCOUNT_INACTIVE':
    case 'ACCOUNT_SUSPENDED':
      baseError.userId = context?.userId || 'unknown';
      break;
    case 'INTERNAL_ERROR':
    case 'DATABASE_ERROR':
    case 'CACHE_ERROR':
      if (context?.originalError) {
        baseError.originalError =
          context.originalError instanceof Error
            ? context.originalError.message
            : String(context.originalError);
      }
      break;
  }

  // Log error for monitoring (only server errors, not user errors)
  if (type === 'INTERNAL_ERROR' || type === 'DATABASE_ERROR' || type === 'CACHE_ERROR') {
    logger.error('Auth error occurred', {
      errorType: type,
      message,
      correlationId,
      ...context,
    });
  } else {
    logger.debug('Auth error occurred', {
      errorType: type,
      message,
      correlationId,
      ...context,
    });
  }

  return baseError as AuthError;
}

/**
 * Convert exception to AuthError
 * Useful for try/catch blocks where we need to convert to Result pattern
 */
export function exceptionToAuthError(error: unknown, context?: Record<string, any>): AuthError {
  const correlationId = randomUUID();

  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Try to infer error type from message
    if (message.includes('not found') || message.includes('notfound')) {
      return createAuthError('NOT_FOUND', error.message, {
        resource: context?.resource || 'user',
        originalError: error,
        ...context
      });
    }

    if (message.includes('invalid') || message.includes('validation')) {
      return createAuthError('INVALID_INPUT', error.message, {
        field: context?.field || 'unknown',
        originalError: error,
        ...context
      });
    }

    if (message.includes('unauthorized') || message.includes('authentication')) {
      return createAuthError('UNAUTHORIZED', error.message, {
        originalError: error,
        ...context
      });
    }

    if (message.includes('forbidden') || message.includes('permission')) {
      return createAuthError('FORBIDDEN', error.message, {
        originalError: error,
        ...context
      });
    }

    if (message.includes('database') || message.includes('prisma')) {
      return createAuthError('DATABASE_ERROR', error.message, {
        originalError: error,
        ...context
      });
    }

    if (message.includes('redis') || message.includes('cache')) {
      return createAuthError('CACHE_ERROR', error.message, {
        originalError: error,
        ...context
      });
    }

    // Default to internal error
    return createAuthError('INTERNAL_ERROR', error.message, {
      originalError: error,
      ...context
    });
  }

  return createAuthError(
    'INTERNAL_ERROR',
    'Unknown error occurred',
    { originalError: String(error), ...context }
  );
}

/**
 * Check if error is recoverable (retry-able)
 */
export function isRetryableError(error: AuthError): boolean {
  return ['DATABASE_ERROR', 'CACHE_ERROR', 'RATE_LIMITED'].includes(error.type);
}

/**
 * Check if error is user's fault (don't retry)
 */
export function isUserError(error: AuthError): boolean {
  return [
    'UNAUTHORIZED',
    'FORBIDDEN',
    'INVALID_INPUT',
    'INVALID_ROLE',
    'ACCOUNT_INACTIVE',
    'ACCOUNT_SUSPENDED',
    'INVALID_TOKEN',
    'TOKEN_EXPIRED',
    'TOKEN_REVOKED',
    'INVALID_SESSION',
  ].includes(error.type);
}

/**
 * Check if error is a server error
 */
export function isServerError(error: AuthError): boolean {
  return ['INTERNAL_ERROR', 'DATABASE_ERROR', 'CACHE_ERROR'].includes(error.type);
}

/**
 * Get HTTP status code for error
 */
export function getErrorStatusCode(error: AuthError): number {
  switch (error.type) {
    case 'UNAUTHORIZED':
    case 'INVALID_TOKEN':
    case 'TOKEN_EXPIRED':
    case 'TOKEN_REVOKED':
    case 'INVALID_SESSION':
      return 401;
    case 'FORBIDDEN':
    case 'INVALID_ROLE':
    case 'ACCOUNT_SUSPENDED':
    case 'ACCOUNT_INACTIVE':
      return 403;
    case 'NOT_FOUND':
      return 404;
    case 'INVALID_INPUT':
      return 400;
    case 'RATE_LIMITED':
      return 429;
    case 'DATABASE_ERROR':
    case 'CACHE_ERROR':
    case 'INTERNAL_ERROR':
    default:
      return 500;
  }
}

/**
 * Get user-friendly error message
 * Suitable for displaying to end users
 */
export function getUserFriendlyMessage(error: AuthError): string {
  switch (error.type) {
    case 'UNAUTHORIZED':
      return 'Authentication required. Please sign in.';
    case 'FORBIDDEN':
      return 'You do not have permission to perform this action.';
    case 'NOT_FOUND':
      return `${error.resource} not found.`;
    case 'INVALID_INPUT':
      return `Invalid input for field: ${error.field}`;
    case 'INVALID_ROLE':
      return 'Insufficient permissions. Required role not found.';
    case 'ACCOUNT_INACTIVE':
      return 'Your account is inactive. Please contact support.';
    case 'ACCOUNT_SUSPENDED':
      return 'Your account has been suspended. Please contact support.';
    case 'RATE_LIMITED':
      return `Too many requests. Please try again in ${error.retryAfter} seconds.`;
    case 'INVALID_TOKEN':
      return 'Invalid authentication token. Please sign in again.';
    case 'TOKEN_EXPIRED':
      return 'Your session has expired. Please sign in again.';
    case 'TOKEN_REVOKED':
      return 'Your session has been revoked. Please sign in again.';
    case 'INVALID_SESSION':
      return 'Invalid session. Please sign in again.';
    case 'DATABASE_ERROR':
    case 'CACHE_ERROR':
    case 'INTERNAL_ERROR':
      return 'An error occurred. Please try again later.';
    default:
      return 'An unexpected error occurred.';
  }
}

/**
 * Format error for API response
 */
export function formatErrorResponse(error: AuthError): {
  error: string;
  message: string;
  correlationId: string;
  statusCode: number;
} {
  return {
    error: error.type,
    message: getUserFriendlyMessage(error),
    correlationId: error.correlationId,
    statusCode: getErrorStatusCode(error),
  };
}

/**
 * Log error with context
 * Automatically logs at appropriate level based on error type
 */
export function logAuthError(error: AuthError, additionalContext?: Record<string, any>): void {
  const context = {
    errorType: error.type,
    message: error.message,
    correlationId: error.correlationId,
    ...additionalContext,
  };

  if (isServerError(error)) {
    logger.error('Auth server error', context);
  } else if (isUserError(error)) {
    logger.warn('Auth user error', context);
  } else {
    logger.info('Auth error', context);
  }
}
