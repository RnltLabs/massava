/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Capacity Badge Component
 * Shows "X/Y" capacity indicator on calendar timeslots
 */

'use client';

import React from 'react';
import { formatCapacity, getCapacityColor } from '@/lib/capacity-utils';
import { cn } from '@/lib/utils';

interface CapacityBadgeProps {
  current: number;
  max: number;
  className?: string;
}

export function CapacityBadge({ current, max, className = '' }: CapacityBadgeProps): React.JSX.Element | null {
  // Don't show badge if no bookings
  if (current === 0) {
    return null;
  }

  const colorClass = getCapacityColor(current, max);

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center px-1.5 py-0.5 sm:px-2 rounded-md text-[10px] sm:text-xs font-semibold border shadow-sm',
        colorClass,
        className
      )}
      aria-label={`Kapazität: ${current} von ${max}`}
    >
      {formatCapacity(current, max)}
    </div>
  );
}
