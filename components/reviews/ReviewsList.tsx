/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Reviews List Component
 * Display paginated list of reviews with sorting
 */

'use client';

import React, { useState, useEffect } from 'react';
import { ReviewCard, type ReviewData } from '@/components/reviews/ReviewCard';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, MessageSquare } from 'lucide-react';

interface ReviewsListProps {
  studioId: string;
  initialReviews?: ReviewData[];
  initialTotal?: number;
}

type SortOption = 'newest' | 'highest' | 'lowest';

export function ReviewsList({
  studioId,
  initialReviews = [],
  initialTotal = 0,
}: ReviewsListProps): React.JSX.Element {
  const [reviews, setReviews] = useState<ReviewData[]>(initialReviews);
  const [total, setTotal] = useState(initialTotal);
  const [isLoading, setIsLoading] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [offset, setOffset] = useState(0);
  const limit = 10;

  const hasMore = offset + limit < total;

  // Fetch reviews
  const fetchReviews = async (newSortBy: SortOption, newOffset: number) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        studioId,
        limit: limit.toString(),
        offset: newOffset.toString(),
        sortBy: newSortBy,
      });

      const response = await fetch(`/api/reviews?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        if (newOffset === 0) {
          setReviews(data.data);
        } else {
          setReviews((prev) => [...prev, ...data.data]);
        }
        setTotal(data.meta.total);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle sort change
  const handleSortChange = (value: SortOption) => {
    setSortBy(value);
    setOffset(0);
    fetchReviews(value, 0);
  };

  // Handle load more
  const handleLoadMore = () => {
    const newOffset = offset + limit;
    setOffset(newOffset);
    fetchReviews(sortBy, newOffset);
  };

  // Initial load if no reviews provided
  useEffect(() => {
    if (initialReviews.length === 0) {
      fetchReviews('newest', 0);
    }
  }, [studioId]);

  // Empty state
  if (!isLoading && reviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="rounded-full bg-muted p-6 mb-4">
          <MessageSquare className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Noch keine Bewertungen</h3>
        <p className="text-muted-foreground max-w-md">
          Sei der Erste, der dieses Studio bewertet!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sort Controls */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {total} {total === 1 ? 'Bewertung' : 'Bewertungen'}
        </h3>

        <Select value={sortBy} onValueChange={handleSortChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sortieren" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Neueste zuerst</SelectItem>
            <SelectItem value="highest">Höchste Bewertung</SelectItem>
            <SelectItem value="lowest">Niedrigste Bewertung</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Lädt...
              </>
            ) : (
              'Mehr laden'
            )}
          </Button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && reviews.length === 0 && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
    </div>
  );
}
