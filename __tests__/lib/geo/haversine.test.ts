/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

import {
  calculateHaversineDistance,
  isWithinRadius,
  type GeoPoint,
} from '@/lib/geo/haversine';

describe('Haversine Distance Calculation', () => {
  describe('calculateHaversineDistance', () => {
    it('should calculate distance between two points correctly', () => {
      // Munich to Berlin (approx 504 km)
      const munich: GeoPoint = { lat: 48.1351, lng: 11.582 };
      const berlin: GeoPoint = { lat: 52.52, lng: 13.405 };

      const distance = calculateHaversineDistance(munich, berlin);

      // Allow 1% tolerance for floating point precision
      expect(distance).toBeGreaterThan(500);
      expect(distance).toBeLessThan(510);
    });

    it('should return 0 for identical points', () => {
      const point: GeoPoint = { lat: 48.1351, lng: 11.582 };

      const distance = calculateHaversineDistance(point, point);

      expect(distance).toBe(0);
    });

    it('should handle negative coordinates (southern/western hemisphere)', () => {
      // Sydney, Australia
      const sydney: GeoPoint = { lat: -33.8688, lng: 151.2093 };
      // Melbourne, Australia (approx 714 km)
      const melbourne: GeoPoint = { lat: -37.8136, lng: 144.9631 };

      const distance = calculateHaversineDistance(sydney, melbourne);

      expect(distance).toBeGreaterThan(700);
      expect(distance).toBeLessThan(720);
    });

    it('should calculate short distances accurately', () => {
      // Two points ~1 km apart in Munich
      const point1: GeoPoint = { lat: 48.1351, lng: 11.582 };
      const point2: GeoPoint = { lat: 48.144, lng: 11.582 };

      const distance = calculateHaversineDistance(point1, point2);

      // Should be approximately 1 km
      expect(distance).toBeGreaterThan(0.9);
      expect(distance).toBeLessThan(1.1);
    });

    it('should be commutative (distance A->B equals B->A)', () => {
      const pointA: GeoPoint = { lat: 48.1351, lng: 11.582 };
      const pointB: GeoPoint = { lat: 52.52, lng: 13.405 };

      const distanceAB = calculateHaversineDistance(pointA, pointB);
      const distanceBA = calculateHaversineDistance(pointB, pointA);

      expect(distanceAB).toBe(distanceBA);
    });
  });

  describe('isWithinRadius', () => {
    it('should return true when point is within radius', () => {
      const center: GeoPoint = { lat: 48.1351, lng: 11.582 };
      const point: GeoPoint = { lat: 48.144, lng: 11.582 }; // ~1 km away

      const result = isWithinRadius(center, point, 5);

      expect(result).toBe(true);
    });

    it('should return false when point is outside radius', () => {
      const center: GeoPoint = { lat: 48.1351, lng: 11.582 };
      const point: GeoPoint = { lat: 52.52, lng: 13.405 }; // ~504 km away

      const result = isWithinRadius(center, point, 100);

      expect(result).toBe(false);
    });

    it('should return true when point is exactly at radius boundary', () => {
      const center: GeoPoint = { lat: 48.1351, lng: 11.582 };
      const point: GeoPoint = { lat: 48.144, lng: 11.582 }; // ~1 km away

      const exactDistance = calculateHaversineDistance(center, point);
      const result = isWithinRadius(center, point, exactDistance);

      expect(result).toBe(true);
    });

    it('should handle zero radius (only exact matches)', () => {
      const center: GeoPoint = { lat: 48.1351, lng: 11.582 };

      const resultSamePoint = isWithinRadius(center, center, 0);
      expect(resultSamePoint).toBe(true);

      const resultDifferentPoint = isWithinRadius(
        center,
        { lat: 48.144, lng: 11.582 },
        0
      );
      expect(resultDifferentPoint).toBe(false);
    });

    it('should handle very large radius (intercontinental)', () => {
      const munich: GeoPoint = { lat: 48.1351, lng: 11.582 };
      const newYork: GeoPoint = { lat: 40.7128, lng: -74.006 };

      const result = isWithinRadius(munich, newYork, 10000); // 10,000 km radius

      expect(result).toBe(true);
    });
  });
});
