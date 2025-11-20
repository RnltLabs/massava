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
import { AlertCircle } from 'lucide-react';
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

  const content = (
    <div className="space-y-6">
      {/* Simple Warning */}
      <div className="flex items-start gap-3 text-sm text-muted-foreground">
        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <p>Das Studio wird benachrichtigt.</p>
      </div>

      {/* Cancellation Reason */}
      <div className="space-y-2">
        <Label htmlFor="reason" className="text-sm">
          Stornierungsgrund <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          id="reason"
          placeholder="Grund angeben..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          maxLength={500}
          disabled={isLoading}
          className="resize-none"
        />
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
    <div className="space-y-3">
      <Button
        onClick={handleCancel}
        disabled={isLoading}
        style={{ backgroundColor: '#B56550' }}
        className="w-full h-12 text-white font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98] hover:opacity-90 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed disabled:shadow-none"
      >
        {isLoading ? 'Wird storniert...' : 'Stornieren'}
      </Button>
      <Button
        variant="outline"
        onClick={handleClose}
        disabled={isLoading}
        className="w-full h-12 font-semibold rounded-xl transition-all duration-200 hover:bg-gray-100 active:scale-[0.98]"
      >
        Abbrechen
      </Button>
    </div>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent
          style={{ backgroundColor: '#F4EDE8' }}
          className="sm:max-w-[425px]"
        >
          <DialogHeader className="mb-4">
            <DialogTitle>Buchung stornieren</DialogTitle>
            <DialogDescription>
              Möchtest du diese Buchung wirklich stornieren?
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
        style={{ backgroundColor: '#F4EDE8' }}
        className="h-[80vh] rounded-t-3xl p-6 overflow-y-auto"
      >
        <SheetHeader className="mb-4">
          <SheetTitle>Buchung stornieren</SheetTitle>
          <SheetDescription>
            Möchtest du diese Buchung wirklich stornieren?
          </SheetDescription>
        </SheetHeader>
        {content}
        <SheetFooter className="mt-6">{footer}</SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
