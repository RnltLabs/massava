/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

"use client";

import React from "react";
import { format, parseISO, isPast } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { MapPin } from "lucide-react";

import { StudioAvatar } from "@/components/ui/studio-avatar";
import { StudioRating } from "@/components/reviews/StudioRating";
import { Badge } from "@/components/ui/badge";
import { formatPriceLabel } from "@/lib/utils/priceAggregation";
import type { SearchResultStudio } from "@/types/booking";

interface SearchResultCardProps {
  studio: SearchResultStudio;
  onBookSlot: (studioId: string, slotId: string) => void;
  onViewStudio: () => void;
}

const MAX_VISIBLE_SLOTS = 4;
const MAX_VISIBLE_SERVICES = 3;

export const SearchResultCard = React.memo<SearchResultCardProps>(
  ({ studio, onBookSlot, onViewStudio }) => {
    // Filter out past slots (client-side safety check)
    const now = new Date();
    const futureSlots = studio.availableSlots.filter((slot) => {
      try {
        const slotDate = toZonedTime(parseISO(slot.startTime), studio.timezone);
        return !isPast(slotDate);
      } catch {
        return false;
      }
    });

    const visibleSlots = futureSlots.slice(0, MAX_VISIBLE_SLOTS);
    const remainingSlots = futureSlots.length - MAX_VISIBLE_SLOTS;

    const visibleServices = studio.matchedServices.slice(0, MAX_VISIBLE_SERVICES);
    const remainingServices = studio.matchedServices.length - MAX_VISIBLE_SERVICES;

    const handleSlotClick = (slotTime: string): void => {
      onBookSlot(studio.id, slotTime);
    };

    const formatSlotTime = (slotTime: string): string => {
      try {
        const slotDate = toZonedTime(parseISO(slotTime), studio.timezone);
        return format(slotDate, "HH:mm");
      } catch {
        return "";
      }
    };

    const formatDistance = (distanceKm: number): string => {
      if (distanceKm < 1) {
        return `${Math.round(distanceKm * 1000)} m`;
      }
      return `${distanceKm.toFixed(1)} km`;
    };

    return (
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm transition-all hover:shadow-md">
        {/* Header: Avatar, Name, Rating, Distance, Price */}
        <div className="flex items-start gap-3 mb-3">
          <button
            onClick={onViewStudio}
            className="flex-shrink-0 transition-opacity hover:opacity-80"
            type="button"
            aria-label={`View ${studio.name} profile`}
          >
            <StudioAvatar
              studioName={studio.name}
              studioId={studio.id}
              logoUrl={studio.logoUrl}
              size={48}
            />
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <button
                onClick={onViewStudio}
                className="font-semibold text-gray-900 line-clamp-1 text-left hover:text-primary transition-colors"
                type="button"
              >
                {studio.name}
              </button>
              <span className="text-lg font-bold text-primary flex-shrink-0">
                {formatPriceLabel(studio.minPrice)}
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600 flex-wrap">
              {studio.averageRating && studio.totalReviews ? (
                <>
                  <StudioRating
                    rating={studio.averageRating ?? null}
                    totalReviews={studio.totalReviews ?? 0}
                    variant="compact"
                  />
                  <span className="text-gray-400">•</span>
                </>
              ) : null}
              <div className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                <span>{formatDistance(studio.distance)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Services */}
        {studio.matchedServices.length > 0 && (
          <>
            <div className="border-t border-gray-100 mt-3 pt-3">
              <div className="flex flex-wrap gap-2">
                {visibleServices.map((service) => (
                  <Badge key={service.id} variant="secondary">
                    {service.name}
                  </Badge>
                ))}
                {remainingServices > 0 && (
                  <Badge variant="outline">+{remainingServices}</Badge>
                )}
              </div>
            </div>
          </>
        )}

        {/* Available Time Slots */}
        {futureSlots.length > 0 && (
          <>
            <div className="border-t border-gray-100 mt-3 pt-3">
              <div className="flex flex-wrap gap-2">
                {visibleSlots.map((slot) => {
                  const formattedTime = formatSlotTime(slot.startTime);
                  if (!formattedTime) return null;

                  return (
                    <button
                      key={slot.startTime}
                      onClick={() => handleSlotClick(slot.startTime)}
                      className="px-3 py-1.5 text-sm font-medium bg-gray-100 hover:bg-primary hover:text-white rounded-lg transition-colors"
                      type="button"
                    >
                      {formattedTime}
                    </button>
                  );
                })}
                {remainingSlots > 0 && (
                  <button
                    onClick={onViewStudio}
                    className="px-3 py-1.5 text-sm font-medium text-primary hover:text-primary-dark transition-colors"
                    type="button"
                  >
                    +{remainingSlots} mehr
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }
);

SearchResultCard.displayName = "SearchResultCard";
