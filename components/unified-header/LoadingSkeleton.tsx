/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function LoadingSkeleton(): React.JSX.Element {
  return (
    <div className="flex items-center gap-2">
      <Skeleton className="h-9 w-9 md:h-10 md:w-10 rounded-full" />
    </div>
  );
}
