/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Tests for Geocoding Cache
 *
 * @module __tests__/lib/services/geocoding/cache.test
 */

import {
  createGeocodingCache,
  getDefaultCache,
  resetDefaultCache,
  generateCacheKey,
  type GeocodingCache,
} from '@/lib/services/geocoding/cache';
import type { AddressSuggestion, GeocodingSearchOptions } from '@/lib/services/geocoding/types';

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
function createMockSuggestion(overrides: Partial<AddressSuggestion> = {}): AddressSuggestion {
  return {
    street: 'Karlstrasse 10',
    city: 'Karlsruhe',
    postalCode: '76133',
    country: 'Deutschland',
    displayText: 'Karlstrasse 10, 76133 Karlsruhe',
    lat: 49.009,
    lng: 8.404,
    ...overrides,
  };
}

describe('GeocodingCache', () => {
  let cache: GeocodingCache;

  beforeEach(() => {
    // Create fresh cache for each test
    cache = createGeocodingCache({
      ttlMs: 1000, // 1 second TTL for faster tests
      maxSize: 5,  // Small size for easier LRU testing
    });
  });

  afterEach(() => {
    resetDefaultCache();
  });

  describe('set and get', () => {
    it('should store and retrieve cached suggestions', () => {
      const suggestions = [createMockSuggestion()];
      const key = 'test-key';

      cache.set(key, suggestions);
      const result = cache.get(key);

      expect(result).toEqual(suggestions);
      expect(result).toHaveLength(1);
    });

    it('should return null for non-existent keys', () => {
      const result = cache.get('non-existent-key');
      expect(result).toBeNull();
    });

    it('should store multiple suggestions correctly', () => {
      const suggestions = [
        createMockSuggestion({ street: 'Strasse 1' }),
        createMockSuggestion({ street: 'Strasse 2' }),
        createMockSuggestion({ street: 'Strasse 3' }),
      ];
      const key = 'multi-key';

      cache.set(key, suggestions);
      const result = cache.get(key);

      expect(result).toHaveLength(3);
      expect(result![0].street).toBe('Strasse 1');
      expect(result![2].street).toBe('Strasse 3');
    });

    it('should overwrite existing entries with same key', () => {
      const key = 'overwrite-key';
      const original = [createMockSuggestion({ street: 'Original' })];
      const updated = [createMockSuggestion({ street: 'Updated' })];

      cache.set(key, original);
      cache.set(key, updated);
      const result = cache.get(key);

      expect(result).toHaveLength(1);
      expect(result![0].street).toBe('Updated');
    });

    it('should store empty arrays', () => {
      const key = 'empty-key';
      cache.set(key, []);
      const result = cache.get(key);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('TTL (Time-To-Live)', () => {
    it('should return null for expired entries', async () => {
      const shortTtlCache = createGeocodingCache({
        ttlMs: 50, // 50ms TTL
        maxSize: 10,
      });

      const suggestions = [createMockSuggestion()];
      const key = 'ttl-test';

      shortTtlCache.set(key, suggestions);

      // Entry should be available immediately
      expect(shortTtlCache.get(key)).toEqual(suggestions);

      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 100));

      // Entry should be expired
      const result = shortTtlCache.get(key);
      expect(result).toBeNull();
    });

    it('should support custom TTL per entry', async () => {
      const suggestions = [createMockSuggestion()];
      const key = 'custom-ttl';

      // Set with very short custom TTL (30ms)
      cache.set(key, suggestions, 30);

      // Should be available immediately
      expect(cache.get(key)).toEqual(suggestions);

      // Wait for custom TTL to expire
      await new Promise(resolve => setTimeout(resolve, 50));

      // Should be expired
      expect(cache.get(key)).toBeNull();
    });

    it('should not return expired entries in has()', async () => {
      const shortTtlCache = createGeocodingCache({
        ttlMs: 30,
        maxSize: 10,
      });

      const key = 'has-test';
      shortTtlCache.set(key, [createMockSuggestion()]);

      expect(shortTtlCache.has(key)).toBe(true);

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(shortTtlCache.has(key)).toBe(false);
    });

    it('should update stats for expired entries (miss)', async () => {
      const shortTtlCache = createGeocodingCache({
        ttlMs: 30,
        maxSize: 10,
      });

      const key = 'stats-ttl';
      shortTtlCache.set(key, [createMockSuggestion()]);

      // First get is a hit
      shortTtlCache.get(key);
      let stats = shortTtlCache.getStats();
      expect(stats.hits).toBe(1);

      await new Promise(resolve => setTimeout(resolve, 50));

      // Second get after TTL is a miss
      shortTtlCache.get(key);
      stats = shortTtlCache.getStats();
      expect(stats.misses).toBe(1);
    });
  });

  describe('LRU Eviction', () => {
    it('should evict least recently used entry when max size is reached', () => {
      const smallCache = createGeocodingCache({
        ttlMs: 60000,
        maxSize: 3,
      });

      // Fill cache
      smallCache.set('key1', [createMockSuggestion({ street: 'Street 1' })]);
      smallCache.set('key2', [createMockSuggestion({ street: 'Street 2' })]);
      smallCache.set('key3', [createMockSuggestion({ street: 'Street 3' })]);

      // All three should exist
      expect(smallCache.has('key1')).toBe(true);
      expect(smallCache.has('key2')).toBe(true);
      expect(smallCache.has('key3')).toBe(true);

      // Add fourth entry - should evict key1 (oldest)
      smallCache.set('key4', [createMockSuggestion({ street: 'Street 4' })]);

      // key1 should be evicted
      expect(smallCache.has('key1')).toBe(false);
      expect(smallCache.has('key2')).toBe(true);
      expect(smallCache.has('key3')).toBe(true);
      expect(smallCache.has('key4')).toBe(true);
    });

    it('should update access time on get() and evict LRU correctly', async () => {
      const smallCache = createGeocodingCache({
        ttlMs: 60000,
        maxSize: 3,
      });

      // Fill cache with small delays to ensure different timestamps
      smallCache.set('key1', [createMockSuggestion({ street: 'Street 1' })]);
      await new Promise(resolve => setTimeout(resolve, 10));
      smallCache.set('key2', [createMockSuggestion({ street: 'Street 2' })]);
      await new Promise(resolve => setTimeout(resolve, 10));
      smallCache.set('key3', [createMockSuggestion({ street: 'Street 3' })]);
      await new Promise(resolve => setTimeout(resolve, 10));

      // Access key1 to make it most recently used (updates lastAccessedAt)
      smallCache.get('key1');
      await new Promise(resolve => setTimeout(resolve, 10));

      // Add new entry - should evict key2 (least recently accessed, key1 was just accessed)
      smallCache.set('key4', [createMockSuggestion({ street: 'Street 4' })]);

      // key2 should be evicted (oldest access time among key1, key2, key3)
      expect(smallCache.has('key2')).toBe(false);
      // key1 should still exist (was accessed recently via get())
      expect(smallCache.has('key1')).toBe(true);
      expect(smallCache.has('key3')).toBe(true);
      expect(smallCache.has('key4')).toBe(true);
    });

    it('should track evictions in stats', () => {
      const smallCache = createGeocodingCache({
        ttlMs: 60000,
        maxSize: 2,
      });

      smallCache.set('key1', [createMockSuggestion()]);
      smallCache.set('key2', [createMockSuggestion()]);

      let stats = smallCache.getStats();
      expect(stats.evictions).toBe(0);

      // Trigger eviction
      smallCache.set('key3', [createMockSuggestion()]);

      stats = smallCache.getStats();
      expect(stats.evictions).toBe(1);
    });
  });

  describe('generateKey', () => {
    it('should generate consistent keys for same query and options', () => {
      const key1 = cache.generateKey('karlstrasse', { limit: 8, lang: 'de' });
      const key2 = cache.generateKey('karlstrasse', { limit: 8, lang: 'de' });

      expect(key1).toBe(key2);
    });

    it('should normalize query (lowercase and trim)', () => {
      const key1 = cache.generateKey('  Karlstrasse  ');
      const key2 = cache.generateKey('karlstrasse');

      expect(key1).toBe(key2);
    });

    it('should generate different keys for different queries', () => {
      const key1 = cache.generateKey('karlstrasse');
      const key2 = cache.generateKey('hauptstrasse');

      expect(key1).not.toBe(key2);
    });

    it('should generate different keys for different options', () => {
      const key1 = cache.generateKey('test', { limit: 5 });
      const key2 = cache.generateKey('test', { limit: 10 });

      expect(key1).not.toBe(key2);
    });

    it('should include language in key', () => {
      const key1 = cache.generateKey('test', { lang: 'de' });
      const key2 = cache.generateKey('test', { lang: 'en' });

      expect(key1).not.toBe(key2);
    });

    it('should include restrictToDACH in key', () => {
      const key1 = cache.generateKey('test', { restrictToDACH: true });
      const key2 = cache.generateKey('test', { restrictToDACH: false });

      expect(key1).not.toBe(key2);
    });

    it('should use default values when options not provided', () => {
      const key1 = cache.generateKey('test');
      const key2 = cache.generateKey('test', { limit: 8, lang: 'de', restrictToDACH: false });

      expect(key1).toBe(key2);
    });

    it('should work with standalone generateCacheKey function', () => {
      const standalone = generateCacheKey('test', { limit: 5 });
      const fromCache = cache.generateKey('test', { limit: 5 });

      expect(standalone).toBe(fromCache);
    });
  });

  describe('stats', () => {
    it('should track hits and misses correctly', () => {
      const key = 'stats-test';
      cache.set(key, [createMockSuggestion()]);

      // Miss (key doesn't exist)
      cache.get('non-existent');
      let stats = cache.getStats();
      expect(stats.misses).toBe(1);
      expect(stats.hits).toBe(0);

      // Hit (key exists)
      cache.get(key);
      stats = cache.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);

      // Another hit
      cache.get(key);
      stats = cache.getStats();
      expect(stats.hits).toBe(2);
    });

    it('should calculate hit rate correctly', () => {
      cache.set('key1', [createMockSuggestion()]);

      // 2 hits
      cache.get('key1');
      cache.get('key1');

      // 2 misses
      cache.get('miss1');
      cache.get('miss2');

      const stats = cache.getStats();
      expect(stats.hitRate).toBe(50); // 2 hits / 4 total = 50%
    });

    it('should return 0 hit rate when no requests', () => {
      const stats = cache.getStats();
      expect(stats.hitRate).toBe(0);
    });

    it('should report current size correctly', () => {
      expect(cache.getStats().size).toBe(0);

      cache.set('key1', [createMockSuggestion()]);
      expect(cache.getStats().size).toBe(1);

      cache.set('key2', [createMockSuggestion()]);
      expect(cache.getStats().size).toBe(2);
    });

    it('should report maxSize correctly', () => {
      const stats = cache.getStats();
      expect(stats.maxSize).toBe(5);
    });
  });

  describe('has', () => {
    it('should return true for existing keys', () => {
      cache.set('existing', [createMockSuggestion()]);
      expect(cache.has('existing')).toBe(true);
    });

    it('should return false for non-existing keys', () => {
      expect(cache.has('non-existing')).toBe(false);
    });

    it('should not update access time (no LRU side effect)', () => {
      const smallCache = createGeocodingCache({
        ttlMs: 60000,
        maxSize: 2,
      });

      smallCache.set('key1', [createMockSuggestion()]);
      smallCache.set('key2', [createMockSuggestion()]);

      // has() should not update access time
      smallCache.has('key1');
      smallCache.has('key1');
      smallCache.has('key1');

      // Adding key3 should still evict key1 (oldest by set time)
      smallCache.set('key3', [createMockSuggestion()]);

      expect(smallCache.has('key1')).toBe(false);
    });
  });

  describe('delete', () => {
    it('should remove existing entries', () => {
      const key = 'delete-test';
      cache.set(key, [createMockSuggestion()]);

      expect(cache.has(key)).toBe(true);
      const deleted = cache.delete(key);
      expect(deleted).toBe(true);
      expect(cache.has(key)).toBe(false);
    });

    it('should return false for non-existing entries', () => {
      const deleted = cache.delete('non-existing');
      expect(deleted).toBe(false);
    });
  });

  describe('clear', () => {
    it('should remove all entries', () => {
      cache.set('key1', [createMockSuggestion()]);
      cache.set('key2', [createMockSuggestion()]);
      cache.set('key3', [createMockSuggestion()]);

      expect(cache.getStats().size).toBe(3);

      cache.clear();

      expect(cache.getStats().size).toBe(0);
      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key2')).toBe(false);
      expect(cache.has('key3')).toBe(false);
    });

    it('should reset stats', () => {
      cache.set('key1', [createMockSuggestion()]);
      cache.get('key1'); // hit
      cache.get('miss'); // miss

      cache.clear();

      const stats = cache.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.evictions).toBe(0);
    });
  });

  describe('getDefaultCache (singleton)', () => {
    beforeEach(() => {
      resetDefaultCache();
    });

    it('should return same instance on multiple calls', () => {
      const cache1 = getDefaultCache();
      const cache2 = getDefaultCache();

      expect(cache1).toBe(cache2);
    });

    it('should be usable after getting singleton', () => {
      const defaultCache = getDefaultCache();
      const key = 'singleton-test';

      defaultCache.set(key, [createMockSuggestion()]);
      expect(defaultCache.get(key)).toHaveLength(1);
    });

    it('should be reset correctly by resetDefaultCache', () => {
      const cache1 = getDefaultCache();
      cache1.set('test', [createMockSuggestion()]);

      resetDefaultCache();

      const cache2 = getDefaultCache();
      expect(cache2.get('test')).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('should handle special characters in keys', () => {
      const key = cache.generateKey('Munchner Strasse &%$#@!');
      cache.set(key, [createMockSuggestion()]);

      expect(cache.get(key)).toHaveLength(1);
    });

    it('should handle unicode characters', () => {
      const key = cache.generateKey('Munchen');
      cache.set(key, [createMockSuggestion({ city: 'Munchen' })]);

      expect(cache.get(key)![0].city).toBe('Munchen');
    });

    it('should handle very long queries', () => {
      const longQuery = 'a'.repeat(1000);
      const key = cache.generateKey(longQuery);

      cache.set(key, [createMockSuggestion()]);
      expect(cache.get(key)).toHaveLength(1);
    });

    it('should handle readonly arrays correctly', () => {
      const suggestions: readonly AddressSuggestion[] = Object.freeze([
        createMockSuggestion(),
      ]);

      cache.set('readonly-test', suggestions);
      const result = cache.get('readonly-test');

      expect(result).toEqual(suggestions);
    });
  });
});
