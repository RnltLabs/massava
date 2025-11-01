/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Contact Step (Step 1/4)
 * Simple contact entry for phone bookings
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useQuickAddBooking } from '../QuickAddBookingContext';
import { User, Phone } from 'lucide-react';

export function ContactStep(): React.JSX.Element {
  console.log('🔵 [ContactStep] RENDER START');

  const { state, setContactInfo, goToNextStep, setErrors } = useQuickAddBooking();

  // Use local state without initializing from context on every render
  const [localName, setLocalName] = useState('');
  const [localPhone, setLocalPhone] = useState('');

  console.log('📊 [ContactStep] Current State:', {
    localName,
    localPhone,
    contextName: state.formData.customerName,
    contextPhone: state.formData.customerPhone,
    currentStep: state.currentStep,
    errors: state.errors,
  });

  // Initialize local state from context ONLY on mount
  React.useEffect(() => {
    console.log('🟢 [ContactStep] useEffect MOUNT - Initializing from context');
    if (state.formData.customerName) {
      console.log('  ↪️ Setting localName:', state.formData.customerName);
      setLocalName(state.formData.customerName);
    }
    if (state.formData.customerPhone) {
      console.log('  ↪️ Setting localPhone:', state.formData.customerPhone);
      setLocalPhone(state.formData.customerPhone);
    }

    return () => {
      console.log('🔴 [ContactStep] useEffect UNMOUNT');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - run only on mount

  const handleContinue = (): void => {
    // Simple validation
    if (!localName.trim()) {
      setErrors({ name: 'Bitte gib einen Namen ein' });
      return;
    }

    if (!localPhone.trim()) {
      setErrors({ phone: 'Bitte gib eine Telefonnummer ein' });
      return;
    }

    setContactInfo(localName.trim(), localPhone.trim());
    goToNextStep();
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
          <User className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Kontaktdaten</h3>
        <p className="text-sm text-muted-foreground">
          Name und Telefonnummer für den Termin
        </p>
      </div>

      <div className="space-y-4">
        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name">
            Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            type="text"
            placeholder="z.B. Max Mustermann"
            value={localName}
            onChange={(e) => {
              setLocalName(e.target.value);
              // Only clear errors if there are any
              if (Object.keys(state.errors).length > 0) {
                setErrors({});
              }
            }}
            autoFocus
          />
          {state.errors.name && (
            <p className="text-sm text-destructive">{state.errors.name}</p>
          )}
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <Label htmlFor="phone">
            Telefonnummer <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="phone"
              type="tel"
              placeholder="z.B. 0176 12345678"
              value={localPhone}
              onChange={(e) => {
                setLocalPhone(e.target.value);
                // Only clear errors if there are any
                if (Object.keys(state.errors).length > 0) {
                  setErrors({});
                }
              }}
              className="pl-10"
            />
          </div>
          {state.errors.phone && (
            <p className="text-sm text-destructive">{state.errors.phone}</p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end">
        <Button onClick={handleContinue} className="w-full sm:w-auto">
          Weiter
        </Button>
      </div>
    </div>
  );
}
