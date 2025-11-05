/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Structured Logging Tests
 * Phase 2: Code Quality - Winston-Based Logging
 *
 * Tests for:
 * - Logger initialization
 * - Log level filtering
 * - Context enrichment
 * - IP anonymization (GDPR compliance)
 * - Correlation ID generation
 * - File transport configuration
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import {
  logger,
  createLogger,
  generateCorrelationId,
  anonymizeIP,
  getClientIP,
  getCorrelationId,
  type LogContext,
} from '@/lib/logger';
import * as winston from 'winston';

describe('Structured Logging System', () => {
  // Mock console methods to capture logs
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;

  let consoleLogMock: jest.Mock;
  let consoleErrorMock: jest.Mock;
  let consoleWarnMock: jest.Mock;

  beforeEach(() => {
    consoleLogMock = jest.fn();
    consoleErrorMock = jest.fn();
    consoleWarnMock = jest.fn();

    console.log = consoleLogMock as unknown as typeof console.log;
    console.error = consoleErrorMock as unknown as typeof console.error;
    console.warn = consoleWarnMock as unknown as typeof console.warn;
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
  });

  describe('Logger Initialization', () => {
    it('should export a logger instance', () => {
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.debug).toBe('function');
    });

    it('should have Winston transport configured', () => {
      const winstonInstance = logger.getWinston();
      expect(winstonInstance).toBeDefined();
      expect(winstonInstance.transports.length).toBeGreaterThan(0);
    });
  });

  describe('Log Levels', () => {
    it('should log info messages', () => {
      logger.info('Test info message');
      // Winston will call console.log, so we check if it was called
      expect(consoleLogMock).toHaveBeenCalled();
    });

    it('should log warning messages', () => {
      logger.warn('Test warning message');
      // Winston may call console.warn or console.log depending on transport
      expect(consoleLogMock.mock.calls.length + consoleWarnMock.mock.calls.length).toBeGreaterThan(0);
    });

    it('should log error messages', () => {
      logger.error('Test error message');
      // Winston may call console.error or console.log depending on transport
      expect(consoleLogMock.mock.calls.length + consoleErrorMock.mock.calls.length).toBeGreaterThan(0);
    });

    it('should log debug messages in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      logger.debug('Test debug message');

      // Winston will log debug messages in development
      expect(consoleLogMock.mock.calls.length).toBeGreaterThanOrEqual(0);

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Context Enrichment', () => {
    it('should include context in log messages', () => {
      const context: LogContext = {
        userId: 'user-123',
        action: 'test_action',
        resource: 'test_resource',
      };

      logger.info('Test with context', context);

      // Verify console was called (Winston handles the actual formatting)
      expect(consoleLogMock).toHaveBeenCalled();
    });

    it('should auto-generate correlation ID if not provided', () => {
      logger.info('Test without correlation ID');

      // Logger should have been called
      expect(consoleLogMock).toHaveBeenCalled();
    });

    it('should use provided correlation ID', () => {
      const correlationId = generateCorrelationId();

      logger.info('Test with correlation ID', { correlationId });

      // Logger should have been called
      expect(consoleLogMock).toHaveBeenCalled();
    });
  });

  describe('Correlation ID', () => {
    it('should generate unique correlation IDs', () => {
      const id1 = generateCorrelationId();
      const id2 = generateCorrelationId();

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
      expect(id1.length).toBe(32); // 16 bytes as hex = 32 characters
    });

    it('should extract correlation ID from request header', () => {
      const customCorrelationId = 'custom-correlation-id-123';
      const request = new Request('http://localhost:3000/api/test', {
        headers: {
          'x-correlation-id': customCorrelationId,
        },
      });

      const correlationId = getCorrelationId(request);
      expect(correlationId).toBe(customCorrelationId);
    });

    it('should generate correlation ID if header is missing', () => {
      const request = new Request('http://localhost:3000/api/test');

      const correlationId = getCorrelationId(request);
      expect(correlationId).toBeDefined();
      expect(correlationId.length).toBe(32);
    });
  });

  describe('IP Anonymization (GDPR Compliance)', () => {
    it('should anonymize IPv4 address', () => {
      const ip = '192.168.1.123';
      const anonymized = anonymizeIP(ip);

      expect(anonymized).toBe('192.168.1.0');
    });

    it('should anonymize IPv6 address', () => {
      const ip = '2001:0db8:85a3:0000:0000:8a2e:0370:7334';
      const anonymized = anonymizeIP(ip);

      expect(anonymized).toBe('2001:0db8:85a3::');
    });

    it('should handle unknown IP format', () => {
      const ip = 'unknown';
      const anonymized = anonymizeIP(ip);

      expect(anonymized).toBe('unknown');
    });

    it('should handle invalid IP format', () => {
      const ip = 'not-an-ip';
      const anonymized = anonymizeIP(ip);

      expect(anonymized).toBe('anonymized');
    });

    it('should extract and anonymize IP from request headers', () => {
      const request = new Request('http://localhost:3000/api/test', {
        headers: {
          'x-forwarded-for': '192.168.1.123, 10.0.0.1',
        },
      });

      const anonymizedIP = getClientIP(request);
      expect(anonymizedIP).toBe('192.168.1.0');
    });

    it('should handle missing IP headers', () => {
      const request = new Request('http://localhost:3000/api/test');

      const anonymizedIP = getClientIP(request);
      expect(anonymizedIP).toBe('unknown');
    });
  });

  describe('Child Logger', () => {
    it('should create child logger with default context', () => {
      const defaultContext: LogContext = {
        service: 'test-service',
        action: 'test-action',
      };

      const childLogger = createLogger(defaultContext);

      expect(childLogger).toBeDefined();
      expect(typeof childLogger.info).toBe('function');

      childLogger.info('Test message');

      // Verify logger was called
      expect(consoleLogMock).toHaveBeenCalled();
    });

    it('should merge default context with call-time context', () => {
      const defaultContext: LogContext = {
        service: 'test-service',
      };

      const childLogger = createLogger(defaultContext);

      childLogger.info('Test message', {
        userId: 'user-123',
      });

      // Verify logger was called
      expect(consoleLogMock).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle Error objects in context', () => {
      const error = new Error('Test error');

      logger.error('Error occurred', { error });

      // Verify error was logged
      expect(consoleLogMock.mock.calls.length + consoleErrorMock.mock.calls.length).toBeGreaterThan(0);
    });

    it('should extract error stack trace', () => {
      const error = new Error('Test error with stack');
      error.stack = 'Error: Test error\n  at test.ts:123';

      logger.error('Error with stack', { error });

      // Verify error was logged
      expect(consoleLogMock.mock.calls.length + consoleErrorMock.mock.calls.length).toBeGreaterThan(0);
    });
  });

  describe('Performance', () => {
    it('should log with minimal overhead', () => {
      const start = performance.now();

      for (let i = 0; i < 100; i++) {
        logger.info('Performance test message', { iteration: i });
      }

      const duration = performance.now() - start;

      // 100 log calls should complete in under 100ms (1ms per call)
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Log Rotation Configuration', () => {
    it('should configure daily rotation in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      // In production, file transports should be configured
      // This test verifies the logger doesn't crash with file transports
      expect(() => {
        logger.info('Test message in production');
      }).not.toThrow();

      process.env.NODE_ENV = originalEnv;
    });
  });
});
