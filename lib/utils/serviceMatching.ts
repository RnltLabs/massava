/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

import { ServiceType, SERVICE_TYPE_SYNONYMS } from '@/lib/constants/serviceTypes';
import type { Service } from '@/app/generated/prisma';

/**
 * Normalizes a string for comparison
 * - Converts to lowercase
 * - Removes diacritics (ä -> a, ö -> o, etc.)
 * - Removes extra whitespace
 * - Removes special characters (except spaces and hyphens)
 */
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Checks if a string contains any of the keywords
 */
function containsKeyword(text: string, keywords: string[]): boolean {
  const normalizedText = normalizeString(text);
  return keywords.some(keyword => {
    const normalizedKeyword = normalizeString(keyword);
    return normalizedText.includes(normalizedKeyword);
  });
}

/**
 * Matches User-Auswahl gegen Studio-Service-Namen
 *
 * Smart String-Matching with:
 * - Case-insensitive comparison
 * - Fuzzy matching (substring detection)
 * - Synonym support (e.g., "Thai" matches "Traditionelle Thai")
 * - Diacritic normalization (ä, ö, ü)
 * - Whitespace tolerance
 *
 * @param studioServiceName - The name of the studio's service
 * @param selectedType - The service type selected by the user
 * @returns true if the service matches the selected type
 *
 * @example
 * matchesServiceType("Traditionelle Thai-Massage", SERVICE_TYPES.THAI) // true
 * matchesServiceType("Thai Wellness Massage", SERVICE_TYPES.THAI) // true
 * matchesServiceType("Sportmassage für Athleten", SERVICE_TYPES.SPORT) // true
 * matchesServiceType("Deep Tissue Öl-Massage", SERVICE_TYPES.DEEP_TISSUE) // true
 * matchesServiceType("Schwedische Massage", SERVICE_TYPES.SWEDISH) // true
 * matchesServiceType("Fußreflexzonenmassage", SERVICE_TYPES.REFLEXOLOGY) // true
 * matchesServiceType("Hot Stone Aromatherapie", SERVICE_TYPES.HOT_STONE) // true
 * matchesServiceType("Paarmassage", SERVICE_TYPES.COUPLE) // true
 * matchesServiceType("Ayurveda Wellness", SERVICE_TYPES.AYURVEDA) // true
 * matchesServiceType("Shiatsu", SERVICE_TYPES.SHIATSU) // true
 */
export function matchesServiceType(
  studioServiceName: string,
  selectedType: ServiceType
): boolean {
  // Get all synonyms for the selected type
  const synonyms = SERVICE_TYPE_SYNONYMS[selectedType] || [];

  // Include the service type itself as a keyword
  const keywords = [selectedType, ...synonyms];

  // Check if any keyword matches
  return containsKeyword(studioServiceName, keywords);
}

/**
 * Filtert Services basierend auf Service-Type
 *
 * @param services - Array of studio services
 * @param serviceType - Optional service type filter
 * @returns Filtered array of services
 */
export function filterServicesByType<T extends Pick<Service, 'name'>>(
  services: T[],
  serviceType?: ServiceType
): T[] {
  if (!serviceType) {
    return services;
  }

  return services.filter((service) =>
    matchesServiceType(service.name, serviceType)
  );
}

/**
 * Groups services by matched service types
 * Useful for categorizing a studio's services
 *
 * @param services - Array of studio services
 * @returns Object mapping service types to matching services
 */
export function groupServicesByType<T extends Pick<Service, 'name'>>(
  services: T[]
): Partial<Record<ServiceType, T[]>> {
  const grouped: Partial<Record<ServiceType, T[]>> = {};

  services.forEach((service) => {
    // Find all matching service types for this service
    Object.entries(SERVICE_TYPE_SYNONYMS).forEach(([type, synonyms]) => {
      const keywords = [type, ...synonyms];
      if (containsKeyword(service.name, keywords)) {
        const serviceType = type as ServiceType;
        if (!grouped[serviceType]) {
          grouped[serviceType] = [];
        }
        grouped[serviceType]!.push(service);
      }
    });
  });

  return grouped;
}

/**
 * Gets all matching service types for a single service
 * A service can match multiple types (e.g., "Thai Aromatherapie" matches both THAI and AROMATHERAPY)
 *
 * @param serviceName - The name of the service
 * @returns Array of matching service types
 */
export function getMatchingServiceTypes(serviceName: string): ServiceType[] {
  const matchingTypes: ServiceType[] = [];

  Object.entries(SERVICE_TYPE_SYNONYMS).forEach(([type, synonyms]) => {
    const keywords = [type, ...synonyms];
    if (containsKeyword(serviceName, keywords)) {
      matchingTypes.push(type as ServiceType);
    }
  });

  return matchingTypes;
}
