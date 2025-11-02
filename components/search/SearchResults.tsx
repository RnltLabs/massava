/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StudioAvatar } from '@/components/ui/studio-avatar';
import { formatPriceLabel } from '@/lib/utils/priceAggregation';
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
  const [results, setResults] = useState<SearchResultStudio[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
   */
  const handleBookSlot = (studioId: string, slotId: string): void => {
    router.push(`/booking/${studioId}/${slotId}`);
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
              {/* Studio Avatar */}
              <StudioAvatar
                logoUrl={logoUrl}
                studioName={name}
                studioId={id}
                size={64}
                className="shrink-0"
              />

              {/* Studio Name + Distance & Price */}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base sm:text-lg mb-2 line-clamp-2 break-words overflow-hidden">{name}</h3>

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

            {/* Available TimeSlots (Klickbar!) */}
            {futureSlots.length > 0 && (
              <div className="mt-auto">
                <div className="grid grid-cols-3 sm:grid-cols-2 gap-2 mb-3">
                  {futureSlots.slice(0, 3).map((slot) => (
                    <Button
                      key={slot.id}
                      variant="outline"
                      size="sm"
                      className="justify-center hover:bg-primary hover:text-primary-foreground transition-colors h-10 sm:h-12 w-full text-sm font-medium"
                      onClick={() => handleBookSlot(id, slot.id)}
                      aria-label={`Termin buchen um ${formatTime(slot.startTime)} Uhr`}
                    >
                      {formatTime(slot.startTime)}
                    </Button>
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
          </Card>
        );
      })}
    </div>
  );
}
