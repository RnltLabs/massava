/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Review Dialog Component
 */

'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ReviewSubmitForm } from '@/components/reviews/ReviewSubmitForm';
import type { BookingWithRelations } from '@/app/[locale]/customer/actions/bookings';

interface ReviewDialogProps {
  booking: BookingWithRelations | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReviewDialog({
  booking,
  open,
  onOpenChange,
}: ReviewDialogProps): React.JSX.Element {
  if (!booking) {
    return <></>;
  }

  const handleSuccess = () => {
    onOpenChange(false);
    // Refresh will happen automatically via router.refresh() in ReviewSubmitForm
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Bewertung abgeben</DialogTitle>
          <DialogDescription>
            Teile deine Erfahrung mit anderen Kunden
          </DialogDescription>
        </DialogHeader>
        <ReviewSubmitForm
          bookingId={booking.id}
          studioName={booking.studio.name}
          onSuccess={handleSuccess}
        />
      </DialogContent>
    </Dialog>
  );
}
