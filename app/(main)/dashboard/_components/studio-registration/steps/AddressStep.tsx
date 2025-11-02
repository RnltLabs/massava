'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useStudioRegistration } from '../hooks/useStudioRegistration';
import { addressSchema } from '../validation/studioSchemas';
import { AddressAutocomplete } from '../components/AddressAutocomplete';

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
    console.log('AddressStep: handleContinue called', { street, city, postalCode, country });

    // Mark all as touched
    setTouched({
      street: true,
      city: true,
      postalCode: true,
      country: true,
    });

    // Validate all fields
    try {
      const validated = addressSchema.parse({
        street,
        line2,
        city,
        postalCode,
        country,
      });
      console.log('AddressStep: Validation successful', validated);
      updateAddress(validated);
      setErrors({});
      goToNextStep();
    } catch (error: unknown) {
      console.error('AddressStep: Validation failed', error);
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
        console.log('AddressStep: Validation errors', errors);
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
        {/* Smart Address Autocomplete - fills all fields automatically */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-gray-700">
            Studio-Adresse <span className="text-red-500">*</span>
          </Label>
          <AddressAutocomplete
            value={street}
            onChange={setStreet}
            onAddressSelect={handleAddressSelect}
            onBlur={() => handleBlur('street')}
            error={touched.street ? localErrors.street : undefined}
            required
          />
          <p className="text-xs text-gray-500">
            Beginne zu tippen und wähle deine Adresse aus den Vorschlägen
          </p>
        </div>

        {/* Address Line 2 - Optional */}
        <div className="space-y-2">
          <Label htmlFor="line2" className="text-sm font-semibold text-gray-700">
            Adresszusatz (Optional)
          </Label>
          <Input
            id="line2"
            name="line2"
            type="text"
            autoComplete="address-line2"
            value={line2}
            onChange={(e) => setLine2(e.target.value)}
            className="focus:border-terracotta-600 focus:ring-2 focus:ring-terracotta-100"
            placeholder="z.B. 2. OG, Hinterhaus, etc."
          />
        </div>

        {/* Hidden/Read-only fields - auto-filled by autocomplete */}
        {(city || postalCode || country !== 'Deutschland') && (
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
            <p className="text-xs font-semibold text-gray-600 mb-2">Automatisch erkannt:</p>
            <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
              {city && <div><span className="font-medium">Stadt:</span> {city}</div>}
              {postalCode && <div><span className="font-medium">PLZ:</span> {postalCode}</div>}
              {country !== 'Deutschland' && <div className="col-span-2"><span className="font-medium">Land:</span> {country}</div>}
            </div>
          </div>
        )}
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
