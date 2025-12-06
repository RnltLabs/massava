/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Geocoding Provider - Abstract Interface
 * Defines the contract for all geocoding provider implementations
 *
 * @module lib/services/geocoding/providers/geocoding-provider
 */

import type { GeocodingError } from '../errors';
import type {
  AddressSuggestion,
  GeocodingSearchOptions,
  GeocodingProviderName,
  ProviderHealth,
} from '../types';

/**
 * Configuration for a geocoding provider
 * Immutable configuration passed during provider initialization
 */
export interface GeocodingProviderConfig {
  /** Request timeout in milliseconds */
  readonly timeout: number;
  /** Maximum number of retry attempts for transient failures */
  readonly maxRetries: number;
  /** Base URL for API requests */
  readonly baseUrl: string;
}

/**
 * Result type for provider search operations
 * Follows the Result pattern for type-safe error handling
 */
export type GeocodingProviderResult =
  | { readonly ok: true; readonly data: readonly AddressSuggestion[] }
  | { readonly ok: false; readonly error: GeocodingError };

/**
 * Geocoding Provider Interface
 *
 * All geocoding providers must implement this interface to ensure
 * consistent behavior across different geocoding services.
 *
 * Providers are responsible for:
 * - Making API requests to their respective services
 * - Transforming responses to the unified AddressSuggestion format
 * - Handling errors and converting them to GeocodingError types
 * - Tracking their own health status
 *
 * @example
 * ```typescript
 * class MyProvider implements GeocodingProvider {
 *   readonly name = 'myProvider' as const;
 *   readonly config: GeocodingProviderConfig;
 *
 *   async search(query: string, options: GeocodingSearchOptions) {
 *     // Implementation
 *   }
 * }
 * ```
 */
export interface GeocodingProvider {
  /**
   * Unique provider identifier
   * Used for logging, metrics, and fallback decisions
   */
  readonly name: GeocodingProviderName;

  /**
   * Provider configuration
   * Immutable after initialization
   */
  readonly config: GeocodingProviderConfig;

  /**
   * Search for address suggestions
   *
   * @param query - Search query string (minimum 2-3 characters)
   * @param options - Search options including limit, language, timeout
   * @returns Result with address suggestions or error
   *
   * @example
   * ```typescript
   * const result = await provider.search('Karlstraße 12', {
   *   limit: 8,
   *   lang: 'de',
   *   correlationId: 'abc-123',
   * });
   *
   * if (result.ok) {
   *   console.log(result.data);
   * } else {
   *   console.error(result.error);
   * }
   * ```
   */
  search(
    query: string,
    options: GeocodingSearchOptions
  ): Promise<GeocodingProviderResult>;

  /**
   * Check if the provider is currently available
   *
   * Returns false if:
   * - Circuit breaker is open (too many failures)
   * - Provider is in maintenance mode
   * - Rate limit is exceeded
   *
   * @returns True if provider can accept requests
   */
  isAvailable(): boolean;

  /**
   * Get detailed health status of the provider
   *
   * Includes metrics like:
   * - Consecutive failures count
   * - Average response time
   * - Success rate
   * - Last success/failure timestamps
   *
   * @returns Provider health status object
   */
  getHealth(): ProviderHealth;
}

/**
 * Default configuration values for providers
 */
export const DEFAULT_PROVIDER_CONFIG: Readonly<GeocodingProviderConfig> = {
  timeout: 5000,
  maxRetries: 2,
  baseUrl: '',
} as const;

/**
 * Create a new provider configuration with defaults
 *
 * @param partial - Partial configuration to merge with defaults
 * @returns Complete provider configuration
 */
export function createProviderConfig(
  partial: Partial<GeocodingProviderConfig> & { readonly baseUrl: string }
): GeocodingProviderConfig {
  return {
    timeout: partial.timeout ?? DEFAULT_PROVIDER_CONFIG.timeout,
    maxRetries: partial.maxRetries ?? DEFAULT_PROVIDER_CONFIG.maxRetries,
    baseUrl: partial.baseUrl,
  };
}
