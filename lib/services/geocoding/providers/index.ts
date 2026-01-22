/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Geocoding Providers - Public Exports
 * Multi-provider geocoding with fallback support
 *
 * @module lib/services/geocoding/providers
 */

// Abstract interface
export type {
  GeocodingProvider,
  GeocodingProviderConfig,
  GeocodingProviderResult,
} from './geocoding-provider';
export {
  DEFAULT_PROVIDER_CONFIG,
  createProviderConfig,
} from './geocoding-provider';

// Photon Provider (Free, OSM-based)
export { PhotonProvider, createPhotonProvider } from './photon-provider';

// Radar Provider (Commercial, client-side via proxy)
export { RadarProvider, createRadarProvider } from './radar-provider';
