/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Review Card Component
 * Display a single review with user info, rating, comment, and studio response
 */

'use client';

import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StarRating } from '@/components/reviews/StarRating';
import { MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ReviewData {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: Date | string;
  response: string | null;
  respondedAt: Date | string | null;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

interface ReviewCardProps {
  review: ReviewData;
  className?: string;
}

export function ReviewCard({ review, className }: ReviewCardProps): React.JSX.Element {
  const createdDate = typeof review.createdAt === 'string'
    ? new Date(review.createdAt)
    : review.createdAt;

  const respondedDate = review.respondedAt
    ? typeof review.respondedAt === 'string'
      ? new Date(review.respondedAt)
      : review.respondedAt
    : null;

  const userName = review.user.name || 'Anonymer Nutzer';
  const userInitials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="p-4 sm:p-6 space-y-4">
        {/* User Info and Rating */}
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={review.user.image || undefined} alt={userName} />
            <AvatarFallback>{userInitials}</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-semibold text-sm truncate">{userName}</h4>
              <time className="text-xs text-muted-foreground whitespace-nowrap">
                {formatDistanceToNow(createdDate, {
                  addSuffix: true,
                  locale: de,
                })}
              </time>
            </div>
            <div className="mt-1">
              <StarRating value={review.rating} readonly size={18} />
            </div>
          </div>
        </div>

        {/* Review Comment */}
        {review.comment && (
          <p className="text-sm text-foreground leading-relaxed break-words">
            {review.comment}
          </p>
        )}

        {/* Studio Response */}
        {review.response && (
          <div className="bg-muted/50 rounded-lg p-4 space-y-2 border-l-2 border-primary">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MessageSquare size={14} />
              <span className="font-medium">Antwort vom Studio</span>
              {respondedDate && (
                <span>
                  •{' '}
                  {formatDistanceToNow(respondedDate, {
                    addSuffix: true,
                    locale: de,
                  })}
                </span>
              )}
            </div>
            <p className="text-sm text-foreground leading-relaxed break-words">
              {review.response}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
