/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Radar Geocoding Provider (Client-Side)
 * Commercial geocoding service with high accuracy
 *
 * This provider is designed for client-side usage and communicates
 * with the local API route proxy at /api/geocoding/radar.
 * The API key is securely stored on the server.
 *
 * API Documentation: https://radar.io/documentation/geocoding
 *
 * @module lib/services/geocoding/providers/radar-provider
 */

import { logger, generateCorrelationId } from '@/lib/logger';
import { createGeocodingError, exceptionToGeocodingError } from '../errors';
import type { GeocodingError } from '../errors';
import type {
  AddressSuggestion,
  GeocodingSearchOptions,
  ProviderHealth,
} from '../types';
import type {
  GeocodingProvider,
  GeocodingProviderConfig,
  GeocodingProviderResult,
} from './geocoding-provider';
import { createProviderConfig } from './geocoding-provider';

/**
 * Response structure from the local API route
 */
interface RadarProxyResponse {
  readonly ok: boolean;
  readonly data?: readonly AddressSuggestion[];
  readonly error?: {
    readonly type: string;
    readonly message: string;
  };
}

/**
 * Default configuration for Radar provider
 */
const RADAR_DEFAULTS = {
  // Local API route (server handles actual Radar API call)
  baseUrl: '/api/geocoding/radar',
  timeout: 8000, // Slightly higher to account for proxy overhead
  maxRetries: 1,
  defaultLimit: 8,
  defaultLang: 'de',
  minQueryLength: 2,
  // Circuit breaker settings
  failureThreshold: 3,
  recoveryTimeMs: 60000, // 1 minute (Radar is paid, give it more time)
} as const;

/**
 * Health tracking state
 */
interface HealthState {
  consecutiveFailures: number;
  lastSuccessAt: Date | null;
  lastFailureAt: Date | null;
  responseTimes: readonly number[];
  requestCount: number;
  successCount: number;
  circuitOpenUntil: Date | null;
}

/**
 * Radar Geocoding Provider Implementation (Client-Side)
 *
 * Features:
 * - Client-side provider using local API route proxy
 * - API key securely stored on server
 * - Higher accuracy than OSM-based services
 * - Rate limiting handled by server
 * - Circuit breaker pattern for resilience
 *
 * @example
 * ```typescript
 * const provider = new RadarProvider();
 *
 * const result = await provider.search('Karlstraße 12 Karlsruhe', {
 *   limit: 8,
 *   lang: 'de',
 * });
 *
 * if (result.ok) {
 *   console.log(result.data);
 * }
 * ```
 */
export class RadarProvider implements GeocodingProvider {
  readonly name = 'radar' as const;
  readonly config: GeocodingProviderConfig;

  private health: HealthState = {
    consecutiveFailures: 0,
    lastSuccessAt: null,
    lastFailureAt: null,
    responseTimes: [],
    requestCount: 0,
    successCount: 0,
    circuitOpenUntil: null,
  };

  /**
   * Create a new Radar provider instance
   *
   * @param config - Optional configuration overrides
   */
  constructor(config?: Partial<GeocodingProviderConfig>) {
    this.config = createProviderConfig({
      baseUrl: config?.baseUrl ?? RADAR_DEFAULTS.baseUrl,
      timeout: config?.timeout ?? RADAR_DEFAULTS.timeout,
      maxRetries: config?.maxRetries ?? RADAR_DEFAULTS.maxRetries,
    });
  }

  /**
   * Search for address suggestions using Radar API via local proxy
   *
   * @param query - Search query string
   * @param options - Search options
   * @returns Result with address suggestions or error
   */
  async search(
    query: string,
    options: GeocodingSearchOptions
  ): Promise<GeocodingProviderResult> {
    const correlationId = options.correlationId ?? generateCorrelationId();
    const limit = options.limit ?? RADAR_DEFAULTS.defaultLimit;
    const timeout = options.timeout ?? this.config.timeout;

    // Validate input
    const trimmedQuery = query.trim();
    if (trimmedQuery.length < RADAR_DEFAULTS.minQueryLength) {
      return {
        ok: false,
        error: createGeocodingError('INVALID_INPUT', 'Query too short', {
          correlationId,
          provider: this.name,
          field: 'query',
          value: trimmedQuery,
          constraint: `Minimum ${RADAR_DEFAULTS.minQueryLength} characters required`,
        }),
      };
    }

    // Check circuit breaker
    if (!this.isAvailable()) {
      return {
        ok: false,
        error: createGeocodingError(
          'PROVIDER_UNAVAILABLE',
          'Radar provider temporarily unavailable due to recent failures',
          {
            correlationId,
            provider: this.name,
            reason: 'Circuit breaker open',
            availableAt: this.health.circuitOpenUntil ?? undefined,
          }
        ),
      };
    }

    // Build URL with query parameters
    const url = new URL(this.config.baseUrl, window.location.origin);
    url.searchParams.set('query', trimmedQuery);
    url.searchParams.set('limit', String(limit));

    // Add DACH country restriction
    if (options.restrictToDACH !== false) {
      url.searchParams.set('countryCode', 'DE,AT,CH');
    }

    // Create abort controller for timeout
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), timeout);

    // Combine with user-provided signal
    const combinedSignal = options.signal
      ? this.combineAbortSignals(options.signal, abortController.signal)
      : abortController.signal;

    const startTime = Date.now();

    try {
      logger.debug('Radar: Fetching address suggestions via proxy', {
        correlationId,
        query: trimmedQuery,
        limit,
        restrictToDACH: options.restrictToDACH !== false,
      });

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'X-Correlation-ID': correlationId,
        },
        signal: combinedSignal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        this.recordFailure();
        return {
          ok: false,
          error: this.handleHttpError(response.status, correlationId),
        };
      }

      const data: RadarProxyResponse = await response.json();

      // Handle error response from proxy
      if (!data.ok || !data.data) {
        this.recordFailure();

        const errorType = data.error?.type ?? 'NETWORK_ERROR';
        const errorMessage = data.error?.message ?? 'Unknown error from proxy';

        return {
          ok: false,
          error: createGeocodingError(
            errorType as GeocodingError['type'],
            errorMessage,
            {
              correlationId,
              provider: this.name,
            }
          ),
        };
      }

      // Record success
      const duration = Date.now() - startTime;
      this.recordSuccess(duration);

      logger.debug('Radar: Successfully fetched address suggestions', {
        correlationId,
        query: trimmedQuery,
        resultCount: data.data.length,
        durationMs: duration,
      });

      return {
        ok: true,
        data: data.data,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      this.recordFailure();

      const geocodingError = exceptionToGeocodingError(
        error,
        this.name,
        correlationId
      );

      logger.warn('Radar: Request failed', {
        correlationId,
        query: trimmedQuery,
        errorType: geocodingError.type,
        message: geocodingError.message,
      });

      return {
        ok: false,
        error: geocodingError,
      };
    }
  }

  /**
   * Check if the provider is currently available
   *
   * @returns True if provider can accept requests
   */
  isAvailable(): boolean {
    // Check if circuit breaker is open
    if (this.health.circuitOpenUntil) {
      const now = new Date();
      if (now < this.health.circuitOpenUntil) {
        return false;
      }
      // Circuit breaker timeout expired, allow retry (half-open state)
      this.health = {
        ...this.health,
        circuitOpenUntil: null,
      };
    }

    return true;
  }

  /**
   * Get detailed health status of the provider
   *
   * @returns Provider health status
   */
  getHealth(): ProviderHealth {
    const avgResponseTimeMs =
      this.health.responseTimes.length > 0
        ? this.health.responseTimes.reduce((a, b) => a + b, 0) /
          this.health.responseTimes.length
        : 0;

    const successRate =
      this.health.requestCount > 0
        ? (this.health.successCount / this.health.requestCount) * 100
        : 100;

    return {
      provider: this.name,
      isHealthy: this.isAvailable() && this.health.consecutiveFailures < 2,
      consecutiveFailures: this.health.consecutiveFailures,
      lastSuccessAt: this.health.lastSuccessAt,
      lastFailureAt: this.health.lastFailureAt,
      avgResponseTimeMs: Math.round(avgResponseTimeMs),
      successRate: Math.round(successRate * 100) / 100,
      availableAt: this.health.circuitOpenUntil,
    };
  }

  /**
   * Handle HTTP error responses
   */
  private handleHttpError(statusCode: number, correlationId: string): GeocodingError {
    if (statusCode === 429) {
      return createGeocodingError('RATE_LIMITED', 'Radar API rate limit exceeded', {
        correlationId,
        provider: this.name,
        statusCode,
        retryAfterMs: 60000,
      });
    }

    if (statusCode === 401 || statusCode === 403) {
      return createGeocodingError(
        'PROVIDER_UNAVAILABLE',
        'Radar API authentication error',
        {
          correlationId,
          provider: this.name,
          statusCode,
          reason: 'Invalid or missing API key',
        }
      );
    }

    if (statusCode >= 500) {
      return createGeocodingError('PROVIDER_UNAVAILABLE', 'Radar API server error', {
        correlationId,
        provider: this.name,
        statusCode,
        reason: `HTTP ${statusCode}`,
      });
    }

    return createGeocodingError('NETWORK_ERROR', `Radar proxy returned ${statusCode}`, {
      correlationId,
      provider: this.name,
      statusCode,
    });
  }

  /**
   * Record a successful request
   */
  private recordSuccess(durationMs: number): void {
    // Keep only last 50 response times for rolling average
    const responseTimes = [...this.health.responseTimes, durationMs].slice(-50);

    this.health = {
      ...this.health,
      consecutiveFailures: 0,
      lastSuccessAt: new Date(),
      responseTimes,
      requestCount: this.health.requestCount + 1,
      successCount: this.health.successCount + 1,
      circuitOpenUntil: null,
    };
  }

  /**
   * Record a failed request
   */
  private recordFailure(): void {
    const consecutiveFailures = this.health.consecutiveFailures + 1;

    // Open circuit breaker if threshold exceeded
    let circuitOpenUntil: Date | null = null;
    if (consecutiveFailures >= RADAR_DEFAULTS.failureThreshold) {
      circuitOpenUntil = new Date(Date.now() + RADAR_DEFAULTS.recoveryTimeMs);
      logger.warn('Radar: Circuit breaker opened', {
        consecutiveFailures,
        recoveryTimeMs: RADAR_DEFAULTS.recoveryTimeMs,
        availableAt: circuitOpenUntil.toISOString(),
      });
    }

    this.health = {
      ...this.health,
      consecutiveFailures,
      lastFailureAt: new Date(),
      requestCount: this.health.requestCount + 1,
      circuitOpenUntil,
    };
  }

  /**
   * Combine multiple abort signals into one
   */
  private combineAbortSignals(...signals: AbortSignal[]): AbortSignal {
    const controller = new AbortController();

    for (const signal of signals) {
      if (signal.aborted) {
        controller.abort(signal.reason);
        break;
      }
      signal.addEventListener('abort', () => controller.abort(signal.reason), {
        once: true,
      });
    }

    return controller.signal;
  }
}

/**
 * Create a new Radar provider instance with default configuration
 *
 * @returns Configured RadarProvider instance
 */
export function createRadarProvider(
  config?: Partial<GeocodingProviderConfig>
): RadarProvider {
  return new RadarProvider(config);
}
