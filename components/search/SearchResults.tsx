/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SearchResultCard } from '@/components/search/SearchResultCard';
import { SearchEmptyState } from '@/components/search/SearchEmptyState';
import { StudioViewPopup } from '@/components/search/StudioViewPopup';
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
 * Skeleton Card Component for Loading State
 * Consistent with BookingsList skeleton design
 */
function SkeletonCard(): React.JSX.Element {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <Skeleton className="w-12 h-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
        <Skeleton className="h-6 w-16" />
      </div>
      <div className="flex gap-1.5 mt-3">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="flex gap-1.5 mt-3 pt-3 border-t border-gray-100">
        <Skeleton className="h-8 w-14 rounded-lg" />
        <Skeleton className="h-8 w-14 rounded-lg" />
        <Skeleton className="h-8 w-14 rounded-lg" />
      </div>
    </div>
  );
}

export function SearchResults({ searchParams }: SearchResultsProps): React.JSX.Element {
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
        const queryParams = new URLSearchParams();
        if (searchParams.location) queryParams.set('location', searchParams.location);
        if (searchParams.lat) queryParams.set('lat', searchParams.lat);
        if (searchParams.lng) queryParams.set('lng', searchParams.lng);
        if (searchParams.radius) queryParams.set('radius', searchParams.radius);
        if (searchParams.datetime) queryParams.set('datetime', searchParams.datetime);
        if (searchParams.serviceType) queryParams.set('serviceType', searchParams.serviceType);
        if (searchParams.minPrice) queryParams.set('minPrice', searchParams.minPrice);
        if (searchParams.maxPrice) queryParams.set('maxPrice', searchParams.maxPrice);

        const response = await fetch(`/api/search/appointments?${queryParams.toString()}`);

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
   * Preserves search parameters so user can return to same search results
   */
  const handleBookSlot = (studioId: string, slotId: string): void => {
    // Build query string from current search params to preserve search context
    const queryParams = new URLSearchParams();
    if (searchParams.location) queryParams.set('location', searchParams.location);
    if (searchParams.lat) queryParams.set('lat', searchParams.lat);
    if (searchParams.lng) queryParams.set('lng', searchParams.lng);
    if (searchParams.radius) queryParams.set('radius', searchParams.radius);
    if (searchParams.datetime) queryParams.set('datetime', searchParams.datetime);
    if (searchParams.serviceType) queryParams.set('serviceType', searchParams.serviceType);
    if (searchParams.minPrice) queryParams.set('minPrice', searchParams.minPrice);
    if (searchParams.maxPrice) queryParams.set('maxPrice', searchParams.maxPrice);

    const queryString = queryParams.toString();
    const bookingUrl = `/${locale}/booking/${studioId}/${encodeURIComponent(slotId)}${queryString ? `?${queryString}` : ''}`;
    router.push(bookingUrl);
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

  /**
   * Clear filters but keep location parameters
   */
  const handleClearFilters = (): void => {
    const queryParams = new URLSearchParams();
    if (searchParams.location) queryParams.set('location', searchParams.location);
    if (searchParams.lat) queryParams.set('lat', searchParams.lat);
    if (searchParams.lng) queryParams.set('lng', searchParams.lng);
    if (searchParams.radius) queryParams.set('radius', searchParams.radius);
    router.push(`?${queryParams.toString()}`);
  };

  // Loading State - Vertical list layout
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-8 text-center shadow-sm">
        <p className="text-destructive font-semibold mb-2">
          Fehler beim Laden der Ergebnisse
        </p>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button variant="outline" onClick={handleBackToSearch}>
          Zurück zur Suche
        </Button>
      </div>
    );
  }

  // Empty State
  if (results.length === 0) {
    const hasFilters = Boolean(
      searchParams.serviceType ||
      searchParams.minPrice ||
      searchParams.maxPrice
    );
    return (
      <SearchEmptyState
        hasFilters={hasFilters}
        onClearFilters={handleClearFilters}
      />
    );
  }

  // Results - Vertical list layout
  return (
    <>
      <div className="space-y-3">
        {results.map((result) => (
          <SearchResultCard
            key={result.id}
            studio={result}
            onBookSlot={handleBookSlot}
            onViewStudio={() => handleViewStudio(result)}
          />
        ))}
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
