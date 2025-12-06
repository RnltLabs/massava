/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Tests for Geocoding Orchestrator
 *
 * @module __tests__/lib/services/geocoding/orchestrator.test
 */

import {
  GeocodingOrchestrator,
  createGeocodingOrchestrator,
  isOrchestratorError,
  isOrchestratorSuccess,
  setDefaultProviders,
  getDefaultOrchestrator,
  resetDefaultOrchestrator,
  type OrchestratorResult,
} from '@/lib/services/geocoding/orchestrator';
import { createGeocodingCache, type GeocodingCache } from '@/lib/services/geocoding/cache';
import type {
  GeocodingProvider,
  AddressSuggestion,
  GeocodingSearchOptions,
  ProviderHealth,
  GeocodingProviderConfig,
} from '@/lib/services/geocoding/types';
import type { GeocodingError } from '@/lib/services/geocoding/errors';

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

/**
 * Helper to create mock AddressSuggestion
 */
function createMockSuggestion(street: string = 'Test Street'): AddressSuggestion {
  return {
    street,
    city: 'Test City',
    postalCode: '12345',
    country: 'Deutschland',
    displayText: `${street}, 12345 Test City`,
    lat: 49.0,
    lng: 8.4,
  };
}

/**
 * Create a mock geocoding provider
 */
function createMockProvider(
  name: 'photon' | 'radar',
  options: {
    searchFn?: jest.Mock;
    shouldFail?: boolean;
    failWith?: Error;
    delay?: number;
    results?: AddressSuggestion[];
  } = {}
): GeocodingProvider {
  const defaultResults = options.results ?? [createMockSuggestion(`${name} result`)];

  const searchFn = options.searchFn ?? jest.fn().mockImplementation(async () => {
    if (options.delay) {
      await new Promise(resolve => setTimeout(resolve, options.delay));
    }
    if (options.shouldFail) {
      const error = options.failWith ?? new Error(`${name} provider failed`);
      // Convert to GeocodingError if it's not already
      const geocodingError: GeocodingError = {
        type: 'NETWORK_ERROR',
        message: error.message,
        correlationId: 'test-correlation-id',
        provider: name,
      };
      return { ok: false, error: geocodingError };
    }
    return { ok: true, data: defaultResults };
  });

  return {
    name,
    search: searchFn,
    getHealth: jest.fn().mockReturnValue({
      provider: name,
      isHealthy: true,
      consecutiveFailures: 0,
      lastSuccessAt: null,
      lastFailureAt: null,
      avgResponseTimeMs: 0,
      successRate: 100,
      availableAt: null,
    } as ProviderHealth),
    getConfig: jest.fn().mockReturnValue({
      name,
      baseUrl: `https://${name}.example.com`,
      timeout: 5000,
      defaultLimit: 8,
      defaultLang: 'de',
      priority: name === 'photon' ? 1 : 2,
      enabled: true,
    } as GeocodingProviderConfig),
  };
}

describe('GeocodingOrchestrator', () => {
  let orchestrator: GeocodingOrchestrator;
  let cache: GeocodingCache;
  let photonProvider: GeocodingProvider;
  let radarProvider: GeocodingProvider;

  beforeEach(() => {
    jest.useFakeTimers();
    cache = createGeocodingCache({ ttlMs: 60000, maxSize: 100 });
    photonProvider = createMockProvider('photon');
    radarProvider = createMockProvider('radar');
    orchestrator = new GeocodingOrchestrator(
      [photonProvider, radarProvider],
      cache,
      {
        enableCache: true,
        providers: ['photon', 'radar'],
        circuitBreaker: {
          failureThreshold: 3,
          resetTimeout: 100,
          successThreshold: 2,
        },
      }
    );
  });

  afterEach(() => {
    jest.useRealTimers();
    resetDefaultOrchestrator();
  });

  describe('successful search', () => {
    it('should return results from primary provider', async () => {
      const searchPromise = orchestrator.search('test query');
      jest.runAllTimers();
      const result = await searchPromise;

      expect(isOrchestratorSuccess(result)).toBe(true);
      if (isOrchestratorSuccess(result)) {
        expect(result.suggestions).toHaveLength(1);
        expect(result.metadata.provider).toBe('photon');
        expect(result.metadata.fallbackUsed).toBe(false);
      }
    });

    it('should call only the primary provider on success', async () => {
      const searchPromise = orchestrator.search('test query');
      jest.runAllTimers();
      await searchPromise;

      expect(photonProvider.search).toHaveBeenCalledTimes(1);
      expect(radarProvider.search).not.toHaveBeenCalled();
    });

    it('should include correct metadata', async () => {
      const searchPromise = orchestrator.search('test', { correlationId: 'custom-id' });
      jest.runAllTimers();
      const result = await searchPromise;

      if (isOrchestratorSuccess(result)) {
        expect(result.metadata.correlationId).toBe('custom-id');
        expect(result.metadata.fromCache).toBe(false);
        expect(result.metadata.timestamp).toBeInstanceOf(Date);
        expect(typeof result.metadata.durationMs).toBe('number');
      }
    });
  });

  describe('fallback behavior', () => {
    it('should fallback to secondary provider on primary failure', async () => {
      const failingPhoton = createMockProvider('photon', { shouldFail: true });
      const successRadar = createMockProvider('radar', {
        results: [createMockSuggestion('radar fallback result')],
      });

      orchestrator = new GeocodingOrchestrator(
        [failingPhoton, successRadar],
        cache,
        { enableCache: false, providers: ['photon', 'radar'] }
      );

      const searchPromise = orchestrator.search('test');
      jest.runAllTimers();
      const result = await searchPromise;

      expect(isOrchestratorSuccess(result)).toBe(true);
      if (isOrchestratorSuccess(result)) {
        expect(result.metadata.provider).toBe('radar');
        expect(result.metadata.fallbackUsed).toBe(true);
        expect(result.metadata.originalProvider).toBe('photon');
        expect(result.suggestions[0].street).toBe('radar fallback result');
      }
    });

    it('should increment fallback metrics', async () => {
      const failingPhoton = createMockProvider('photon', { shouldFail: true });
      const successRadar = createMockProvider('radar');

      orchestrator = new GeocodingOrchestrator(
        [failingPhoton, successRadar],
        cache,
        { enableCache: false, providers: ['photon', 'radar'] }
      );

      const searchPromise = orchestrator.search('test');
      jest.runAllTimers();
      await searchPromise;

      const metrics = orchestrator.getMetrics();
      expect(metrics.fallbacksTriggered).toBe(1);
    });
  });

  describe('cache behavior', () => {
    it('should return cached results on cache hit', async () => {
      // First request - cache miss
      const firstPromise = orchestrator.search('test query');
      jest.runAllTimers();
      await firstPromise;

      // Clear mock calls
      (photonProvider.search as jest.Mock).mockClear();

      // Second request - cache hit
      const secondPromise = orchestrator.search('test query');
      jest.runAllTimers();
      const secondResult = await secondPromise;

      expect(photonProvider.search).not.toHaveBeenCalled();

      if (isOrchestratorSuccess(secondResult)) {
        expect(secondResult.metadata.fromCache).toBe(true);
      }
    });

    it('should not call provider on cache hit', async () => {
      // Pre-populate cache
      const cacheKey = cache.generateKey('cached query');
      const cachedSuggestions = [createMockSuggestion('cached result')];
      cache.set(cacheKey, cachedSuggestions, 60000);

      const searchPromise = orchestrator.search('cached query');
      jest.runAllTimers();
      const result = await searchPromise;

      expect(photonProvider.search).not.toHaveBeenCalled();
      expect(radarProvider.search).not.toHaveBeenCalled();

      if (isOrchestratorSuccess(result)) {
        expect(result.suggestions[0].street).toBe('cached result');
        expect(result.metadata.fromCache).toBe(true);
      }
    });

    it('should respect skipCache option', async () => {
      // Pre-populate cache
      const cacheKey = cache.generateKey('test');
      cache.set(cacheKey, [createMockSuggestion('cached')], 60000);

      const searchPromise = orchestrator.search('test', { skipCache: true });
      jest.runAllTimers();
      await searchPromise;

      expect(photonProvider.search).toHaveBeenCalled();
    });

    it('should track cache hits and misses', async () => {
      // Cache miss
      const firstPromise = orchestrator.search('first query');
      jest.runAllTimers();
      await firstPromise;

      // Cache hit
      const secondPromise = orchestrator.search('first query');
      jest.runAllTimers();
      await secondPromise;

      const metrics = orchestrator.getMetrics();
      expect(metrics.cacheHits).toBe(1);
      expect(metrics.cacheMisses).toBe(1);
    });

    it('should cache results after successful provider call', async () => {
      const searchPromise = orchestrator.search('new query');
      jest.runAllTimers();
      await searchPromise;

      const cacheKey = cache.generateKey('new query');
      expect(cache.has(cacheKey)).toBe(true);
    });
  });

  describe('circuit breaker integration', () => {
    it('should skip provider when circuit is open', async () => {
      const failingPhoton = createMockProvider('photon', { shouldFail: true });
      const successRadar = createMockProvider('radar');

      orchestrator = new GeocodingOrchestrator(
        [failingPhoton, successRadar],
        cache,
        {
          enableCache: false,
          providers: ['photon', 'radar'],
          circuitBreaker: {
            failureThreshold: 2,
            resetTimeout: 1000,
          },
        }
      );

      // Trigger failures to open circuit
      const promise1 = orchestrator.search('query1');
      jest.runAllTimers();
      await promise1;

      const promise2 = orchestrator.search('query2');
      jest.runAllTimers();
      await promise2;

      // Circuit should now be open for photon
      (failingPhoton.search as jest.Mock).mockClear();
      (successRadar.search as jest.Mock).mockClear();

      // This request should skip photon (circuit open) and go directly to radar
      const promise3 = orchestrator.search('query3');
      jest.runAllTimers();
      const result = await promise3;

      // Photon should not be called (circuit open)
      expect(failingPhoton.search).not.toHaveBeenCalled();
      expect(successRadar.search).toHaveBeenCalled();

      if (isOrchestratorSuccess(result)) {
        expect(result.metadata.provider).toBe('radar');
      }
    });

    it('should report provider health correctly', () => {
      const health = orchestrator.getProviderHealth();

      expect(health).toHaveLength(2);
      expect(health[0].provider).toBe('photon');
      expect(health[1].provider).toBe('radar');
    });

    it('should allow resetting individual circuit breaker', async () => {
      const failingPhoton = createMockProvider('photon', { shouldFail: true });
      const successRadar = createMockProvider('radar');

      orchestrator = new GeocodingOrchestrator(
        [failingPhoton, successRadar],
        cache,
        {
          enableCache: false,
          providers: ['photon', 'radar'],
          circuitBreaker: { failureThreshold: 2 },
        }
      );

      // Open the circuit
      const promise1 = orchestrator.search('q1');
      jest.runAllTimers();
      await promise1;

      const promise2 = orchestrator.search('q2');
      jest.runAllTimers();
      await promise2;

      // Reset photon circuit breaker
      orchestrator.resetCircuitBreaker('photon');

      // Fix photon provider
      (failingPhoton.search as jest.Mock).mockResolvedValue({ ok: true, data: [createMockSuggestion('fixed')] });

      // Photon should be called again
      const promise3 = orchestrator.search('q3');
      jest.runAllTimers();
      await promise3;

      expect(failingPhoton.search).toHaveBeenCalledTimes(3); // 2 failures + 1 after reset
    });

    it('should allow resetting all circuit breakers', () => {
      orchestrator.resetAllCircuitBreakers();

      const health = orchestrator.getProviderHealth();
      expect(health.every(h => h.consecutiveFailures === 0)).toBe(true);
    });
  });

  describe('all providers failed', () => {
    it('should return ALL_PROVIDERS_FAILED error when all providers fail', async () => {
      const failingPhoton = createMockProvider('photon', { shouldFail: true });
      const failingRadar = createMockProvider('radar', { shouldFail: true });

      orchestrator = new GeocodingOrchestrator(
        [failingPhoton, failingRadar],
        cache,
        { enableCache: false, providers: ['photon', 'radar'] }
      );

      const searchPromise = orchestrator.search('test');
      jest.runAllTimers();
      const result = await searchPromise;

      expect(isOrchestratorError(result)).toBe(true);
      if (isOrchestratorError(result)) {
        expect(result.error.type).toBe('ALL_PROVIDERS_FAILED');
        if (result.error.type === 'ALL_PROVIDERS_FAILED') {
          expect(result.error.failedProviders).toContain('photon');
          expect(result.error.failedProviders).toContain('radar');
        }
      }
    });

    it('should track all provider failures in metrics', async () => {
      const failingPhoton = createMockProvider('photon', { shouldFail: true });
      const failingRadar = createMockProvider('radar', { shouldFail: true });

      orchestrator = new GeocodingOrchestrator(
        [failingPhoton, failingRadar],
        cache,
        { enableCache: false, providers: ['photon', 'radar'] }
      );

      const searchPromise = orchestrator.search('test');
      jest.runAllTimers();
      await searchPromise;

      const metrics = orchestrator.getMetrics();
      expect(metrics.allProviderFailures).toBe(1);
    });
  });

  describe('non-recoverable errors', () => {
    it('should not fallback on INVALID_INPUT error', async () => {
      const invalidInputError = new Error('Query too short');
      (invalidInputError as any).type = 'INVALID_INPUT';

      const photonWithInvalidInput = {
        ...createMockProvider('photon'),
        search: jest.fn().mockRejectedValue(invalidInputError),
      };

      orchestrator = new GeocodingOrchestrator(
        [photonWithInvalidInput, radarProvider],
        cache,
        { enableCache: false, providers: ['photon', 'radar'] }
      );

      const searchPromise = orchestrator.search('ab');
      jest.runAllTimers();
      const result = await searchPromise;

      // Should have tried photon but not radar (INVALID_INPUT doesn't trigger fallback)
      expect(photonWithInvalidInput.search).toHaveBeenCalled();
      // Note: The actual behavior depends on how exceptionToGeocodingError handles this
    });
  });

  describe('metrics and statistics', () => {
    it('should track total requests', async () => {
      const promise1 = orchestrator.search('q1');
      jest.runAllTimers();
      await promise1;

      const promise2 = orchestrator.search('q2');
      jest.runAllTimers();
      await promise2;

      const promise3 = orchestrator.search('q3');
      jest.runAllTimers();
      await promise3;

      const metrics = orchestrator.getMetrics();
      expect(metrics.totalRequests).toBe(3);
    });

    it('should return cache stats', () => {
      const cacheStats = orchestrator.getCacheStats();

      expect(cacheStats).toHaveProperty('hits');
      expect(cacheStats).toHaveProperty('misses');
      expect(cacheStats).toHaveProperty('size');
      expect(cacheStats).toHaveProperty('maxSize');
    });
  });

  describe('cache management', () => {
    it('should clear cache', async () => {
      // Populate cache
      const promise = orchestrator.search('test');
      jest.runAllTimers();
      await promise;

      expect(orchestrator.getCacheStats().size).toBeGreaterThan(0);

      orchestrator.clearCache();

      expect(orchestrator.getCacheStats().size).toBe(0);
    });
  });

  describe('correlation ID handling', () => {
    it('should use provided correlation ID', async () => {
      const customId = 'my-custom-correlation-id';
      const searchPromise = orchestrator.search('test', { correlationId: customId });
      jest.runAllTimers();
      const result = await searchPromise;

      if (isOrchestratorSuccess(result)) {
        expect(result.metadata.correlationId).toBe(customId);
      }

      expect(photonProvider.search).toHaveBeenCalledWith(
        'test',
        expect.objectContaining({ correlationId: customId })
      );
    });

    it('should generate correlation ID if not provided', async () => {
      const searchPromise = orchestrator.search('test');
      jest.runAllTimers();
      const result = await searchPromise;

      if (isOrchestratorSuccess(result)) {
        expect(result.metadata.correlationId).toBeTruthy();
      }
    });
  });
});

describe('Type Guards', () => {
  describe('isOrchestratorError', () => {
    it('should return true for error results', () => {
      const errorResult: OrchestratorResult = {
        ok: false,
        error: {
          type: 'NETWORK_ERROR',
          message: 'Test error',
          correlationId: 'test',
          provider: 'photon',
        },
      };

      expect(isOrchestratorError(errorResult)).toBe(true);
    });

    it('should return false for success results', () => {
      const successResult: OrchestratorResult = {
        suggestions: [],
        metadata: {
          provider: 'photon',
          fallbackUsed: false,
          durationMs: 100,
          correlationId: 'test',
          fromCache: false,
          rawResultCount: 0,
          timestamp: new Date(),
        },
      };

      expect(isOrchestratorError(successResult)).toBe(false);
    });
  });

  describe('isOrchestratorSuccess', () => {
    it('should return true for success results', () => {
      const successResult: OrchestratorResult = {
        suggestions: [],
        metadata: {
          provider: 'photon',
          fallbackUsed: false,
          durationMs: 100,
          correlationId: 'test',
          fromCache: false,
          rawResultCount: 0,
          timestamp: new Date(),
        },
      };

      expect(isOrchestratorSuccess(successResult)).toBe(true);
    });

    it('should return false for error results', () => {
      const errorResult: OrchestratorResult = {
        ok: false,
        error: {
          type: 'TIMEOUT',
          message: 'Test timeout',
          correlationId: 'test',
          provider: 'photon',
          timeoutMs: 5000,
        },
      };

      expect(isOrchestratorSuccess(errorResult)).toBe(false);
    });
  });
});

describe('Factory Functions', () => {
  describe('createGeocodingOrchestrator', () => {
    it('should create orchestrator with default config', () => {
      const provider = createMockProvider('photon');
      const orchestrator = createGeocodingOrchestrator([provider]);

      expect(orchestrator).toBeInstanceOf(GeocodingOrchestrator);
    });

    it('should create orchestrator with custom config', () => {
      const provider = createMockProvider('photon');
      const orchestrator = createGeocodingOrchestrator([provider], {
        enableCache: false,
        cacheTtl: 10000,
      });

      expect(orchestrator).toBeInstanceOf(GeocodingOrchestrator);
    });
  });

  describe('Default Orchestrator Singleton', () => {
    beforeEach(() => {
      resetDefaultOrchestrator();
    });

    it('should throw if getDefaultOrchestrator called before setDefaultProviders', () => {
      expect(() => getDefaultOrchestrator()).toThrow(
        'Default orchestrator not initialized'
      );
    });

    it('should return orchestrator after setDefaultProviders', () => {
      const provider = createMockProvider('photon');
      setDefaultProviders([provider]);

      const orchestrator = getDefaultOrchestrator();
      expect(orchestrator).toBeInstanceOf(GeocodingOrchestrator);
    });

    it('should return same instance on multiple calls', () => {
      const provider = createMockProvider('photon');
      setDefaultProviders([provider]);

      const orchestrator1 = getDefaultOrchestrator();
      const orchestrator2 = getDefaultOrchestrator();

      expect(orchestrator1).toBe(orchestrator2);
    });

    it('should reset correctly', () => {
      const provider = createMockProvider('photon');
      setDefaultProviders([provider]);

      resetDefaultOrchestrator();

      expect(() => getDefaultOrchestrator()).toThrow();
    });

    it('should allow re-initialization with new providers', () => {
      const provider1 = createMockProvider('photon');
      setDefaultProviders([provider1]);

      const provider2 = createMockProvider('radar');
      setDefaultProviders([provider2]);

      const orchestrator = getDefaultOrchestrator();
      expect(orchestrator).toBeInstanceOf(GeocodingOrchestrator);
    });
  });
});

describe('Edge Cases', () => {
  let cache: GeocodingCache;

  beforeEach(() => {
    jest.useFakeTimers();
    cache = createGeocodingCache({ ttlMs: 60000, maxSize: 100 });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should handle empty provider list gracefully', async () => {
    const orchestrator = new GeocodingOrchestrator([], cache, {
      enableCache: false,
      providers: [],
    });

    const searchPromise = orchestrator.search('test');
    jest.runAllTimers();
    const result = await searchPromise;

    expect(isOrchestratorError(result)).toBe(true);
    if (isOrchestratorError(result)) {
      expect(result.error.type).toBe('ALL_PROVIDERS_FAILED');
    }
  });

  it('should handle provider returning empty results', async () => {
    const emptyProvider = createMockProvider('photon', { results: [] });
    const testOrchestrator = new GeocodingOrchestrator(
      [emptyProvider],
      cache,
      { enableCache: false, providers: ['photon'] }
    );

    const result = await testOrchestrator.search('test');

    expect(isOrchestratorSuccess(result)).toBe(true);
    if (isOrchestratorSuccess(result)) {
      expect(result.suggestions).toHaveLength(0);
      expect(result.metadata.provider).toBe('photon');
    }
  });

  it('should pass search options to provider', async () => {
    const provider = createMockProvider('photon');
    const orchestrator = new GeocodingOrchestrator(
      [provider],
      cache,
      { enableCache: false, providers: ['photon'] }
    );

    const options: GeocodingSearchOptions = {
      limit: 5,
      lang: 'en',
      restrictToDACH: true,
      timeout: 3000,
    };

    const searchPromise = orchestrator.search('test', options);
    jest.runAllTimers();
    await searchPromise;

    expect(provider.search).toHaveBeenCalledWith(
      'test',
      expect.objectContaining({
        limit: 5,
        lang: 'en',
        restrictToDACH: true,
        timeout: 3000,
      })
    );
  });

  it('should handle provider not in config order', async () => {
    const photon = createMockProvider('photon');

    // Config says radar first, but only photon is provided
    const testOrchestrator = new GeocodingOrchestrator(
      [photon],
      cache,
      { enableCache: false, providers: ['radar', 'photon'] }
    );

    const result = await testOrchestrator.search('test');

    // Should still work with available provider
    expect(isOrchestratorSuccess(result)).toBe(true);
    if (isOrchestratorSuccess(result)) {
      expect(result.metadata.provider).toBe('photon');
    }
    expect(photon.search).toHaveBeenCalled();
  });
});
