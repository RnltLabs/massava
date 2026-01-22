/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

import {
  getBoundingBox,
  isWithinBoundingBox,
  type BoundingBox,
} from '@/lib/geo/bounding-box';

describe('Bounding Box Utilities', () => {
  describe('getBoundingBox', () => {
    it('should calculate bounding box for a given radius', () => {
      // Munich coordinates
      const lat = 48.1351;
      const lng = 11.582;
      const radius = 10; // 10 km

      const box = getBoundingBox(lat, lng, radius);

      // Latitude delta should be approximately 10/111 ≈ 0.09
      expect(box.maxLat - box.minLat).toBeCloseTo(0.18, 2);
      expect(box.minLat).toBeLessThan(lat);
      expect(box.maxLat).toBeGreaterThan(lat);

      // Longitude delta varies by latitude, but should be reasonable
      expect(box.minLng).toBeLessThan(lng);
      expect(box.maxLng).toBeGreaterThan(lng);
    });

    it('should center the bounding box on the given coordinates', () => {
      const lat = 48.1351;
      const lng = 11.582;
      const radius = 5;

      const box = getBoundingBox(lat, lng, radius);

      // Center should be at the midpoint
      const centerLat = (box.minLat + box.maxLat) / 2;
      const centerLng = (box.minLng + box.maxLng) / 2;

      expect(centerLat).toBeCloseTo(lat, 6);
      expect(centerLng).toBeCloseTo(lng, 6);
    });

    it('should handle equatorial coordinates correctly', () => {
      // Near equator (latitude affects longitude delta)
      const lat = 0;
      const lng = 0;
      const radius = 10;

      const box = getBoundingBox(lat, lng, radius);

      // At equator, latitude and longitude deltas should be similar
      const latDelta = box.maxLat - box.minLat;
      const lngDelta = box.maxLng - box.minLng;

      expect(latDelta).toBeCloseTo(lngDelta, 1);
    });

    it('should handle high latitude coordinates (poles)', () => {
      // Near North Pole
      const lat = 80;
      const lng = 0;
      const radius = 10;

      const box = getBoundingBox(lat, lng, radius);

      // At high latitudes, longitude delta should be much larger than latitude delta
      const latDelta = box.maxLat - box.minLat;
      const lngDelta = box.maxLng - box.minLng;

      expect(lngDelta).toBeGreaterThan(latDelta);
    });

    it('should handle small radius (100m)', () => {
      const lat = 48.1351;
      const lng = 11.582;
      const radius = 0.1; // 100 meters

      const box = getBoundingBox(lat, lng, radius);

      // Should create a very small bounding box
      expect(box.maxLat - box.minLat).toBeLessThan(0.002);
      expect(box.maxLng - box.minLng).toBeLessThan(0.003);
    });

    it('should handle large radius (100km)', () => {
      const lat = 48.1351;
      const lng = 11.582;
      const radius = 100; // 100 km

      const box = getBoundingBox(lat, lng, radius);

      // Should create a large bounding box
      expect(box.maxLat - box.minLat).toBeGreaterThan(1.5);
      expect(box.maxLng - box.minLng).toBeGreaterThan(1.5);
    });

    it('should handle negative coordinates (southern/western hemisphere)', () => {
      // Sydney, Australia
      const lat = -33.8688;
      const lng = 151.2093;
      const radius = 10;

      const box = getBoundingBox(lat, lng, radius);

      expect(box.minLat).toBeLessThan(lat);
      expect(box.maxLat).toBeGreaterThan(lat);
      expect(box.minLng).toBeLessThan(lng);
      expect(box.maxLng).toBeGreaterThan(lng);
    });
  });

  describe('isWithinBoundingBox', () => {
    const box: BoundingBox = {
      minLat: 48.0,
      maxLat: 48.5,
      minLng: 11.0,
      maxLng: 12.0,
    };

    it('should return true when point is inside bounding box', () => {
      const lat = 48.25;
      const lng = 11.5;

      const result = isWithinBoundingBox(lat, lng, box);

      expect(result).toBe(true);
    });

    it('should return false when point is outside bounding box (north)', () => {
      const lat = 49.0; // Above maxLat
      const lng = 11.5;

      const result = isWithinBoundingBox(lat, lng, box);

      expect(result).toBe(false);
    });

    it('should return false when point is outside bounding box (south)', () => {
      const lat = 47.5; // Below minLat
      const lng = 11.5;

      const result = isWithinBoundingBox(lat, lng, box);

      expect(result).toBe(false);
    });

    it('should return false when point is outside bounding box (east)', () => {
      const lat = 48.25;
      const lng = 12.5; // Above maxLng

      const result = isWithinBoundingBox(lat, lng, box);

      expect(result).toBe(false);
    });

    it('should return false when point is outside bounding box (west)', () => {
      const lat = 48.25;
      const lng = 10.5; // Below minLng

      const result = isWithinBoundingBox(lat, lng, box);

      expect(result).toBe(false);
    });

    it('should return true when point is exactly on boundary', () => {
      // Test all four corners
      expect(isWithinBoundingBox(box.minLat, box.minLng, box)).toBe(true);
      expect(isWithinBoundingBox(box.minLat, box.maxLng, box)).toBe(true);
      expect(isWithinBoundingBox(box.maxLat, box.minLng, box)).toBe(true);
      expect(isWithinBoundingBox(box.maxLat, box.maxLng, box)).toBe(true);
    });

    it('should handle negative coordinates', () => {
      const southernBox: BoundingBox = {
        minLat: -35.0,
        maxLat: -33.0,
        minLng: 150.0,
        maxLng: 152.0,
      };

      const resultInside = isWithinBoundingBox(-34.0, 151.0, southernBox);
      expect(resultInside).toBe(true);

      const resultOutside = isWithinBoundingBox(-32.0, 151.0, southernBox);
      expect(resultOutside).toBe(false);
    });
  });
});
