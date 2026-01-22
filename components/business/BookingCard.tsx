/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

'use client';

import React, { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { ClockIcon, CheckCircleIcon, XCircleIcon, PhoneIcon, MessageSquareIcon } from 'lucide-react';
import { BookingStatus } from '@/app/generated/prisma';
import { BookingStatusBadge } from './BookingStatusBadge';
import { BookingActions } from './BookingActions';

interface BookingCardProps {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  serviceName: string | null;
  dateTime: Date;
  status: BookingStatus;
  message?: string | null;
  createdAt: Date;
}

// Status icon configuration - memoized outside component
const STATUS_ICONS = {
  [BookingStatus.PENDING]: { Icon: ClockIcon, bgColor: 'bg-amber-100', iconColor: 'text-amber-600' },
  [BookingStatus.CONFIRMED]: { Icon: CheckCircleIcon, bgColor: 'bg-green-100', iconColor: 'text-green-600' },
  [BookingStatus.CANCELLED]: { Icon: XCircleIcon, bgColor: 'bg-red-100', iconColor: 'text-red-600' },
} as const;

function BookingCardComponent({
  id,
  customerName,
  customerEmail,
  customerPhone,
  serviceName,
  dateTime,
  status,
  message,
  createdAt,
}: BookingCardProps): React.JSX.Element {
  const t = useTranslations('business.booking');

  // Memoize formatted date/time with German locale
  const formattedTime = useMemo(
    () => format(dateTime, 'HH:mm', { locale: de }),
    [dateTime]
  );

  const formattedDate = useMemo(
    () => format(dateTime, 'PPP', { locale: de }),
    [dateTime]
  );

  // Memoize icon configuration
  const iconConfig = useMemo(() => STATUS_ICONS[status], [status]);
  const { Icon, bgColor, iconColor } = iconConfig;

  // Determine if actions should be shown
  const showActions = status === BookingStatus.PENDING;

  // Truncate message if too long
  const displayMessage = useMemo(() => {
    if (!message) return null;
    const maxLength = 100;
    return message.length > maxLength ? `${message.slice(0, maxLength)}...` : message;
  }, [message]);

  return (
    <article
      className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm transition-all duration-200 hover:shadow-md"
      role="article"
      aria-label={`Booking: ${customerName}, ${serviceName || 'Service'}, ${formattedDate} at ${formattedTime}`}
    >
      {/* Header with Icon, Time, Service, and Status Badge */}
      <div className="flex items-start gap-3 mb-3">
        {/* Status Icon Circle */}
        <div
          className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
            bgColor
          )}
          aria-hidden="true"
        >
          <Icon className={cn('h-5 w-5', iconColor)} />
        </div>

        {/* Time, Service, Customer Name */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 mb-1">
            <p className="text-base font-semibold text-gray-900">
              {formattedTime} Uhr
            </p>
            {serviceName && (
              <>
                <span className="text-gray-400" aria-hidden="true">•</span>
                <p className="text-base text-gray-700 truncate">{serviceName}</p>
              </>
            )}
          </div>
          <p className="text-sm font-medium text-gray-900">{customerName}</p>
        </div>

        {/* Status Badge */}
        <div className="flex-shrink-0">
          <BookingStatusBadge status={status} />
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-1 mb-3 pl-[52px]">
        {/* Phone */}
        {customerPhone && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <PhoneIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
            <a
              href={`tel:${customerPhone}`}
              className="hover:text-[#B56550] transition-colors"
              aria-label={`Call ${customerName} at ${customerPhone}`}
            >
              {customerPhone}
            </a>
          </div>
        )}

        {/* Message if available */}
        {displayMessage && (
          <div className="flex items-start gap-2 text-sm text-gray-600">
            <MessageSquareIcon className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
            <p className="italic line-clamp-2" title={message || undefined}>
              "{displayMessage}"
            </p>
          </div>
        )}
      </div>

      {/* Actions for Pending Bookings */}
      {showActions && (
        <>
          {/* Divider */}
          <div className="border-t border-gray-200 my-3" aria-hidden="true" />

          {/* Action Buttons */}
          <div className="flex gap-2" role="group" aria-label="Booking actions">
            <BookingActions bookingId={id} customerName={customerName} />
          </div>
        </>
      )}
    </article>
  );
}

// Memoized export to prevent unnecessary re-renders
export const BookingCard = React.memo(BookingCardComponent);
