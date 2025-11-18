/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Booking Card Component
 */

'use client';

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  XIcon,
  Edit2Icon,
  EyeIcon,
  StarIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import type { BookingWithRelations } from '@/app/[locale]/customer/actions/bookings';

interface BookingCardProps {
  booking: BookingWithRelations;
  onViewDetails: (booking: BookingWithRelations) => void;
  onCancel?: (booking: BookingWithRelations) => void;
  onReschedule?: (booking: BookingWithRelations) => void;
  onReview?: (booking: BookingWithRelations) => void;
  isPast?: boolean;
}

export function BookingCard({
  booking,
  onViewDetails,
  onCancel,
  onReschedule,
  onReview,
  isPast = false,
}: BookingCardProps): React.JSX.Element {
  const canCancel = !isPast && (booking.status === 'PENDING' || booking.status === 'CONFIRMED');
  const canReschedule = !isPast && (booking.status === 'PENDING' || booking.status === 'CONFIRMED');

  // Can review if: past, confirmed, and no review yet
  const canReview = isPast && booking.status === 'CONFIRMED' && !booking.review;

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

  // DateTime formatting using date-fns (Phase 4 migration)
  const formatDateTime = (date: Date) => {
    return format(date, 'EEEE, d. MMMM yyyy', { locale: de });
  };

  const formatTime = (date: Date) => {
    return format(date, 'HH:mm');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  return (
    <Card
      className="group relative overflow-hidden rounded-[1.5rem] border border-border bg-background transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer"
      onClick={() => onViewDetails(booking)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-base mb-1">{booking.studio.name}</h3>
            {booking.service && (
              <p className="text-sm text-muted-foreground">{booking.service.name}</p>
            )}
          </div>
          {getStatusBadge()}
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPinIcon className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">
            {booking.studio.address && booking.studio.city
              ? `${booking.studio.address}, ${booking.studio.city}`
              : booking.studio.city || 'Keine Adresse'}
          </span>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <CalendarIcon className="h-4 w-4 text-gray-600 flex-shrink-0" />
            <span className="font-medium">{formatDateTime(booking.preferredDateTime)}</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <ClockIcon className="h-4 w-4 text-gray-600 flex-shrink-0" />
            <div className="flex items-center gap-3 flex-1">
              <span>{formatTime(booking.preferredDateTime)}</span>
              {booking.service && (
                <span className="text-muted-foreground">
                  ({booking.service.duration} Min.)
                </span>
              )}
            </div>
          </div>

          {booking.service && booking.service.price > 0 && (
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-sm font-semibold">Preis:</span>
              <span className="text-base font-bold text-primary">
                {formatPrice(booking.service.price)}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {!isPast && (canCancel || canReschedule) && (
          <div className="flex gap-2 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails(booking);
              }}
            >
              <EyeIcon className="h-4 w-4 mr-2" />
              Details
            </Button>

            {canReschedule && onReschedule && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onReschedule(booking);
                }}
              >
                <Edit2Icon className="h-4 w-4" />
              </Button>
            )}

            {canCancel && onCancel && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onCancel(booking);
                }}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <XIcon className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}

        {/* Review Button or Status */}
        {isPast && (
          <div className="flex gap-2 pt-2 border-t">
            {booking.review ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <StarIcon className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span>Bewertung abgegeben ({booking.review.rating} Sterne)</span>
              </div>
            ) : canReview && onReview ? (
              <Button
                variant="default"
                size="sm"
                className="flex-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onReview(booking);
                }}
              >
                <StarIcon className="h-4 w-4 mr-2" />
                Bewerten
              </Button>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
