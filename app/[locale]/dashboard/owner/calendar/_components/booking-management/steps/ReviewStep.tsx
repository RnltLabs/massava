/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Review Step (Step 4/4)
 * Review booking details and submit
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useQuickAddBooking } from '../QuickAddBookingContext';
import { createManualBooking } from '../../../actions';
import { useToast } from '@/components/ui/use-toast';
import { format, parse } from 'date-fns';
import { de } from 'date-fns/locale';
import { User, Sparkles, Calendar, Clock, FileText } from 'lucide-react';
import { CapacityWarningSheet } from '../../CapacityWarningSheet';

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
}

interface ReviewStepProps {
  studioId: string;
  services: Service[];
}

export function ReviewStep({ studioId, services }: ReviewStepProps): React.JSX.Element {
  const { state, setNotes, setSubmitting, setBookingId, goToNextStep, goToStep } = useQuickAddBooking();
  const { toast } = useToast();
  const [notes, setNotesLocal] = useState(state.formData.notes || '');

  // Capacity warning state
  const [showCapacityWarning, setShowCapacityWarning] = useState(false);
  const [capacityWarningData, setCapacityWarningData] = useState<{
    current: number;
    max: number;
    bookings: Array<{ id: string; customerName: string; serviceName: string }>;
  } | null>(null);

  const selectedService = services.find((s) => s.id === state.formData.serviceId);

  const handleNotesChange = (value: string): void => {
    setNotesLocal(value);
    setNotes(value);
  };

  const handleSubmit = async (overrideCapacity = false): Promise<void> => {
    setSubmitting(true);

    try {
      const result = await createManualBooking({
        studioId,
        customerName: state.formData.customerName!,
        customerPhone: state.formData.customerPhone!,
        serviceId: state.formData.serviceId!,
        date: state.formData.date!,
        time: state.formData.time!,
        notes: notes || undefined,
        overrideCapacity, // Pass override flag
      });

      // Handle capacity warning
      if (result.error === 'capacity_full' && result.capacityWarning) {
        setCapacityWarningData(result.capacityWarning);
        setShowCapacityWarning(true);
        setSubmitting(false);
        return;
      }

      if (result.success && result.data) {
        setBookingId(result.data.id);
        toast({
          title: 'Termin gebucht!',
          description: 'Der Termin wurde erfolgreich angelegt.',
        });
        goToNextStep();
      } else {
        toast({
          title: 'Fehler',
          description: result.error || 'Termin konnte nicht erstellt werden.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Ein unerwarteter Fehler ist aufgetreten.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleBookAnyway = (): void => {
    setShowCapacityWarning(false);
    handleSubmit(true); // Override capacity
  };

  const handleChooseDifferentTime = (): void => {
    setShowCapacityWarning(false);
    // Go back to DateTime step (Step 3)
    goToStep(2);
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = parse(dateString, 'yyyy-MM-dd', new Date());
      return format(date, 'EEEE, d. MMMM yyyy', { locale: de });
    } catch {
      return dateString;
    }
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  const calculateEndTime = (): string => {
    if (!state.formData.time || !selectedService) return '';
    const [hours, minutes] = state.formData.time.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    const endDate = new Date(startDate.getTime() + selectedService.duration * 60000);
    return format(endDate, 'HH:mm');
  };

  const customerName = state.formData.customerName;
  const customerPhone = state.formData.customerPhone;
  const endTime = calculateEndTime();

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="text-center space-y-3">
        <h2 className="text-2xl font-bold text-foreground">Zusammenfassung</h2>
        <p className="text-sm text-muted-foreground">
          Bitte überprüfe die Angaben
        </p>
      </div>

      {/* Booking Details */}
      <div className="space-y-4 py-4">
        {/* Customer */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground">Kontakt</p>
            <p className="font-semibold text-foreground truncate">{customerName}</p>
            {customerPhone && (
              <p className="text-sm text-muted-foreground">{customerPhone}</p>
            )}
          </div>
        </div>

        {/* Service */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground">Service</p>
            <p className="font-semibold text-foreground">{selectedService?.name}</p>
            {selectedService && (
              <p className="text-sm text-muted-foreground">
                {selectedService.duration} Min • {formatPrice(selectedService.price)}
              </p>
            )}
          </div>
        </div>

        {/* Date */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground">Datum</p>
            <p className="font-semibold text-foreground">
              {state.formData.date && formatDate(state.formData.date)}
            </p>
          </div>
        </div>

        {/* Time */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
            <Clock className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground">Uhrzeit</p>
            <p className="font-semibold text-foreground">
              {state.formData.time}
              {endTime && ` - ${endTime}`}
            </p>
          </div>
        </div>
      </div>

      {/* Notes (Optional) */}
      <div className="space-y-2">
        <Label htmlFor="booking-notes" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Notizen (optional)
        </Label>
        <Textarea
          id="booking-notes"
          value={notes}
          onChange={(e) => handleNotesChange(e.target.value)}
          placeholder="Besondere Wünsche oder Hinweise..."
          className="min-h-[80px] resize-none"
          maxLength={500}
        />
        <p className="text-xs text-muted-foreground text-right">
          {notes.length}/500
        </p>
      </div>

      {/* Submit Button */}
      <Button
        onClick={() => handleSubmit()}
        disabled={state.isSubmitting}
        style={{ backgroundColor: '#B56550' }}
        className="w-full h-12 text-white font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98] hover:opacity-90 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed disabled:shadow-none"
      >
        {state.isSubmitting ? 'Wird gebucht...' : 'Jetzt buchen'}
      </Button>

      {/* Capacity Warning Sheet */}
      {capacityWarningData && (
        <CapacityWarningSheet
          isOpen={showCapacityWarning}
          onClose={() => setShowCapacityWarning(false)}
          timeSlot={state.formData.time}
          current={capacityWarningData.current}
          max={capacityWarningData.max}
          bookings={capacityWarningData.bookings}
          onChooseDifferentTime={handleChooseDifferentTime}
          onBookAnyway={handleBookAnyway}
        />
      )}
    </div>
  );
}
