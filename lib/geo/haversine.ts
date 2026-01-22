/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

/**
 * Haversine Distance Calculation
 *
 * Calculate the great-circle distance between two points on Earth.
 */

export interface GeoPoint {
  lat: number;
  lng: number;
}

/**
 * Calculate distance between two geographic points using Haversine formula
 *
 * The Haversine formula determines the great-circle distance between two points
 * on a sphere given their longitudes and latitudes.
 *
 * @param point1 - First coordinate (latitude, longitude)
 * @param point2 - Second coordinate (latitude, longitude)
 * @returns Distance in kilometers
 */
export function calculateHaversineDistance(
  point1: GeoPoint,
  point2: GeoPoint
): number {
  // Earth's radius in kilometers
  const EARTH_RADIUS_KM = 6371;

  // Convert degrees to radians
  const lat1Rad = (point1.lat * Math.PI) / 180;
  const lat2Rad = (point2.lat * Math.PI) / 180;
  const deltaLat = ((point2.lat - point1.lat) * Math.PI) / 180;
  const deltaLng = ((point2.lng - point1.lng) * Math.PI) / 180;

  // Haversine formula
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1Rad) *
      Math.cos(lat2Rad) *
      Math.sin(deltaLng / 2) *
      Math.sin(deltaLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  // Distance in kilometers
  const distance = EARTH_RADIUS_KM * c;

  return distance;
}

/**
 * Check if a point is within a given radius of another point
 *
 * @param center - Center coordinate
 * @param point - Point to check
 * @param radiusKm - Radius in kilometers
 * @returns True if point is within radius
 */
export function isWithinRadius(
  center: GeoPoint,
  point: GeoPoint,
  radiusKm: number
): boolean {
  const distance = calculateHaversineDistance(center, point);
  return distance <= radiusKm;
}
