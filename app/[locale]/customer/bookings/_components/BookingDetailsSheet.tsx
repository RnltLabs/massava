/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Booking Details Sheet Component
 */

'use client';

import React from 'react';
import { useMediaQuery } from '@/hooks/use-media-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  PhoneIcon,
  Edit2Icon,
  XIcon,
  MessageSquareIcon,
  DollarSignIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import type { BookingWithRelations } from '@/app/[locale]/customer/actions/bookings';

interface BookingDetailsSheetProps {
  booking: BookingWithRelations;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCancel: (booking: BookingWithRelations) => void;
  onReschedule: (booking: BookingWithRelations) => void;
}

export function BookingDetailsSheet({
  booking,
  open,
  onOpenChange,
  onCancel,
  onReschedule,
}: BookingDetailsSheetProps): React.JSX.Element {
  const isDesktop = useMediaQuery('(min-width: 768px)');

  const canCancel = booking.status === 'PENDING' || booking.status === 'CONFIRMED';
  const canReschedule = booking.status === 'PENDING' || booking.status === 'CONFIRMED';

  const getStatusBadge = () => {
    switch (booking.status) {
      case 'PENDING':
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
            Ausstehend
          </Badge>
        );
      case 'CONFIRMED':
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
            Bestätigt
          </Badge>
        );
      case 'CANCELLED':
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
            Storniert
          </Badge>
        );
      default:
        return null;
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  const formatDateTime = (date: Date | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const content = (
    <div className="space-y-6">
      {/* Status Section */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-1">Status</h3>
          {getStatusBadge()}
        </div>
        {booking.confirmedAt && (
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Bestätigt am</p>
            <p className="text-sm font-medium">{formatDateTime(booking.confirmedAt)}</p>
          </div>
        )}
        {booking.cancelledAt && (
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Storniert am</p>
            <p className="text-sm font-medium">{formatDateTime(booking.cancelledAt)}</p>
          </div>
        )}
      </div>

      <Separator />

      {/* Studio Information */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">Studio</h3>
        <div className="space-y-2">
          <p className="font-semibold text-lg">{booking.studio.name}</p>

          {(booking.studio.address || booking.studio.city) && (
            <div className="flex items-start gap-2 text-sm">
              <MapPinIcon className="h-4 w-4 text-gray-600 flex-shrink-0 mt-0.5" />
              <span>
                {booking.studio.address && booking.studio.city
                  ? `${booking.studio.address}, ${booking.studio.city}`
                  : booking.studio.city || booking.studio.address}
              </span>
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* Service Information */}
      {booking.service && (
        <>
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">Service</h3>
            <div className="space-y-2">
              <p className="font-semibold">{booking.service.name}</p>

              <div className="flex items-center gap-2 text-sm">
                <ClockIcon className="h-4 w-4 text-gray-600" />
                <span>{booking.service.duration} Minuten</span>
              </div>

              {booking.service.price > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <DollarSignIcon className="h-4 w-4 text-gray-600" />
                  <span className="font-semibold text-primary">
                    {formatPrice(booking.service.price)}
                  </span>
                </div>
              )}
            </div>
          </div>

          <Separator />
        </>
      )}

      {/* Appointment Information */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">Termin</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-gray-600" />
            <span className="font-medium">{format(booking.preferredDateTime, 'EEEE, d. MMMM yyyy', { locale: de })}</span>
          </div>

          <div className="flex items-center gap-2">
            <ClockIcon className="h-4 w-4 text-gray-600" />
            <span className="font-medium">{format(booking.preferredDateTime, 'HH:mm')}</span>
          </div>
        </div>
      </div>

      {/* Customer Message */}
      {booking.message && (
        <>
          <Separator />
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <MessageSquareIcon className="h-4 w-4" />
              Nachricht
            </h3>
            <p className="text-sm bg-gray-50 p-3 rounded-lg">{booking.message}</p>
          </div>
        </>
      )}

      {/* Cancellation Reason */}
      {booking.status === 'CANCELLED' && booking.cancellationReason && (
        <>
          <Separator />
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">Stornierungsgrund</h3>
            <p className="text-sm bg-red-50 p-3 rounded-lg text-red-800">
              {booking.cancellationReason}
            </p>
          </div>
        </>
      )}

      {/* Action Buttons */}
      {(canCancel || canReschedule) && (
        <>
          <Separator />
          <div className="flex gap-3">
            {canReschedule && (
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  onOpenChange(false);
                  setTimeout(() => onReschedule(booking), 300);
                }}
              >
                <Edit2Icon className="h-4 w-4 mr-2" />
                Umbuchen
              </Button>
            )}

            {canCancel && (
              <Button
                variant="outline"
                className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => {
                  onOpenChange(false);
                  setTimeout(() => onCancel(booking), 300);
                }}
              >
                <XIcon className="h-4 w-4 mr-2" />
                Stornieren
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Buchungsdetails</DialogTitle>
            <DialogDescription>
              Vollständige Informationen zu deiner Buchung
            </DialogDescription>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[90vh] overflow-y-auto rounded-t-[2rem]"
      >
        <SheetHeader>
          <SheetTitle>Buchungsdetails</SheetTitle>
          <SheetDescription>
            Vollständige Informationen zu deiner Buchung
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6">{content}</div>
      </SheetContent>
    </Sheet>
  );
}
