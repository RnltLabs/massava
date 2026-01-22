/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

/**
 * Geocoding Service Integration Tests
 *
 * Tests for the backward-compatible geocoding service wrapper.
 * This tests the integration with the orchestrator and providers.
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import {
  searchAddresses,
  createDebouncedSearch,
  GeocodingError,
  type AddressSuggestion,
  resetGeocodingService,
} from '@/lib/services/geocoding';

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

// Mock fetch globally for provider tests
global.fetch = jest.fn() as jest.Mock;

describe('Geocoding Service (Integration)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetGeocodingService();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('searchAddresses', () => {
    it('should return empty array for queries shorter than 3 characters', async () => {
      const result = await searchAddresses('Ka');
      expect(result).toEqual([]);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should search addresses via orchestrator', async () => {
      const mockResponse = {
        features: [
          {
            properties: {
              name: 'Karlstraße',
              housenumber: '12',
              street: 'Karlstraße',
              postcode: '76133',
              city: 'Karlsruhe',
              country: 'Deutschland',
            },
            geometry: {
              coordinates: [8.403653, 49.009],
              type: 'Point',
            },
          },
        ],
        type: 'FeatureCollection',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const results = await searchAddresses('Karl');

      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        street: expect.any(String),
        city: 'Karlsruhe',
        postalCode: '76133',
        country: 'Deutschland',
        displayText: expect.any(String),
      });
    });

    it('should return empty array on error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new TypeError('Network error'));

      // The wrapper returns empty array on error (backward compatible behavior)
      const results = await searchAddresses('Test');
      expect(results).toEqual([]);
    });

    it('should pass options to provider', async () => {
      const mockResponse = {
        features: [],
        type: 'FeatureCollection',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await searchAddresses('Test', { limit: 5, lang: 'en' });

      // Verify fetch was called (provider integration)
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe('createDebouncedSearch', () => {
    it('should create a debounced search function', () => {
      const debouncedSearch = createDebouncedSearch(100);
      expect(typeof debouncedSearch).toBe('function');
    });

    it('should return results after debounce delay', async () => {
      const mockResponse = {
        features: [
          {
            properties: {
              name: 'Test',
              street: 'Test',
              city: 'City',
              country: 'Deutschland',
            },
            geometry: {
              coordinates: [9.177, 48.777],
              type: 'Point',
            },
          },
        ],
        type: 'FeatureCollection',
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const debouncedSearch = createDebouncedSearch(10);
      const result = await debouncedSearch('Test');

      expect(Array.isArray(result)).toBe(true);
    });

    it('should return empty array on error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const debouncedSearch = createDebouncedSearch(10);
      const result = await debouncedSearch('Test');

      expect(result).toEqual([]);
    });
  });

  describe('GeocodingError', () => {
    it('should be a class that can be instantiated', () => {
      expect(GeocodingError).toBeDefined();
      expect(typeof GeocodingError).toBe('function');
    });
  });
});
