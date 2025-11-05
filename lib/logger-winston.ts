/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Winston-Based Structured Logging System
 * Phase 2: Code Quality - Structured Logging
 *
 * FEATURES:
 * - Multiple transports (console, file, daily rotation)
 * - Correlation ID support for request tracing
 * - Sentry integration for errors
 * - GDPR-compliant IP anonymization
 * - Environment-specific log levels
 * - JSON formatting for production
 * - Pretty printing for development
 */

import winston from 'winston';
import * as Sentry from '@sentry/nextjs';
import { randomBytes } from 'crypto';

// Dynamically import file transport only on server (not in Edge runtime or browser)
let DailyRotateFile: typeof import('winston-daily-rotate-file') | null = null;
if (typeof window === 'undefined' && typeof EdgeRuntime === 'undefined') {
  try {
    DailyRotateFile = require('winston-daily-rotate-file');
  } catch {
    // File transport not available (Edge runtime or browser)
    DailyRotateFile = null;
  }
}

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
 * Anonymize IP address for GDPR compliance (Art. 25 - Privacy by Design)
 * IPv4: 192.168.1.123 → 192.168.1.0
 * IPv6: 2001:db8::1234:5678 → 2001:db8::
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

/**
 * Custom format for development (colorized, pretty-printed)
 */
const developmentFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, correlationId, ...meta }) => {
    const metaStr = Object.keys(meta).length > 0 ? JSON.stringify(meta, null, 2) : '';
    const corrId = correlationId ? `[${correlationId.substring(0, 8)}]` : '';
    return `${timestamp} ${level} ${corrId} ${message} ${metaStr}`;
  })
);

/**
 * Custom format for production (JSON, structured)
 */
const productionFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

/**
 * Create Winston logger instance
 */
function createWinstonLogger(): winston.Logger {
  const isProduction = process.env.NODE_ENV === 'production';
  const logLevel = process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug');

  const transports: winston.transport[] = [
    // Console transport (always enabled)
    new winston.transports.Console({
      format: isProduction ? productionFormat : developmentFormat,
    }),
  ];

  // File transports (only in production or if LOG_TO_FILE=true)
  // Only add if DailyRotateFile is available (not in Edge runtime/browser)
  if (DailyRotateFile && (isProduction || process.env.LOG_TO_FILE === 'true')) {
    // Error logs (separate file for errors only)
    transports.push(
      new DailyRotateFile({
        filename: 'logs/error-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        level: 'error',
        maxSize: '20m',
        maxFiles: '14d',
        format: productionFormat,
      })
    );

    // Combined logs (all levels)
    transports.push(
      new DailyRotateFile({
        filename: 'logs/combined-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '14d',
        format: productionFormat,
      })
    );
  }

  return winston.createLogger({
    level: logLevel,
    format: productionFormat,
    transports,
    // Don't exit on error
    exitOnError: false,
  });
}

/**
 * Singleton Winston logger instance
 */
const winstonLogger = createWinstonLogger();

/**
 * Structured Logger Class
 */
class Logger {
  private winston: winston.Logger;

  constructor(winstonInstance: winston.Logger) {
    this.winston = winstonInstance;
  }

  /**
   * Log a message with context
   */
  private log(level: LogLevel, message: string, context?: LogContext): void {
    const correlationId = context?.correlationId || generateCorrelationId();

    // Anonymize IP if present
    const sanitizedContext = context ? { ...context } : {};
    if (sanitizedContext.ipAddress) {
      sanitizedContext.ipAddress = anonymizeIP(sanitizedContext.ipAddress);
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

    // Log with Winston
    this.winston.log(level, message, {
      correlationId,
      ...sanitizedContext,
    });

    // Send errors to Sentry/GlitchTip
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

  /**
   * Log info message
   */
  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  /**
   * Log error message
   */
  error(message: string, context?: LogContext): void {
    this.log('error', message, context);
  }

  /**
   * Log debug message (only in development)
   */
  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  /**
   * Log HTTP request
   */
  http(message: string, context?: LogContext): void {
    this.log('http', message, context);
  }

  /**
   * Get the underlying Winston logger (for advanced usage)
   */
  getWinston(): winston.Logger {
    return this.winston;
  }
}

/**
 * Singleton logger instance
 */
export const logger = new Logger(winstonLogger);

/**
 * Create a logger with default context (useful for specific routes/actions)
 */
export function createLogger(defaultContext: LogContext): Logger {
  const childLogger = winstonLogger.child(defaultContext);
  return new Logger(childLogger);
}

/**
 * Extract correlation ID from request headers or generate new one
 */
export function getCorrelationId(request: Request): string {
  const header = request.headers.get('x-correlation-id');
  return header || generateCorrelationId();
}

/**
 * Get client IP address from request headers (anonymized for GDPR compliance)
 * GDPR Art. 25 - Privacy by Design
 */
export function getClientIP(request: Request): string {
  const rawIP =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  return anonymizeIP(rawIP);
}

/**
 * Get user agent from request headers
 */
export function getUserAgent(request: Request): string {
  return request.headers.get('user-agent') || 'unknown';
}

/**
 * Middleware helper: Log HTTP request
 */
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

/**
 * Middleware helper: Log HTTP response
 */
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
