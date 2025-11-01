/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Service Step (Step 2/4)
 * Select service for booking
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useQuickAddBooking } from '../QuickAddBookingContext';
import { serviceStepSchema } from '../validation/bookingSchemas';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
  description?: string | null;
}

interface ServiceStepProps {
  studioId: string;
  services: Service[];
}

export function ServiceStep({ studioId, services }: ServiceStepProps): React.JSX.Element {
  const { state, setService, goToNextStep, setErrors } = useQuickAddBooking();
  const [selectedServiceId, setSelectedServiceId] = useState(state.formData.serviceId || '');

  // Filter services: only show 30, 45, 60, 90 minutes (no 120 min)
  const filteredServices = services.filter(
    (service) => [30, 45, 60, 90].includes(service.duration)
  );

  const handleSelectService = (serviceId: string): void => {
    setSelectedServiceId(serviceId);
    setService(serviceId);
    setErrors({});
  };

  const handleContinue = (): void => {
    const validation = serviceStepSchema.safeParse({ serviceId: selectedServiceId });

    if (!validation.success) {
      const fieldErrors = validation.error.flatten().fieldErrors;
      setErrors({
        service: fieldErrors.serviceId?.[0] || 'Bitte wähle einen Service',
      });
      return;
    }

    goToNextStep();
  };

  const formatDuration = (minutes: number): string => {
    return `${minutes} Min`;
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  return (
    <div className="space-y-6">
      {/* Icon & Title */}
      <div className="text-center space-y-3">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Welche Leistung?</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Wähle den gewünschten Service
          </p>
        </div>
      </div>

      {/* Service Selection */}
      <div className="space-y-3">
        {filteredServices.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Keine Services verfügbar.</p>
            <p className="text-sm mt-2">Bitte füge zuerst Services hinzu.</p>
          </div>
        ) : (
          filteredServices.map((service) => (
            <button
              key={service.id}
              onClick={() => handleSelectService(service.id)}
              className={cn(
                'w-full text-left p-4 rounded-xl border-2 transition-all duration-200',
                'hover:border-primary/50 hover:bg-primary/5',
                'focus:outline-none focus:ring-2 focus:ring-primary/20',
                selectedServiceId === service.id
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-background'
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Service Name + Duration */}
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <h3 className="font-semibold text-foreground">{service.name}</h3>
                    <span className="text-sm text-muted-foreground">
                      · {formatDuration(service.duration)}
                    </span>
                  </div>

                  {/* Description */}
                  {service.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {service.description}
                    </p>
                  )}

                  {/* Price */}
                  <div className="mt-2">
                    <span className="text-base font-semibold text-foreground">
                      {formatPrice(service.price)}
                    </span>
                  </div>
                </div>
                <div
                  className={cn(
                    'ml-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all',
                    selectedServiceId === service.id
                      ? 'border-primary bg-primary'
                      : 'border-gray-300'
                  )}
                >
                  {selectedServiceId === service.id && (
                    <div className="w-3 h-3 bg-white rounded-full" />
                  )}
                </div>
              </div>
            </button>
          ))
        )}
        {state.errors.service && (
          <p className="text-xs text-destructive text-center" role="alert">
            {state.errors.service}
          </p>
        )}
      </div>

      {/* Continue Button */}
      <Button
        onClick={handleContinue}
        disabled={!selectedServiceId || filteredServices.length === 0}
        style={{ backgroundColor: '#B56550' }}
        className="w-full h-12 text-white font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98] hover:opacity-90 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed disabled:shadow-none"
      >
        Weiter
      </Button>
    </div>
  );
}
