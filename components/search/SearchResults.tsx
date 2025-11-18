/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { ArrowRight, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StudioAvatar } from '@/components/ui/studio-avatar';
import { formatPriceLabel } from '@/lib/utils/priceAggregation';
import { StudioViewPopup } from '@/components/search/StudioViewPopup';
import { StudioRating } from '@/components/reviews/StudioRating';
import { TimeSlotButton } from '@/components/booking/TimeSlotButton';
import type { SearchResultStudio } from '@/types/booking';

interface SearchResultsResponse {
  success: boolean;
  results: SearchResultStudio[];
  meta: {
    total: number;
    radius: number;
    center: { lat: number; lng: number };
  };
}

interface SearchResultsProps {
  searchParams: {
    location?: string;
    lat?: string;
    lng?: string;
    radius?: string;
    datetime?: string;
    serviceType?: string;
    minPrice?: string;
    maxPrice?: string;
  };
}

/**
 * Helper function to format time from datetime string or Date object
 */
const formatTime = (datetime: string | Date): string => {
  const date = typeof datetime === 'string' ? new Date(datetime) : datetime;
  return format(date, 'HH:mm', { locale: de });
};

/**
 * Skeleton Card Component for Loading State
 */
function SkeletonCard(): React.JSX.Element {
  return (
    <Card className="wellness-shadow p-4 sm:p-6 animate-pulse overflow-hidden">
      <div className="flex items-start gap-4">
        {/* Avatar skeleton */}
        <div className="size-16 rounded-full bg-muted shrink-0" />

        {/* Content skeleton */}
        <div className="flex-1 space-y-2">
          <div className="h-6 bg-muted rounded w-2/3" />
          <div className="h-4 bg-muted rounded w-1/3" />
          <div className="h-5 bg-muted rounded w-1/4" />
        </div>
      </div>

      {/* Services skeleton */}
      <div className="mt-4 h-4 bg-muted rounded w-full" />

      {/* TimeSlots skeleton */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 bg-muted rounded" />
        ))}
      </div>
    </Card>
  );
}

export function SearchResults({ searchParams }: SearchResultsProps) {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'de';
  const [results, setResults] = useState<SearchResultStudio[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStudio, setSelectedStudio] = useState<SearchResultStudio | null>(null);
  const [isStudioPopupOpen, setIsStudioPopupOpen] = useState(false);

  useEffect(() => {
    const fetchResults = async (): Promise<void> => {
      try {
        setIsLoading(true);
        setError(null);

        // Build query string
        const params = new URLSearchParams();
        if (searchParams.location) params.set('location', searchParams.location);
        if (searchParams.lat) params.set('lat', searchParams.lat);
        if (searchParams.lng) params.set('lng', searchParams.lng);
        if (searchParams.radius) params.set('radius', searchParams.radius);
        if (searchParams.datetime) params.set('datetime', searchParams.datetime);
        if (searchParams.serviceType) params.set('serviceType', searchParams.serviceType);
        if (searchParams.minPrice) params.set('minPrice', searchParams.minPrice);
        if (searchParams.maxPrice) params.set('maxPrice', searchParams.maxPrice);

        const response = await fetch(`/api/search/appointments?${params.toString()}`);

        if (!response.ok) {
          throw new Error('Failed to fetch search results');
        }

        const data: SearchResultsResponse = await response.json();
        setResults(data.results);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    void fetchResults();
  }, [searchParams]);

  /**
   * Handle booking slot click - navigate to booking page
   * Note: With dynamic slots, slotId is the ISO datetime string (startTime)
   */
  const handleBookSlot = (studioId: string, slotId: string): void => {
    router.push(`/${locale}/booking/${studioId}/${encodeURIComponent(slotId)}`);
  };

  /**
   * Handle view studio click - open studio details popup
   */
  const handleViewStudio = (studio: SearchResultStudio): void => {
    setSelectedStudio(studio);
    setIsStudioPopupOpen(true);
  };

  /**
   * Navigate back to search form
   */
  const handleBackToSearch = (): void => {
    router.back();
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 overflow-x-hidden">
        {[1, 2, 3].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <Card className="wellness-shadow p-8 text-center">
        <p className="text-destructive font-semibold mb-2">
          Fehler beim Laden der Ergebnisse
        </p>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button variant="outline" onClick={handleBackToSearch}>
          Zurück zur Suche
        </Button>
      </Card>
    );
  }

  // Empty State
  if (results.length === 0) {
    return (
      <Card className="wellness-shadow p-12 text-center">
        <div className="max-w-md mx-auto">
          <h3 className="text-xl font-bold mb-2">Keine verfügbaren Termine gefunden</h3>
          <p className="text-muted-foreground mb-6">
            Leider konnten wir keine Studios mit verfügbaren Terminen in Ihrer Nähe finden.
            Versuchen Sie es mit einem größeren Suchradius oder einem anderen Zeitpunkt.
          </p>
          <Button variant="outline" onClick={handleBackToSearch}>
            Suche anpassen
          </Button>
        </div>
      </Card>
    );
  }

  // Results Grid (Responsive: 1/2/3 columns)
  return (
    <>
      <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 overflow-x-hidden">
        {results.map((result) => {
          const { id, name, distance, minPrice, matchedServices, availableSlots } = result;
          const logoUrl = result.logoUrl || null;

          // Filter out past slots (client-side safety check)
          const now = new Date();
          const futureSlots = availableSlots.filter((slot) => {
            const slotTime = new Date(slot.startTime);
            return slotTime > now;
          });

          return (
            <Card
              key={id}
              className="wellness-shadow p-3 sm:p-6 hover:shadow-lg transition-shadow flex flex-col overflow-hidden"
            >
              {/* Header: Avatar + Studio Info */}
              <div className="flex items-start gap-4 mb-0.5 sm:mb-4">
                {/* Studio Avatar - Clickable */}
                <button
                  onClick={() => handleViewStudio(result)}
                  className="focus:outline-none focus:ring-2 focus:ring-primary rounded-full shrink-0"
                  aria-label={`${name} Studio-Details anzeigen`}
                >
                  <StudioAvatar
                    logoUrl={logoUrl}
                    studioName={name}
                    studioId={id}
                    size={64}
                    className="hover:opacity-80 transition-opacity cursor-pointer"
                  />
                </button>

                {/* Studio Name + Distance & Price */}
                <div className="flex-1 min-w-0">
                  {/* Studio Name - Clickable */}
                  <button
                    onClick={() => handleViewStudio(result)}
                    className="text-left w-full focus:outline-none focus:ring-2 focus:ring-primary rounded"
                  >
                    <h3 className="font-bold text-base sm:text-lg mb-1 line-clamp-2 break-words overflow-hidden hover:text-primary transition-colors">
                      {name}
                    </h3>
                  </button>

                  {/* Studio Rating */}
                  {result.averageRating !== undefined && result.totalReviews !== undefined && (
                    <div className="mb-2">
                      <StudioRating
                        rating={result.averageRating}
                        totalReviews={result.totalReviews}
                        variant="compact"
                        onClick={() => handleViewStudio(result)}
                      />
                    </div>
                  )}

                  {/* Distance and Price in one row */}
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="secondary" className="shrink-0">
                      {distance.toFixed(1)} km entfernt
                    </Badge>
                    <span className="text-lg sm:text-xl font-bold text-primary shrink-0">
                      {formatPriceLabel(minPrice)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Matched Services */}
              {matchedServices.length > 0 && (
                <div className="mb-1.5 sm:mb-3">
                  <p className="text-sm text-muted-foreground line-clamp-2 break-words overflow-hidden">
                    {matchedServices.map((service) => service.name).join(' • ')}
                  </p>
                </div>
              )}

              {/* Available TimeSlots (Klickbar!) - Now with Timezone Awareness */}
              {futureSlots.length > 0 && (
                <div className="mt-auto">
                  <div className="grid grid-cols-3 sm:grid-cols-2 gap-2 mb-3">
                    {futureSlots.slice(0, 3).map((slot) => (
                      <TimeSlotButton
                        key={slot.startTime}
                        startTime={slot.startTime}
                        studioTimezone={result.timezone}
                        onClick={() => handleBookSlot(id, slot.startTime)}
                        size="sm"
                        showUserTime={true}
                      />
                    ))}
                  </div>

                  {/* View More Link */}
                  {futureSlots.length > 3 && (
                    <Button
                      variant="link"
                      size="sm"
                      className="w-full justify-center gap-2 text-primary hover:text-primary/80"
                      onClick={() => router.push(`/studios/${id}`)}
                    >
                      Alle Termine anzeigen
                      <ArrowRight className="size-4" />
                    </Button>
                  )}
                </div>
              )}

              {/* View Studio Button */}
              <div className="mt-3 pt-3 border-t border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-center gap-2 text-muted-foreground hover:text-primary"
                  onClick={() => handleViewStudio(result)}
                >
                  <Info className="size-4" />
                  Studio-Informationen
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Studio View Popup */}
      {selectedStudio && (
        <StudioViewPopup
          studio={selectedStudio}
          open={isStudioPopupOpen}
          onOpenChange={setIsStudioPopupOpen}
        />
      )}
    </>
  );
}
