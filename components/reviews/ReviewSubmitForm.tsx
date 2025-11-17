/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Review Submit Form Component
 * Form to submit a review with rating and optional comment
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { StarRating } from '@/components/reviews/StarRating';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface ReviewSubmitFormProps {
  bookingId: string;
  studioName: string;
  onSuccess?: () => void;
}

export function ReviewSubmitForm({
  bookingId,
  studioName,
  onSuccess,
}: ReviewSubmitFormProps): React.JSX.Element {
  const router = useRouter();
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast({
        title: 'Bewertung erforderlich',
        description: 'Bitte wähle eine Sternebewertung aus.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId,
          rating,
          comment: comment.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Bewertung erfolgreich',
          description: 'Vielen Dank für deine Bewertung!',
        });

        // Reset form
        setRating(0);
        setComment('');

        // Call success callback if provided
        if (onSuccess) {
          onSuccess();
        } else {
          // Refresh page to show updated booking status
          router.refresh();
        }
      } else {
        toast({
          title: 'Fehler beim Absenden',
          description: data.error || 'Bitte versuche es erneut.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: 'Fehler',
        description: 'Ein unerwarteter Fehler ist aufgetreten.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">
          Bewerte deine Erfahrung bei {studioName}
        </h3>
        <p className="text-sm text-muted-foreground">
          Teile deine Meinung mit anderen Kunden
        </p>
      </div>

      {/* Rating Stars */}
      <div className="space-y-2">
        <Label>Bewertung *</Label>
        <div className="flex items-center gap-2">
          <StarRating
            value={rating}
            onChange={setRating}
            size={32}
            showValue={false}
          />
          {rating > 0 && (
            <span className="text-sm font-medium text-muted-foreground">
              {rating} {rating === 1 ? 'Stern' : 'Sterne'}
            </span>
          )}
        </div>
      </div>

      {/* Comment */}
      <div className="space-y-2">
        <Label htmlFor="comment">Kommentar (optional)</Label>
        <Textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Beschreibe deine Erfahrung..."
          maxLength={2000}
          rows={5}
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground text-right">
          {comment.length} / 2000
        </p>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={rating === 0 || isSubmitting}
        className="w-full"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Wird gesendet...
          </>
        ) : (
          'Bewertung abschicken'
        )}
      </Button>
    </form>
  );
}
