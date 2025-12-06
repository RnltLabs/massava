/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Geocoding Service - In-Memory Cache
 * LRU cache with TTL support for geocoding results
 *
 * @module lib/services/geocoding/cache
 */

import { logger } from '@/lib/logger';
import type { AddressSuggestion, CacheStats, GeocodingSearchOptions } from './types';

/**
 * Default cache configuration
 */
const DEFAULT_CONFIG = {
  /** Time-to-live in milliseconds (24 hours) */
  ttlMs: 24 * 60 * 60 * 1000,
  /** Maximum number of entries */
  maxSize: 1000,
} as const;

/**
 * Cache entry with metadata
 */
interface CacheEntry {
  /** Cached address suggestions */
  readonly value: readonly AddressSuggestion[];
  /** Timestamp when entry was created */
  readonly createdAt: number;
  /** Timestamp when entry expires */
  readonly expiresAt: number;
  /** Last access timestamp (for LRU) */
  lastAccessedAt: number;
}

/**
 * Internal cache state
 */
interface CacheState {
  /** Map of cache key to entry */
  entries: Map<string, CacheEntry>;
  /** Total cache hits */
  hits: number;
  /** Total cache misses */
  misses: number;
  /** Total evictions */
  evictions: number;
}

/**
 * Generate a cache key from query and options
 *
 * @param query - Search query string
 * @param options - Search options
 * @returns Unique cache key
 */
function generateCacheKey(query: string, options?: GeocodingSearchOptions): string {
  const normalizedQuery = query.trim().toLowerCase();
  const limit = options?.limit ?? 8;
  const lang = options?.lang ?? 'de';
  const restrictToDACH = options?.restrictToDACH ?? false;

  // Create a deterministic key from query and relevant options
  return `${normalizedQuery}|${limit}|${lang}|${restrictToDACH}`;
}

/**
 * In-memory LRU cache for geocoding results
 *
 * Features:
 * - TTL-based expiration (default: 24 hours)
 * - LRU eviction when max size is reached
 * - Thread-safe for SSR (no shared mutable state between requests)
 * - Statistics for monitoring
 *
 * @example
 * ```typescript
 * const cache = createGeocodingCache({ ttlMs: 3600000, maxSize: 500 });
 *
 * // Check cache
 * const cached = cache.get('karlstr');
 * if (cached) {
 *   return cached;
 * }
 *
 * // Fetch and cache
 * const results = await fetchAddresses('karlstr');
 * cache.set('karlstr', results);
 * ```
 */
export interface GeocodingCache {
  /**
   * Get cached suggestions for a query
   * @param key - Cache key (use generateCacheKey)
   * @returns Cached suggestions or null if not found/expired
   */
  get(key: string): readonly AddressSuggestion[] | null;

  /**
   * Store suggestions in cache
   * @param key - Cache key
   * @param value - Address suggestions to cache
   * @param ttlMs - Optional custom TTL (overrides default)
   */
  set(key: string, value: readonly AddressSuggestion[], ttlMs?: number): void;

  /**
   * Check if a key exists in cache (without updating access time)
   * @param key - Cache key
   * @returns True if key exists and is not expired
   */
  has(key: string): boolean;

  /**
   * Remove a specific entry from cache
   * @param key - Cache key to remove
   * @returns True if entry was removed
   */
  delete(key: string): boolean;

  /**
   * Clear all entries from cache
   */
  clear(): void;

  /**
   * Get cache statistics
   * @returns Current cache statistics
   */
  getStats(): CacheStats;

  /**
   * Generate cache key from query and options
   * @param query - Search query
   * @param options - Search options
   * @returns Cache key
   */
  generateKey(query: string, options?: GeocodingSearchOptions): string;
}

/**
 * Configuration options for the geocoding cache
 */
export interface GeocodingCacheConfig {
  /** Time-to-live in milliseconds (default: 24 hours) */
  readonly ttlMs?: number;
  /** Maximum number of entries (default: 1000) */
  readonly maxSize?: number;
}

/**
 * Create a new geocoding cache instance
 *
 * @param config - Cache configuration
 * @returns GeocodingCache instance
 *
 * @example
 * ```typescript
 * // Default configuration (24h TTL, 1000 entries)
 * const cache = createGeocodingCache();
 *
 * // Custom configuration
 * const cache = createGeocodingCache({
 *   ttlMs: 60 * 60 * 1000, // 1 hour
 *   maxSize: 500
 * });
 * ```
 */
export function createGeocodingCache(config?: GeocodingCacheConfig): GeocodingCache {
  const ttlMs = config?.ttlMs ?? DEFAULT_CONFIG.ttlMs;
  const maxSize = config?.maxSize ?? DEFAULT_CONFIG.maxSize;

  // Internal state
  const state: CacheState = {
    entries: new Map(),
    hits: 0,
    misses: 0,
    evictions: 0,
  };

  /**
   * Remove expired entries
   */
  function removeExpired(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    state.entries.forEach((entry, key) => {
      if (entry.expiresAt <= now) {
        expiredKeys.push(key);
      }
    });

    for (const key of expiredKeys) {
      state.entries.delete(key);
      state.evictions++;
    }

    if (expiredKeys.length > 0) {
      logger.debug('Geocoding cache: removed expired entries', {
        count: expiredKeys.length,
      });
    }
  }

  /**
   * Evict least recently used entry
   */
  function evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    state.entries.forEach((entry, key) => {
      if (entry.lastAccessedAt < oldestTime) {
        oldestTime = entry.lastAccessedAt;
        oldestKey = key;
      }
    });

    if (oldestKey !== null) {
      state.entries.delete(oldestKey);
      state.evictions++;
      logger.debug('Geocoding cache: LRU eviction', { key: oldestKey });
    }
  }

  /**
   * Ensure cache doesn't exceed max size
   */
  function ensureCapacity(): void {
    // First, remove expired entries
    removeExpired();

    // Then evict LRU entries if still over capacity
    while (state.entries.size >= maxSize) {
      evictLRU();
    }
  }

  return {
    get(key: string): readonly AddressSuggestion[] | null {
      const entry = state.entries.get(key);

      // Entry not found
      if (!entry) {
        state.misses++;
        return null;
      }

      // Entry expired
      const now = Date.now();
      if (entry.expiresAt <= now) {
        state.entries.delete(key);
        state.misses++;
        return null;
      }

      // Update access time (for LRU)
      entry.lastAccessedAt = now;
      state.hits++;

      logger.debug('Geocoding cache hit', {
        key,
        age: now - entry.createdAt,
      });

      return entry.value;
    },

    set(key: string, value: readonly AddressSuggestion[], customTtlMs?: number): void {
      // Ensure we have space
      ensureCapacity();

      const now = Date.now();
      const entryTtl = customTtlMs ?? ttlMs;

      const entry: CacheEntry = {
        value,
        createdAt: now,
        expiresAt: now + entryTtl,
        lastAccessedAt: now,
      };

      state.entries.set(key, entry);

      logger.debug('Geocoding cache set', {
        key,
        resultCount: value.length,
        ttlMs: entryTtl,
        cacheSize: state.entries.size,
      });
    },

    has(key: string): boolean {
      const entry = state.entries.get(key);
      if (!entry) {
        return false;
      }

      // Check if expired
      if (entry.expiresAt <= Date.now()) {
        state.entries.delete(key);
        return false;
      }

      return true;
    },

    delete(key: string): boolean {
      return state.entries.delete(key);
    },

    clear(): void {
      const size = state.entries.size;
      state.entries.clear();
      state.hits = 0;
      state.misses = 0;
      state.evictions = 0;

      logger.debug('Geocoding cache cleared', { previousSize: size });
    },

    getStats(): CacheStats {
      // Remove expired entries before calculating stats
      removeExpired();

      const totalRequests = state.hits + state.misses;
      const hitRate = totalRequests > 0
        ? Math.round((state.hits / totalRequests) * 100)
        : 0;

      return {
        hits: state.hits,
        misses: state.misses,
        size: state.entries.size,
        maxSize,
        hitRate,
        evictions: state.evictions,
      };
    },

    generateKey: generateCacheKey,
  };
}

/**
 * Default singleton cache instance
 * Use this for most cases unless you need isolated cache
 */
let defaultCache: GeocodingCache | null = null;

/**
 * Get the default geocoding cache instance (singleton)
 *
 * @returns Default GeocodingCache instance
 *
 * @example
 * ```typescript
 * const cache = getDefaultCache();
 * const key = cache.generateKey('karlstr', { limit: 5 });
 * const cached = cache.get(key);
 * ```
 */
export function getDefaultCache(): GeocodingCache {
  if (!defaultCache) {
    defaultCache = createGeocodingCache();
    logger.debug('Geocoding default cache initialized', {
      ttlMs: DEFAULT_CONFIG.ttlMs,
      maxSize: DEFAULT_CONFIG.maxSize,
    });
  }
  return defaultCache;
}

/**
 * Reset the default cache (useful for testing)
 */
export function resetDefaultCache(): void {
  if (defaultCache) {
    defaultCache.clear();
    defaultCache = null;
  }
}

// Re-export generateCacheKey for direct usage
export { generateCacheKey };
