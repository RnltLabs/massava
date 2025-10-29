'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useStudioRegistration } from '../hooks/useStudioRegistration';
import { addressSchema } from '../validation/studioSchemas';
import { cn } from '@/lib/utils';

/**
 * Address Step - Step 2
 * Collects studio address information
 */
export function AddressStep(): React.JSX.Element {
  const { state, updateAddress, goToNextStep, setErrors } = useStudioRegistration();

  const [street, setStreet] = useState(state.formData.address.street || '');
  const [line2, setLine2] = useState(state.formData.address.line2 || '');
  const [city, setCity] = useState(state.formData.address.city || '');
  const [stateProvince, setStateProvince] = useState(state.formData.address.state || '');
  const [postalCode, setPostalCode] = useState(state.formData.address.postalCode || '');
  const [country, setCountry] = useState(state.formData.address.country || '');

  const [touched, setTouched] = useState({
    street: false,
    city: false,
    state: false,
    postalCode: false,
    country: false,
  });
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  // Validate field
  const validateField = (
    field: 'street' | 'city' | 'state' | 'postalCode' | 'country',
    value: string
  ): void => {
    try {
      if (field === 'street') {
        addressSchema.shape.street.parse(value);
      } else if (field === 'city') {
        addressSchema.shape.city.parse(value);
      } else if (field === 'state') {
        addressSchema.shape.state.parse(value);
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
  const handleBlur = (field: 'street' | 'city' | 'state' | 'postalCode' | 'country'): void => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const values = { street, city, state: stateProvince, postalCode, country };
    validateField(field, values[field]);
  };

  // Handle continue
  const handleContinue = (): void => {
    // Mark all as touched
    setTouched({
      street: true,
      city: true,
      state: true,
      postalCode: true,
      country: true,
    });

    // Validate all fields
    try {
      const validated = addressSchema.parse({
        street,
        line2: line2 || undefined,
        city,
        state: stateProvince,
        postalCode,
        country,
      });
      updateAddress(validated);
      setErrors({});
      goToNextStep();
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'errors' in error) {
        const zodError = error as { errors: Array<{ path: string[]; message: string }> };
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
        state: stateProvince,
        postalCode,
        country,
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [street, line2, city, stateProvince, postalCode, country]);

  const isValid =
    street.trim().length >= 5 &&
    city.trim().length >= 2 &&
    stateProvince.trim().length >= 2 &&
    postalCode.trim().length >= 3 &&
    country.trim().length >= 2;

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
        {/* Street Address */}
        <div className="space-y-2">
          <Label htmlFor="street" className="after:content-['*'] after:ml-0.5 after:text-red-500">
            Straße und Hausnummer
          </Label>
          <Input
            id="street"
            name="street"
            type="text"
            autoComplete="street-address"
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            onBlur={() => handleBlur('street')}
            required
            className={cn(
              'focus:border-terracotta-600 focus:ring-2 focus:ring-terracotta-100',
              touched.street && localErrors.street && 'border-red-500 focus:border-red-500 focus:ring-red-100'
            )}
            placeholder="z.B. Hauptstraße 123"
            aria-invalid={touched.street && !!localErrors.street}
            aria-describedby={touched.street && localErrors.street ? 'street-error' : undefined}
          />
          {touched.street && localErrors.street && (
            <p id="street-error" className="text-sm text-red-600" role="alert">
              {localErrors.street}
            </p>
          )}
        </div>

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

        {/* City */}
        <div className="space-y-2">
          <Label htmlFor="city" className="after:content-['*'] after:ml-0.5 after:text-red-500">
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
              touched.city && localErrors.city && 'border-red-500 focus:border-red-500 focus:ring-red-100'
            )}
            placeholder="München"
            aria-invalid={touched.city && !!localErrors.city}
            aria-describedby={touched.city && localErrors.city ? 'city-error' : undefined}
          />
          {touched.city && localErrors.city && (
            <p id="city-error" className="text-sm text-red-600" role="alert">
              {localErrors.city}
            </p>
          )}
        </div>

        {/* State and Postal Code - Two Column Layout on Desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* State/Province */}
          <div className="space-y-2">
            <Label htmlFor="state" className="after:content-['*'] after:ml-0.5 after:text-red-500">
              Bundesland
            </Label>
            <Input
              id="state"
              name="state"
              type="text"
              autoComplete="address-level1"
              value={stateProvince}
              onChange={(e) => setStateProvince(e.target.value)}
              onBlur={() => handleBlur('state')}
              required
              className={cn(
                'focus:border-terracotta-600 focus:ring-2 focus:ring-terracotta-100',
                touched.state && localErrors.state && 'border-red-500 focus:border-red-500 focus:ring-red-100'
              )}
              placeholder="Bayern"
              aria-invalid={touched.state && !!localErrors.state}
              aria-describedby={touched.state && localErrors.state ? 'state-error' : undefined}
            />
            {touched.state && localErrors.state && (
              <p id="state-error" className="text-sm text-red-600" role="alert">
                {localErrors.state}
              </p>
            )}
          </div>

          {/* Postal Code */}
          <div className="space-y-2">
            <Label htmlFor="postalCode" className="after:content-['*'] after:ml-0.5 after:text-red-500">
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
                touched.postalCode && localErrors.postalCode && 'border-red-500 focus:border-red-500 focus:ring-red-100'
              )}
              placeholder="80331"
              aria-invalid={touched.postalCode && !!localErrors.postalCode}
              aria-describedby={touched.postalCode && localErrors.postalCode ? 'postalCode-error' : undefined}
            />
            {touched.postalCode && localErrors.postalCode && (
              <p id="postalCode-error" className="text-sm text-red-600" role="alert">
                {localErrors.postalCode}
              </p>
            )}
          </div>
        </div>

        {/* Country */}
        <div className="space-y-2">
          <Label htmlFor="country" className="after:content-['*'] after:ml-0.5 after:text-red-500">
            Land
          </Label>
          <Input
            id="country"
            name="country"
            type="text"
            autoComplete="country-name"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            onBlur={() => handleBlur('country')}
            required
            className={cn(
              'focus:border-terracotta-600 focus:ring-2 focus:ring-terracotta-100',
              touched.country && localErrors.country && 'border-red-500 focus:border-red-500 focus:ring-red-100'
            )}
            placeholder="Deutschland"
            aria-invalid={touched.country && !!localErrors.country}
            aria-describedby={touched.country && localErrors.country ? 'country-error' : undefined}
          />
          {touched.country && localErrors.country && (
            <p id="country-error" className="text-sm text-red-600" role="alert">
              {localErrors.country}
            </p>
          )}
        </div>
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
