/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

/**
 * Geocoding Service Tests
 *
 * Tests for Photon API integration and address autocomplete functionality.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  searchAddresses,
  createDebouncedSearch,
  GeocodingError,
  type AddressSuggestion,
} from '@/lib/services/geocoding';

// Mock fetch globally
global.fetch = vi.fn();

describe('Geocoding Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('searchAddresses', () => {
    it('should return empty array for queries shorter than 3 characters', async () => {
      const result = await searchAddresses('Ka');
      expect(result).toEqual([]);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should fetch addresses from Photon API', async () => {
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

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const results = await searchAddresses('Karl');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('photon.komoot.io'),
        expect.objectContaining({
          method: 'GET',
        })
      );

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        street: 'Karlstraße 12',
        city: 'Karlsruhe',
        postalCode: '76133',
        country: 'Deutschland',
        displayText: 'Karlstraße 12, 76133 Karlsruhe',
      });
    });

    it('should handle addresses without house numbers', async () => {
      const mockResponse = {
        features: [
          {
            properties: {
              name: 'Hauptstraße',
              street: 'Hauptstraße',
              postcode: '70173',
              city: 'Stuttgart',
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

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const results = await searchAddresses('Haupt');

      expect(results).toHaveLength(1);
      expect(results[0].street).toBe('Hauptstraße');
      expect(results[0].displayText).toBe('Hauptstraße, 70173 Stuttgart');
    });

    it('should handle addresses without postal codes', async () => {
      const mockResponse = {
        features: [
          {
            properties: {
              name: 'Teststraße',
              street: 'Teststraße',
              housenumber: '1',
              city: 'Teststadt',
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

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const results = await searchAddresses('Test');

      expect(results).toHaveLength(1);
      expect(results[0].postalCode).toBe('');
      expect(results[0].displayText).toBe('Teststraße 1, Teststadt');
    });

    it('should filter out invalid features without required fields', async () => {
      const mockResponse = {
        features: [
          {
            properties: {
              name: 'Valid Street',
              housenumber: '1',
              city: 'Valid City',
              postcode: '12345',
              country: 'Deutschland',
            },
            geometry: {
              coordinates: [9.177, 48.777],
              type: 'Point',
            },
          },
          {
            properties: {
              // Missing street/name and city
              postcode: '12345',
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

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const results = await searchAddresses('Valid');

      expect(results).toHaveLength(1);
      expect(results[0].street).toBe('Valid Street 1');
    });

    it('should throw GeocodingError on network failure', async () => {
      (global.fetch as any).mockRejectedValueOnce(new TypeError('Network error'));

      await expect(searchAddresses('Test')).rejects.toThrow(GeocodingError);
      await expect(searchAddresses('Test')).rejects.toThrow('Network error');
    });

    it('should throw GeocodingError on HTTP error', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(searchAddresses('Test')).rejects.toThrow(GeocodingError);
      await expect(searchAddresses('Test')).rejects.toThrow('status 500');
    });

    it('should throw GeocodingError on invalid response structure', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ invalid: 'response' }),
      });

      await expect(searchAddresses('Test')).rejects.toThrow(GeocodingError);
      await expect(searchAddresses('Test')).rejects.toThrow('Invalid response structure');
    });

    it('should handle timeout', async () => {
      (global.fetch as any).mockImplementationOnce(
        () =>
          new Promise((_, reject) => {
            setTimeout(() => {
              const error = new Error('Aborted');
              error.name = 'AbortError';
              reject(error);
            }, 100);
          })
      );

      await expect(searchAddresses('Test')).rejects.toThrow(GeocodingError);
    });

    it('should respect custom limit parameter', async () => {
      const mockResponse = {
        features: [],
        type: 'FeatureCollection',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await searchAddresses('Test', { limit: 3 });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('limit=3'),
        expect.any(Object)
      );
    });

    it('should respect custom language parameter', async () => {
      const mockResponse = {
        features: [],
        type: 'FeatureCollection',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await searchAddresses('Test', { lang: 'en' });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('lang=en'),
        expect.any(Object)
      );
    });
  });

  describe('createDebouncedSearch', () => {
    it('should debounce multiple rapid calls', async () => {
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

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const debouncedSearch = createDebouncedSearch(100);

      // Make 3 rapid calls
      const promise1 = debouncedSearch('Test 1');
      const promise2 = debouncedSearch('Test 2');
      const promise3 = debouncedSearch('Test 3');

      // Wait for all to complete
      await Promise.all([promise1, promise2, promise3]);

      // Should only have called fetch once (for the last query)
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('Test+3'),
        expect.any(Object)
      );
    });

    it('should return empty array on error', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const debouncedSearch = createDebouncedSearch(50);
      const result = await debouncedSearch('Test');

      expect(result).toEqual([]);
    });
  });

  describe('GeocodingError', () => {
    it('should create error with correct properties', () => {
      const error = new GeocodingError('Test error', 'NETWORK_ERROR');

      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('NETWORK_ERROR');
      expect(error.name).toBe('GeocodingError');
    });
  });
});
