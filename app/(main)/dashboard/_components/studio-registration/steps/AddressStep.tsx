'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useStudioRegistration } from '../hooks/useStudioRegistration';
import { addressSchema } from '../validation/studioSchemas';
import { cn } from '@/lib/utils';
import { AddressAutocomplete } from '../components/AddressAutocomplete';
import { CountrySelect } from '../components/CountrySelect';

/**
 * Address Step - Step 2
 * Collects studio address with smart autocomplete
 */
export function AddressStep(): React.JSX.Element {
  const { state, updateAddress, goToNextStep, setErrors } = useStudioRegistration();

  const [street, setStreet] = useState(state.formData.address.street || '');
  const [line2, setLine2] = useState(state.formData.address.line2 || '');
  const [city, setCity] = useState(state.formData.address.city || '');
  const [postalCode, setPostalCode] = useState(state.formData.address.postalCode || '');
  const [country, setCountry] = useState(state.formData.address.country || 'Deutschland');

  const [touched, setTouched] = useState({
    street: false,
    city: false,
    postalCode: false,
    country: false,
  });
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  // Validate field
  const validateField = (
    field: 'street' | 'city' | 'postalCode' | 'country',
    value: string
  ): void => {
    try {
      if (field === 'street') {
        addressSchema.shape.street.parse(value);
      } else if (field === 'city') {
        addressSchema.shape.city.parse(value);
      } else if (field === 'postalCode') {
        addressSchema.shape.postalCode.parse(value);
      } else if (field === 'country') {
        addressSchema.shape.country.parse(value);
      }
      setLocalErrors((prev) => ({ ...prev, [field]: '' }));
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'errors' in error) {
        const zodError = error as { errors: Array<{ message: string }> };
        const message = zodError.errors[0]?.message || 'Invalid value';
        setLocalErrors((prev) => ({ ...prev, [field]: message }));
      }
    }
  };

  // Handle blur
  const handleBlur = (field: 'street' | 'city' | 'postalCode' | 'country'): void => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const value =
      field === 'street'
        ? street
        : field === 'city'
        ? city
        : field === 'postalCode'
        ? postalCode
        : country;
    validateField(field, value);
  };

  // Handle address selection from autocomplete
  const handleAddressSelect = (address: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  }): void => {
    setStreet(address.street);
    setCity(address.city);
    setPostalCode(address.postalCode);
    setCountry(address.country);

    // Mark all fields as touched
    setTouched({
      street: true,
      city: true,
      postalCode: true,
      country: true,
    });

    // Clear errors
    setLocalErrors({});
  };

  // Note: City auto-fill is now handled by AddressAutocomplete component
  // which fills all fields when user selects an address suggestion

  // Handle continue
  const handleContinue = (): void => {
    // Mark all as touched
    setTouched({
      street: true,
      city: true,
      postalCode: true,
      country: true,
    });

    // Validate all fields (Bundesland removed from validation)
    try {
      const validated = addressSchema.parse({
        street,
        line2,
        city,
        state: '', // Not needed anymore
        postalCode,
        country,
      });
      updateAddress(validated);
      setErrors({});
      goToNextStep();
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'errors' in error) {
        const zodError = error as {
          errors: Array<{ path: string[]; message: string }>;
        };
        const errors: Record<string, string> = {};
        zodError.errors.forEach((err: { path: string[]; message: string }) => {
          if (err.path[0]) {
            errors[err.path[0]] = err.message;
          }
        });
        setLocalErrors(errors);
        setErrors(errors);
      }
    }
  };

  // Update context on unmount
  useEffect(() => {
    return () => {
      updateAddress({
        street,
        line2,
        city,
        state: '', // Not needed anymore
        postalCode,
        country,
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [street, line2, city, postalCode, country]);

  const isValid =
    street.trim().length > 0 &&
    city.trim().length > 0 &&
    postalCode.trim().length > 0 &&
    country.trim().length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">Studio-Standort</h2>
        <p className="text-sm text-gray-600">Wo Kunden dich finden können</p>
      </div>

      {/* Form */}
      <div className="space-y-4">
        {/* Smart Address Autocomplete */}
        <AddressAutocomplete
          value={street}
          onChange={setStreet}
          onAddressSelect={handleAddressSelect}
          onBlur={() => handleBlur('street')}
          error={touched.street ? localErrors.street : undefined}
          required
        />

        {/* Address Line 2 */}
        <div className="space-y-2">
          <Label htmlFor="line2">Adresszusatz (Optional)</Label>
          <Input
            id="line2"
            name="line2"
            type="text"
            autoComplete="address-line2"
            value={line2}
            onChange={(e) => setLine2(e.target.value)}
            className="focus:border-terracotta-600 focus:ring-2 focus:ring-terracotta-100"
            placeholder="Stockwerk, Gebäude, etc."
          />
        </div>

        {/* City and Postal Code - Two Column Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* City */}
          <div className="space-y-2">
            <Label
              htmlFor="city"
              className="after:content-['*'] after:ml-0.5 after:text-red-500"
            >
              Stadt
            </Label>
            <Input
              id="city"
              name="city"
              type="text"
              autoComplete="address-level2"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              onBlur={() => handleBlur('city')}
              required
              className={cn(
                'focus:border-terracotta-600 focus:ring-2 focus:ring-terracotta-100',
                touched.city &&
                  localErrors.city &&
                  'border-red-500 focus:border-red-500 focus:ring-red-100'
              )}
              placeholder="Karlsruhe"
              aria-invalid={touched.city && !!localErrors.city}
              aria-describedby={
                touched.city && localErrors.city ? 'city-error' : undefined
              }
            />
            {touched.city && localErrors.city && (
              <p id="city-error" className="text-sm text-red-600" role="alert">
                {localErrors.city}
              </p>
            )}
          </div>

          {/* Postal Code */}
          <div className="space-y-2">
            <Label
              htmlFor="postalCode"
              className="after:content-['*'] after:ml-0.5 after:text-red-500"
            >
              Postleitzahl
            </Label>
            <Input
              id="postalCode"
              name="postalCode"
              type="text"
              autoComplete="postal-code"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              onBlur={() => handleBlur('postalCode')}
              required
              className={cn(
                'focus:border-terracotta-600 focus:ring-2 focus:ring-terracotta-100',
                touched.postalCode &&
                  localErrors.postalCode &&
                  'border-red-500 focus:border-red-500 focus:ring-red-100'
              )}
              placeholder="76133"
              aria-invalid={touched.postalCode && !!localErrors.postalCode}
              aria-describedby={
                touched.postalCode && localErrors.postalCode
                  ? 'postalCode-error'
                  : undefined
              }
            />
            {touched.postalCode && localErrors.postalCode && (
              <p id="postalCode-error" className="text-sm text-red-600" role="alert">
                {localErrors.postalCode}
              </p>
            )}
          </div>
        </div>

        {/* Country Dropdown */}
        <CountrySelect
          value={country}
          onChange={setCountry}
          onBlur={() => handleBlur('country')}
          error={touched.country ? localErrors.country : undefined}
          required
        />
      </div>

      {/* Continue Button */}
      <Button
        onClick={handleContinue}
        disabled={!isValid}
        style={isValid ? { backgroundColor: '#B56550' } : undefined}
        className="w-full h-12 text-white font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98] hover:opacity-90 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed disabled:shadow-none"
      >
        Weiter
      </Button>
    </motion.div>
  );
}
