/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Client-Side Structured Logging
 * Phase 2: Code Quality - Browser-Safe Logging
 *
 * This logger is used in browser/Edge runtime where Winston is not available.
 */

import * as Sentry from '@sentry/nextjs';
import { randomBytes } from 'crypto';

export type LogLevel = 'error' | 'warn' | 'info' | 'http' | 'verbose' | 'debug' | 'silly';

export interface LogContext {
  correlationId?: string;
  userId?: string;
  email?: string;
  action?: string;
  resource?: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  duration?: number;
  statusCode?: number;
  error?: Error | string;
  [key: string]: unknown;
}

/**
 * Generate a unique correlation ID for request tracing
 */
export function generateCorrelationId(): string {
  return randomBytes(16).toString('hex');
}

/**
 * Simple Client-Side Logger
 */
class SimpleLogger {
  private log(level: LogLevel, message: string, context?: LogContext): void {
    const correlationId = context?.correlationId || generateCorrelationId();

    // Anonymize IP if present
    const sanitizedContext = context ? { ...context } : {};
    if (sanitizedContext.ipAddress) {
      sanitizedContext.ipAddress = anonymizeIPInternal(sanitizedContext.ipAddress);
    }

    // Extract error details
    if (sanitizedContext.error) {
      if (sanitizedContext.error instanceof Error) {
        const error = sanitizedContext.error;
        sanitizedContext.errorMessage = error.message;
        sanitizedContext.errorStack = error.stack;
        delete sanitizedContext.error;
      } else if (typeof sanitizedContext.error === 'string') {
        sanitizedContext.errorMessage = sanitizedContext.error;
        delete sanitizedContext.error;
      }
    }

    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      correlationId,
      ...sanitizedContext,
    };

    // Console output (structured JSON for production, pretty for development)
    if (process.env.NODE_ENV === 'production') {
      console.log(JSON.stringify(logEntry));
    } else {
      console.log(`[${level.toUpperCase()}] ${message}`, sanitizedContext);
    }

    // Send errors to Sentry
    if (level === 'error') {
      Sentry.captureException(new Error(message), {
        level: 'error',
        contexts: {
          custom: sanitizedContext,
        },
        tags: {
          correlationId,
          action: sanitizedContext.action as string | undefined,
          resource: sanitizedContext.resource as string | undefined,
        },
      });
    }
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  error(message: string, context?: LogContext): void {
    this.log('error', message, context);
  }

  debug(message: string, context?: LogContext): void {
    if (process.env.NODE_ENV !== 'production') {
      this.log('debug', message, context);
    }
  }

  http(message: string, context?: LogContext): void {
    this.log('http', message, context);
  }

  getWinston() {
    // Not available in client
    return null;
  }
}

/**
 * Anonymize IP address for GDPR compliance
 */
function anonymizeIPInternal(ip: string): string {
  if (!ip || ip === 'unknown') {
    return 'unknown';
  }

  try {
    if (ip.includes('.') && !ip.includes(':')) {
      const parts = ip.split('.');
      if (parts.length === 4) {
        return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
      }
    }

    if (ip.includes(':')) {
      const parts = ip.split(':');
      if (parts.length >= 3) {
        return `${parts[0]}:${parts[1]}:${parts[2]}::`;
      }
    }

    return 'anonymized';
  } catch {
    return 'anonymized';
  }
}

/**
 * Singleton logger instance
 */
export const logger = new SimpleLogger();

/**
 * Create a logger with default context
 */
export function createLogger(defaultContext: LogContext): SimpleLogger {
  return {
    info: (message: string, context?: LogContext) =>
      logger.info(message, { ...defaultContext, ...context }),
    warn: (message: string, context?: LogContext) =>
      logger.warn(message, { ...defaultContext, ...context }),
    error: (message: string, context?: LogContext) =>
      logger.error(message, { ...defaultContext, ...context }),
    debug: (message: string, context?: LogContext) =>
      logger.debug(message, { ...defaultContext, ...context }),
    http: (message: string, context?: LogContext) =>
      logger.http(message, { ...defaultContext, ...context }),
    getWinston: () => null,
  } as SimpleLogger;
}

/**
 * Anonymize IP address for GDPR compliance (exported version)
 */
export function anonymizeIP(ip: string): string {
  if (!ip || ip === 'unknown') {
    return 'unknown';
  }

  try {
    // IPv4 address
    if (ip.includes('.') && !ip.includes(':')) {
      const parts = ip.split('.');
      if (parts.length === 4) {
        return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
      }
    }

    // IPv6 address
    if (ip.includes(':')) {
      const parts = ip.split(':');
      if (parts.length >= 3) {
        return `${parts[0]}:${parts[1]}:${parts[2]}::`;
      }
    }

    return 'anonymized';
  } catch {
    return 'anonymized';
  }
}

export function getCorrelationId(request: Request): string {
  const header = request.headers.get('x-correlation-id');
  return header || generateCorrelationId();
}

export function getClientIP(request: Request): string {
  const rawIP =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  return anonymizeIP(rawIP);
}

export function getUserAgent(request: Request): string {
  return request.headers.get('user-agent') || 'unknown';
}

export function logRequest(
  request: Request,
  context?: Omit<LogContext, 'correlationId' | 'ipAddress' | 'userAgent'>
): string {
  const correlationId = getCorrelationId(request);
  const ipAddress = getClientIP(request);
  const userAgent = getUserAgent(request);

  logger.http(`${request.method} ${request.url}`, {
    correlationId,
    ipAddress,
    userAgent,
    ...context,
  });

  return correlationId;
}

export function logResponse(
  request: Request,
  statusCode: number,
  duration: number,
  correlationId: string,
  context?: Omit<LogContext, 'correlationId' | 'statusCode' | 'duration'>
): void {
  const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';

  logger[level](`${request.method} ${request.url} ${statusCode} ${duration}ms`, {
    correlationId,
    statusCode,
    duration,
    ...context,
  });
}
