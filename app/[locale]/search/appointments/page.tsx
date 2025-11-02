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
  const t = await getTranslations({ locale, namespace: 'search' });

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            {t('title', { location: search.location || 'Ihrer Nähe' })}
          </h1>
          <p className="text-muted-foreground">
            {t('subtitle', { radius: search.radius || '20' })}
          </p>
        </div>

        {/* Desktop Layout: Sidebar + Results */}
        <div className="lg:grid lg:grid-cols-[300px_1fr] lg:gap-8">
          {/* Desktop Sidebar Filters (hidden on mobile) */}
          <aside className="hidden lg:block">
            <SearchFilters />
          </aside>

          {/* Main Content */}
          <div className="space-y-6">
            {/* Mobile Filter Button (hidden on desktop) */}
            <div className="lg:hidden flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Ergebnisse werden geladen...
              </p>
              <SearchFilters />
            </div>

            {/* Results */}
            <Suspense fallback={<SearchResultsSkeleton />}>
              <SearchResults searchParams={search} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}

function SearchResultsSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="wellness-shadow rounded-3xl bg-card p-6 animate-pulse"
        >
          <div className="h-6 bg-muted rounded w-1/3 mb-4" />
          <div className="h-4 bg-muted rounded w-2/3 mb-2" />
          <div className="h-4 bg-muted rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}
