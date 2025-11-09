'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useStudioRegistration } from '../hooks/useStudioRegistration';
import { Info, Minus, Plus } from 'lucide-react';

/**
 * Capacity Step - Step 5
 * Collects studio capacity (number of treatment beds/rooms) and submits registration
 */
export function CapacityStep(): React.JSX.Element {
  const { state, updateCapacity, goToNextStep } = useStudioRegistration();

  const [capacity, setCapacity] = useState(state.formData.capacity || 2); // Default: 2

  // Handle increment
  const handleIncrement = (): void => {
    if (capacity < 10) {
      setCapacity(capacity + 1);
    }
  };

  // Handle decrement
  const handleDecrement = (): void => {
    if (capacity > 1) {
      setCapacity(capacity - 1);
    }
  };

  // Handle continue
  const handleContinue = (): void => {
    updateCapacity(capacity);
    goToNextStep();
  };

  // Update context on unmount
  useEffect(() => {
    return () => {
      updateCapacity(capacity);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [capacity]);

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Header */}
      <div className="space-y-1 text-center">
        <div className="text-3xl sm:text-4xl">
          <span>🛏️</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
          Wie viele Behandlungsräume?
        </h2>
        <p className="text-gray-600 text-sm sm:text-base">
          Anzahl gleichzeitiger Massagen
        </p>
      </div>

      {/* Capacity Selector */}
      <div className="py-2 sm:py-4">
        <div className="flex items-center justify-center gap-3 sm:gap-6">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-14 w-14 sm:h-16 sm:w-16 rounded-full border-2 hover:border-[#B56550] hover:bg-[#B56550]/5 transition-all active:scale-95"
            onClick={handleDecrement}
            disabled={capacity <= 1}
            aria-label="Verringern"
          >
            <Minus className="h-5 w-5 sm:h-6 sm:w-6" />
          </Button>

          <div
            className="flex items-center justify-center h-20 w-20 sm:h-28 sm:w-28 text-4xl sm:text-6xl font-bold border-4 border-[#B56550] rounded-2xl bg-[#B56550]/5 transition-all"
            aria-live="polite"
            aria-label={`Kapazität: ${capacity}`}
          >
            {capacity}
          </div>

          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-14 w-14 sm:h-16 sm:w-16 rounded-full border-2 hover:border-[#B56550] hover:bg-[#B56550]/5 transition-all active:scale-95"
            onClick={handleIncrement}
            disabled={capacity >= 10}
            aria-label="Erhöhen"
          >
            <Plus className="h-5 w-5 sm:h-6 sm:w-6" />
          </Button>
        </div>
      </div>

      {/* Info Banner - Explains booking availability */}
      <Alert className="border-blue-200 bg-blue-50">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-gray-700">
          <p className="text-xs sm:text-sm font-medium mb-1">
            {capacity} {capacity === 1 ? 'Kunde kann' : 'Kunden können'} zur selben Zeit buchen
          </p>
          <p className="text-xs text-gray-600">
            {capacity === 1
              ? 'Pro Zeitslot ist nur 1 Termin verfügbar.'
              : `Beispiel: ${capacity} Kunden können um 14:00 Uhr gleichzeitig buchen.`}
          </p>
        </AlertDescription>
      </Alert>

      {/* Continue Button */}
      <div className="pt-2 sm:pt-4">
        <Button
          onClick={handleContinue}
          style={{ backgroundColor: '#B56550' }}
          className="w-full h-12 text-white font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98] hover:opacity-90"
        >
          Weiter
        </Button>
      </div>
    </div>
  );
}
