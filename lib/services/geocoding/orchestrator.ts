/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Geocoding Orchestrator with Circuit Breaker
 * Manages multi-provider geocoding with intelligent fallback
 *
 * @module lib/services/geocoding/orchestrator
 */

import { logger, generateCorrelationId } from '@/lib/logger';
import type {
  GeocodingProviderName,
  GeocodingSearchOptions,
  GeocodingSearchResult,
  GeocodingResultMetadata,
  ProviderHealth,
  AddressSuggestion,
} from './types';
import type { GeocodingProvider } from './providers/geocoding-provider';
import type { GeocodingError } from './errors';
import {
  createGeocodingError,
  shouldTriggerFallback,
  exceptionToGeocodingError,
} from './errors';
import type { GeocodingCache } from './cache';
import { createGeocodingCache, getDefaultCache } from './cache';

// ============================================================================
// Circuit Breaker Configuration
// ============================================================================

/**
 * Configuration for the circuit breaker
 */
export interface CircuitBreakerConfig {
  /** Number of failures before opening the circuit (default: 5) */
  readonly failureThreshold: number;
  /** Time window for counting failures in ms (default: 60000) */
  readonly failureWindow: number;
  /** Time before attempting to close the circuit in ms (default: 60000) */
  readonly resetTimeout: number;
  /** Number of successes required to close the circuit (default: 2) */
  readonly successThreshold: number;
}

/**
 * Default circuit breaker configuration
 */
const DEFAULT_CIRCUIT_BREAKER_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  failureWindow: 60000,
  resetTimeout: 60000,
  successThreshold: 2,
} as const;

/**
 * Circuit breaker states
 * - closed: Normal operation, requests pass through
 * - open: Circuit is tripped, requests are rejected immediately
 * - half-open: Testing if the service has recovered
 */
type CircuitState = 'closed' | 'open' | 'half-open';

/**
 * Internal state for the circuit breaker (immutable updates)
 */
interface CircuitBreakerState {
  readonly state: CircuitState;
  readonly failures: readonly number[]; // Timestamps of failures
  readonly successCount: number; // Successes in half-open state
  readonly lastFailureAt: number | null;
  readonly lastSuccessAt: number | null;
  readonly openedAt: number | null;
  readonly totalRequests: number;
  readonly totalSuccesses: number;
  readonly totalFailures: number;
  readonly responseTimeSum: number;
  readonly responseTimeCount: number;
}

/**
 * Initial circuit breaker state
 */
function createInitialState(): CircuitBreakerState {
  return {
    state: 'closed',
    failures: [],
    successCount: 0,
    lastFailureAt: null,
    lastSuccessAt: null,
    openedAt: null,
    totalRequests: 0,
    totalSuccesses: 0,
    totalFailures: 0,
    responseTimeSum: 0,
    responseTimeCount: 0,
  };
}

// ============================================================================
// Circuit Breaker Implementation
// ============================================================================

/**
 * Circuit Breaker for a single provider
 *
 * Implements the circuit breaker pattern to prevent cascading failures:
 * - Tracks failures within a sliding time window
 * - Opens circuit when failure threshold is exceeded
 * - Allows test requests in half-open state
 * - Closes circuit after successful test requests
 */
export class CircuitBreaker {
  private readonly provider: GeocodingProviderName;
  private readonly config: CircuitBreakerConfig;
  private state: CircuitBreakerState;

  constructor(
    provider: GeocodingProviderName,
    config: Partial<CircuitBreakerConfig> = {}
  ) {
    this.provider = provider;
    this.config = { ...DEFAULT_CIRCUIT_BREAKER_CONFIG, ...config };
    this.state = createInitialState();
  }

  /**
   * Check if the circuit allows execution
   * @returns True if requests can be executed
   */
  canExecute(): boolean {
    const now = Date.now();

    switch (this.state.state) {
      case 'closed':
        return true;

      case 'open': {
        // Check if reset timeout has passed
        if (
          this.state.openedAt !== null &&
          now - this.state.openedAt >= this.config.resetTimeout
        ) {
          // Transition to half-open
          this.transitionTo('half-open');
          return true;
        }
        return false;
      }

      case 'half-open':
        // Allow one request at a time in half-open state
        return true;

      default: {
        const _exhaustive: never = this.state.state;
        return false;
      }
    }
  }

  /**
   * Record a successful request
   * @param responseTimeMs - Response time in milliseconds
   */
  recordSuccess(responseTimeMs: number): void {
    const now = Date.now();

    // Update metrics
    const newState: CircuitBreakerState = {
      ...this.state,
      lastSuccessAt: now,
      totalRequests: this.state.totalRequests + 1,
      totalSuccesses: this.state.totalSuccesses + 1,
      responseTimeSum: this.state.responseTimeSum + responseTimeMs,
      responseTimeCount: this.state.responseTimeCount + 1,
    };

    if (this.state.state === 'half-open') {
      const newSuccessCount = this.state.successCount + 1;

      if (newSuccessCount >= this.config.successThreshold) {
        // Enough successes, close the circuit
        this.state = {
          ...newState,
          state: 'closed',
          failures: [],
          successCount: 0,
          openedAt: null,
        };

        logger.info('Circuit breaker closed', {
          provider: this.provider,
          successCount: newSuccessCount,
        });
      } else {
        // Continue in half-open state
        this.state = {
          ...newState,
          successCount: newSuccessCount,
        };
      }
    } else {
      this.state = newState;
    }
  }

  /**
   * Record a failed request
   */
  recordFailure(): void {
    const now = Date.now();

    // Update metrics
    let newState: CircuitBreakerState = {
      ...this.state,
      lastFailureAt: now,
      totalRequests: this.state.totalRequests + 1,
      totalFailures: this.state.totalFailures + 1,
    };

    if (this.state.state === 'half-open') {
      // Any failure in half-open state immediately opens the circuit
      this.state = {
        ...newState,
        state: 'open',
        successCount: 0,
        openedAt: now,
      };

      logger.warn('Circuit breaker reopened from half-open', {
        provider: this.provider,
      });
      return;
    }

    // Add failure timestamp and clean old failures
    const windowStart = now - this.config.failureWindow;
    const recentFailures = [
      ...this.state.failures.filter((ts) => ts > windowStart),
      now,
    ];

    newState = {
      ...newState,
      failures: recentFailures,
    };

    // Check if we should open the circuit
    if (recentFailures.length >= this.config.failureThreshold) {
      this.state = {
        ...newState,
        state: 'open',
        openedAt: now,
      };

      logger.warn('Circuit breaker opened', {
        provider: this.provider,
        failures: recentFailures.length,
        threshold: this.config.failureThreshold,
        windowMs: this.config.failureWindow,
      });
    } else {
      this.state = newState;
    }
  }

  /**
   * Get the health status of this circuit breaker
   * @returns Provider health information
   */
  getHealth(): ProviderHealth {
    const now = Date.now();
    const windowStart = now - this.config.failureWindow;
    const recentFailures = this.state.failures.filter((ts) => ts > windowStart);

    // Calculate average response time
    const avgResponseTimeMs =
      this.state.responseTimeCount > 0
        ? Math.round(this.state.responseTimeSum / this.state.responseTimeCount)
        : 0;

    // Calculate success rate (last 100 requests or all if less)
    const totalReqs = this.state.totalRequests;
    const successRate =
      totalReqs > 0
        ? Math.round((this.state.totalSuccesses / totalReqs) * 100)
        : 100;

    // Calculate when circuit will be available
    let availableAt: Date | null = null;
    if (this.state.state === 'open' && this.state.openedAt !== null) {
      availableAt = new Date(this.state.openedAt + this.config.resetTimeout);
    }

    return {
      provider: this.provider,
      isHealthy: this.state.state === 'closed',
      consecutiveFailures: recentFailures.length,
      lastSuccessAt:
        this.state.lastSuccessAt !== null
          ? new Date(this.state.lastSuccessAt)
          : null,
      lastFailureAt:
        this.state.lastFailureAt !== null
          ? new Date(this.state.lastFailureAt)
          : null,
      avgResponseTimeMs,
      successRate,
      availableAt,
    };
  }

  /**
   * Get current circuit state
   */
  getState(): CircuitState {
    return this.state.state;
  }

  /**
   * Reset the circuit breaker to initial state
   */
  reset(): void {
    this.state = createInitialState();
    logger.info('Circuit breaker reset', { provider: this.provider });
  }

  /**
   * Transition to a new state
   */
  private transitionTo(newState: CircuitState): void {
    const oldState = this.state.state;
    const now = Date.now();

    this.state = {
      ...this.state,
      state: newState,
      successCount: 0,
      openedAt: newState === 'open' ? now : this.state.openedAt,
    };

    logger.debug('Circuit breaker state transition', {
      provider: this.provider,
      from: oldState,
      to: newState,
    });
  }
}

// ============================================================================
// Orchestrator Configuration
// ============================================================================

/**
 * Configuration for the geocoding orchestrator
 */
export interface OrchestratorConfig {
  /** Enable caching of results (default: true) */
  readonly enableCache: boolean;
  /** Cache TTL in milliseconds (default: 24 hours) */
  readonly cacheTtl: number;
  /** Provider priority order (first = primary) */
  readonly providers: readonly GeocodingProviderName[];
  /** Circuit breaker configuration */
  readonly circuitBreaker?: Partial<CircuitBreakerConfig>;
}

/**
 * Default orchestrator configuration
 */
const DEFAULT_ORCHESTRATOR_CONFIG: OrchestratorConfig = {
  enableCache: true,
  cacheTtl: 24 * 60 * 60 * 1000, // 24 hours
  providers: ['photon', 'radar'],
  circuitBreaker: DEFAULT_CIRCUIT_BREAKER_CONFIG,
} as const;

/**
 * Result type for orchestrator operations
 */
export type OrchestratorResult =
  | GeocodingSearchResult
  | { readonly ok: false; readonly error: GeocodingError };

/**
 * Metrics for tracking fallback usage
 */
export interface OrchestratorMetrics {
  readonly totalRequests: number;
  readonly cacheHits: number;
  readonly cacheMisses: number;
  readonly fallbacksTriggered: number;
  readonly allProviderFailures: number;
}

// ============================================================================
// Geocoding Orchestrator
// ============================================================================

/**
 * Geocoding Orchestrator with Circuit Breaker
 *
 * Orchestrates geocoding requests across multiple providers with:
 * - Intelligent caching (LRU with TTL)
 * - Circuit breaker pattern for fault tolerance
 * - Automatic fallback to secondary providers
 * - Request correlation for tracing
 * - Comprehensive metrics
 *
 * @example
 * ```typescript
 * const orchestrator = createGeocodingOrchestrator([photonProvider, radarProvider]);
 *
 * const result = await orchestrator.search('Karlstraße 10', { limit: 5 });
 *
 * if ('ok' in result && !result.ok) {
 *   console.error(result.error);
 * } else {
 *   console.log(result.suggestions);
 * }
 * ```
 */
export class GeocodingOrchestrator {
  private readonly providers: Map<GeocodingProviderName, GeocodingProvider>;
  private readonly circuitBreakers: Map<GeocodingProviderName, CircuitBreaker>;
  private readonly cache: GeocodingCache;
  private readonly config: OrchestratorConfig;
  private readonly providerOrder: readonly GeocodingProviderName[];

  // Metrics
  private metrics: OrchestratorMetrics = {
    totalRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    fallbacksTriggered: 0,
    allProviderFailures: 0,
  };

  constructor(
    providers: GeocodingProvider[],
    cache: GeocodingCache,
    config: Partial<OrchestratorConfig> = {}
  ) {
    this.config = { ...DEFAULT_ORCHESTRATOR_CONFIG, ...config };
    this.cache = cache;

    // Initialize provider map
    this.providers = new Map();
    for (const provider of providers) {
      this.providers.set(provider.name, provider);
    }

    // Initialize circuit breakers
    this.circuitBreakers = new Map();
    for (const provider of providers) {
      this.circuitBreakers.set(
        provider.name,
        new CircuitBreaker(provider.name, this.config.circuitBreaker)
      );
    }

    // Determine provider order (config order, filtered by available providers)
    this.providerOrder = this.config.providers.filter((name) =>
      this.providers.has(name)
    );

    logger.debug('Geocoding orchestrator initialized', {
      providers: this.providerOrder,
      cacheEnabled: this.config.enableCache,
      cacheTtl: this.config.cacheTtl,
    });
  }

  /**
   * Search for address suggestions
   *
   * @param query - Search query string
   * @param options - Search options
   * @returns Search result or error
   */
  async search(
    query: string,
    options: GeocodingSearchOptions = {}
  ): Promise<OrchestratorResult> {
    const correlationId = options.correlationId ?? generateCorrelationId();
    const startTime = Date.now();

    // Update metrics
    this.metrics = {
      ...this.metrics,
      totalRequests: this.metrics.totalRequests + 1,
    };

    logger.debug('Geocoding search started', {
      correlationId,
      query,
      providers: this.providerOrder,
    });

    // 1. Check cache first (if enabled)
    if (this.config.enableCache && !options.skipCache) {
      const cacheKey = this.cache.generateKey(query, options);
      const cached = this.cache.get(cacheKey);

      if (cached !== null) {
        this.metrics = {
          ...this.metrics,
          cacheHits: this.metrics.cacheHits + 1,
        };

        const result: GeocodingSearchResult = {
          suggestions: cached,
          metadata: {
            provider: this.providerOrder[0] ?? 'photon',
            fallbackUsed: false,
            durationMs: Date.now() - startTime,
            correlationId,
            fromCache: true,
            rawResultCount: cached.length,
            timestamp: new Date(),
          },
        };

        logger.debug('Geocoding cache hit', {
          correlationId,
          query,
          resultCount: cached.length,
        });

        return result;
      }

      this.metrics = {
        ...this.metrics,
        cacheMisses: this.metrics.cacheMisses + 1,
      };
    }

    // 2. Try providers in order
    const errors: GeocodingError[] = [];
    const failedProviders: GeocodingProviderName[] = [];

    for (let i = 0; i < this.providerOrder.length; i++) {
      const providerName = this.providerOrder[i];
      const provider = this.providers.get(providerName);
      const circuitBreaker = this.circuitBreakers.get(providerName);

      if (!provider || !circuitBreaker) {
        continue;
      }

      // Check circuit breaker
      if (!circuitBreaker.canExecute()) {
        const health = circuitBreaker.getHealth();

        logger.debug('Geocoding provider skipped (circuit open)', {
          correlationId,
          provider: providerName,
          availableAt: health.availableAt?.toISOString(),
        });

        errors.push(
          createGeocodingError(
            'PROVIDER_UNAVAILABLE',
            `Provider ${providerName} circuit is open`,
            {
              provider: providerName,
              correlationId,
              reason: 'Circuit breaker open',
              availableAt: health.availableAt ?? undefined,
            }
          )
        );
        failedProviders.push(providerName);
        continue;
      }

      // Execute request
      const requestStartTime = Date.now();

      try {
        const providerResult = await provider.search(query, {
          ...options,
          correlationId,
        });

        const responseTime = Date.now() - requestStartTime;

        // Handle Result pattern from provider
        if (providerResult.ok === false) {
          // Provider returned an error via Result pattern
          circuitBreaker.recordFailure();
          errors.push(providerResult.error);
          failedProviders.push(providerName);

          logger.warn('Geocoding provider returned error', {
            correlationId,
            provider: providerName,
            errorType: providerResult.error.type,
            durationMs: responseTime,
          });

          // Check if we should try fallback
          if (!shouldTriggerFallback(providerResult.error)) {
            // Error is not recoverable (e.g., invalid input)
            return { ok: false, error: providerResult.error };
          }

          // Continue to next provider
          continue;
        }

        // Success - extract suggestions from Result
        const suggestions = providerResult.data;

        // Record success
        circuitBreaker.recordSuccess(responseTime);

        // Cache result
        if (this.config.enableCache) {
          const cacheKey = this.cache.generateKey(query, options);
          this.cache.set(cacheKey, suggestions, this.config.cacheTtl);
        }

        // Track fallback usage
        const fallbackUsed = i > 0;
        if (fallbackUsed) {
          this.metrics = {
            ...this.metrics,
            fallbacksTriggered: this.metrics.fallbacksTriggered + 1,
          };

          logger.warn('Geocoding fallback triggered', {
            correlationId,
            primaryProvider: this.providerOrder[0],
            fallbackProvider: providerName,
            reason: errors.length > 0 ? errors[errors.length - 1].type : 'unknown',
          });
        }

        const result: GeocodingSearchResult = {
          suggestions,
          metadata: {
            provider: providerName,
            fallbackUsed,
            originalProvider: fallbackUsed ? this.providerOrder[0] : undefined,
            durationMs: Date.now() - startTime,
            correlationId,
            fromCache: false,
            rawResultCount: suggestions.length,
            timestamp: new Date(),
          },
        };

        logger.debug('Geocoding search completed', {
          correlationId,
          query,
          provider: providerName,
          resultCount: suggestions.length,
          durationMs: result.metadata.durationMs,
          fallbackUsed,
        });

        return result;
      } catch (error) {
        // Unexpected exception (network error, etc.)
        const responseTime = Date.now() - requestStartTime;
        const geocodingError = exceptionToGeocodingError(
          error,
          providerName,
          correlationId
        );

        // Record failure
        circuitBreaker.recordFailure();
        errors.push(geocodingError);
        failedProviders.push(providerName);

        logger.warn('Geocoding provider failed', {
          correlationId,
          provider: providerName,
          errorType: geocodingError.type,
          durationMs: responseTime,
        });

        // Check if we should try fallback
        if (!shouldTriggerFallback(geocodingError)) {
          // Error is not recoverable (e.g., invalid input)
          return { ok: false, error: geocodingError };
        }

        // Continue to next provider
      }
    }

    // 3. All providers failed
    this.metrics = {
      ...this.metrics,
      allProviderFailures: this.metrics.allProviderFailures + 1,
    };

    const allFailedError = createGeocodingError(
      'ALL_PROVIDERS_FAILED',
      'All geocoding providers failed',
      {
        correlationId,
        failedProviders,
        errors,
      }
    );

    logger.error('All geocoding providers failed', {
      correlationId,
      query,
      failedProviders,
      errorCount: errors.length,
      durationMs: Date.now() - startTime,
    });

    return { ok: false, error: allFailedError };
  }

  /**
   * Get health status of all providers
   * @returns Array of provider health statuses
   */
  getProviderHealth(): ProviderHealth[] {
    const healthStatuses: ProviderHealth[] = [];

    for (const providerName of this.providerOrder) {
      const circuitBreaker = this.circuitBreakers.get(providerName);
      if (circuitBreaker) {
        healthStatuses.push(circuitBreaker.getHealth());
      }
    }

    return healthStatuses;
  }

  /**
   * Reset circuit breaker for a specific provider
   * @param provider - Provider name to reset
   */
  resetCircuitBreaker(provider: GeocodingProviderName): void {
    const circuitBreaker = this.circuitBreakers.get(provider);
    if (circuitBreaker) {
      circuitBreaker.reset();
    }
  }

  /**
   * Reset all circuit breakers
   */
  resetAllCircuitBreakers(): void {
    this.circuitBreakers.forEach((circuitBreaker) => {
      circuitBreaker.reset();
    });
  }

  /**
   * Get current orchestrator metrics
   * @returns Orchestrator metrics
   */
  getMetrics(): OrchestratorMetrics {
    return { ...this.metrics };
  }

  /**
   * Get cache statistics
   * @returns Cache statistics
   */
  getCacheStats() {
    return this.cache.getStats();
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
    logger.debug('Geocoding orchestrator cache cleared');
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a new geocoding orchestrator
 *
 * @param providers - Array of geocoding providers
 * @param config - Optional orchestrator configuration
 * @returns Configured GeocodingOrchestrator instance
 *
 * @example
 * ```typescript
 * const orchestrator = createGeocodingOrchestrator(
 *   [photonProvider, radarProvider],
 *   { enableCache: true, cacheTtl: 3600000 }
 * );
 * ```
 */
export function createGeocodingOrchestrator(
  providers: GeocodingProvider[],
  config?: Partial<OrchestratorConfig>
): GeocodingOrchestrator {
  const cache = createGeocodingCache({
    ttlMs: config?.cacheTtl ?? DEFAULT_ORCHESTRATOR_CONFIG.cacheTtl,
    maxSize: 1000,
  });

  return new GeocodingOrchestrator(providers, cache, config);
}

/**
 * Singleton orchestrator instance
 */
let defaultOrchestrator: GeocodingOrchestrator | null = null;

/**
 * Get the default geocoding orchestrator (singleton)
 *
 * Note: This requires providers to be registered first via setDefaultProviders()
 *
 * @returns Default GeocodingOrchestrator instance
 * @throws Error if no providers are registered
 */
export function getDefaultOrchestrator(): GeocodingOrchestrator {
  if (!defaultOrchestrator) {
    throw new Error(
      'Default orchestrator not initialized. Call setDefaultProviders() first.'
    );
  }
  return defaultOrchestrator;
}

/**
 * Initialize the default orchestrator with providers
 *
 * @param providers - Array of geocoding providers
 * @param config - Optional orchestrator configuration
 * @returns Configured GeocodingOrchestrator instance
 *
 * @example
 * ```typescript
 * import { createPhotonProvider, createRadarProvider } from './providers';
 *
 * setDefaultProviders([
 *   createPhotonProvider(),
 *   createRadarProvider({ apiKey: process.env.RADAR_API_KEY })
 * ]);
 *
 * const orchestrator = getDefaultOrchestrator();
 * ```
 */
export function setDefaultProviders(
  providers: GeocodingProvider[],
  config?: Partial<OrchestratorConfig>
): GeocodingOrchestrator {
  if (defaultOrchestrator) {
    defaultOrchestrator.clearCache();
    defaultOrchestrator.resetAllCircuitBreakers();
  }

  const cache = getDefaultCache();
  defaultOrchestrator = new GeocodingOrchestrator(providers, cache, config);

  logger.info('Default geocoding orchestrator initialized', {
    providers: providers.map((p) => p.name),
    cacheEnabled: config?.enableCache ?? DEFAULT_ORCHESTRATOR_CONFIG.enableCache,
  });

  return defaultOrchestrator;
}

/**
 * Reset the default orchestrator (for testing)
 */
export function resetDefaultOrchestrator(): void {
  if (defaultOrchestrator) {
    defaultOrchestrator.clearCache();
    defaultOrchestrator.resetAllCircuitBreakers();
    defaultOrchestrator = null;
  }
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard to check if result is an error
 *
 * @param result - Orchestrator result
 * @returns True if result is an error
 *
 * @example
 * ```typescript
 * const result = await orchestrator.search('test');
 *
 * if (isOrchestratorError(result)) {
 *   console.error(result.error.message);
 * } else {
 *   console.log(result.suggestions);
 * }
 * ```
 */
export function isOrchestratorError(
  result: OrchestratorResult
): result is { readonly ok: false; readonly error: GeocodingError } {
  return 'ok' in result && result.ok === false;
}

/**
 * Type guard to check if result is successful
 *
 * @param result - Orchestrator result
 * @returns True if result is successful
 */
export function isOrchestratorSuccess(
  result: OrchestratorResult
): result is GeocodingSearchResult {
  return !('ok' in result);
}
