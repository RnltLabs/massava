/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Studio Rating Component
 * Display aggregated rating with stars and review count
 */

'use client';

import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StudioRatingProps {
  /**
   * Average rating (0-5)
   */
  rating: number | null;

  /**
   * Total number of reviews
   */
  totalReviews: number;

  /**
   * Display variant
   * @default 'default'
   */
  variant?: 'default' | 'compact' | 'large';

  /**
   * Make rating clickable
   */
  onClick?: () => void;

  /**
   * Additional CSS classes
   */
  className?: string;
}

export function StudioRating({
  rating,
  totalReviews,
  variant = 'default',
  onClick,
  className,
}: StudioRatingProps): React.JSX.Element {
  // No rating yet
  if (rating === null || totalReviews === 0) {
    return (
      <div
        className={cn(
          'flex items-center gap-1.5 text-muted-foreground',
          onClick && 'cursor-pointer hover:text-primary transition-colors',
          className
        )}
        onClick={onClick}
      >
        <Star size={16} className="fill-none" />
        <span className="text-sm">Keine Bewertungen</span>
      </div>
    );
  }

  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  // Size configuration
  const sizes = {
    compact: {
      star: 14,
      text: 'text-xs',
    },
    default: {
      star: 16,
      text: 'text-sm',
    },
    large: {
      star: 20,
      text: 'text-base',
    },
  };

  const { star: starSize, text: textSize } = sizes[variant];

  return (
    <div
      className={cn(
        'flex items-center gap-1.5',
        onClick && 'cursor-pointer group',
        className
      )}
      onClick={onClick}
    >
      {/* Stars */}
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFull = star <= fullStars;
          const isHalf = star === fullStars + 1 && hasHalfStar;

          return (
            <Star
              key={star}
              size={starSize}
              className={cn(
                'transition-colors',
                isFull && 'fill-yellow-400 text-yellow-400',
                isHalf && 'fill-yellow-400 text-yellow-400',
                !isFull && !isHalf && 'fill-none text-gray-300',
                onClick && 'group-hover:scale-105'
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

      {/* Rating Number */}
      <span
        className={cn(
          'font-semibold',
          textSize,
          onClick && 'group-hover:text-primary transition-colors'
        )}
      >
        {rating.toFixed(1)}
      </span>

      {/* Review Count */}
      <span className={cn('text-muted-foreground', textSize)}>
        ({totalReviews.toLocaleString('de-DE')}{' '}
        {totalReviews === 1 ? 'Bewertung' : 'Bewertungen'})
      </span>
    </div>
  );
}
