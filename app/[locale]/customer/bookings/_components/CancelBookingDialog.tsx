/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Cancel Booking Dialog Component
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { AlertTriangle } from 'lucide-react';
import { cancelBooking } from '@/app/[locale]/customer/actions/bookings';
import type { BookingWithRelations } from '@/app/[locale]/customer/actions/bookings';

interface CancelBookingDialogProps {
  booking: BookingWithRelations;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CancelBookingDialog({
  booking,
  open,
  onOpenChange,
}: CancelBookingDialogProps): React.JSX.Element {
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  const isDesktop = useMediaQuery('(min-width: 768px)');

  const handleCancel = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await cancelBooking({
        bookingId: booking.id,
        reason: reason.trim() || undefined,
      });

      if (result.success) {
        toast({
          title: 'Buchung storniert',
          description: result.message,
        });

        onOpenChange(false);
        setReason('');
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
      setReason('');
      setError(null);
      onOpenChange(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('de-DE', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const content = (
    <div className="space-y-6">
      {/* Warning Message */}
      <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-semibold text-yellow-900 mb-1">
            Achtung: Buchung stornieren
          </h4>
          <p className="text-sm text-yellow-800">
            Diese Aktion kann nicht rückgängig gemacht werden. Das Studio wird über die
            Stornierung benachrichtigt.
          </p>
        </div>
      </div>

      {/* Booking Details */}
      <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
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
          <p className="text-sm text-muted-foreground">Termin</p>
          <p className="font-medium">
            {formatDate(booking.preferredDate)} um {booking.preferredTime}
          </p>
        </div>
      </div>

      {/* Cancellation Reason */}
      <div className="space-y-2">
        <Label htmlFor="reason">
          Grund für die Stornierung <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          id="reason"
          placeholder="Warum möchtest du diese Buchung stornieren? (optional)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          maxLength={500}
          disabled={isLoading}
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground text-right">
          {reason.length}/500 Zeichen
        </p>
      </div>

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
        variant="destructive"
        onClick={handleCancel}
        disabled={isLoading}
        className="flex-1"
      >
        {isLoading ? 'Wird storniert...' : 'Buchung stornieren'}
      </Button>
    </div>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Buchung stornieren</DialogTitle>
            <DialogDescription>
              Bist du sicher, dass du diese Buchung stornieren möchtest?
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
          <SheetTitle>Buchung stornieren</SheetTitle>
          <SheetDescription>
            Bist du sicher, dass du diese Buchung stornieren möchtest?
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6">{content}</div>
        <SheetFooter className="mt-6">{footer}</SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
