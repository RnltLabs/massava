'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface CountrySelectProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
}

/**
 * Country Select Component
 * Dropdown for selecting country with common countries prioritized
 */
export function CountrySelect({
  value,
  onChange,
  onBlur,
  error,
  disabled,
  required,
}: CountrySelectProps): React.JSX.Element {
  // Common countries (prioritized in dropdown)
  const countries = [
    { value: 'DE', label: 'Deutschland' },
    { value: 'AT', label: 'Österreich' },
    { value: 'CH', label: 'Schweiz' },
    { value: 'FR', label: 'Frankreich' },
    { value: 'IT', label: 'Italien' },
    { value: 'ES', label: 'Spanien' },
    { value: 'NL', label: 'Niederlande' },
    { value: 'BE', label: 'Belgien' },
    { value: 'PL', label: 'Polen' },
    { value: 'CZ', label: 'Tschechien' },
    { value: 'GB', label: 'Vereinigtes Königreich' },
    { value: 'US', label: 'USA' },
  ];

  return (
    <div className="space-y-2">
      <Label
        htmlFor="country"
        className={cn(required && "after:content-['*'] after:ml-0.5 after:text-red-500")}
      >
        Land
      </Label>

      <Select
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        required={required}
      >
        <SelectTrigger
          id="country"
          onBlur={onBlur}
          className={cn(
            'w-full h-10',
            'focus:border-terracotta-600 focus:ring-2 focus:ring-terracotta-100',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-100'
          )}
          aria-invalid={!!error}
          aria-describedby={error ? 'country-error' : undefined}
        >
          <SelectValue placeholder="Land auswählen" />
        </SelectTrigger>
        <SelectContent>
          {countries.map((country) => (
            <SelectItem key={country.value} value={country.label}>
              {country.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Error message */}
      {error && (
        <p id="country-error" className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
