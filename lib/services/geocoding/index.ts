/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Geocoding Service - Public API
 * Multi-provider geocoding with fallback support
 *
 * This module provides the main entry point for geocoding functionality.
 * It includes backward-compatible functions that match the old API while
 * providing access to the new multi-provider orchestrator capabilities.
 *
 * @module lib/services/geocoding
 *
 * @example
 * ```typescript
 * // Basic usage (backward-compatible)
 * import { searchAddresses } from '@/lib/services/geocoding';
 *
 * const suggestions = await searchAddresses('Karlstraße 12 Karlsruhe');
 *
 * // With metadata
 * import { searchAddressesWithMetadata } from '@/lib/services/geocoding';
 *
 * const result = await searchAddressesWithMetadata('Karlstraße 12 Karlsruhe');
 * console.log(result.suggestions);
 * console.log(result.metadata.provider); // 'photon' or 'radar'
 *
 * // Debounced search for UI components
 * import { createDebouncedSearch } from '@/lib/services/geocoding';
 *
 * const debouncedSearch = createDebouncedSearch(300);
 * const suggestions = await debouncedSearch('Karl');
 * ```
 */

import { logger, generateCorrelationId } from '@/lib/logger';
import type {
  AddressSuggestion,
  GeocodingSearchOptions,
  GeocodingSearchResult,
  ProviderHealth,
  CacheStats,
} from './types';
import {
  GeocodingOrchestrator,
  setDefaultProviders,
  getDefaultOrchestrator,
  isOrchestratorError,
} from './orchestrator';
import { createPhotonProvider } from './providers/photon-provider';
import { createRadarProvider } from './providers/radar-provider';
import { getDefaultCache } from './cache';

// ============================================================================
// Lazy Initialization
// ============================================================================

/**
 * Track initialization state
 */
let initialized = false;

/**
 * Default configuration for the orchestrator
 */
const DEFAULT_ORCHESTRATOR_CONFIG = {
  enableCache: true,
  cacheTtl: 24 * 60 * 60 * 1000, // 24 hours
  providers: ['photon', 'radar'] as const,
} as const;

/**
 * Ensure the geocoding service is initialized
 *
 * This function is called automatically on first use.
 * It initializes the default providers (Photon + Radar)
 * and sets up the orchestrator with caching enabled.
 *
 * Thread-safe: Multiple calls will wait for initialization to complete.
 *
 * @internal
 */
function ensureInitialized(): void {
  if (initialized) {
    return;
  }

  try {
    // Create provider instances
    const photonProvider = createPhotonProvider();
    const radarProvider = createRadarProvider();

    // Initialize the default orchestrator
    setDefaultProviders([photonProvider, radarProvider], {
      enableCache: DEFAULT_ORCHESTRATOR_CONFIG.enableCache,
      cacheTtl: DEFAULT_ORCHESTRATOR_CONFIG.cacheTtl,
      providers: DEFAULT_ORCHESTRATOR_CONFIG.providers,
    });

    initialized = true;

    logger.info('Geocoding service initialized', {
      providers: ['photon', 'radar'],
      cacheEnabled: DEFAULT_ORCHESTRATOR_CONFIG.enableCache,
      cacheTtl: DEFAULT_ORCHESTRATOR_CONFIG.cacheTtl,
    });
  } catch (error) {
    logger.error('Failed to initialize geocoding service', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

// ============================================================================
// Backward-Compatible Public API
// ============================================================================

/**
 * Search for address suggestions
 *
 * This is the main entry point for geocoding. It automatically uses
 * the multi-provider orchestrator with fallback support.
 *
 * Results are automatically sorted to prioritize DACH region addresses
 * (Germany, Austria, Switzerland) with intelligent international limiting:
 * - DACH addresses always appear first (DE > AT > CH priority)
 * - International addresses limited to max 2 (only if < 8 DACH results)
 * - Total results capped at 8 for optimal UX
 *
 * @param query - Search query (e.g., "Karlstraße 12 Karlsruhe")
 * @param options - Optional configuration
 * @param options.limit - Maximum number of results (default: 8)
 * @param options.lang - Language code (default: 'de')
 * @param options.signal - AbortSignal for request cancellation
 * @param options.correlationId - Correlation ID for logging
 * @param options.restrictToDACH - Only return DACH region addresses (default: false)
 * @returns Array of address suggestions (DACH addresses prioritized)
 *
 * @example
 * ```typescript
 * // Basic search (prioritizes DACH addresses: DE > AT > CH)
 * const suggestions = await searchAddresses('Karl', { limit: 8 });
 *
 * // Restrict to DACH region only
 * const dachOnly = await searchAddresses('Karl', {
 *   limit: 5,
 *   restrictToDACH: true
 * });
 *
 * // With cancellation support
 * const controller = new AbortController();
 * const suggestions = await searchAddresses('Karl', {
 *   signal: controller.signal
 * });
 * ```
 */
export async function searchAddresses(
  query: string,
  options: {
    limit?: number;
    lang?: string;
    signal?: AbortSignal;
    correlationId?: string;
    restrictToDACH?: boolean;
  } = {}
): Promise<AddressSuggestion[]> {
  // Validate input early (before initialization)
  if (!query || query.trim().length < 3) {
    return [];
  }

  // Ensure service is initialized
  ensureInitialized();

  const correlationId = options.correlationId ?? generateCorrelationId();

  try {
    const orchestrator = getDefaultOrchestrator();

    const result = await orchestrator.search(query, {
      limit: options.limit,
      lang: options.lang,
      signal: options.signal,
      correlationId,
      restrictToDACH: options.restrictToDACH,
    });

    // Handle error result
    if (isOrchestratorError(result)) {
      logger.warn('Geocoding search failed', {
        correlationId,
        query,
        errorType: result.error.type,
        message: result.error.message,
      });
      return [];
    }

    // Return mutable array for backward compatibility
    return [...result.suggestions];
  } catch (error) {
    logger.error('Unexpected error during geocoding search', {
      correlationId,
      query,
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

/**
 * Debounced address search for use in UI components
 *
 * Creates a debounced version of searchAddresses that waits for user to stop typing.
 * Cancels previous requests when a new one is initiated.
 *
 * @param delayMs - Debounce delay in milliseconds (default: 300ms)
 * @returns Debounced search function
 *
 * @example
 * ```typescript
 * const debouncedSearch = createDebouncedSearch(300);
 *
 * // In your component:
 * const handleInputChange = async (value: string) => {
 *   const suggestions = await debouncedSearch(value);
 *   setSuggestions(suggestions);
 * };
 * ```
 */
export function createDebouncedSearch(
  delayMs: number = 300
): (query: string) => Promise<AddressSuggestion[]> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let abortController: AbortController | null = null;

  return (query: string): Promise<AddressSuggestion[]> => {
    // Cancel previous timeout
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    // Abort previous request
    if (abortController !== null) {
      abortController.abort();
    }

    return new Promise((resolve) => {
      timeoutId = setTimeout(async () => {
        abortController = new AbortController();

        try {
          const results = await searchAddresses(query, {
            signal: abortController.signal,
          });
          resolve(results);
        } catch (error) {
          // User cancelled search by typing more (or request timed out)
          if (error instanceof Error && error.name === 'AbortError') {
            logger.debug('Debounced search aborted (user still typing)', { query });
            resolve([]);
            return;
          }

          // Other errors - log as warning and return empty
          logger.warn('Debounced address search failed', {
            query,
            error: error instanceof Error ? error.message : String(error),
          });
          resolve([]);
        }
      }, delayMs);
    });
  };
}

// ============================================================================
// Extended API (New Features)
// ============================================================================

/**
 * Search for address suggestions with detailed metadata
 *
 * This extended version returns additional metadata about the search,
 * including which provider was used, whether fallback was triggered,
 * cache hit status, and timing information.
 *
 * @param query - Search query (e.g., "Karlstraße 12 Karlsruhe")
 * @param options - Search options
 * @returns Search result with suggestions and metadata
 *
 * @example
 * ```typescript
 * const result = await searchAddressesWithMetadata('Karlstraße 12');
 *
 * console.log(result.suggestions);
 * console.log(result.metadata.provider);      // 'photon' or 'radar'
 * console.log(result.metadata.fallbackUsed);  // true if primary failed
 * console.log(result.metadata.fromCache);     // true if cached
 * console.log(result.metadata.durationMs);    // request duration
 * ```
 */
export async function searchAddressesWithMetadata(
  query: string,
  options: GeocodingSearchOptions = {}
): Promise<GeocodingSearchResult> {
  // Validate input early
  if (!query || query.trim().length < 3) {
    return {
      suggestions: [],
      metadata: {
        provider: 'photon',
        fallbackUsed: false,
        durationMs: 0,
        correlationId: options.correlationId ?? generateCorrelationId(),
        fromCache: false,
        rawResultCount: 0,
        timestamp: new Date(),
      },
    };
  }

  // Ensure service is initialized
  ensureInitialized();

  const correlationId = options.correlationId ?? generateCorrelationId();

  try {
    const orchestrator = getDefaultOrchestrator();

    const result = await orchestrator.search(query, {
      ...options,
      correlationId,
    });

    // Handle error result
    if (isOrchestratorError(result)) {
      logger.warn('Geocoding search with metadata failed', {
        correlationId,
        query,
        errorType: result.error.type,
        message: result.error.message,
      });

      return {
        suggestions: [],
        metadata: {
          provider: 'photon',
          fallbackUsed: false,
          durationMs: 0,
          correlationId,
          fromCache: false,
          rawResultCount: 0,
          timestamp: new Date(),
        },
      };
    }

    return result;
  } catch (error) {
    logger.error('Unexpected error during geocoding search with metadata', {
      correlationId,
      query,
      error: error instanceof Error ? error.message : String(error),
    });

    return {
      suggestions: [],
      metadata: {
        provider: 'photon',
        fallbackUsed: false,
        durationMs: 0,
        correlationId,
        fromCache: false,
        rawResultCount: 0,
        timestamp: new Date(),
      },
    };
  }
}

/**
 * Get health status of all geocoding providers
 *
 * Returns detailed health information for each provider including:
 * - Availability status
 * - Consecutive failure count
 * - Average response time
 * - Success rate
 * - Last success/failure timestamps
 *
 * @returns Array of provider health statuses
 *
 * @example
 * ```typescript
 * const health = getGeocodingHealth();
 *
 * for (const provider of health) {
 *   console.log(`${provider.provider}: ${provider.isHealthy ? 'healthy' : 'unhealthy'}`);
 *   console.log(`  Success rate: ${provider.successRate}%`);
 *   console.log(`  Avg response: ${provider.avgResponseTimeMs}ms`);
 * }
 * ```
 */
export function getGeocodingHealth(): ProviderHealth[] {
  // Ensure service is initialized
  ensureInitialized();

  try {
    const orchestrator = getDefaultOrchestrator();
    return orchestrator.getProviderHealth();
  } catch (error) {
    logger.error('Failed to get geocoding health', {
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

/**
 * Get cache statistics for the geocoding service
 *
 * Returns statistics about the geocoding cache including:
 * - Hit/miss counts
 * - Hit rate percentage
 * - Current size and max size
 * - Eviction count
 *
 * @returns Cache statistics
 *
 * @example
 * ```typescript
 * const stats = getGeocodingCacheStats();
 *
 * console.log(`Cache hit rate: ${stats.hitRate}%`);
 * console.log(`Cache size: ${stats.size}/${stats.maxSize}`);
 * console.log(`Total hits: ${stats.hits}`);
 * ```
 */
export function getGeocodingCacheStats(): CacheStats {
  // Ensure service is initialized
  ensureInitialized();

  try {
    const orchestrator = getDefaultOrchestrator();
    return orchestrator.getCacheStats();
  } catch (error) {
    logger.error('Failed to get geocoding cache stats', {
      error: error instanceof Error ? error.message : String(error),
    });

    // Return empty stats on error
    return {
      hits: 0,
      misses: 0,
      size: 0,
      maxSize: 1000,
      hitRate: 0,
      evictions: 0,
    };
  }
}

/**
 * Clear the geocoding cache
 *
 * Removes all cached geocoding results. Useful for testing
 * or when you need fresh results from the provider.
 *
 * @example
 * ```typescript
 * clearGeocodingCache();
 * console.log('Cache cleared');
 * ```
 */
export function clearGeocodingCache(): void {
  // Ensure service is initialized
  ensureInitialized();

  try {
    const orchestrator = getDefaultOrchestrator();
    orchestrator.clearCache();
    logger.info('Geocoding cache cleared');
  } catch (error) {
    logger.error('Failed to clear geocoding cache', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Reset the geocoding service
 *
 * Resets all circuit breakers and clears the cache.
 * Use with caution - this will trigger re-initialization on next use.
 *
 * @internal For testing purposes
 */
export function resetGeocodingService(): void {
  if (initialized) {
    try {
      const orchestrator = getDefaultOrchestrator();
      orchestrator.clearCache();
      orchestrator.resetAllCircuitBreakers();
    } catch {
      // Ignore errors during reset
    }
  }

  initialized = false;
  logger.debug('Geocoding service reset');
}

// ============================================================================
// Type Re-exports
// ============================================================================

export type {
  AddressSuggestion,
  GeocodingProviderName,
  GeocodingSearchOptions,
  GeocodingSearchResult,
  GeocodingResultMetadata,
  ProviderHealth,
  CacheStats,
  CountryType,
} from './types';

// Re-export GeocodingProviderConfig from providers (not types.ts)
// The types.ts version has extra fields not used by actual providers
export type { GeocodingProviderConfig } from './providers/geocoding-provider';

// Errors - Export error utilities and type
// Note: GeocodingErrorType is the discriminated union from the new error system
export type { GeocodingError as GeocodingErrorType } from './errors';
export {
  GEOCODING_ERROR_CODES,
  createGeocodingError,
  shouldTriggerFallback,
  isRetryableError,
  isUserError,
  isServerError,
  getRetryDelay,
  getUserFriendlyMessage,
  exceptionToGeocodingError,
} from './errors';

/**
 * Legacy GeocodingError class for backward compatibility
 *
 * This class is maintained for backward compatibility with existing code
 * that uses `instanceof GeocodingError` checks. The new error system uses
 * a discriminated union type (GeocodingErrorType) instead.
 *
 * @example
 * ```typescript
 * // Old pattern (still works for backward compatibility)
 * try {
 *   await searchAddresses('...');
 * } catch (error) {
 *   if (error instanceof GeocodingError) {
 *     console.log(error.code, error.correlationId);
 *   }
 * }
 *
 * // New pattern (recommended)
 * const result = await searchAddressesWithMetadata('...');
 * // Errors are handled internally, empty results returned on failure
 * ```
 */
export class GeocodingError extends Error {
  public readonly correlationId: string;
  public readonly code: 'NETWORK_ERROR' | 'INVALID_RESPONSE' | 'NO_RESULTS' | 'TIMEOUT';

  constructor(
    message: string,
    code: 'NETWORK_ERROR' | 'INVALID_RESPONSE' | 'NO_RESULTS' | 'TIMEOUT',
    correlationId?: string
  ) {
    super(message);
    this.name = 'GeocodingError';
    this.code = code;
    this.correlationId = correlationId ?? '';

    // Maintain proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, GeocodingError.prototype);
  }
}

// Cache (for advanced usage)
export type { GeocodingCache, GeocodingCacheConfig } from './cache';
export {
  createGeocodingCache,
  getDefaultCache,
  resetDefaultCache,
  generateCacheKey,
} from './cache';

// DACH Prioritization utilities
export {
  getCountryType,
  isDACHAddress,
  prioritizeDACHAddresses,
  getAddressStats,
  filterDACHAddresses,
  sortByCountryPriority,
} from './utils/dach-prioritizer';

// Providers (for custom orchestrator setup)
// GeocodingProvider from providers/geocoding-provider.ts is the actual interface
// used by provider implementations (different from types.ts version)
export type { GeocodingProviderResult, GeocodingProvider } from './providers';
export {
  DEFAULT_PROVIDER_CONFIG,
  createProviderConfig,
  PhotonProvider,
  createPhotonProvider,
  RadarProvider,
  createRadarProvider,
} from './providers';

// Orchestrator (for advanced usage)
export type {
  CircuitBreakerConfig,
  OrchestratorConfig,
  OrchestratorResult,
  OrchestratorMetrics,
} from './orchestrator';
export {
  CircuitBreaker,
  GeocodingOrchestrator,
  createGeocodingOrchestrator,
  getDefaultOrchestrator,
  setDefaultProviders,
  resetDefaultOrchestrator,
  isOrchestratorError,
  isOrchestratorSuccess,
} from './orchestrator';
