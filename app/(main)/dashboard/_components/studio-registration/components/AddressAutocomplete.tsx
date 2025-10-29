'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddressSuggestion {
  street: string;
  city: string;
  postalCode: string;
  country: string;
  displayText: string;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onAddressSelect: (address: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  }) => void;
  onBlur?: () => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
}

/**
 * Smart Address Autocomplete Component
 * Provides real-time address suggestions as user types
 * Similar to Google Places, Booking.com, etc.
 */
export function AddressAutocomplete({
  value,
  onChange,
  onAddressSelect,
  onBlur,
  error,
  disabled,
  required,
}: AddressAutocompleteProps): React.JSX.Element {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Mock address database (in production, this would be an API like Google Places)
  // Realistic German addresses for demonstration
  const addressDatabase: AddressSuggestion[] = [
    // Karlsruhe
    { street: 'Karlstraße 12', city: 'Karlsruhe', postalCode: '76133', country: 'Deutschland', displayText: 'Karlstraße 12, 76133 Karlsruhe' },
    { street: 'Kaiserstraße 156', city: 'Karlsruhe', postalCode: '76133', country: 'Deutschland', displayText: 'Kaiserstraße 156, 76133 Karlsruhe' },
    { street: 'Waldstraße 63', city: 'Karlsruhe', postalCode: '76131', country: 'Deutschland', displayText: 'Waldstraße 63, 76131 Karlsruhe' },
    { street: 'Sophienstraße 120', city: 'Karlsruhe', postalCode: '76135', country: 'Deutschland', displayText: 'Sophienstraße 120, 76135 Karlsruhe' },

    // München
    { street: 'Karlstraße 45', city: 'München', postalCode: '80333', country: 'Deutschland', displayText: 'Karlstraße 45, 80333 München' },
    { street: 'Maximilianstraße 12', city: 'München', postalCode: '80539', country: 'Deutschland', displayText: 'Maximilianstraße 12, 80539 München' },
    { street: 'Leopoldstraße 15', city: 'München', postalCode: '80802', country: 'Deutschland', displayText: 'Leopoldstraße 15, 80802 München' },

    // Berlin
    { street: 'Karlstraße 78', city: 'Berlin', postalCode: '10117', country: 'Deutschland', displayText: 'Karlstraße 78, 10117 Berlin' },
    { street: 'Unter den Linden 1', city: 'Berlin', postalCode: '10117', country: 'Deutschland', displayText: 'Unter den Linden 1, 10117 Berlin' },
    { street: 'Friedrichstraße 95', city: 'Berlin', postalCode: '10117', country: 'Deutschland', displayText: 'Friedrichstraße 95, 10117 Berlin' },

    // Stuttgart
    { street: 'Hauptstraße 123', city: 'Stuttgart', postalCode: '70173', country: 'Deutschland', displayText: 'Hauptstraße 123, 70173 Stuttgart' },
    { street: 'Königstraße 28', city: 'Stuttgart', postalCode: '70173', country: 'Deutschland', displayText: 'Königstraße 28, 70173 Stuttgart' },

    // Hamburg
    { street: 'Reeperbahn 154', city: 'Hamburg', postalCode: '20359', country: 'Deutschland', displayText: 'Reeperbahn 154, 20359 Hamburg' },
    { street: 'Jungfernstieg 16', city: 'Hamburg', postalCode: '20354', country: 'Deutschland', displayText: 'Jungfernstieg 16, 20354 Hamburg' },

    // Köln
    { street: 'Hohe Straße 41', city: 'Köln', postalCode: '50667', country: 'Deutschland', displayText: 'Hohe Straße 41, 50667 Köln' },

    // Frankfurt
    { street: 'Zeil 106', city: 'Frankfurt am Main', postalCode: '60313', country: 'Deutschland', displayText: 'Zeil 106, 60313 Frankfurt am Main' },
  ];

  // Search for address suggestions
  const searchAddresses = (query: string): void => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);

    // Simulate API delay
    setTimeout(() => {
      const filtered = addressDatabase.filter((addr) =>
        addr.displayText.toLowerCase().includes(query.toLowerCase())
      );
      setSuggestions(filtered);
      setIsOpen(filtered.length > 0);
      setSelectedIndex(-1);
      setIsLoading(false);
    }, 200);
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const newValue = e.target.value;
    onChange(newValue);
    searchAddresses(newValue);
  };

  // Handle suggestion selection
  const handleSelectSuggestion = (suggestion: AddressSuggestion): void => {
    onChange(suggestion.street);
    onAddressSelect({
      street: suggestion.street,
      city: suggestion.city,
      postalCode: suggestion.postalCode,
      country: suggestion.country,
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
    <div className="space-y-2 relative">
      <Label
        htmlFor="street-autocomplete"
        className={cn(required && "after:content-['*'] after:ml-0.5 after:text-red-500")}
      >
        Straße und Hausnummer
      </Label>

      <div className="relative">
        <Input
          ref={inputRef}
          id="street-autocomplete"
          name="street-address"
          type="text"
          autoComplete="off"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={onBlur}
          onFocus={() => {
            if (value.length >= 3 && suggestions.length > 0) {
              setIsOpen(true);
            }
          }}
          disabled={disabled}
          required={required}
          className={cn(
            'transition-colors pr-10',
            'focus:border-terracotta-600 focus:ring-2 focus:ring-terracotta-100',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-100'
          )}
          placeholder="z.B. Karlstraße 12"
          aria-invalid={!!error}
          aria-describedby={error ? 'street-error' : 'street-hint'}
          aria-autocomplete="list"
          aria-controls="address-suggestions"
          aria-expanded={isOpen}
        />

        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="animate-spin h-4 w-4 border-2 border-terracotta-500 border-t-transparent rounded-full" />
          </div>
        )}
      </div>

      {/* Suggestions dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          id="address-suggestions"
          role="listbox"
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.street}-${suggestion.city}`}
              type="button"
              role="option"
              aria-selected={selectedIndex === index}
              onClick={() => handleSelectSuggestion(suggestion)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={cn(
                'w-full px-4 py-3 text-left hover:bg-terracotta-50 transition-colors',
                'flex items-start gap-3 border-b border-gray-100 last:border-b-0',
                selectedIndex === index && 'bg-terracotta-50'
              )}
            >
              <MapPin className="h-5 w-5 text-terracotta-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {suggestion.street}
                </p>
                <p className="text-xs text-gray-600 truncate">
                  {suggestion.postalCode} {suggestion.city}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Error message */}
      {error && (
        <p id="street-error" className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {/* Hint */}
      {!error && (
        <p id="street-hint" className="text-sm text-gray-500">
          Beginne zu tippen für Vorschläge
        </p>
      )}
    </div>
  );
}
