'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface PhoneInputProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  label?: string;
}

/**
 * Format phone number on blur
 * Accepts international formats
 * Example: "(555) 123-4567" or "+1 555-123-4567"
 */
function formatPhoneNumber(value: string): string {
  // Remove all non-digit characters
  const digits = value.replace(/\D/g, '');

  // Format based on length
  if (digits.length === 0) return '';
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  // International format
  return `+${digits.slice(0, digits.length - 10)} (${digits.slice(-10, -7)}) ${digits.slice(-7, -4)}-${digits.slice(-4)}`;
}

/**
 * Phone Input Component with formatting
 */
export function PhoneInput({
  id = 'phone',
  name = 'phone',
  value,
  onChange,
  onBlur,
  error,
  disabled = false,
  required = false,
  label = 'Phone Number',
}: PhoneInputProps): React.JSX.Element {
  const [isFocused, setIsFocused] = useState(false);

  const handleBlur = (): void => {
    setIsFocused(false);
    // Format on blur
    const formatted = formatPhoneNumber(value);
    onChange(formatted);
    onBlur?.();
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className={cn(required && 'after:content-["*"] after:ml-0.5 after:text-red-500')}>
        {label}
      </Label>
      <Input
        id={id}
        name={name}
        type="tel"
        autoComplete="tel"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={handleBlur}
        disabled={disabled}
        required={required}
        className={cn(
          'transition-colors',
          isFocused && 'border-terracotta-600 ring-2 ring-terracotta-100',
          error && 'border-red-500 focus:border-red-500 focus:ring-red-100'
        )}
        placeholder="(555) 123-4567"
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error && (
        <p id={`${id}-error`} className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
