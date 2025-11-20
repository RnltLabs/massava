/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Booking Card Component
 * Redesigned to match AppointmentCard styling exactly
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { ClockIcon, CalendarIcon, StarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { StudioViewPopup } from '@/components/search/StudioViewPopup';
import { CancelBookingDialog } from './CancelBookingDialog';
import type { BookingWithRelations } from '@/app/[locale]/customer/actions/bookings';
import type { SearchResultStudio } from '@/types/booking';

interface BookingCardProps {
  booking: BookingWithRelations;
  onReview?: (booking: BookingWithRelations) => void;
  isPast?: boolean;
}

// Status configuration - matches AppointmentCard exactly
const STATUS_COLORS: Record<'PENDING' | 'CONFIRMED' | 'CANCELLED', string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  CONFIRMED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

const STATUS_LABELS: Record<'PENDING' | 'CONFIRMED' | 'CANCELLED', string> = {
  PENDING: 'Ausstehend',
  CONFIRMED: 'Bestätigt',
  CANCELLED: 'Storniert',
};

export function BookingCard({
  booking,
  onReview,
  isPast = false,
}: BookingCardProps): React.JSX.Element {
  const [showStudioInfo, setShowStudioInfo] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // Determine if booking can be cancelled (not past, not already cancelled)
  const canCancel = useMemo(
    () => !isPast && (booking.status === 'PENDING' || booking.status === 'CONFIRMED'),
    [isPast, booking.status]
  );

  // Can review if: past, confirmed, and no review yet
  const canReview = useMemo(
    () => isPast && booking.status === 'CONFIRMED' && !booking.review,
    [isPast, booking.status, booking.review]
  );

  // Status label
  const statusLabel = useMemo(() => STATUS_LABELS[booking.status], [booking.status]);

  // Memoize event handlers
  const handleStudioInfoClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowStudioInfo(true);
  }, []);

  const handleCancelClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowCancelDialog(true);
  }, []);

  const handleReviewClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (onReview) {
      onReview(booking);
    }
  }, [booking, onReview]);

  // DateTime formatting
  const formatDate = useCallback((date: Date) => {
    return format(date, 'd. MMMM yyyy', { locale: de });
  }, []);

  const formatTime = useCallback((date: Date) => {
    return format(date, 'HH:mm', { locale: de });
  }, []);

  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  }, []);

  // Convert booking studio to SearchResultStudio for StudioViewPopup
  const studioForPopup: SearchResultStudio = useMemo(
    () => ({
      id: booking.studio.id,
      name: booking.studio.name,
      description: booking.studio.description,
      logoUrl: booking.studio.logoUrl,
      galleryImages: booking.studio.galleryImages,
      address: booking.studio.address || '',
      city: booking.studio.city || '',
      postalCode: booking.studio.postalCode,
      phone: booking.studio.phone,
      email: booking.studio.email,
      website: booking.studio.website,
      openingHours: booking.studio.openingHours,
      latitude: booking.studio.latitude,
      longitude: booking.studio.longitude,
      timezone: booking.studio.timezone,
      distance: 0,
      services: [],
      matchedServices: [],
      minPrice: 0,
      availableSlots: [],
      averageRating: undefined,
      totalReviews: undefined,
    }),
    [booking.studio]
  );

  return (
    <>
      <article
        className={cn(
          'bg-white border border-gray-200 rounded-xl p-4 shadow-sm',
          'transition-all duration-200 hover:shadow-md'
        )}
        aria-label={`Booking: ${booking.studio.name}, ${booking.service?.name || 'Service'}, ${formatDate(booking.preferredDateTime)} at ${formatTime(booking.preferredDateTime)}`}
      >
        {/* Header with Icon and Status - EXACT match to AppointmentCard */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#D4A89F] flex items-center justify-center" aria-hidden="true">
              <ClockIcon className="h-6 w-6 text-[#B56550]" />
            </div>
            <div>
              <p className="text-base font-semibold text-gray-900">{booking.studio.name}</p>
              {booking.service && (
                <p className="text-sm text-gray-600">{booking.service.name}</p>
              )}
            </div>
          </div>
          <span
            className={cn(
              'px-3 py-1 rounded-full text-xs font-medium',
              STATUS_COLORS[booking.status]
            )}
            role="status"
            aria-label={`Status: ${statusLabel}`}
          >
            {statusLabel}
          </span>
        </div>

        {/* Date and Time - EXACT match to AppointmentCard */}
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
            <span>{formatDate(booking.preferredDateTime)}</span>
          </div>
          <div className="flex items-center gap-2">
            <ClockIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
            <span>{formatTime(booking.preferredDateTime)}</span>
          </div>
        </div>

        {/* Service Details (Duration and Price) */}
        {booking.service && (
          <div className="flex items-center justify-between text-sm mt-3 pt-3 border-t border-gray-100">
            <span className="text-gray-600">
              {booking.service.duration} Min.
            </span>
            {booking.service.price > 0 && (
              <span className="font-semibold text-gray-900">
                {formatPrice(booking.service.price)}
              </span>
            )}
          </div>
        )}

        {/* Studio Info Link */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <button
            onClick={handleStudioInfoClick}
            className="text-sm text-[#B56550] hover:text-[#9a4a3d] hover:underline transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-[#B56550] focus:ring-offset-2 rounded"
            aria-label={`View ${booking.studio.name} information`}
          >
            Studio-Informationen
          </button>
        </div>

        {/* Action Buttons */}
        {(canCancel || canReview) && (
          <div className="flex gap-2 mt-4" role="group" aria-label="Booking actions">
            {/* Cancel Button - Only for upcoming, non-cancelled bookings */}
            {canCancel && (
              <button
                onClick={handleCancelClick}
                className="flex-1 min-h-[44px] bg-gray-100 text-gray-700 text-sm font-medium rounded-xl transition-all duration-200 hover:bg-gray-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                aria-label={`Cancel booking for ${booking.studio.name}`}
              >
                Stornieren
              </button>
            )}

            {/* Review Button - Only for past confirmed bookings without review */}
            {canReview && onReview && (
              <button
                onClick={handleReviewClick}
                style={{ backgroundColor: '#B56550' }}
                className="flex-1 min-h-[44px] text-white text-sm font-medium rounded-xl transition-all duration-200 shadow-md hover:shadow-lg hover:opacity-90 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#B56550] focus:ring-offset-2"
                aria-label={`Review ${booking.studio.name}`}
              >
                Bewerten
              </button>
            )}
          </div>
        )}

        {/* Review Status - If already reviewed */}
        {isPast && booking.review && (
          <div className="flex items-center gap-2 text-sm text-gray-600 mt-3 pt-3 border-t border-gray-100">
            <StarIcon className="h-4 w-4 fill-yellow-400 text-yellow-400" aria-hidden="true" />
            <span>Bewertung abgegeben ({booking.review.rating} Sterne)</span>
          </div>
        )}
      </article>

      {/* Studio Info Popup */}
      <StudioViewPopup
        studio={studioForPopup}
        open={showStudioInfo}
        onOpenChange={setShowStudioInfo}
      />

      {/* Cancel Booking Dialog */}
      <CancelBookingDialog
        booking={booking}
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
      />
    </>
  );
}
