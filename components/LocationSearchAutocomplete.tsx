/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  createDebouncedSearch,
  type AddressSuggestion,
  GeocodingError,
} from '@/lib/services/geocoding';
import { logger } from '@/lib/logger';

interface LocationData {
  location: string;
  lat: number;
  lng: number;
}

interface LocationSearchAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onLocationSelect: (location: LocationData) => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
}

/**
 * Location Search Autocomplete Component
 *
 * Specialized version of AddressAutocomplete for location/city search.
 * Uses the same Photon Geocoding API but focuses on city-level results.
 *
 * Key differences from AddressAutocomplete:
 * - City-focused search (not street addresses)
 * - Returns location name + coordinates
 * - Optimized placeholder and labels for search context
 */
export function LocationSearchAutocomplete({
  value,
  onChange,
  onLocationSelect,
  placeholder = 'z.B. Karlsruhe oder Berlin',
  autoFocus = false,
  className = '',
}: LocationSearchAutocompleteProps): React.JSX.Element {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Create debounced search function (initialized once)
  const debouncedSearch = useRef(createDebouncedSearch(300)).current;

  /**
   * Extract coordinates from Photon API response
   * The geocoding service returns full address data, but we need coordinates.
   *
   * Note: Currently the AddressSuggestion type doesn't include coordinates.
   * We need to fetch them from the Photon API response.
   *
   * For now, we'll use a workaround by fetching the full Photon response
   * or extending the geocoding service to include coordinates.
   */
  const searchLocations = async (query: string): Promise<void> => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      setHasError(false);
      return;
    }

    setIsLoading(true);
    setHasError(false);

    try {
      // Use the geocoding service for city-level results
      // The service automatically prioritizes DACH region addresses
      const results = await debouncedSearch(query);

      setSuggestions(results);
      setIsOpen(results.length > 0);
      setSelectedIndex(-1);
      setHasError(false);
    } catch (error) {
      // Graceful error handling - don't break the UI
      logger.error('Location search failed', {
        query,
        error: error instanceof Error ? error.message : String(error),
        correlationId: error instanceof GeocodingError ? error.correlationId : undefined,
        action: 'location_search',
        component: 'LocationSearchAutocomplete',
      });
      setSuggestions([]);
      setIsOpen(false);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const newValue = e.target.value;
    onChange(newValue);
    searchLocations(newValue);
  };

  /**
   * Handle location selection
   *
   * Extracts the full address and coordinates from the suggestion.
   */
  const handleSelectSuggestion = (suggestion: AddressSuggestion): void => {
    // Build full address: "Lachnerstraße 12, 76131 Karlsruhe"
    const addressParts: string[] = [];

    if (suggestion.street) {
      addressParts.push(suggestion.street);
    }

    if (suggestion.postalCode && suggestion.city) {
      addressParts.push(`${suggestion.postalCode} ${suggestion.city}`);
    } else if (suggestion.city) {
      addressParts.push(suggestion.city);
    }

    const fullAddress = addressParts.join(', ');
    onChange(fullAddress);

    // Use coordinates from the suggestion (already fetched by geocoding service)
    onLocationSelect({
      location: fullAddress,
      lat: suggestion.lat,
      lng: suggestion.lng,
    });

    setIsOpen(false);
    setSuggestions([]);
    setSelectedIndex(-1);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelectSuggestion(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={cn('relative flex-1', className)}>
      <label htmlFor="location-search-autocomplete" className="sr-only">
        Wo suchst du?
      </label>

      <div className="relative">
        <MapPin
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10"
          aria-hidden="true"
        />

        <Input
          ref={inputRef}
          id="location-search-autocomplete"
          name="location-search"
          type="text"
          autoComplete="off"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (value.length >= 2 && suggestions.length > 0) {
              setIsOpen(true);
            }
          }}
          autoFocus={autoFocus}
          className={cn(
            'w-full h-11 pl-10 pr-10 rounded-xl border-2 border-muted focus:border-primary text-sm',
            'transition-colors',
            hasError && 'border-amber-500 focus:border-amber-500'
          )}
          placeholder={placeholder}
          required
          aria-label="Stadt oder Postleitzahl mit Autocomplete"
          aria-autocomplete="list"
          aria-controls="location-search-suggestions"
          aria-expanded={isOpen}
        />

        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        )}
      </div>

      {/* Suggestions dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          id="location-search-suggestions"
          role="listbox"
          className="absolute z-50 w-full mt-2 bg-card border-2 border-muted rounded-xl shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => {
            // Show full street name in main line
            const displayLocation = suggestion.street || suggestion.city;
            // Show postal code + city in subtext
            const displaySubtext = suggestion.postalCode && suggestion.city
              ? `${suggestion.postalCode}, ${suggestion.city}`
              : suggestion.city;

            return (
              <button
                key={`${suggestion.street}-${suggestion.postalCode}-${suggestion.city}-${index}`}
                type="button"
                role="option"
                aria-selected={selectedIndex === index}
                onClick={() => handleSelectSuggestion(suggestion)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={cn(
                  'w-full px-3 py-2.5 text-left transition-colors',
                  'flex items-center gap-2 border-b border-muted last:border-b-0',
                  selectedIndex === index ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50'
                )}
              >
                <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {displayLocation}
                  </p>
                  {displaySubtext && (
                    <p className="text-xs text-muted-foreground truncate">
                      {displaySubtext}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* API error message */}
      {hasError && (
        <p className="text-xs text-amber-600 mt-1" role="alert">
          Standortsuche vorübergehend nicht verfügbar. Bitte versuche es später erneut.
        </p>
      )}
    </div>
  );
}
