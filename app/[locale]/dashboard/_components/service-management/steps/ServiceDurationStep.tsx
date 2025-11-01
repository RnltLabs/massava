/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Service Duration Step (Step 2/3)
 * Select duration with quick presets
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useServiceManagement } from '../hooks/useServiceManagement';
import { serviceDurationSchema } from '../validation/serviceSchemas';
import { Clock } from 'lucide-react';

const DURATION_PRESETS = [30, 45, 60, 90];

interface ServiceDurationStepProps {
  studioId: string;
  onClose: () => void;
}

export function ServiceDurationStep({
  studioId,
  onClose,
}: ServiceDurationStepProps): React.JSX.Element {
  const { state, updateDuration, goToNextStep, setErrors } = useServiceManagement();
  const [localDuration, setLocalDuration] = useState(state.formData.duration);

  useEffect(() => {
    setLocalDuration(state.formData.duration);
  }, [state.formData.duration]);

  const handleChange = (value: number): void => {
    setLocalDuration(value);
    updateDuration(value);
    // Clear errors on change
    if (state.errors.duration) {
      setErrors({});
    }
  };

  const handleContinue = (): void => {
    const validation = serviceDurationSchema.safeParse({ duration: localDuration });

    if (!validation.success) {
      const fieldErrors = validation.error.flatten().fieldErrors;
      setErrors({
        duration: fieldErrors.duration?.[0] || 'Ungültige Dauer',
      });
      return;
    }

    goToNextStep();
  };

  const handlePresetClick = (duration: number): void => {
    handleChange(duration);
  };

  return (
    <div className="space-y-6">
      {/* Icon & Title */}
      <div className="text-center space-y-3">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
          <Clock className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Dauer</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Wie lange dauert der Service?
          </p>
        </div>
      </div>

      {/* Presets */}
      <div className="space-y-2">
        <Label>Schnellauswahl</Label>
        <div className="grid grid-cols-4 gap-3">
          {DURATION_PRESETS.map((preset) => (
            <Button
              key={preset}
              onClick={() => handlePresetClick(preset)}
              variant={localDuration === preset ? 'default' : 'outline'}
              className="h-16 flex flex-col items-center justify-center"
              style={
                localDuration === preset
                  ? {
                      backgroundColor: '#B56550',
                    }
                  : undefined
              }
            >
              <span className="text-2xl font-bold">{preset}</span>
              <span className="text-xs">Min</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Custom Input */}
      <div className="space-y-2">
        <Label htmlFor="service-duration">Oder eigene Dauer eingeben</Label>
        <div className="relative">
          <Input
            id="service-duration"
            type="number"
            value={localDuration}
            onChange={(e) => handleChange(parseInt(e.target.value) || 0)}
            min={15}
            max={240}
            step={15}
            className="h-12 pr-16"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
            Minuten
          </span>
        </div>
        <p
          className={`text-xs ${state.errors.duration ? 'text-destructive' : 'text-muted-foreground'}`}
          role={state.errors.duration ? 'alert' : undefined}
        >
          {state.errors.duration || '15-240 Minuten möglich'}
        </p>
      </div>

      {/* Continue Button */}
      <Button
        onClick={handleContinue}
        disabled={!localDuration || localDuration < 15 || localDuration > 240}
        style={{ backgroundColor: '#B56550' }}
        className="w-full h-12 text-white font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98] hover:opacity-90 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed disabled:shadow-none"
      >
        Weiter
      </Button>
    </div>
  );
}
