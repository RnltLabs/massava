/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Service Price Step (Step 3/3)
 * Enter service price in EUR
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useServiceManagement } from '../hooks/useServiceManagement';
import { servicePriceSchema } from '../validation/serviceSchemas';
import { Euro } from 'lucide-react';

interface ServicePriceStepProps {
  studioId: string;
  onClose: () => void;
}

export function ServicePriceStep({
  studioId,
  onClose,
}: ServicePriceStepProps): React.JSX.Element {
  const { state, updatePrice, goToNextStep, setErrors } = useServiceManagement();
  const [localPrice, setLocalPrice] = useState(state.formData.price);

  useEffect(() => {
    setLocalPrice(state.formData.price);
  }, [state.formData.price]);

  const handleChange = (value: number): void => {
    setLocalPrice(value);
    updatePrice(value);
    // Clear errors on change
    if (state.errors.price) {
      setErrors({});
    }
  };

  const handleContinue = (): void => {
    const validation = servicePriceSchema.safeParse({ price: localPrice });

    if (!validation.success) {
      const fieldErrors = validation.error.flatten().fieldErrors;
      setErrors({
        price: fieldErrors.price?.[0] || 'Ungültiger Preis',
      });
      return;
    }

    goToNextStep();
  };

  return (
    <div className="space-y-6">
      {/* Icon & Title */}
      <div className="text-center space-y-3">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
          <Euro className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Preis</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Was kostet der Service?
          </p>
        </div>
      </div>

      {/* Price Input */}
      <div className="space-y-2">
        <Label htmlFor="service-price">Preis in Euro</Label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-lg font-semibold">
            €
          </span>
          <Input
            id="service-price"
            type="number"
            value={localPrice}
            onChange={(e) => handleChange(parseFloat(e.target.value) || 0)}
            min={5}
            max={500}
            step={5}
            className="h-14 pl-10 text-2xl font-bold text-center"
            autoFocus
          />
        </div>
        <p
          className={`text-xs ${state.errors.price ? 'text-destructive' : 'text-muted-foreground'}`}
          role={state.errors.price ? 'alert' : undefined}
        >
          {state.errors.price || '5€ - 500€ möglich'}
        </p>
      </div>

      {/* Price Preview */}
      <div className="p-4 bg-muted/50 rounded-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Dein Preis</p>
            <p className="text-2xl font-bold text-foreground">{localPrice.toFixed(2)} €</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Pro {state.formData.duration} Min</p>
            <p className="text-sm font-medium text-muted-foreground">
              ≈ {(localPrice / (state.formData.duration / 60)).toFixed(2)} €/Std
            </p>
          </div>
        </div>
      </div>

      {/* Continue Button */}
      <Button
        onClick={handleContinue}
        disabled={!localPrice || localPrice < 5 || localPrice > 500}
        style={{ backgroundColor: '#B56550' }}
        className="w-full h-12 text-white font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98] hover:opacity-90 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed disabled:shadow-none"
      >
        Weiter zur Übersicht
      </Button>
    </div>
  );
}
