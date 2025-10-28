/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

'use client';

import { useState, useEffect, useRef, type ChangeEvent, type KeyboardEvent, type ReactElement } from 'react';
import { MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface LocationSuggestion {
  id: string;
  name: string;
  city: string;
  postalCode: string;
  lat: number;
  lng: number;
}

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string, location?: LocationSuggestion) => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
}

/**
 * LocationAutocomplete Component
 *
 * Provides location search with autocomplete suggestions.
 * Currently uses a mock dataset. In production, integrate with:
 * - Google Places API (recommended)
 * - Mapbox Geocoding API
 * - OpenStreetMap Nominatim
 */
export function LocationAutocomplete({
  value,
  onChange,
  placeholder = 'Stadt oder PLZ eingeben...',
  autoFocus = false,
  className = '',
}: LocationAutocompleteProps): ReactElement {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Mock data for German cities (in production: replace with API calls)
  const mockCities: LocationSuggestion[] = [
    { id: '1', name: 'Karlsruhe', city: 'Karlsruhe', postalCode: '76131', lat: 49.0069, lng: 8.4037 },
    { id: '2', name: 'Karlsruhe-Durlach', city: 'Karlsruhe', postalCode: '76227', lat: 49.0031, lng: 8.4756 },
    { id: '3', name: 'Berlin', city: 'Berlin', postalCode: '10115', lat: 52.5200, lng: 13.4050 },
    { id: '4', name: 'München', city: 'München', postalCode: '80331', lat: 48.1351, lng: 11.5820 },
    { id: '5', name: 'Hamburg', city: 'Hamburg', postalCode: '20095', lat: 53.5511, lng: 9.9937 },
    { id: '6', name: 'Frankfurt am Main', city: 'Frankfurt', postalCode: '60311', lat: 50.1109, lng: 8.6821 },
    { id: '7', name: 'Köln', city: 'Köln', postalCode: '50667', lat: 50.9375, lng: 6.9603 },
    { id: '8', name: 'Stuttgart', city: 'Stuttgart', postalCode: '70173', lat: 48.7758, lng: 9.1829 },
    { id: '9', name: 'Düsseldorf', city: 'Düsseldorf', postalCode: '40210', lat: 51.2277, lng: 6.7735 },
    { id: '10', name: 'Dortmund', city: 'Dortmund', postalCode: '44135', lat: 51.5136, lng: 7.4653 },
  ];

  // Handle input change and filter suggestions
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const inputValue = e.target.value;
    onChange(inputValue);

    if (inputValue.length >= 2) {
      // Filter suggestions based on input
      // TODO: Replace with API call to Google Places/Mapbox
      const filtered = mockCities.filter(
        (city) =>
          city.name.toLowerCase().includes(inputValue.toLowerCase()) ||
          city.postalCode.includes(inputValue)
      );
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
      setSelectedIndex(-1);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Handle suggestion selection
  const handleSelectSuggestion = (suggestion: LocationSuggestion): void => {
    onChange(suggestion.name, suggestion);
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (!showSuggestions) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSelectSuggestion(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="relative flex-1">
      <label htmlFor="location-autocomplete" className="sr-only">
        Standort
      </label>
      <MapPin
        className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none z-10"
        aria-hidden="true"
      />
      <Input
        id="location-autocomplete"
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoFocus={autoFocus}
        autoComplete="off"
        className={`w-full pl-12 pr-4 py-6 rounded-2xl border-2 border-muted focus:border-primary text-lg h-auto ${className}`}
        required
        aria-label="Stadt oder Postleitzahl mit Autocomplete"
        aria-autocomplete="list"
        aria-controls="location-suggestions"
        aria-expanded={showSuggestions}
      />

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <ul
          id="location-suggestions"
          role="listbox"
          className="absolute z-50 w-full mt-2 bg-card border-2 border-muted rounded-2xl shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion.id}
              role="option"
              aria-selected={index === selectedIndex}
              className={`px-4 py-3 cursor-pointer transition-colors ${
                index === selectedIndex
                  ? 'bg-primary/10 text-primary'
                  : 'hover:bg-muted/50'
              }`}
              onClick={() => handleSelectSuggestion(suggestion)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">{suggestion.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {suggestion.postalCode}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
