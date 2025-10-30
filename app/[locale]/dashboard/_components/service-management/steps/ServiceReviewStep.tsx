/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Service Review Step (Step 4/5)
 * Review and submit service
 */

'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useServiceManagement } from '../hooks/useServiceManagement';
import { completeServiceSchema } from '../validation/serviceSchemas';
import { createService, updateService } from '@/app/actions/studio/serviceActions';
import { useToast } from '@/components/ui/use-toast';
import { Package, Clock, Euro } from 'lucide-react';

interface ServiceReviewStepProps {
  studioId: string;
  onClose: () => void;
}

export function ServiceReviewStep({
  studioId,
  onClose,
}: ServiceReviewStepProps): React.JSX.Element {
  const { state, setSubmitting, setServiceId, goToNextStep, setErrors } = useServiceManagement();
  const { toast } = useToast();
  const { formData, isSubmitting, mode, serviceId: existingServiceId } = state;

  const handleSubmit = async (): Promise<void> => {
    // Validate all data
    const validation = completeServiceSchema.safeParse(formData);

    if (!validation.success) {
      const fieldErrors = validation.error.flatten().fieldErrors;
      setErrors({
        general: 'Bitte überprüfe deine Eingaben',
      });
      toast({
        title: 'Fehler',
        description: 'Bitte überprüfe deine Eingaben',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      let result;

      if (mode === 'edit' && existingServiceId) {
        // Update existing service
        result = await updateService(existingServiceId, validation.data);
      } else {
        // Create new service
        result = await createService(studioId, validation.data);
      }

      if (result.success && result.serviceId) {
        setServiceId(result.serviceId);
        goToNextStep(); // Go to success step
      } else {
        toast({
          title: 'Fehler',
          description: result.error || 'Service konnte nicht gespeichert werden',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Ein unerwarteter Fehler ist aufgetreten',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Übersicht</h2>
        <p className="text-sm text-muted-foreground">
          Prüfe deine Angaben und speichere den Service
        </p>
      </div>

      {/* Review Card */}
      <Card className="border-2">
        <CardContent className="p-6 space-y-4">
          {/* Service Name */}
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Service</p>
              <p className="text-lg font-semibold text-foreground">{formData.name}</p>
            </div>
          </div>

          <div className="border-t" />

          {/* Duration */}
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Dauer</p>
              <p className="text-lg font-semibold text-foreground">{formData.duration} Minuten</p>
            </div>
          </div>

          <div className="border-t" />

          {/* Price */}
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
              <Euro className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Preis</p>
              <p className="text-lg font-semibold text-foreground">{formData.price.toFixed(2)} €</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {state.errors.general && (
        <div
          className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm"
          role="alert"
        >
          {state.errors.general}
        </div>
      )}

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        disabled={isSubmitting}
        style={{ backgroundColor: '#B56550' }}
        className="w-full h-12 text-white font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98] hover:opacity-90 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed disabled:shadow-none"
      >
        {isSubmitting
          ? mode === 'edit'
            ? 'Wird aktualisiert...'
            : 'Wird gespeichert...'
          : mode === 'edit'
          ? 'Service aktualisieren'
          : 'Service speichern'}
      </Button>
    </div>
  );
}
