/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Capacity Warning Sheet
 * Responsive warning dialog when timeslot capacity is full
 */

'use client';

import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useMediaQuery } from '@/hooks/use-media-query';
import { AlertTriangle, User, Sparkles } from 'lucide-react';

interface CapacityWarningSheetProps {
  isOpen: boolean;
  onClose: () => void;
  timeSlot?: string; // e.g., "14:00"
  current: number;
  max: number;
  bookings: Array<{
    id: string;
    customerName: string;
    serviceName: string;
  }>;
  onChooseDifferentTime: () => void;
  onBookAnyway: () => void;
}

export function CapacityWarningSheet({
  isOpen,
  onClose,
  timeSlot,
  current,
  max,
  bookings,
  onChooseDifferentTime,
  onBookAnyway,
}: CapacityWarningSheetProps): React.JSX.Element {
  const isMobile = useMediaQuery('(max-width: 767px)');

  const content = (
    <div className="space-y-6">
      {/* Alert */}
      <Alert className="border-orange-200 bg-orange-50">
        <AlertTriangle className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-900">
          Diese Zeit ist bereits <strong>voll ausgelastet</strong> ({current}/{max}).
        </AlertDescription>
      </Alert>

      {/* Existing Bookings */}
      {bookings.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-muted-foreground">
            Bestehende Buchungen:
          </p>
          <div className="space-y-2">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-muted"
              >
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{booking.customerName}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Sparkles className="h-3 w-3" />
                    <span>{booking.serviceName}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3 pt-2">
        <Button
          onClick={onChooseDifferentTime}
          variant="outline"
          className="w-full rounded-xl h-12"
        >
          Andere Zeit wählen
        </Button>
        <Button
          onClick={onBookAnyway}
          style={{ backgroundColor: '#B56550' }}
          className="w-full rounded-xl h-12 text-white hover:opacity-90"
        >
          Trotzdem buchen
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent
          side="bottom"
          className="h-[85vh] rounded-t-3xl px-6 py-6"
        >
          <SheetHeader className="mb-6">
            <SheetTitle className="text-xl">Zeit ist ausgelastet</SheetTitle>
            <SheetDescription className="text-base">
              {timeSlot && `${timeSlot} Uhr - `}
              Du hast die maximale Kapazität für diese Zeit erreicht.
            </SheetDescription>
          </SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Zeit ist ausgelastet</DialogTitle>
          <DialogDescription className="text-base">
            {timeSlot && `${timeSlot} Uhr - `}
            Du hast die maximale Kapazität für diese Zeit erreicht.
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
