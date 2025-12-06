/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Geocoding Service - Backward Compatibility Layer
 *
 * @deprecated Import from '@/lib/services/geocoding' (the directory)
 * instead of '@/lib/services/geocoding.ts' (this file).
 *
 * This file is maintained solely for backward compatibility with existing
 * code that imports from the old path. All functionality has been migrated
 * to the new multi-provider geocoding module.
 *
 * Migration guide:
 * - Old: import { searchAddresses } from '@/lib/services/geocoding.ts'
 * - New: import { searchAddresses } from '@/lib/services/geocoding'
 *
 * New features available in the directory import:
 * - searchAddressesWithMetadata() - Search with provider/cache metadata
 * - getGeocodingHealth() - Provider health monitoring
 * - getGeocodingCacheStats() - Cache statistics
 * - Multi-provider support (Photon + Radar with automatic fallback)
 * - Circuit breaker pattern for fault tolerance
 * - LRU caching with 24-hour TTL
 *
 * @module lib/services/geocoding
 *
 * @example
 * ```typescript
 * // Old import (still works but deprecated)
 * import { searchAddresses, createDebouncedSearch } from '@/lib/services/geocoding.ts';
 *
 * // New import (recommended)
 * import {
 *   searchAddresses,
 *   createDebouncedSearch,
 *   searchAddressesWithMetadata,
 *   getGeocodingHealth,
 * } from '@/lib/services/geocoding';
 * ```
 */

// Re-export everything from the new module
// This ensures 100% backward compatibility

// Main functions (backward-compatible)
export {
  searchAddresses,
  createDebouncedSearch,
} from './geocoding/index';

// Extended functions (new)
export {
  searchAddressesWithMetadata,
  getGeocodingHealth,
  getGeocodingCacheStats,
  clearGeocodingCache,
  resetGeocodingService,
} from './geocoding/index';

// Types (backward-compatible)
export type {
  AddressSuggestion,
  GeocodingProviderName,
  GeocodingSearchOptions,
  GeocodingSearchResult,
  GeocodingResultMetadata,
  ProviderHealth,
  GeocodingProviderConfig,
  GeocodingProvider,
  CacheStats,
  CountryType,
} from './geocoding/index';

// Error types and utilities
// GeocodingErrorType is the discriminated union from the new error system
export type { GeocodingErrorType } from './geocoding/index';

// GeocodingError is the legacy class for backward compatibility (instanceof checks)
export { GeocodingError } from './geocoding/index';

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
} from './geocoding/index';

// Cache utilities (advanced usage)
export type { GeocodingCache, GeocodingCacheConfig } from './geocoding/index';
export {
  createGeocodingCache,
  getDefaultCache,
  resetDefaultCache,
  generateCacheKey,
} from './geocoding/index';

// DACH prioritization utilities
export {
  getCountryType,
  isDACHAddress,
  prioritizeDACHAddresses,
  getAddressStats,
  filterDACHAddresses,
  sortByCountryPriority,
} from './geocoding/index';

// Provider utilities (advanced usage)
export type { GeocodingProviderResult } from './geocoding/index';
export {
  DEFAULT_PROVIDER_CONFIG,
  createProviderConfig,
  PhotonProvider,
  createPhotonProvider,
  RadarProvider,
  createRadarProvider,
} from './geocoding/index';

// Orchestrator utilities (advanced usage)
export type {
  CircuitBreakerConfig,
  OrchestratorConfig,
  OrchestratorResult,
  OrchestratorMetrics,
} from './geocoding/index';
export {
  CircuitBreaker,
  GeocodingOrchestrator,
  createGeocodingOrchestrator,
  getDefaultOrchestrator,
  setDefaultProviders,
  resetDefaultOrchestrator,
  isOrchestratorError,
  isOrchestratorSuccess,
} from './geocoding/index';

