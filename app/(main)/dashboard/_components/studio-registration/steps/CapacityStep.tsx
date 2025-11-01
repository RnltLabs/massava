'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useStudioRegistration } from '../hooks/useStudioRegistration';
import { registerStudio } from '@/app/actions/studio/registerStudio';
import { Info, Minus, Plus, Loader2 } from 'lucide-react';

/**
 * Capacity Step - Step 5
 * Collects studio capacity (number of treatment beds/rooms) and submits registration
 */
export function CapacityStep(): React.JSX.Element {
  const { state, updateCapacity, goToNextStep, setSubmitting, setStudioId, setErrors } = useStudioRegistration();

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

  // Handle continue and submit registration
  const handleContinue = async (): Promise<void> => {
    updateCapacity(capacity);

    // Prepare complete data for registration
    const completeData = {
      name: state.formData.basicInfo.name || '',
      description: state.formData.basicInfo.description || '',
      address: {
        street: state.formData.address.street || '',
        line2: state.formData.address.line2,
        city: state.formData.address.city || '',
        postalCode: state.formData.address.postalCode || '',
        country: state.formData.address.country || '',
      },
      contact: {
        phone: state.formData.contact.phone || '',
        email: state.formData.contact.email || '',
        website: state.formData.contact.website || undefined,
      },
      openingHours: state.formData.openingHours as {
        mode: 'same' | 'different';
        sameHours?: { open: string; close: string };
        differentHours?: Record<string, { open: string; close: string } | null>;
      } | undefined,
      capacity: capacity,
    };

    // Submit to server
    setSubmitting(true);
    try {
      const result = await registerStudio(completeData);

      if (result.success && result.studioId) {
        setStudioId(result.studioId);
        goToNextStep();
      } else {
        setErrors({ submit: result.error || 'Registration failed' });
      }
    } catch (error) {
      console.error('Registration error:', error);
      setErrors({ submit: 'Ein unerwarteter Fehler ist aufgetreten' });
    } finally {
      setSubmitting(false);
    }
  };

  // Update context on unmount
  useEffect(() => {
    return () => {
      updateCapacity(capacity);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [capacity]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-4xl mb-1">
          <span>🛏️</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
          Wie viele Behandlungsräume hast du?
        </h2>
        <p className="text-gray-600 text-base md:text-lg">
          Gib an, wie viele Massagen gleichzeitig stattfinden können.
        </p>
      </div>

      {/* Capacity Selector */}
      <div className="space-y-4">
        <Label htmlFor="capacity" className="text-base font-medium">
          Anzahl der Liegen/Räume
        </Label>

        <div className="flex items-center justify-center gap-6 py-6">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-16 w-16 rounded-full border-2 hover:border-[#B56550] hover:bg-[#B56550]/5 transition-all"
            onClick={handleDecrement}
            disabled={capacity <= 1}
            aria-label="Verringern"
          >
            <Minus className="h-6 w-6" />
          </Button>

          <div
            className="flex items-center justify-center h-24 w-24 text-5xl font-bold border-4 border-[#B56550] rounded-2xl bg-[#B56550]/5 transition-all"
            aria-live="polite"
            aria-label={`Kapazität: ${capacity}`}
          >
            {capacity}
          </div>

          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-16 w-16 rounded-full border-2 hover:border-[#B56550] hover:bg-[#B56550]/5 transition-all"
            onClick={handleIncrement}
            disabled={capacity >= 10}
            aria-label="Erhöhen"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>

        <p className="text-sm text-gray-500 text-center">
          Wähle zwischen 1 und 10 Räumen
        </p>
      </div>

      {/* Info Alert */}
      <Alert className="border-blue-200 bg-blue-50">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-gray-700">
          <strong>Beispiel:</strong> Mit {capacity} {capacity === 1 ? 'Raum' : 'Räumen'} kannst
          du bis zu {capacity} {capacity === 1 ? 'Behandlung' : 'Behandlungen'} zur gleichen Zeit
          durchführen.
          {capacity > 1 && ' Du wirst gewarnt, wenn ein Zeitslot voll ist.'}
        </AlertDescription>
      </Alert>

      {/* Submit Error */}
      {state.errors.submit && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-700">{state.errors.submit}</AlertDescription>
        </Alert>
      )}

      {/* Continue Button */}
      <div className="pt-4">
        <Button
          onClick={handleContinue}
          disabled={state.isSubmitting}
          style={!state.isSubmitting ? { backgroundColor: '#B56550' } : undefined}
          className="w-full text-white py-6 text-lg font-semibold rounded-2xl shadow-lg hover:opacity-90 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {state.isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Studio wird erstellt...
            </>
          ) : (
            'Studio erstellen'
          )}
        </Button>
      </div>

      {/* Skip Option */}
      <div className="text-center">
        <button
          onClick={handleContinue}
          disabled={state.isSubmitting}
          className="text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Mit Standard-Einstellung fortfahren
        </button>
      </div>
    </motion.div>
  );
}
