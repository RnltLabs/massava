/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Geocoding Service - Shared Types
 * Foundation for multi-provider geocoding with fallback support
 *
 * @module lib/services/geocoding/types
 */

/**
 * Supported geocoding provider names
 * - photon: Free, OSM-based, no API key required
 * - radar: Commercial provider with better accuracy, requires API key
 */
export type GeocodingProviderName = 'photon' | 'radar';

/**
 * Address suggestion structure returned to UI components
 * Unified format across all geocoding providers
 */
export interface AddressSuggestion {
  /** Street name with optional house number */
  readonly street: string;
  /** City or locality name */
  readonly city: string;
  /** Postal/ZIP code */
  readonly postalCode: string;
  /** Country name (full name, not ISO code) */
  readonly country: string;
  /** Human-readable display text for UI */
  readonly displayText: string;
  /** Latitude coordinate (WGS84) */
  readonly lat: number;
  /** Longitude coordinate (WGS84) */
  readonly lng: number;
}

/**
 * Options for geocoding search requests
 */
export interface GeocodingSearchOptions {
  /** Maximum number of results to return (default: 8) */
  readonly limit?: number;
  /** Language code for results (default: 'de') */
  readonly lang?: string;
  /** AbortSignal for request cancellation */
  readonly signal?: AbortSignal;
  /** Correlation ID for request tracing and logging */
  readonly correlationId?: string;
  /** Only return results from DACH region (DE, AT, CH) */
  readonly restrictToDACH?: boolean;
  /** Timeout in milliseconds (default: 5000) */
  readonly timeout?: number;
  /** Skip cache lookup (for testing/debugging) */
  readonly skipCache?: boolean;
}

/**
 * Health status of a geocoding provider
 * Used for intelligent provider selection and fallback decisions
 */
export interface ProviderHealth {
  /** Provider name */
  readonly provider: GeocodingProviderName;
  /** Whether the provider is currently available */
  readonly isHealthy: boolean;
  /** Number of consecutive failures */
  readonly consecutiveFailures: number;
  /** Timestamp of last successful request */
  readonly lastSuccessAt: Date | null;
  /** Timestamp of last failed request */
  readonly lastFailureAt: Date | null;
  /** Average response time in milliseconds (rolling window) */
  readonly avgResponseTimeMs: number;
  /** Success rate percentage (0-100) over rolling window */
  readonly successRate: number;
  /** Timestamp when provider will be available again (after circuit breaker) */
  readonly availableAt: Date | null;
}

/**
 * Metadata about a geocoding search result
 * Includes provider information and performance metrics
 */
export interface GeocodingResultMetadata {
  /** Provider that returned the results */
  readonly provider: GeocodingProviderName;
  /** Whether fallback provider was used */
  readonly fallbackUsed: boolean;
  /** Original provider that failed (if fallback was used) */
  readonly originalProvider?: GeocodingProviderName;
  /** Request duration in milliseconds */
  readonly durationMs: number;
  /** Correlation ID for request tracing */
  readonly correlationId: string;
  /** Whether result was served from cache */
  readonly fromCache: boolean;
  /** Number of results before DACH prioritization */
  readonly rawResultCount: number;
  /** Timestamp of the request */
  readonly timestamp: Date;
}

/**
 * Complete geocoding search result with metadata
 * Includes both the address suggestions and request metadata
 */
export interface GeocodingSearchResult {
  /** Array of address suggestions */
  readonly suggestions: readonly AddressSuggestion[];
  /** Request and response metadata */
  readonly metadata: GeocodingResultMetadata;
}

/**
 * Extended configuration for a geocoding provider
 *
 * This is used for advanced configuration scenarios.
 * For the basic provider configuration, see GeocodingProviderConfig
 * in providers/geocoding-provider.ts
 *
 * @deprecated Use GeocodingProviderConfig from providers/geocoding-provider.ts
 */
export interface GeocodingProviderConfigExtended {
  /** Provider name */
  readonly name: GeocodingProviderName;
  /** Base URL for API requests */
  readonly baseUrl: string;
  /** Request timeout in milliseconds */
  readonly timeout: number;
  /** Default result limit */
  readonly defaultLimit: number;
  /** Default language code */
  readonly defaultLang: string;
  /** API key (if required) */
  readonly apiKey?: string;
  /** Priority for provider selection (lower = higher priority) */
  readonly priority: number;
  /** Whether this provider is enabled */
  readonly enabled: boolean;
}

/**
 * Cache statistics for monitoring
 */
export interface CacheStats {
  /** Total cache hits */
  readonly hits: number;
  /** Total cache misses */
  readonly misses: number;
  /** Current number of entries in cache */
  readonly size: number;
  /** Maximum cache size */
  readonly maxSize: number;
  /** Hit rate percentage (0-100) */
  readonly hitRate: number;
  /** Number of evicted entries */
  readonly evictions: number;
}

/**
 * Country classification for DACH region
 */
export type CountryType = 'DE' | 'AT' | 'CH' | 'INTERNATIONAL';
