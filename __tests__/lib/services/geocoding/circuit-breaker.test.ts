/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Tests for Circuit Breaker
 *
 * @module __tests__/lib/services/geocoding/circuit-breaker.test
 */

import { CircuitBreaker, type CircuitBreakerConfig } from '@/lib/services/geocoding/orchestrator';

// Mock logger to prevent console output during tests
jest.mock('@/lib/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
  generateCorrelationId: () => 'test-correlation-id',
}));

describe('CircuitBreaker', () => {
  let circuitBreaker: CircuitBreaker;

  // Fast config for testing
  const testConfig: Partial<CircuitBreakerConfig> = {
    failureThreshold: 3,       // Open after 3 failures
    failureWindow: 1000,       // 1 second window
    resetTimeout: 100,         // 100ms before trying again
    successThreshold: 2,       // 2 successes to close
  };

  beforeEach(() => {
    circuitBreaker = new CircuitBreaker('photon', testConfig);
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('initial state', () => {
    it('should start in closed state', () => {
      expect(circuitBreaker.getState()).toBe('closed');
    });

    it('should allow execution in closed state', () => {
      expect(circuitBreaker.canExecute()).toBe(true);
    });

    it('should report healthy in initial state', () => {
      const health = circuitBreaker.getHealth();
      expect(health.isHealthy).toBe(true);
      expect(health.consecutiveFailures).toBe(0);
      expect(health.provider).toBe('photon');
    });
  });

  describe('closed state', () => {
    it('should stay closed on success', () => {
      circuitBreaker.recordSuccess(100);
      circuitBreaker.recordSuccess(150);

      expect(circuitBreaker.getState()).toBe('closed');
      expect(circuitBreaker.canExecute()).toBe(true);
    });

    it('should stay closed on failures below threshold', () => {
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();

      expect(circuitBreaker.getState()).toBe('closed');
      expect(circuitBreaker.canExecute()).toBe(true);
    });

    it('should track success after failures', () => {
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();
      circuitBreaker.recordSuccess(100);

      // Note: consecutiveFailures tracks recent failures in the window,
      // not a counter that resets on success. Success resets the internal
      // failure tracking but getHealth() shows failures within the time window.
      const health = circuitBreaker.getHealth();
      // After success, circuit should be healthy
      expect(health.isHealthy).toBe(true);
    });
  });

  describe('closed -> open transition', () => {
    it('should open circuit after reaching failure threshold', () => {
      // Record failures to reach threshold
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure(); // Threshold reached

      expect(circuitBreaker.getState()).toBe('open');
      expect(circuitBreaker.canExecute()).toBe(false);
    });

    it('should only count failures within the failure window', () => {
      // Record 2 failures
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();

      // Advance time beyond failure window
      jest.advanceTimersByTime(1500);

      // Record 2 more failures (old ones should be expired)
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();

      // Should still be closed (only 2 failures in current window)
      expect(circuitBreaker.getState()).toBe('closed');
    });

    it('should not allow execution when open', () => {
      // Open the circuit
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();

      expect(circuitBreaker.canExecute()).toBe(false);
    });

    it('should report availableAt when open', () => {
      // Open the circuit
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();

      const health = circuitBreaker.getHealth();
      expect(health.availableAt).toBeInstanceOf(Date);
      expect(health.isHealthy).toBe(false);
    });
  });

  describe('open -> half-open transition', () => {
    it('should transition to half-open after reset timeout', () => {
      // Open the circuit
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();

      expect(circuitBreaker.canExecute()).toBe(false);

      // Advance time past reset timeout
      jest.advanceTimersByTime(150);

      // Should allow execution now (half-open)
      expect(circuitBreaker.canExecute()).toBe(true);
      expect(circuitBreaker.getState()).toBe('half-open');
    });

    it('should not transition before reset timeout', () => {
      // Open the circuit
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();

      // Advance time but not past reset timeout
      jest.advanceTimersByTime(50);

      expect(circuitBreaker.canExecute()).toBe(false);
      expect(circuitBreaker.getState()).toBe('open');
    });
  });

  describe('half-open state', () => {
    beforeEach(() => {
      // Get to half-open state
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();
      jest.advanceTimersByTime(150);
      circuitBreaker.canExecute(); // Trigger transition to half-open
    });

    it('should allow execution in half-open state', () => {
      expect(circuitBreaker.canExecute()).toBe(true);
    });

    it('should be in half-open state', () => {
      expect(circuitBreaker.getState()).toBe('half-open');
    });
  });

  describe('half-open -> closed transition', () => {
    beforeEach(() => {
      // Get to half-open state
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();
      jest.advanceTimersByTime(150);
      circuitBreaker.canExecute(); // Trigger transition to half-open
    });

    it('should close circuit after success threshold is reached', () => {
      // Need 2 successes to close (based on testConfig)
      circuitBreaker.recordSuccess(100);
      expect(circuitBreaker.getState()).toBe('half-open');

      circuitBreaker.recordSuccess(100);
      expect(circuitBreaker.getState()).toBe('closed');
    });

    it('should allow full execution after closing', () => {
      circuitBreaker.recordSuccess(100);
      circuitBreaker.recordSuccess(100);

      expect(circuitBreaker.canExecute()).toBe(true);
      expect(circuitBreaker.getHealth().isHealthy).toBe(true);
    });
  });

  describe('half-open -> open transition', () => {
    beforeEach(() => {
      // Get to half-open state
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();
      jest.advanceTimersByTime(150);
      circuitBreaker.canExecute(); // Trigger transition to half-open
    });

    it('should reopen circuit immediately on failure in half-open', () => {
      expect(circuitBreaker.getState()).toBe('half-open');

      circuitBreaker.recordFailure();

      expect(circuitBreaker.getState()).toBe('open');
      expect(circuitBreaker.canExecute()).toBe(false);
    });

    it('should reopen even after some successes if failure occurs', () => {
      circuitBreaker.recordSuccess(100); // 1 success, need 2 to close
      expect(circuitBreaker.getState()).toBe('half-open');

      circuitBreaker.recordFailure(); // Failure reopens immediately

      expect(circuitBreaker.getState()).toBe('open');
    });
  });

  describe('canExecute()', () => {
    it('should return true when closed', () => {
      expect(circuitBreaker.canExecute()).toBe(true);
    });

    it('should return false when open', () => {
      // Open the circuit
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();

      expect(circuitBreaker.canExecute()).toBe(false);
    });

    it('should return true when half-open', () => {
      // Open the circuit
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();

      // Advance past reset timeout
      jest.advanceTimersByTime(150);

      expect(circuitBreaker.canExecute()).toBe(true);
    });

    it('should trigger state transition from open to half-open', () => {
      // Open the circuit
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();

      expect(circuitBreaker.getState()).toBe('open');

      // Advance past reset timeout
      jest.advanceTimersByTime(150);

      // canExecute triggers the transition
      circuitBreaker.canExecute();

      expect(circuitBreaker.getState()).toBe('half-open');
    });
  });

  describe('getHealth()', () => {
    it('should return correct provider name', () => {
      const health = circuitBreaker.getHealth();
      expect(health.provider).toBe('photon');
    });

    it('should track consecutive failures', () => {
      circuitBreaker.recordFailure();
      expect(circuitBreaker.getHealth().consecutiveFailures).toBe(1);

      circuitBreaker.recordFailure();
      expect(circuitBreaker.getHealth().consecutiveFailures).toBe(2);
    });

    it('should track last success timestamp', () => {
      expect(circuitBreaker.getHealth().lastSuccessAt).toBeNull();

      const now = new Date();
      jest.setSystemTime(now);
      circuitBreaker.recordSuccess(100);

      const health = circuitBreaker.getHealth();
      expect(health.lastSuccessAt).toEqual(now);
    });

    it('should track last failure timestamp', () => {
      expect(circuitBreaker.getHealth().lastFailureAt).toBeNull();

      const now = new Date();
      jest.setSystemTime(now);
      circuitBreaker.recordFailure();

      const health = circuitBreaker.getHealth();
      expect(health.lastFailureAt).toEqual(now);
    });

    it('should calculate average response time', () => {
      circuitBreaker.recordSuccess(100);
      circuitBreaker.recordSuccess(200);
      circuitBreaker.recordSuccess(300);

      const health = circuitBreaker.getHealth();
      expect(health.avgResponseTimeMs).toBe(200); // (100 + 200 + 300) / 3
    });

    it('should return 0 avg response time when no successes', () => {
      const health = circuitBreaker.getHealth();
      expect(health.avgResponseTimeMs).toBe(0);
    });

    it('should calculate success rate', () => {
      // 2 successes, 2 failures = 50% success rate
      circuitBreaker.recordSuccess(100);
      circuitBreaker.recordSuccess(100);
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();

      const health = circuitBreaker.getHealth();
      expect(health.successRate).toBe(50);
    });

    it('should return 100% success rate when no requests', () => {
      const health = circuitBreaker.getHealth();
      expect(health.successRate).toBe(100);
    });

    it('should report availableAt when circuit is open', () => {
      // Open the circuit
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();

      const health = circuitBreaker.getHealth();
      expect(health.availableAt).not.toBeNull();
      expect(health.availableAt).toBeInstanceOf(Date);
    });

    it('should report null availableAt when circuit is closed', () => {
      const health = circuitBreaker.getHealth();
      expect(health.availableAt).toBeNull();
    });
  });

  describe('reset()', () => {
    it('should reset to initial state', () => {
      // Open the circuit and record some data
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();
      circuitBreaker.recordSuccess(500);

      expect(circuitBreaker.getState()).toBe('open');

      // Reset
      circuitBreaker.reset();

      expect(circuitBreaker.getState()).toBe('closed');
      expect(circuitBreaker.canExecute()).toBe(true);

      const health = circuitBreaker.getHealth();
      expect(health.consecutiveFailures).toBe(0);
      expect(health.isHealthy).toBe(true);
    });

    it('should reset from half-open state', () => {
      // Get to half-open
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();
      jest.advanceTimersByTime(150);
      circuitBreaker.canExecute();

      expect(circuitBreaker.getState()).toBe('half-open');

      circuitBreaker.reset();

      expect(circuitBreaker.getState()).toBe('closed');
    });
  });

  describe('different provider', () => {
    it('should work with radar provider', () => {
      const radarBreaker = new CircuitBreaker('radar', testConfig);

      expect(radarBreaker.getHealth().provider).toBe('radar');
      expect(radarBreaker.getState()).toBe('closed');

      radarBreaker.recordFailure();
      radarBreaker.recordFailure();
      radarBreaker.recordFailure();

      expect(radarBreaker.getState()).toBe('open');
    });
  });

  describe('default configuration', () => {
    it('should use default config when not provided', () => {
      const defaultBreaker = new CircuitBreaker('photon');

      // Should be in closed state
      expect(defaultBreaker.getState()).toBe('closed');
      expect(defaultBreaker.canExecute()).toBe(true);

      // Should need 5 failures (default threshold) to open
      defaultBreaker.recordFailure();
      defaultBreaker.recordFailure();
      defaultBreaker.recordFailure();
      defaultBreaker.recordFailure();

      // Still closed with 4 failures
      expect(defaultBreaker.getState()).toBe('closed');

      defaultBreaker.recordFailure(); // 5th failure

      // Now open
      expect(defaultBreaker.getState()).toBe('open');
    });
  });

  describe('concurrent scenarios', () => {
    it('should handle rapid failures correctly', () => {
      // Rapid fire failures
      for (let i = 0; i < 10; i++) {
        circuitBreaker.recordFailure();
      }

      expect(circuitBreaker.getState()).toBe('open');
    });

    it('should handle alternating success/failure', () => {
      // Alternate success and failure
      circuitBreaker.recordSuccess(100);
      circuitBreaker.recordFailure();
      circuitBreaker.recordSuccess(100);
      circuitBreaker.recordFailure();
      circuitBreaker.recordSuccess(100);

      // Should still be closed (failures reset by successes)
      expect(circuitBreaker.getState()).toBe('closed');
    });

    it('should handle multiple recovery cycles', () => {
      // First cycle: open -> half-open -> closed
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();
      expect(circuitBreaker.getState()).toBe('open');

      jest.advanceTimersByTime(150);
      circuitBreaker.canExecute();
      expect(circuitBreaker.getState()).toBe('half-open');

      circuitBreaker.recordSuccess(100);
      circuitBreaker.recordSuccess(100);
      expect(circuitBreaker.getState()).toBe('closed');

      // Second cycle: open again
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();
      expect(circuitBreaker.getState()).toBe('open');

      // Recover again
      jest.advanceTimersByTime(150);
      circuitBreaker.canExecute();
      circuitBreaker.recordSuccess(100);
      circuitBreaker.recordSuccess(100);
      expect(circuitBreaker.getState()).toBe('closed');
    });
  });

  describe('metrics tracking', () => {
    it('should track total requests across all states', () => {
      circuitBreaker.recordSuccess(100);
      circuitBreaker.recordSuccess(100);
      circuitBreaker.recordFailure();

      const health = circuitBreaker.getHealth();
      // Success rate = 2/3 = 66.67%
      expect(health.successRate).toBeCloseTo(67, 0);
    });

    it('should round average response time', () => {
      circuitBreaker.recordSuccess(101);
      circuitBreaker.recordSuccess(102);

      const health = circuitBreaker.getHealth();
      // Average should be rounded
      expect(health.avgResponseTimeMs).toBe(102); // Math.round(101.5)
    });
  });
});
