/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

/**
 * Geolocation Utilities
 *
 * Provides functions for geospatial calculations and distance measurements.
 */

interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 *
 * @param coord1 - First coordinate (latitude, longitude)
 * @param coord2 - Second coordinate (latitude, longitude)
 * @returns Distance in kilometers
 */
export function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371; // Earth's radius in kilometers

  // Convert degrees to radians
  const lat1Rad = (coord1.lat * Math.PI) / 180;
  const lat2Rad = (coord2.lat * Math.PI) / 180;
  const deltaLat = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const deltaLng = ((coord2.lng - coord1.lng) * Math.PI) / 180;

  // Haversine formula
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  // Distance in kilometers
  const distance = R * c;

  return distance;
}

/**
 * Check if a coordinate is within a given radius of another coordinate
 *
 * @param center - Center coordinate
 * @param point - Point to check
 * @param radiusKm - Radius in kilometers
 * @returns True if point is within radius
 */
export function isWithinRadius(
  center: Coordinates,
  point: Coordinates,
  radiusKm: number
): boolean {
  const distance = calculateDistance(center, point);
  return distance <= radiusKm;
}

/**
 * Filter studios by distance from a center point
 *
 * @param studios - Array of studios with lat/lng
 * @param center - Center coordinate
 * @param radiusKm - Search radius in kilometers
 * @returns Filtered studios with distance property
 */
export function filterStudiosByRadius<T extends { latitude: number | null; longitude: number | null }>(
  studios: T[],
  center: Coordinates,
  radiusKm: number
): Array<T & { distance: number }> {
  return studios
    .filter((studio) => studio.latitude !== null && studio.longitude !== null)
    .map((studio) => ({
      ...studio,
      distance: calculateDistance(center, {
        lat: studio.latitude!,
        lng: studio.longitude!,
      }),
    }))
    .filter((studio) => studio.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance); // Sort by distance
}
