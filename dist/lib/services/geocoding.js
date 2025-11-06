"use strict";
/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeocodingError = void 0;
exports.searchAddresses = searchAddresses;
exports.createDebouncedSearch = createDebouncedSearch;
/**
 * Geocoding Service - Photon API Integration
 *
 * Provides address autocomplete functionality using the Photon geocoding API.
 * Photon is a free, open-source geocoding API based on OpenStreetMap data.
 *
 * API Documentation: https://photon.komoot.io/
 * No API key required, no rate limits.
 */
const logger_1 = require("../logger");
/**
 * Error types for geocoding operations
 */
class GeocodingError extends Error {
    constructor(message, code, correlationId) {
        super(message);
        this.code = code;
        this.name = 'GeocodingError';
        this.correlationId = correlationId || (0, logger_1.generateCorrelationId)();
    }
}
exports.GeocodingError = GeocodingError;
/**
 * Configuration for Photon API requests
 */
const PHOTON_CONFIG = {
    baseUrl: 'https://photon.komoot.io/api/',
    timeout: 5000, // 5 seconds
    defaultLimit: 8,
    defaultLang: 'de',
    // Bounding box for DACH region (optional filter)
    // Format: minLon,minLat,maxLon,maxLat
    // Coordinates cover Germany, Austria, and Switzerland
    // West(5.9°), South(45.8°), East(17.2°), North(55.0°)
    dachBbox: '5.9,45.8,17.2,55.0',
};
/**
 * Transform Photon API feature to AddressSuggestion format
 *
 * @param feature - Photon API feature object
 * @returns Transformed address suggestion or null if invalid
 */
function transformPhotonFeature(feature) {
    const { properties, geometry } = feature;
    // Extract street information (prefer 'street' field, fallback to 'name')
    const streetName = properties.street || properties.name || '';
    const houseNumber = properties.housenumber || '';
    const street = houseNumber ? `${streetName} ${houseNumber}` : streetName;
    // Extract city information (multiple fallbacks)
    const city = properties.city ||
        properties.locality ||
        properties.district ||
        properties.state ||
        '';
    // Extract postal code
    const postalCode = properties.postcode || '';
    // Extract country
    const country = properties.country || 'Deutschland';
    // Extract coordinates (Photon returns [longitude, latitude])
    const [lng, lat] = geometry.coordinates;
    // Validate required fields
    if (!street || !city) {
        logger_1.logger.debug('Invalid Photon feature: missing required fields', {
            properties,
        });
        return null;
    }
    // Validate coordinates
    if (typeof lat !== 'number' || typeof lng !== 'number') {
        logger_1.logger.debug('Invalid Photon feature: missing coordinates', {
            properties,
        });
        return null;
    }
    // Build display text
    const displayText = postalCode
        ? `${street}, ${postalCode} ${city}`
        : `${street}, ${city}`;
    return {
        street: street.trim(),
        city: city.trim(),
        postalCode: postalCode.trim(),
        country: country.trim(),
        displayText,
        lat,
        lng,
    };
}
/**
 * Maximum number of international results to show
 * (only used when fewer than 8 DACH results are available)
 */
const MAX_INTERNATIONAL_RESULTS = 2;
/**
 * Determine the country type for address prioritization
 *
 * @param country - Country name from address
 * @returns Country type: DE, AT, CH, or INTERNATIONAL
 */
function getCountryType(country) {
    const countryLower = country.toLowerCase();
    // Germany (highest priority)
    const germanNames = ['deutschland', 'germany', 'allemagne', 'germania'];
    if (germanNames.some((name) => countryLower.includes(name)) || countryLower === 'de') {
        return 'DE';
    }
    // Austria
    const austrianNames = ['österreich', 'osterreich', 'austria', 'autriche'];
    if (austrianNames.some((name) => countryLower.includes(name)) || countryLower === 'at') {
        return 'AT';
    }
    // Switzerland
    const swissNames = ['schweiz', 'switzerland', 'suisse', 'svizzera'];
    if (swissNames.some((name) => countryLower.includes(name)) || countryLower === 'ch') {
        return 'CH';
    }
    // Everything else
    return 'INTERNATIONAL';
}
/**
 * Check if an address is in the DACH region
 *
 * @param country - Country name from address
 * @returns True if address is in Germany, Austria, or Switzerland
 */
function isDACHAddress(country) {
    const type = getCountryType(country);
    return type === 'DE' || type === 'AT' || type === 'CH';
}
/**
 * Prioritize DACH addresses in results with smart international limiting
 *
 * Strategy:
 * 1. DACH addresses first (Germany > Austria > Switzerland)
 * 2. International addresses limited to max 2 (only if < 8 DACH results)
 * 3. Total results capped at 8
 *
 * This ensures the target audience (studios in DACH region) sees relevant
 * results first, while maintaining flexibility for edge cases.
 *
 * @param suggestions - Array of address suggestions
 * @returns Sorted and limited array with DACH addresses prioritized
 */
function prioritizeDACHAddresses(suggestions) {
    const germany = [];
    const austria = [];
    const switzerland = [];
    const international = [];
    // Categorize suggestions by country type
    suggestions.forEach((suggestion) => {
        const type = getCountryType(suggestion.country);
        switch (type) {
            case 'DE':
                germany.push(suggestion);
                break;
            case 'AT':
                austria.push(suggestion);
                break;
            case 'CH':
                switzerland.push(suggestion);
                break;
            case 'INTERNATIONAL':
                international.push(suggestion);
                break;
        }
    });
    // Combine DACH results in priority order
    const dachResults = [...germany, ...austria, ...switzerland];
    // If we have enough DACH results, return only those (max 8)
    if (dachResults.length >= 8) {
        return dachResults.slice(0, 8);
    }
    // Otherwise, add limited international results to fill up to 8
    const remainingSlots = 8 - dachResults.length;
    const internationalToAdd = Math.min(remainingSlots, MAX_INTERNATIONAL_RESULTS);
    return [...dachResults, ...international.slice(0, internationalToAdd)];
}
/**
 * Search for address suggestions using Photon API
 *
 * Security: Query is automatically URL-encoded via URLSearchParams,
 * preventing injection attacks. Input validation ensures minimum
 * length of 3 characters to prevent abuse.
 *
 * Results are automatically sorted to prioritize DACH region addresses
 * (Germany, Austria, Switzerland) with intelligent international limiting:
 * - DACH addresses always appear first (DE > AT > CH priority)
 * - International addresses limited to max 2 (only if < 8 DACH results)
 * - Total results capped at 8 for optimal UX
 *
 * @param query - Search query (e.g., "Karlstraße 12 Karlsruhe")
 * @param options - Optional configuration
 * @param options.limit - Maximum number of results (default: 8)
 * @param options.lang - Language code (default: 'de')
 * @param options.signal - AbortSignal for request cancellation
 * @param options.correlationId - Correlation ID for logging
 * @param options.restrictToDACH - Only return DACH region addresses (default: false)
 * @returns Array of address suggestions (DACH addresses prioritized)
 * @throws {GeocodingError} When API request fails
 *
 * @example
 * ```typescript
 * // Basic search (prioritizes DACH addresses: DE > AT > CH)
 * const suggestions = await searchAddresses('Karl', { limit: 8 });
 *
 * // Restrict to DACH region only
 * const dachOnly = await searchAddresses('Karl', {
 *   limit: 5,
 *   restrictToDACH: true
 * });
 * ```
 */
async function searchAddresses(query, options = {}) {
    const { limit = PHOTON_CONFIG.defaultLimit, lang = PHOTON_CONFIG.defaultLang, signal, correlationId = (0, logger_1.generateCorrelationId)(), restrictToDACH = false, } = options;
    // Validate input
    if (!query || query.trim().length < 3) {
        return [];
    }
    // Build URL with query parameters
    const url = new URL(PHOTON_CONFIG.baseUrl);
    url.searchParams.set('q', query.trim());
    url.searchParams.set('lang', lang);
    url.searchParams.set('limit', limit.toString());
    // Optional: Restrict results to DACH region using bounding box
    if (restrictToDACH) {
        url.searchParams.set('bbox', PHOTON_CONFIG.dachBbox);
    }
    // Create abort controller for timeout if not provided
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => {
        timeoutController.abort();
    }, PHOTON_CONFIG.timeout);
    try {
        logger_1.logger.debug('Fetching address suggestions from Photon API', {
            correlationId,
            query,
            limit,
            lang,
        });
        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                Accept: 'application/json',
            },
            signal: signal || timeoutController.signal,
        });
        clearTimeout(timeoutId);
        if (!response.ok) {
            throw new GeocodingError(`Photon API returned status ${response.status}`, 'NETWORK_ERROR', correlationId);
        }
        const data = await response.json();
        // Validate response structure
        if (!data.features || !Array.isArray(data.features)) {
            throw new GeocodingError('Invalid response structure from Photon API', 'INVALID_RESPONSE', correlationId);
        }
        // Transform features to address suggestions
        const suggestions = data.features
            .map(transformPhotonFeature)
            .filter((suggestion) => suggestion !== null);
        // Prioritize DACH addresses and limit international results
        const sortedSuggestions = prioritizeDACHAddresses(suggestions);
        logger_1.logger.debug('Successfully fetched address suggestions', {
            correlationId,
            query,
            resultCount: sortedSuggestions.length,
            dachResults: sortedSuggestions.filter(s => isDACHAddress(s.country)).length,
            deResults: sortedSuggestions.filter(s => getCountryType(s.country) === 'DE').length,
            atResults: sortedSuggestions.filter(s => getCountryType(s.country) === 'AT').length,
            chResults: sortedSuggestions.filter(s => getCountryType(s.country) === 'CH').length,
        });
        if (sortedSuggestions.length === 0) {
            logger_1.logger.debug('No address suggestions found', { correlationId, query });
        }
        return sortedSuggestions;
    }
    catch (error) {
        clearTimeout(timeoutId);
        // Handle abort/timeout
        if (error instanceof Error && error.name === 'AbortError') {
            logger_1.logger.warn('Address search request timed out', { correlationId, query });
            throw new GeocodingError('Request timed out', 'TIMEOUT', correlationId);
        }
        // Handle network errors
        if (error instanceof TypeError) {
            logger_1.logger.error('Network error during address search', {
                correlationId,
                query,
                error: error.message,
            });
            throw new GeocodingError('Network error', 'NETWORK_ERROR', correlationId);
        }
        // Re-throw GeocodingError
        if (error instanceof GeocodingError) {
            throw error;
        }
        // Handle unexpected errors
        logger_1.logger.error('Unexpected error during address search', {
            correlationId,
            query,
            error: error instanceof Error ? error.message : String(error),
        });
        throw new GeocodingError('Unexpected error', 'NETWORK_ERROR', correlationId);
    }
}
/**
 * Debounced address search for use in UI components
 *
 * Creates a debounced version of searchAddresses that waits for user to stop typing.
 * Cancels previous requests when a new one is initiated.
 *
 * @param delayMs - Debounce delay in milliseconds (default: 300ms)
 * @returns Debounced search function
 *
 * @example
 * ```typescript
 * const debouncedSearch = createDebouncedSearch(300);
 *
 * // In your component:
 * const handleInputChange = async (value: string) => {
 *   const suggestions = await debouncedSearch(value);
 *   setSuggestions(suggestions);
 * };
 * ```
 */
function createDebouncedSearch(delayMs = 300) {
    let timeoutId = null;
    let abortController = null;
    return (query) => {
        // Cancel previous timeout
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        // Abort previous request
        if (abortController) {
            abortController.abort();
        }
        return new Promise((resolve) => {
            timeoutId = setTimeout(async () => {
                abortController = new AbortController();
                try {
                    const results = await searchAddresses(query, {
                        signal: abortController.signal,
                    });
                    resolve(results);
                }
                catch (error) {
                    // User cancelled search by typing more (or request timed out)
                    if (error instanceof Error && error.name === 'AbortError') {
                        logger_1.logger.debug('Debounced search aborted (user still typing)', { query });
                        resolve([]);
                        return;
                    }
                    // Timeout - expected behavior
                    if (error instanceof GeocodingError && error.code === 'TIMEOUT') {
                        logger_1.logger.debug('Debounced search timed out', {
                            query,
                            correlationId: error.correlationId,
                        });
                        resolve([]);
                        return;
                    }
                    // Network/API error - log as warning
                    logger_1.logger.warn('Address autocomplete failed', {
                        query,
                        correlationId: error instanceof GeocodingError ? error.correlationId : undefined,
                        error: error instanceof Error ? error.message : String(error),
                    });
                    resolve([]);
                }
            }, delayMs);
        });
    };
}
