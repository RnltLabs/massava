/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Booking Block Component
 * Visual representation of a booking on the calendar
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { calculateBlockPosition, createDateTime } from '@/lib/calendar-utils';
import type { NewBooking, Service, BookingStatus } from '@/app/generated/prisma';

type BookingWithService = NewBooking & {
  service: Service | null;
  customer: {
    name: string;
    email: string;
    phone: string | null;
  };
};

interface BookingBlockProps {
  booking: BookingWithService;
  onClick: () => void;
}

export function BookingBlock({ booking, onClick }: BookingBlockProps): React.JSX.Element {
  // Parse booking times
  const startTime = createDateTime(booking.preferredDate, booking.preferredTime);
  const durationMinutes = booking.service?.duration || 60;
  const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

  // Calculate position
  const { top, height } = calculateBlockPosition(startTime, endTime);

  // Status styling
  const statusConfig: Record<
    BookingStatus,
    {
      label: string;
      icon: string;
      borderColor: string;
      bgColor: string;
      badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline';
    }
  > = {
    PENDING: {
      label: 'Reserviert',
      icon: '🔶',
      borderColor: 'border-l-orange-500',
      bgColor: 'bg-orange-50',
      badgeVariant: 'secondary',
    },
    CONFIRMED: {
      label: 'Bestätigt',
      icon: '✅',
      borderColor: 'border-l-green-500',
      bgColor: 'bg-green-50',
      badgeVariant: 'default',
    },
    CANCELLED: {
      label: 'Storniert',
      icon: '❌',
      borderColor: 'border-l-red-500',
      bgColor: 'bg-red-50',
      badgeVariant: 'destructive',
    },
  };

  const config = statusConfig[booking.status];

  return (
    <div
      className={`absolute left-0 right-0 mx-1 mb-1 rounded-lg border-l-4 ${config.borderColor} ${config.bgColor} p-2 shadow-sm cursor-pointer hover:shadow-md transition-shadow overflow-hidden`}
      style={{ top, height }}
      onClick={onClick}
    >
      {/* Status Badge */}
      <div className="flex items-center justify-between mb-1">
        <Badge variant={config.badgeVariant} className="text-[10px] px-1 py-0 h-4">
          {config.icon} {config.label}
        </Badge>
      </div>

      {/* Booking Info */}
      <div className="space-y-0.5">
        {/* Service Name */}
        <p className="text-xs font-semibold text-foreground truncate leading-tight">
          {booking.service?.name || 'Service'}
        </p>

        {/* Customer Name */}
        <p className="text-[11px] text-muted-foreground truncate leading-tight">
          {booking.customerName}
        </p>

        {/* Time */}
        <p className="text-[10px] text-muted-foreground leading-tight">
          {startTime.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} -{' '}
          {endTime.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}
