/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Structured Logging System - Universal Logger
 * Phase 2: Code Quality - Browser-Safe Logging
 *
 * This file re-exports from the client-safe logger implementation.
 * The client logger works in both browser and server environments.
 * For server-only advanced features (file rotation, etc.), import logger-winston.ts directly.
 */

export {
  logger,
  createLogger,
  generateCorrelationId,
  getCorrelationId,
  anonymizeIP,
  getClientIP,
  getUserAgent,
  logRequest,
  logResponse,
  type LogLevel,
  type LogContext,
} from './logger-client';
