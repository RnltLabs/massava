/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Reschedule Booking Dialog Component
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMediaQuery } from '@/hooks/use-media-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { InfoIcon } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { rescheduleBooking } from '@/app/[locale]/customer/actions/bookings';
import type { BookingWithRelations } from '@/app/[locale]/customer/actions/bookings';

interface RescheduleDialogProps {
  booking: BookingWithRelations;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RescheduleDialog({
  booking,
  open,
  onOpenChange,
}: RescheduleDialogProps): React.JSX.Element {
  const [newDate, setNewDate] = useState(format(booking.preferredDateTime, 'yyyy-MM-dd'));
  const [newTime, setNewTime] = useState(format(booking.preferredDateTime, 'HH:mm'));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  const isDesktop = useMediaQuery('(min-width: 768px)');

  const handleReschedule = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await rescheduleBooking({
        bookingId: booking.id,
        newDate,
        newTime,
      });

      if (result.success) {
        toast({
          title: 'Buchung umgebucht',
          description: result.message,
        });

        onOpenChange(false);
        router.refresh();
      } else {
        setError(result.error);

        if (result.fieldErrors) {
          // Show first field error
          const firstError = Object.values(result.fieldErrors)[0]?.[0];
          if (firstError) {
            setError(firstError);
          }
        }
      }
    } catch (err) {
      setError('Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setNewDate(format(booking.preferredDateTime, 'yyyy-MM-dd'));
      setNewTime(format(booking.preferredDateTime, 'HH:mm'));
      setError(null);
      onOpenChange(false);
    }
  };

  const formatDate = (date: Date | string) => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return dateObj.toLocaleDateString('de-DE', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return String(date);
    }
  };

  // Get minimum date (tomorrow)
  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const isFormValid = () => {
    if (!newDate || !newTime) return false;
    const currentDate = format(booking.preferredDateTime, 'yyyy-MM-dd');
    const currentTime = format(booking.preferredDateTime, 'HH:mm');
    if (newDate === currentDate && newTime === currentTime) return false;
    return true;
  };

  const content = (
    <div className="space-y-6">
      {/* Info Message */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <InfoIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-semibold text-blue-900 mb-1">
            Buchung umbuchen
          </h4>
          <p className="text-sm text-blue-800">
            {booking.status === 'CONFIRMED'
              ? 'Diese Buchung ist bereits bestätigt. Nach der Umbuchung muss das Studio den neuen Termin erneut bestätigen.'
              : 'Wähle einen neuen Termin für deine Buchung. Das Studio wird über die Änderung benachrichtigt.'}
          </p>
        </div>
      </div>

      {/* Current Booking Details */}
      <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold text-sm text-muted-foreground mb-2">
          Aktueller Termin
        </h4>
        <div>
          <p className="text-sm text-muted-foreground">Studio</p>
          <p className="font-semibold">{booking.studio.name}</p>
        </div>
        {booking.service && (
          <div>
            <p className="text-sm text-muted-foreground">Service</p>
            <p className="font-medium">{booking.service.name}</p>
          </div>
        )}
        <div>
          <p className="text-sm text-muted-foreground">Datum & Uhrzeit</p>
          <p className="font-medium">
            {formatDate(booking.preferredDateTime)} um {format(booking.preferredDateTime, 'HH:mm')}
          </p>
        </div>
      </div>

      {/* New Date/Time Selection */}
      <div className="space-y-4">
        <h4 className="font-semibold text-sm">Neuer Termin</h4>

        <div className="space-y-2">
          <Label htmlFor="newDate">Datum *</Label>
          <Input
            id="newDate"
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            min={getMinDate()}
            disabled={isLoading}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="newTime">Uhrzeit *</Label>
          <Input
            id="newTime"
            type="time"
            value={newTime}
            onChange={(e) => setNewTime(e.target.value)}
            disabled={isLoading}
            required
          />
        </div>
      </div>

      {/* Preview */}
      {isFormValid() && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-900 font-medium mb-1">Neuer Termin:</p>
          <p className="text-sm text-green-800">
            {formatDate(newDate)} um {newTime}
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}
    </div>
  );

  const footer = (
    <div className="flex gap-3 flex-col sm:flex-row">
      <Button
        variant="outline"
        onClick={handleClose}
        disabled={isLoading}
        className="flex-1"
      >
        Abbrechen
      </Button>
      <Button
        onClick={handleReschedule}
        disabled={isLoading || !isFormValid()}
        className="flex-1"
      >
        {isLoading ? 'Wird umgebucht...' : 'Termin ändern'}
      </Button>
    </div>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Buchung umbuchen</DialogTitle>
            <DialogDescription>
              Wähle einen neuen Termin für deine Buchung
            </DialogDescription>
          </DialogHeader>
          {content}
          <DialogFooter>{footer}</DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent
        side="bottom"
        className="h-auto max-h-[90vh] overflow-y-auto rounded-t-[2rem]"
      >
        <SheetHeader>
          <SheetTitle>Buchung umbuchen</SheetTitle>
          <SheetDescription>
            Wähle einen neuen Termin für deine Buchung
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6">{content}</div>
        <SheetFooter className="mt-6">{footer}</SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
