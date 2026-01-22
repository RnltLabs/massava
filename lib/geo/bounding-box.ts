/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

/**
 * Bounding Box Utilities
 *
 * Calculate geographic bounding boxes for efficient database queries.
 */

export interface BoundingBox {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

/**
 * Calculate bounding box for a given center point and radius
 *
 * Uses simple approximation: 1 degree latitude ≈ 111 km
 * Longitude degrees vary by latitude, so we adjust for that.
 *
 * @param lat - Center latitude
 * @param lng - Center longitude
 * @param radiusKm - Radius in kilometers
 * @returns Bounding box coordinates
 */
export function getBoundingBox(
  lat: number,
  lng: number,
  radiusKm: number
): BoundingBox {
  // Earth's radius in kilometers
  const EARTH_RADIUS_KM = 6371;

  // Calculate latitude delta (1 degree ≈ 111 km)
  const latDelta = radiusKm / 111;

  // Calculate longitude delta (varies by latitude)
  // At the equator: 1 degree ≈ 111 km
  // At higher latitudes: 1 degree ≈ 111 * cos(latitude) km
  const lngDelta = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));

  return {
    minLat: lat - latDelta,
    maxLat: lat + latDelta,
    minLng: lng - lngDelta,
    maxLng: lng + lngDelta,
  };
}

/**
 * Check if a point is within a bounding box
 *
 * @param lat - Point latitude
 * @param lng - Point longitude
 * @param box - Bounding box
 * @returns True if point is within bounding box
 */
export function isWithinBoundingBox(
  lat: number,
  lng: number,
  box: BoundingBox
): boolean {
  return (
    lat >= box.minLat &&
    lat <= box.maxLat &&
    lng >= box.minLng &&
    lng <= box.maxLng
  );
}
