/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Photon Geocoding Provider
 * Free, OSM-based geocoding service by Komoot
 *
 * API Documentation: https://photon.komoot.io/
 * - No API key required
 * - No strict rate limits (be respectful)
 * - Based on OpenStreetMap data
 *
 * @module lib/services/geocoding/providers/photon-provider
 */

import { logger, generateCorrelationId } from '@/lib/logger';
import { createGeocodingError, exceptionToGeocodingError } from '../errors';
import type { GeocodingError } from '../errors';
import type {
  AddressSuggestion,
  GeocodingSearchOptions,
  ProviderHealth,
} from '../types';
import { prioritizeDACHAddresses } from '../utils/dach-prioritizer';
import type {
  GeocodingProvider,
  GeocodingProviderConfig,
  GeocodingProviderResult,
} from './geocoding-provider';
import { createProviderConfig } from './geocoding-provider';

/**
 * Photon API response structures
 */
interface PhotonFeatureProperties {
  readonly name?: string;
  readonly housenumber?: string;
  readonly street?: string;
  readonly postcode?: string;
  readonly city?: string;
  readonly country?: string;
  readonly state?: string;
  readonly district?: string;
  readonly locality?: string;
  readonly osm_key?: string;
  readonly osm_value?: string;
}

interface PhotonFeatureGeometry {
  readonly coordinates: readonly [number, number]; // [longitude, latitude]
  readonly type: 'Point';
}

interface PhotonFeature {
  readonly properties: PhotonFeatureProperties;
  readonly geometry: PhotonFeatureGeometry;
}

interface PhotonResponse {
  readonly features: readonly PhotonFeature[];
  readonly type: 'FeatureCollection';
}

/**
 * Default configuration for Photon provider
 */
const PHOTON_DEFAULTS = {
  baseUrl: 'https://photon.komoot.io/api/',
  timeout: 5000,
  maxRetries: 2,
  defaultLimit: 8,
  defaultLang: 'de',
  minQueryLength: 3,
  // Bounding box for DACH region: West(5.9), South(45.8), East(17.2), North(55.0)
  dachBbox: '5.9,45.8,17.2,55.0',
  // Circuit breaker settings
  failureThreshold: 5,
  recoveryTimeMs: 30000,
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
 * Transform Photon API feature to AddressSuggestion format
 *
 * @param feature - Photon API feature object
 * @returns Transformed address suggestion or null if invalid
 */
function transformPhotonFeature(feature: PhotonFeature): AddressSuggestion | null {
  const { properties, geometry } = feature;

  // Extract street information (prefer 'street' field, fallback to 'name')
  const streetName = properties.street || properties.name || '';
  const houseNumber = properties.housenumber || '';
  const street = houseNumber ? `${streetName} ${houseNumber}` : streetName;

  // Extract city information (multiple fallbacks)
  const city =
    properties.city ||
    properties.locality ||
    properties.district ||
    properties.state ||
    '';

  // Extract postal code
  const postalCode = properties.postcode || '';

  // Extract country
  const country = properties.country || 'Deutschland';

  // Extract coordinates (Photon returns [longitude, latitude])
  const [lng, lat] = geometry.coordinates;

  // Validate required fields
  if (!street || !city) {
    return null;
  }

  // Validate coordinates
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return null;
  }

  // Build display text
  const displayText = postalCode
    ? `${street}, ${postalCode} ${city}`
    : `${street}, ${city}`;

  return {
    street: street.trim(),
    city: city.trim(),
    postalCode: postalCode.trim(),
    country: country.trim(),
    displayText,
    lat,
    lng,
  };
}

/**
 * Photon Geocoding Provider Implementation
 *
 * Features:
 * - Free OSM-based geocoding
 * - No API key required
 * - DACH region prioritization
 * - Circuit breaker pattern for resilience
 * - Health tracking and metrics
 *
 * @example
 * ```typescript
 * const provider = new PhotonProvider();
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
export class PhotonProvider implements GeocodingProvider {
  readonly name = 'photon' as const;
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
   * Create a new Photon provider instance
   *
   * @param config - Optional configuration overrides
   */
  constructor(config?: Partial<GeocodingProviderConfig>) {
    this.config = createProviderConfig({
      baseUrl: config?.baseUrl ?? PHOTON_DEFAULTS.baseUrl,
      timeout: config?.timeout ?? PHOTON_DEFAULTS.timeout,
      maxRetries: config?.maxRetries ?? PHOTON_DEFAULTS.maxRetries,
    });
  }

  /**
   * Search for address suggestions using Photon API
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
    const limit = options.limit ?? PHOTON_DEFAULTS.defaultLimit;
    const lang = options.lang ?? PHOTON_DEFAULTS.defaultLang;
    const timeout = options.timeout ?? this.config.timeout;

    // Validate input
    const trimmedQuery = query.trim();
    if (trimmedQuery.length < PHOTON_DEFAULTS.minQueryLength) {
      return {
        ok: false,
        error: createGeocodingError('INVALID_INPUT', 'Query too short', {
          correlationId,
          provider: this.name,
          field: 'query',
          value: trimmedQuery,
          constraint: `Minimum ${PHOTON_DEFAULTS.minQueryLength} characters required`,
        }),
      };
    }

    // Check circuit breaker
    if (!this.isAvailable()) {
      return {
        ok: false,
        error: createGeocodingError(
          'PROVIDER_UNAVAILABLE',
          'Provider temporarily unavailable due to recent failures',
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
    const url = new URL(this.config.baseUrl);
    url.searchParams.set('q', trimmedQuery);
    url.searchParams.set('lang', lang);
    // Request more results than limit to allow for DACH prioritization
    url.searchParams.set('limit', String(Math.min(limit * 2, 20)));

    // Optional: Restrict results to DACH region using bounding box
    if (options.restrictToDACH) {
      url.searchParams.set('bbox', PHOTON_DEFAULTS.dachBbox);
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
      logger.debug('Photon: Fetching address suggestions', {
        correlationId,
        query: trimmedQuery,
        limit,
        lang,
        restrictToDACH: options.restrictToDACH ?? false,
      });

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          Accept: 'application/json',
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

      const data: PhotonResponse = await response.json();

      // Validate response structure
      if (!data.features || !Array.isArray(data.features)) {
        this.recordFailure();
        return {
          ok: false,
          error: createGeocodingError(
            'INVALID_RESPONSE',
            'Invalid response structure from Photon API',
            {
              correlationId,
              provider: this.name,
              expectedFormat: '{ features: PhotonFeature[] }',
              receivedData: JSON.stringify(data).slice(0, 200),
            }
          ),
        };
      }

      // Transform features to address suggestions
      const suggestions = data.features
        .map(transformPhotonFeature)
        .filter((suggestion): suggestion is AddressSuggestion => suggestion !== null);

      // Prioritize DACH addresses and limit results
      const prioritizedSuggestions = prioritizeDACHAddresses(suggestions, {
        maxResults: limit,
      });

      // Record success
      const duration = Date.now() - startTime;
      this.recordSuccess(duration);

      logger.debug('Photon: Successfully fetched address suggestions', {
        correlationId,
        query: trimmedQuery,
        rawResultCount: data.features.length,
        transformedCount: suggestions.length,
        finalCount: prioritizedSuggestions.length,
        durationMs: duration,
      });

      return {
        ok: true,
        data: prioritizedSuggestions,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      this.recordFailure();

      const geocodingError = exceptionToGeocodingError(
        error,
        this.name,
        correlationId
      );

      logger.warn('Photon: Request failed', {
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
      isHealthy: this.isAvailable() && this.health.consecutiveFailures < 3,
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
      return createGeocodingError('RATE_LIMITED', 'Photon API rate limit exceeded', {
        correlationId,
        provider: this.name,
        statusCode,
        retryAfterMs: 60000,
      });
    }

    if (statusCode >= 500) {
      return createGeocodingError('PROVIDER_UNAVAILABLE', 'Photon API server error', {
        correlationId,
        provider: this.name,
        statusCode,
        reason: `HTTP ${statusCode}`,
      });
    }

    return createGeocodingError('NETWORK_ERROR', `Photon API returned ${statusCode}`, {
      correlationId,
      provider: this.name,
      statusCode,
    });
  }

  /**
   * Record a successful request
   */
  private recordSuccess(durationMs: number): void {
    // Keep only last 100 response times for rolling average
    const responseTimes = [...this.health.responseTimes, durationMs].slice(-100);

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
    if (consecutiveFailures >= PHOTON_DEFAULTS.failureThreshold) {
      circuitOpenUntil = new Date(Date.now() + PHOTON_DEFAULTS.recoveryTimeMs);
      logger.warn('Photon: Circuit breaker opened', {
        consecutiveFailures,
        recoveryTimeMs: PHOTON_DEFAULTS.recoveryTimeMs,
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
 * Create a new Photon provider instance with default configuration
 *
 * @returns Configured PhotonProvider instance
 */
export function createPhotonProvider(
  config?: Partial<GeocodingProviderConfig>
): PhotonProvider {
  return new PhotonProvider(config);
}
