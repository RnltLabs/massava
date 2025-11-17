/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Star Rating Component
 * Display and input component for 1-5 star ratings
 */

'use client';

import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  /**
   * Current rating value (1-5)
   */
  value: number;

  /**
   * Callback when rating changes (for input mode)
   */
  onChange?: (rating: number) => void;

  /**
   * Size of stars in pixels
   * @default 24
   */
  size?: number;

  /**
   * Whether the rating is readonly (display only)
   * @default false
   */
  readonly?: boolean;

  /**
   * Show rating number next to stars
   * @default false
   */
  showValue?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;
}

export function StarRating({
  value,
  onChange,
  size = 24,
  readonly = false,
  showValue = false,
  className,
}: StarRatingProps): React.JSX.Element {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const displayValue = hoverValue !== null ? hoverValue : value;

  const handleClick = (rating: number): void => {
    if (!readonly && onChange) {
      onChange(rating);
    }
  };

  const handleMouseEnter = (rating: number): void => {
    if (!readonly) {
      setHoverValue(rating);
    }
  };

  const handleMouseLeave = (): void => {
    if (!readonly) {
      setHoverValue(null);
    }
  };

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((rating) => {
          const isFilled = rating <= displayValue;

          return (
            <button
              key={rating}
              type="button"
              onClick={() => handleClick(rating)}
              onMouseEnter={() => handleMouseEnter(rating)}
              onMouseLeave={handleMouseLeave}
              disabled={readonly}
              className={cn(
                'transition-all',
                !readonly && 'cursor-pointer hover:scale-110',
                readonly && 'cursor-default'
              )}
              aria-label={`${rating} star${rating > 1 ? 's' : ''}`}
            >
              <Star
                size={size}
                className={cn(
                  'transition-colors',
                  isFilled
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'fill-none text-gray-300'
                )}
              />
            </button>
          );
        })}
      </div>

      {showValue && (
        <span className="ml-2 text-sm font-medium text-muted-foreground">
          {value.toFixed(1)}
        </span>
      )}
    </div>
  );
}

/**
 * Compact star rating display (for cards/lists)
 */
interface CompactStarRatingProps {
  rating: number;
  totalReviews?: number;
  className?: string;
}

export function CompactStarRating({
  rating,
  totalReviews,
  className,
}: CompactStarRatingProps): React.JSX.Element {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFull = star <= fullStars;
          const isHalf = star === fullStars + 1 && hasHalfStar;

          return (
            <Star
              key={star}
              size={16}
              className={cn(
                'transition-colors',
                isFull && 'fill-yellow-400 text-yellow-400',
                isHalf && 'fill-yellow-400 text-yellow-400',
                !isFull && !isHalf && 'fill-none text-gray-300'
              )}
              style={
                isHalf
                  ? {
                      clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)',
                    }
                  : undefined
              }
            />
          );
        })}
      </div>

      <span className="text-sm font-medium text-foreground">{rating.toFixed(1)}</span>

      {totalReviews !== undefined && (
        <span className="text-sm text-muted-foreground">
          ({totalReviews.toLocaleString()})
        </span>
      )}
    </div>
  );
}
