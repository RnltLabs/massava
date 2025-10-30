/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Service Name Step (Step 1/3)
 * Input service name with examples
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useServiceManagement } from '../hooks/useServiceManagement';
import { serviceNameSchema } from '../validation/serviceSchemas';
import { Package } from 'lucide-react';

const EXAMPLE_NAMES = [
  'Thai-Massage',
  'Öl-Massage',
  'Traditionelle Thai-Massage',
  'Aromatherapie-Massage',
  'Fußreflexzonenmassage',
];

interface ServiceNameStepProps {
  studioId: string;
  onClose: () => void;
}

export function ServiceNameStep({
  studioId,
  onClose,
}: ServiceNameStepProps): React.JSX.Element {
  const { state, updateName, goToNextStep, setErrors } = useServiceManagement();
  const [localName, setLocalName] = useState(state.formData.name);
  const [charCount, setCharCount] = useState(state.formData.name.length);

  useEffect(() => {
    setLocalName(state.formData.name);
    setCharCount(state.formData.name.length);
  }, [state.formData.name]);

  const handleChange = (value: string): void => {
    setLocalName(value);
    setCharCount(value.length);
    updateName(value);
    // Clear errors on change
    if (state.errors.name) {
      setErrors({});
    }
  };

  const handleContinue = (): void => {
    const validation = serviceNameSchema.safeParse({ name: localName });

    if (!validation.success) {
      const fieldErrors = validation.error.flatten().fieldErrors;
      setErrors({
        name: fieldErrors.name?.[0] || 'Ungültiger Name',
      });
      return;
    }

    goToNextStep();
  };

  const handleExampleClick = (example: string): void => {
    handleChange(example);
  };

  return (
    <div className="space-y-6">
      {/* Icon & Title */}
      <div className="text-center space-y-3">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
          <Package className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Service-Name</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Wie heißt dein Service?
          </p>
        </div>
      </div>

      {/* Input */}
      <div className="space-y-2">
        <Label htmlFor="service-name">Service-Name</Label>
        <Input
          id="service-name"
          type="text"
          value={localName}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="z.B. Thai-Massage"
          maxLength={100}
          className="h-12"
          autoFocus
        />
        <div className="flex items-center justify-between text-xs">
          <span
            className={state.errors.name ? 'text-destructive' : 'text-muted-foreground'}
            role={state.errors.name ? 'alert' : undefined}
          >
            {state.errors.name || 'Mindestens 3 Zeichen'}
          </span>
          <span className="text-muted-foreground">{charCount}/100</span>
        </div>
      </div>

      {/* Examples */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Beispiele:</p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_NAMES.map((example) => (
            <button
              key={example}
              onClick={() => handleExampleClick(example)}
              className="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors"
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      {/* Continue Button */}
      <Button
        onClick={handleContinue}
        disabled={!localName || localName.length < 3}
        style={{ backgroundColor: '#B56550' }}
        className="w-full h-12 text-white font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98] hover:opacity-90 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed disabled:shadow-none"
      >
        Weiter
      </Button>
    </div>
  );
}
