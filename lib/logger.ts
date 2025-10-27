/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Structured Logging System
 * STRATEGY.md Section 8.2 - Phase 2
 */

import * as Sentry from '@sentry/nextjs';
import { randomBytes } from 'crypto';

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LogContext {
  correlationId?: string;
  userId?: string;
  email?: string;
  action?: string;
  resource?: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  [key: string]: unknown;
}

/**
 * Generate a unique correlation ID for request tracing
 */
export function generateCorrelationId(): string {
  return randomBytes(16).toString('hex');
}

/**
 * Structured logger with Sentry integration
 */
class Logger {
  private log(level: LogLevel, message: string, context?: LogContext): void {
    const timestamp = new Date().toISOString();
    const correlationId = context?.correlationId || generateCorrelationId();

    const logEntry = {
      timestamp,
      level,
      message,
      correlationId,
      ...context,
    };

    // Console output (structured JSON for production, pretty for development)
    if (process.env.NODE_ENV === 'production') {
      console.log(JSON.stringify(logEntry));
    } else {
      console.log(`[${level.toUpperCase()}] ${message}`, context);
    }

    // Send errors to Sentry/GlitchTip
    if (level === 'error') {
      Sentry.captureException(new Error(message), {
        level: 'error',
        contexts: {
          custom: context || {},
        },
        tags: {
          correlationId,
          action: context?.action,
          resource: context?.resource,
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
}

export const logger = new Logger();

/**
 * Create a logger with default context (useful for specific routes/actions)
 */
export function createLogger(defaultContext: LogContext): Logger {
  return {
    info: (message: string, context?: LogContext) =>
      logger.info(message, { ...defaultContext, ...context }),
    warn: (message: string, context?: LogContext) =>
      logger.warn(message, { ...defaultContext, ...context }),
    error: (message: string, context?: LogContext) =>
      logger.error(message, { ...defaultContext, ...context }),
    debug: (message: string, context?: LogContext) =>
      logger.debug(message, { ...defaultContext, ...context }),
  } as Logger;
}

/**
 * Extract correlation ID from request headers or generate new one
 */
export function getCorrelationId(request: Request): string {
  const header = request.headers.get('x-correlation-id');
  return header || generateCorrelationId();
}

/**
 * Get client IP address from request headers
 */
export function getClientIP(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

/**
 * Get user agent from request headers
 */
export function getUserAgent(request: Request): string {
  return request.headers.get('user-agent') || 'unknown';
}
