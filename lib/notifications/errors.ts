/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Notification Error Types
 * Discriminated union for type-safe error handling with Result pattern
 *
 * @module lib/notifications/errors
 */

import { logger } from '@/lib/logger';
import { randomUUID } from 'crypto';

/**
 * Error code constants for notification errors
 */
export const NOTIFICATION_ERROR_CODES = {
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
} as const;

/**
 * Discriminated union of all possible notification errors
 * Each error type has a unique 'type' field for exhaustive matching
 */
export type NotificationError =
  | {
      type: 'USER_NOT_FOUND';
      message: string;
      correlationId: string;
      userId: string;
    }
  | {
      type: 'RATE_LIMITED';
      message: string;
      correlationId: string;
      userId: string;
      retryAfter: number;
      limit: number;
      notificationType?: string;
    }
  | {
      type: 'INVALID_INPUT';
      message: string;
      correlationId: string;
      field: string;
      validationErrors?: Record<string, string[]>;
    }
  | {
      type: 'QUEUE_ERROR';
      message: string;
      correlationId: string;
      queueName?: string;
      originalError?: string;
    }
  | {
      type: 'DATABASE_ERROR';
      message: string;
      correlationId: string;
      operation: string;
      originalError?: string;
    }
  | {
      type: 'DELIVERY_ERROR';
      message: string;
      correlationId: string;
      channel: string;
      notificationId: string;
      originalError?: string;
      retryable: boolean;
    }
  | {
      type: 'TOKEN_VALIDATION_ERROR';
      message: string;
      correlationId: string;
      token?: string;
      reason: string;
    }
  | {
      type: 'NOTIFICATION_NOT_FOUND';
      message: string;
      correlationId: string;
      notificationId: string;
    }
  | {
      type: 'UNAUTHORIZED';
      message: string;
      correlationId: string;
      userId: string;
      notificationId: string;
      reason: string;
    }
  | {
      type: 'EXPIRED';
      message: string;
      correlationId: string;
      notificationId: string;
      expiresAt: Date;
    }
  | {
      type: 'TEMPLATE_ERROR';
      message: string;
      correlationId: string;
      templateType: string;
      originalError?: string;
    }
  | {
      type: 'PREFERENCE_ERROR';
      message: string;
      correlationId: string;
      userId: string;
      originalError?: string;
    }
  | {
      type: 'INTERNAL_ERROR';
      message: string;
      correlationId: string;
      originalError?: string;
    };

/**
 * Context type for error creation - accepts unknown values that will be validated
 */
type ErrorContext = Record<string, unknown>;

/**
 * Create notification error with proper logging and correlation ID
 */
export function createNotificationError(
  type: NotificationError['type'],
  message: string,
  context?: ErrorContext
): NotificationError {
  const correlationId = typeof context?.correlationId === 'string'
    ? context.correlationId
    : randomUUID();

  // Helper to safely get string from context
  const getString = (key: string, defaultVal: string): string => {
    const val = context?.[key];
    return typeof val === 'string' ? val : defaultVal;
  };

  // Helper to safely get number from context
  const getNumber = (key: string, defaultVal: number): number => {
    const val = context?.[key];
    return typeof val === 'number' ? val : defaultVal;
  };

  // Helper to safely get boolean from context
  const getBoolean = (key: string, defaultVal: boolean): boolean => {
    const val = context?.[key];
    return typeof val === 'boolean' ? val : defaultVal;
  };

  // Helper to safely get Date from context
  const getDate = (key: string, defaultVal: Date): Date => {
    const val = context?.[key];
    return val instanceof Date ? val : defaultVal;
  };

  // Helper to extract error message from unknown
  const getOriginalError = (): string | undefined => {
    const val = context?.originalError;
    if (val instanceof Error) return val.message;
    if (typeof val === 'string') return val;
    return undefined;
  };

  // Helper to get validation errors
  const getValidationErrors = (): Record<string, string[]> | undefined => {
    const val = context?.validationErrors;
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      return val as Record<string, string[]>;
    }
    return undefined;
  };

  // Build type-safe error objects based on error type
  let error: NotificationError;

  switch (type) {
    case 'USER_NOT_FOUND':
      error = {
        type: 'USER_NOT_FOUND',
        message,
        correlationId,
        userId: getString('userId', 'unknown'),
      };
      break;

    case 'RATE_LIMITED': {
      const notificationType = getString('notificationType', '');
      error = {
        type: 'RATE_LIMITED',
        message,
        correlationId,
        userId: getString('userId', 'unknown'),
        retryAfter: getNumber('retryAfter', 60),
        limit: getNumber('limit', 100),
        ...(notificationType && { notificationType }),
      };
      break;
    }

    case 'INVALID_INPUT': {
      const validationErrors = getValidationErrors();
      error = {
        type: 'INVALID_INPUT',
        message,
        correlationId,
        field: getString('field', 'unknown'),
        ...(validationErrors && { validationErrors }),
      };
      break;
    }

    case 'QUEUE_ERROR': {
      const queueName = getString('queueName', '');
      const originalError = getOriginalError();
      error = {
        type: 'QUEUE_ERROR',
        message,
        correlationId,
        ...(queueName && { queueName }),
        ...(originalError && { originalError }),
      };
      break;
    }

    case 'DATABASE_ERROR': {
      const originalError = getOriginalError();
      error = {
        type: 'DATABASE_ERROR',
        message,
        correlationId,
        operation: getString('operation', 'unknown'),
        ...(originalError && { originalError }),
      };
      break;
    }

    case 'DELIVERY_ERROR': {
      const originalError = getOriginalError();
      error = {
        type: 'DELIVERY_ERROR',
        message,
        correlationId,
        channel: getString('channel', 'unknown'),
        notificationId: getString('notificationId', 'unknown'),
        retryable: getBoolean('retryable', true),
        ...(originalError && { originalError }),
      };
      break;
    }

    case 'TOKEN_VALIDATION_ERROR': {
      const token = getString('token', '');
      error = {
        type: 'TOKEN_VALIDATION_ERROR',
        message,
        correlationId,
        reason: getString('reason', 'Invalid token'),
        ...(token && { token }),
      };
      break;
    }

    case 'NOTIFICATION_NOT_FOUND':
      error = {
        type: 'NOTIFICATION_NOT_FOUND',
        message,
        correlationId,
        notificationId: getString('notificationId', 'unknown'),
      };
      break;

    case 'UNAUTHORIZED':
      error = {
        type: 'UNAUTHORIZED',
        message,
        correlationId,
        userId: getString('userId', 'unknown'),
        notificationId: getString('notificationId', 'unknown'),
        reason: getString('reason', 'Access denied'),
      };
      break;

    case 'EXPIRED':
      error = {
        type: 'EXPIRED',
        message,
        correlationId,
        notificationId: getString('notificationId', 'unknown'),
        expiresAt: getDate('expiresAt', new Date()),
      };
      break;

    case 'TEMPLATE_ERROR': {
      const originalError = getOriginalError();
      error = {
        type: 'TEMPLATE_ERROR',
        message,
        correlationId,
        templateType: getString('templateType', 'unknown'),
        ...(originalError && { originalError }),
      };
      break;
    }

    case 'PREFERENCE_ERROR': {
      const originalError = getOriginalError();
      error = {
        type: 'PREFERENCE_ERROR',
        message,
        correlationId,
        userId: getString('userId', 'unknown'),
        ...(originalError && { originalError }),
      };
      break;
    }

    case 'INTERNAL_ERROR': {
      const originalError = getOriginalError();
      error = {
        type: 'INTERNAL_ERROR',
        message,
        correlationId,
        ...(originalError && { originalError }),
      };
      break;
    }
  }

  // Log error for monitoring (server errors at error level, user errors at debug level)
  if (isServerError(error)) {
    logger.error('Notification error occurred', {
      errorType: type,
      message,
      correlationId,
    });
  } else {
    logger.debug('Notification error occurred', {
      errorType: type,
      message,
      correlationId,
    });
  }

  return error;
}

/**
 * Convert exception to NotificationError
 * Useful for try/catch blocks where we need to convert to Result pattern
 */
export function exceptionToNotificationError(
  error: unknown,
  context?: ErrorContext
): NotificationError {
  const correlationId = context?.correlationId || randomUUID();

  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Try to infer error type from message
    if (message.includes('user not found') || message.includes('user does not exist')) {
      return createNotificationError('USER_NOT_FOUND', error.message, {
        userId: context?.userId || 'unknown',
        originalError: error,
        correlationId,
        ...context,
      });
    }

    if (message.includes('notification not found') || message.includes('notification does not exist')) {
      return createNotificationError('NOTIFICATION_NOT_FOUND', error.message, {
        notificationId: context?.notificationId || 'unknown',
        originalError: error,
        correlationId,
        ...context,
      });
    }

    if (message.includes('rate limit') || message.includes('too many')) {
      return createNotificationError('RATE_LIMITED', error.message, {
        userId: context?.userId || 'unknown',
        retryAfter: context?.retryAfter || 60,
        limit: context?.limit || 100,
        originalError: error,
        correlationId,
        ...context,
      });
    }

    if (message.includes('invalid') || message.includes('validation')) {
      return createNotificationError('INVALID_INPUT', error.message, {
        field: context?.field || 'unknown',
        validationErrors: context?.validationErrors,
        originalError: error,
        correlationId,
        ...context,
      });
    }

    if (message.includes('unauthorized') || message.includes('access denied')) {
      return createNotificationError('UNAUTHORIZED', error.message, {
        userId: context?.userId || 'unknown',
        notificationId: context?.notificationId || 'unknown',
        reason: context?.reason || 'Access denied',
        originalError: error,
        correlationId,
        ...context,
      });
    }

    if (message.includes('expired')) {
      return createNotificationError('EXPIRED', error.message, {
        notificationId: context?.notificationId || 'unknown',
        expiresAt: context?.expiresAt || new Date(),
        originalError: error,
        correlationId,
        ...context,
      });
    }

    if (message.includes('queue') || message.includes('qstash')) {
      return createNotificationError('QUEUE_ERROR', error.message, {
        queueName: context?.queueName,
        originalError: error,
        correlationId,
        ...context,
      });
    }

    if (message.includes('database') || message.includes('prisma') || message.includes('sql')) {
      return createNotificationError('DATABASE_ERROR', error.message, {
        operation: context?.operation || 'unknown',
        originalError: error,
        correlationId,
        ...context,
      });
    }

    if (message.includes('delivery') || message.includes('send') || message.includes('channel')) {
      return createNotificationError('DELIVERY_ERROR', error.message, {
        channel: context?.channel || 'unknown',
        notificationId: context?.notificationId || 'unknown',
        retryable: context?.retryable ?? true,
        originalError: error,
        correlationId,
        ...context,
      });
    }

    if (message.includes('token') || message.includes('fcm') || message.includes('device')) {
      return createNotificationError('TOKEN_VALIDATION_ERROR', error.message, {
        token: context?.token,
        reason: context?.reason || 'Invalid token',
        originalError: error,
        correlationId,
        ...context,
      });
    }

    if (message.includes('template')) {
      return createNotificationError('TEMPLATE_ERROR', error.message, {
        templateType: context?.templateType || 'unknown',
        originalError: error,
        correlationId,
        ...context,
      });
    }

    if (message.includes('preference')) {
      return createNotificationError('PREFERENCE_ERROR', error.message, {
        userId: context?.userId || 'unknown',
        originalError: error,
        correlationId,
        ...context,
      });
    }

    // Default to internal error
    return createNotificationError('INTERNAL_ERROR', error.message, {
      originalError: error,
      correlationId,
      ...context,
    });
  }

  return createNotificationError('INTERNAL_ERROR', 'Unknown error occurred', {
    originalError: String(error),
    correlationId,
    ...context,
  });
}

/**
 * Check if error is recoverable (retry-able)
 */
export function isRetryableError(error: NotificationError): boolean {
  switch (error.type) {
    case 'RATE_LIMITED':
    case 'QUEUE_ERROR':
    case 'DATABASE_ERROR':
    case 'INTERNAL_ERROR':
      return true;

    case 'DELIVERY_ERROR':
      return error.retryable;

    default:
      return false;
  }
}

/**
 * Check if error is user's fault (don't retry)
 */
export function isUserError(error: NotificationError): boolean {
  return [
    'USER_NOT_FOUND',
    'INVALID_INPUT',
    'NOTIFICATION_NOT_FOUND',
    'UNAUTHORIZED',
    'EXPIRED',
  ].includes(error.type);
}

/**
 * Check if error is a server error
 */
export function isServerError(error: NotificationError): boolean {
  return [
    'QUEUE_ERROR',
    'DATABASE_ERROR',
    'INTERNAL_ERROR',
    'TEMPLATE_ERROR',
  ].includes(error.type);
}

/**
 * Get HTTP status code for error
 */
export function getErrorStatusCode(error: NotificationError): number {
  switch (error.type) {
    case 'USER_NOT_FOUND':
    case 'NOTIFICATION_NOT_FOUND':
      return 404;

    case 'UNAUTHORIZED':
      return 401;

    case 'RATE_LIMITED':
      return 429;

    case 'INVALID_INPUT':
      return 400;

    case 'EXPIRED':
      return 410; // Gone

    case 'TOKEN_VALIDATION_ERROR':
      return 422; // Unprocessable Entity

    case 'PREFERENCE_ERROR':
      return 400;

    case 'DELIVERY_ERROR':
      return 502; // Bad Gateway

    case 'QUEUE_ERROR':
    case 'DATABASE_ERROR':
    case 'TEMPLATE_ERROR':
    case 'INTERNAL_ERROR':
    default:
      return 500;
  }
}

/**
 * Get user-friendly error message
 * Suitable for displaying to end users (sanitized)
 */
export function getUserFriendlyMessage(error: NotificationError): string {
  switch (error.type) {
    case 'USER_NOT_FOUND':
      return 'User not found. Please check your account.';

    case 'RATE_LIMITED':
      return `Too many notifications sent. Please try again in ${error.retryAfter} seconds.`;

    case 'INVALID_INPUT':
      return `Invalid input for field: ${error.field}. Please check your data.`;

    case 'QUEUE_ERROR':
      return 'Failed to queue notification. Please try again later.';

    case 'DATABASE_ERROR':
      return 'Database error occurred. Please try again later.';

    case 'DELIVERY_ERROR':
      return `Failed to deliver notification via ${error.channel}. ${error.retryable ? 'Will retry automatically.' : ''}`;

    case 'TOKEN_VALIDATION_ERROR':
      return 'Invalid device token. Please re-enable notifications.';

    case 'NOTIFICATION_NOT_FOUND':
      return 'Notification not found.';

    case 'UNAUTHORIZED':
      return `Access denied: ${error.reason}`;

    case 'EXPIRED':
      return 'This notification has expired.';

    case 'TEMPLATE_ERROR':
      return 'Error generating notification content. Please contact support.';

    case 'PREFERENCE_ERROR':
      return 'Error accessing notification preferences. Please try again.';

    case 'INTERNAL_ERROR':
      return 'An unexpected error occurred. Please try again later.';

    default:
      // Exhaustive check - TypeScript will error if we miss a case
      const _exhaustive: never = error;
      return 'An unexpected error occurred.';
  }
}

/**
 * Format error for API response
 * Returns a structured error response suitable for HTTP responses
 */
/**
 * Details type for error responses
 */
type ErrorResponseDetails = {
  retryAfter?: number;
  limit?: number;
  validationErrors?: Record<string, string[]>;
  field?: string;
  channel?: string;
  retryable?: boolean;
  expiresAt?: string;
};

export function formatErrorResponse(error: NotificationError): {
  error: string;
  message: string;
  correlationId: string;
  statusCode: number;
  details?: ErrorResponseDetails;
} {
  const response = {
    error: error.type,
    message: getUserFriendlyMessage(error),
    correlationId: error.correlationId,
    statusCode: getErrorStatusCode(error),
  };

  // Add safe details for specific error types
  const details: ErrorResponseDetails = {};

  switch (error.type) {
    case 'RATE_LIMITED':
      details.retryAfter = error.retryAfter;
      details.limit = error.limit;
      break;

    case 'INVALID_INPUT':
      if (error.validationErrors) {
        details.validationErrors = error.validationErrors;
      }
      details.field = error.field;
      break;

    case 'DELIVERY_ERROR':
      details.channel = error.channel;
      details.retryable = error.retryable;
      break;

    case 'EXPIRED':
      details.expiresAt = error.expiresAt.toISOString();
      break;
  }

  if (Object.keys(details).length > 0) {
    return { ...response, details };
  }

  return response;
}

/**
 * Format error for Next.js API route
 * Helper for use in Next.js API routes
 */
export function toNextResponse(error: NotificationError): {
  status: number;
  body: ReturnType<typeof formatErrorResponse>;
} {
  return {
    status: getErrorStatusCode(error),
    body: formatErrorResponse(error),
  };
}

/**
 * Log error with context
 * Automatically logs at appropriate level based on error type
 */
export function logNotificationError(
  error: NotificationError,
  additionalContext?: Record<string, unknown>
): void {
  const context = {
    errorType: error.type,
    message: error.message,
    correlationId: error.correlationId,
    ...additionalContext,
  };

  if (isServerError(error)) {
    logger.error('Notification server error', context);
  } else if (isUserError(error)) {
    logger.warn('Notification user error', context);
  } else {
    logger.info('Notification error', context);
  }
}

/**
 * Get retry delay based on error type
 * Returns delay in milliseconds for retryable errors
 */
export function getRetryDelay(error: NotificationError, attemptNumber: number): number | null {
  if (!isRetryableError(error)) {
    return null;
  }

  switch (error.type) {
    case 'RATE_LIMITED':
      return error.retryAfter * 1000;

    case 'QUEUE_ERROR':
    case 'DATABASE_ERROR':
    case 'INTERNAL_ERROR':
      // Exponential backoff: 2^attempt seconds (1s, 2s, 4s, 8s, ...)
      return Math.pow(2, attemptNumber) * 1000;

    case 'DELIVERY_ERROR':
      if (!error.retryable) return null;
      // Exponential backoff with jitter
      const baseDelay = Math.pow(2, attemptNumber) * 1000;
      const jitter = Math.random() * 1000;
      return baseDelay + jitter;

    default:
      return null;
  }
}

/**
 * Create error from Zod validation error
 * Helper for converting Zod errors to NotificationError
 */
export function fromZodError(
  zodError: { errors: Array<{ path: string[]; message: string }> },
  correlationId?: string
): NotificationError {
  const validationErrors: Record<string, string[]> = {};

  for (const error of zodError.errors) {
    const field = error.path.join('.');
    if (!validationErrors[field]) {
      validationErrors[field] = [];
    }
    validationErrors[field].push(error.message);
  }

  const firstField = Object.keys(validationErrors)[0] || 'unknown';

  return createNotificationError('INVALID_INPUT', 'Validation failed', {
    field: firstField,
    validationErrors,
    correlationId,
  });
}
