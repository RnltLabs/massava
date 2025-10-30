/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Calendar Skeleton Component
 * Loading state for calendar
 */

export function CalendarSkeleton(): React.JSX.Element {
  return (
    <div className="flex flex-col h-screen pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 w-full">
        {/* Header Skeleton */}
        <div className="mb-6">
          <div className="h-10 w-48 bg-muted rounded animate-pulse mb-2" />
          <div className="h-6 w-32 bg-muted rounded animate-pulse" />
        </div>

        {/* Date Navigation Skeleton */}
        <div className="flex items-center justify-between mb-6">
          <div className="h-10 w-10 bg-muted rounded animate-pulse" />
          <div className="h-8 w-64 bg-muted rounded animate-pulse" />
          <div className="h-10 w-10 bg-muted rounded animate-pulse" />
        </div>

        {/* Time Grid Skeleton */}
        <div className="space-y-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="h-16 w-16 bg-muted rounded animate-pulse" />
              <div className="flex-1 h-16 bg-muted rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
