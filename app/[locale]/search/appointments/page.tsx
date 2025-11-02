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
    <div className="min-h-screen">
      {/* Desktop Layout: Sidebar + Results */}
      <div className="max-w-7xl mx-auto lg:grid lg:grid-cols-[300px_1fr] lg:gap-8 lg:px-8">
        {/* Desktop Sidebar Filters (hidden on mobile) */}
        <aside className="hidden lg:block lg:py-8">
          <SearchFilters />
        </aside>

        {/* Main Content */}
        <div className="px-4 py-6 sm:px-6 lg:px-0 lg:py-8">
          {/* Mobile Filter Button (visible on mobile only) */}
          <div className="lg:hidden mb-4">
            <SearchFilters />
          </div>

          {/* Results */}
          <Suspense fallback={<SearchResultsSkeleton />}>
            <SearchResults searchParams={search} />
          </Suspense>
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
