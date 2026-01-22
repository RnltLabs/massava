/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * DACH Region Address Prioritization
 * Utilities for prioritizing addresses from Germany, Austria, and Switzerland
 *
 * @module lib/services/geocoding/utils/dach-prioritizer
 */

import type { AddressSuggestion, CountryType } from '../types';

/**
 * Maximum number of international results to show
 * Only used when fewer than 8 DACH results are available
 */
const MAX_INTERNATIONAL_RESULTS = 2;

/**
 * Maximum total results to return
 */
const MAX_TOTAL_RESULTS = 8;

/**
 * Country name variations for Germany
 */
const GERMAN_NAMES: readonly string[] = [
  'deutschland',
  'germany',
  'allemagne',
  'germania',
  'de',
] as const;

/**
 * Country name variations for Austria
 */
const AUSTRIAN_NAMES: readonly string[] = [
  'österreich',
  'osterreich',
  'austria',
  'autriche',
  'at',
] as const;

/**
 * Country name variations for Switzerland
 */
const SWISS_NAMES: readonly string[] = [
  'schweiz',
  'switzerland',
  'suisse',
  'svizzera',
  'ch',
] as const;

/**
 * Determine the country type for address prioritization
 *
 * Classifies a country string into one of four categories:
 * - 'DE': Germany (highest priority)
 * - 'AT': Austria (second priority)
 * - 'CH': Switzerland (third priority)
 * - 'INTERNATIONAL': All other countries (lowest priority)
 *
 * @param country - Country name from address (supports multiple languages)
 * @returns Country type classification
 *
 * @example
 * ```typescript
 * getCountryType('Deutschland') // 'DE'
 * getCountryType('Germany') // 'DE'
 * getCountryType('Österreich') // 'AT'
 * getCountryType('Switzerland') // 'CH'
 * getCountryType('France') // 'INTERNATIONAL'
 * ```
 */
export function getCountryType(country: string): CountryType {
  const countryLower = country.toLowerCase().trim();

  // Germany (highest priority)
  if (
    GERMAN_NAMES.some((name) => countryLower.includes(name)) ||
    countryLower === 'de'
  ) {
    return 'DE';
  }

  // Austria
  if (
    AUSTRIAN_NAMES.some((name) => countryLower.includes(name)) ||
    countryLower === 'at'
  ) {
    return 'AT';
  }

  // Switzerland
  if (
    SWISS_NAMES.some((name) => countryLower.includes(name)) ||
    countryLower === 'ch'
  ) {
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
 *
 * @example
 * ```typescript
 * isDACHAddress('Deutschland') // true
 * isDACHAddress('Austria') // true
 * isDACHAddress('Schweiz') // true
 * isDACHAddress('France') // false
 * ```
 */
export function isDACHAddress(country: string): boolean {
  const type = getCountryType(country);
  return type === 'DE' || type === 'AT' || type === 'CH';
}

/**
 * Categorized addresses by country type
 */
interface CategorizedAddresses {
  readonly germany: readonly AddressSuggestion[];
  readonly austria: readonly AddressSuggestion[];
  readonly switzerland: readonly AddressSuggestion[];
  readonly international: readonly AddressSuggestion[];
}

/**
 * Categorize addresses by country type
 *
 * @param suggestions - Array of address suggestions
 * @returns Addresses grouped by country type
 */
function categorizeAddresses(
  suggestions: readonly AddressSuggestion[]
): CategorizedAddresses {
  const germany: AddressSuggestion[] = [];
  const austria: AddressSuggestion[] = [];
  const switzerland: AddressSuggestion[] = [];
  const international: AddressSuggestion[] = [];

  for (const suggestion of suggestions) {
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
  }

  return {
    germany,
    austria,
    switzerland,
    international,
  };
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
 * @param options - Optional configuration
 * @param options.maxResults - Maximum total results (default: 8)
 * @param options.maxInternational - Maximum international results (default: 2)
 * @returns Sorted and limited array with DACH addresses prioritized
 *
 * @example
 * ```typescript
 * const suggestions = await fetchAddresses('Karl');
 * const prioritized = prioritizeDACHAddresses(suggestions);
 * // Results: [DE addresses, AT addresses, CH addresses, max 2 international]
 * ```
 */
export function prioritizeDACHAddresses(
  suggestions: readonly AddressSuggestion[],
  options?: {
    readonly maxResults?: number;
    readonly maxInternational?: number;
  }
): readonly AddressSuggestion[] {
  const maxResults = options?.maxResults ?? MAX_TOTAL_RESULTS;
  const maxInternational = options?.maxInternational ?? MAX_INTERNATIONAL_RESULTS;

  // Categorize by country type
  const { germany, austria, switzerland, international } =
    categorizeAddresses(suggestions);

  // Combine DACH results in priority order
  const dachResults: readonly AddressSuggestion[] = [
    ...germany,
    ...austria,
    ...switzerland,
  ];

  // If we have enough DACH results, return only those
  if (dachResults.length >= maxResults) {
    return dachResults.slice(0, maxResults);
  }

  // Otherwise, add limited international results to fill up to maxResults
  const remainingSlots = maxResults - dachResults.length;
  const internationalToAdd = Math.min(remainingSlots, maxInternational);

  return [...dachResults, ...international.slice(0, internationalToAdd)];
}

/**
 * Get statistics about address distribution by country
 *
 * @param suggestions - Array of address suggestions
 * @returns Object with counts for each country type
 *
 * @example
 * ```typescript
 * const stats = getAddressStats(suggestions);
 * console.log(stats);
 * // { total: 10, de: 5, at: 2, ch: 1, international: 2, dach: 8 }
 * ```
 */
export function getAddressStats(
  suggestions: readonly AddressSuggestion[]
): {
  readonly total: number;
  readonly de: number;
  readonly at: number;
  readonly ch: number;
  readonly international: number;
  readonly dach: number;
} {
  const { germany, austria, switzerland, international } =
    categorizeAddresses(suggestions);

  const dachCount = germany.length + austria.length + switzerland.length;

  return {
    total: suggestions.length,
    de: germany.length,
    at: austria.length,
    ch: switzerland.length,
    international: international.length,
    dach: dachCount,
  };
}

/**
 * Filter suggestions to only include DACH addresses
 *
 * @param suggestions - Array of address suggestions
 * @returns Only addresses from Germany, Austria, or Switzerland
 *
 * @example
 * ```typescript
 * const dachOnly = filterDACHAddresses(suggestions);
 * ```
 */
export function filterDACHAddresses(
  suggestions: readonly AddressSuggestion[]
): readonly AddressSuggestion[] {
  return suggestions.filter((suggestion) => isDACHAddress(suggestion.country));
}

/**
 * Sort suggestions by country priority (DE > AT > CH > International)
 * without limiting results
 *
 * @param suggestions - Array of address suggestions
 * @returns Sorted array (not limited)
 */
export function sortByCountryPriority(
  suggestions: readonly AddressSuggestion[]
): readonly AddressSuggestion[] {
  const { germany, austria, switzerland, international } =
    categorizeAddresses(suggestions);

  return [...germany, ...austria, ...switzerland, ...international];
}
