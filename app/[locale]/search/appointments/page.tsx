/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { SearchResults } from '@/components/search/SearchResults';
import { SearchFilters } from '@/components/search/SearchFilters';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    location?: string;
    lat?: string;
    lng?: string;
    radius?: string;
    datetime?: string;
    serviceType?: string;
    minPrice?: string;
    maxPrice?: string;
  }>;
};

export default async function AppointmentSearchPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const search = await searchParams;
  // Translation hook - kept for future use
  void (await getTranslations({ locale, namespace: 'search' }));

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-2xl mx-auto px-4 pt-4 pb-8 sm:px-6">
        {/* Unified Search Filters with Header */}
        <SearchFilters />

        {/* Results */}
        <Suspense fallback={<SearchResultsSkeleton />}>
          <SearchResults searchParams={search} />
        </Suspense>
      </div>
    </div>
  );
}

function SearchResultsSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm animate-pulse"
        >
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 bg-muted rounded" />
              <div className="h-3 w-48 bg-muted rounded" />
            </div>
            <div className="h-6 w-16 bg-muted rounded" />
          </div>
          <div className="flex gap-1.5 mt-3">
            <div className="h-6 w-16 bg-muted rounded-full" />
            <div className="h-6 w-20 bg-muted rounded-full" />
          </div>
          <div className="flex gap-1.5 mt-3 pt-3 border-t border-gray-100">
            <div className="h-8 w-14 bg-muted rounded-lg" />
            <div className="h-8 w-14 bg-muted rounded-lg" />
            <div className="h-8 w-14 bg-muted rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}
