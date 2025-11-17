"use strict";
/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateDistance = calculateDistance;
exports.isWithinRadius = isWithinRadius;
exports.filterStudiosByRadius = filterStudiosByRadius;
/**
 * Calculate distance between two coordinates using Haversine formula
 *
 * @param coord1 - First coordinate (latitude, longitude)
 * @param coord2 - Second coordinate (latitude, longitude)
 * @returns Distance in kilometers
 */
function calculateDistance(coord1, coord2) {
    const R = 6371; // Earth's radius in kilometers
    // Convert degrees to radians
    const lat1Rad = (coord1.lat * Math.PI) / 180;
    const lat2Rad = (coord2.lat * Math.PI) / 180;
    const deltaLat = ((coord2.lat - coord1.lat) * Math.PI) / 180;
    const deltaLng = ((coord2.lng - coord1.lng) * Math.PI) / 180;
    // Haversine formula
    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
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
function isWithinRadius(center, point, radiusKm) {
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
function filterStudiosByRadius(studios, center, radiusKm) {
    return studios
        .filter((studio) => studio.latitude !== null && studio.longitude !== null)
        .map((studio) => ({
        ...studio,
        distance: calculateDistance(center, {
            lat: studio.latitude,
            lng: studio.longitude,
        }),
    }))
        .filter((studio) => studio.distance <= radiusKm)
        .sort((a, b) => a.distance - b.distance); // Sort by distance
}
