/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Booking Detail Sheet Component
 * Bottom sheet displaying full booking details
 */

'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { createDateTime } from '@/lib/calendar-utils';
import type { NewBooking, Service } from '@/app/generated/prisma';

type BookingWithService = NewBooking & {
  service: Service | null;
  customer: {
    name: string;
    email: string;
    phone: string | null;
  };
};

interface BookingDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: BookingWithService | null;
}

export function BookingDetailSheet({
  open,
  onOpenChange,
  booking,
}: BookingDetailSheetProps): React.JSX.Element {
  if (!booking) {
    return <></>;
  }

  const startTime = createDateTime(booking.preferredDate, booking.preferredTime);
  const durationMinutes = booking.service?.duration || 60;
  const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

  const statusConfig = {
    PENDING: { label: 'Reserviert', icon: '🔶', variant: 'secondary' as const },
    CONFIRMED: { label: 'Bestätigt', icon: '✅', variant: 'default' as const },
    CANCELLED: { label: 'Storniert', icon: '❌', variant: 'destructive' as const },
  };

  const config = statusConfig[booking.status];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh]">
        <SheetHeader>
          <SheetTitle>Buchungsdetails</SheetTitle>
          <SheetDescription>
            <Badge variant={config.variant} className="mt-2">
              {config.icon} {config.label}
            </Badge>
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Customer Information */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Kunde</h3>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-lg">👤</span>
                <div>
                  <p className="text-sm font-medium">{booking.customerName}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-lg">📧</span>
                <div>
                  <a href={`mailto:${booking.customerEmail}`} className="text-sm text-blue-600 hover:underline">
                    {booking.customerEmail}
                  </a>
                </div>
              </div>
              {booking.customerPhone && (
                <div className="flex items-start gap-2">
                  <span className="text-lg">📱</span>
                  <div>
                    <a href={`tel:${booking.customerPhone}`} className="text-sm text-blue-600 hover:underline">
                      {booking.customerPhone}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Booking Details */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Buchung</h3>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-lg">📅</span>
                <div>
                  <p className="text-sm">
                    {startTime.toLocaleDateString('de-DE', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-lg">🕐</span>
                <div>
                  <p className="text-sm font-medium">
                    {startTime.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} -{' '}
                    {endTime.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {durationMinutes} Minuten
                  </p>
                </div>
              </div>
              {booking.service && (
                <>
                  <div className="flex items-start gap-2">
                    <span className="text-lg">💆</span>
                    <div>
                      <p className="text-sm font-medium">{booking.service.name}</p>
                      {booking.service.description && (
                        <p className="text-xs text-muted-foreground">{booking.service.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-lg">💰</span>
                    <div>
                      <p className="text-sm font-medium">{booking.service.price} EUR</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Message/Notes */}
          {booking.message && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">Notizen</h3>
                <p className="text-sm text-muted-foreground">{booking.message}</p>
              </div>
            </>
          )}

          {/* Metadata */}
          <Separator />
          <div>
            <p className="text-xs text-muted-foreground">
              Gebucht am:{' '}
              {new Date(booking.createdAt).toLocaleString('de-DE', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-2 pt-4">
            {booking.customerPhone && (
              <Button variant="outline" className="w-full" asChild>
                <a href={`tel:${booking.customerPhone}`}>📞 Kunde anrufen</a>
              </Button>
            )}
            <Button variant="outline" className="w-full" asChild>
              <a href={`mailto:${booking.customerEmail}`}>📧 E-Mail senden</a>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
