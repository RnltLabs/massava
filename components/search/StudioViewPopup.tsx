/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Studio View Popup Component
 * Shows detailed studio information in a dialog/sheet
 */

'use client';

import React from 'react';
import { useMediaQuery } from '@/hooks/use-media-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { StudioAvatar } from '@/components/ui/studio-avatar';
import { StudioMap } from '@/components/search/StudioMap';
import { OpeningHoursDisplay } from '@/components/search/OpeningHoursDisplay';
import { StudioGallery } from '@/components/search/StudioGallery';
import { StudioRating } from '@/components/reviews/StudioRating';
import { ReviewsList } from '@/components/reviews/ReviewsList';
import {
  PhoneIcon,
  MailIcon,
  GlobeIcon,
  ExternalLinkIcon,
} from 'lucide-react';
import type { SearchResultStudio } from '@/types/booking';

interface StudioViewPopupProps {
  studio: SearchResultStudio;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StudioViewPopup({
  studio,
  open,
  onOpenChange,
}: StudioViewPopupProps): React.JSX.Element {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [reviewsRef, setReviewsRef] = React.useState<HTMLDivElement | null>(null);

  const scrollToReviews = () => {
    reviewsRef?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const content = (
    <div className="space-y-6">
      {/* Studio Header with Avatar */}
      <div className="flex flex-col items-center text-center space-y-4">
        <StudioAvatar
          logoUrl={studio.logoUrl}
          studioName={studio.name}
          studioId={studio.id}
          size={96}
        />
        <div>
          <h2 className="text-2xl font-bold mb-2">{studio.name}</h2>

          {/* Studio Rating - Clickable to scroll to reviews */}
          {studio.averageRating !== undefined && studio.totalReviews !== undefined && (
            <div className="mb-2 flex justify-center">
              <StudioRating
                rating={studio.averageRating}
                totalReviews={studio.totalReviews}
                variant="default"
                onClick={scrollToReviews}
              />
            </div>
          )}

          {studio.description && (
            <p className="text-muted-foreground text-sm leading-relaxed max-w-md">
              {studio.description}
            </p>
          )}
        </div>
      </div>

      <Separator />

      {/* Studio Gallery */}
      <StudioGallery galleryImages={studio.galleryImages} studioName={studio.name} />

      <Separator />

      {/* Map with Address */}
      <StudioMap
        name={studio.name}
        address={studio.address}
        city={studio.city}
        postalCode={studio.postalCode}
        latitude={studio.latitude ?? null}
        longitude={studio.longitude ?? null}
      />

      <Separator />

      {/* Contact Information */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">Kontakt</h3>
        <div className="space-y-2">
          {/* Phone */}
          <a
            href={`tel:${studio.phone}`}
            className="flex items-center gap-3 text-sm hover:text-primary transition-colors group"
          >
            <PhoneIcon className="h-5 w-5 text-gray-600 group-hover:text-primary flex-shrink-0" />
            <span>{studio.phone}</span>
          </a>

          {/* Email */}
          <a
            href={`mailto:${studio.email}`}
            className="flex items-center gap-3 text-sm hover:text-primary transition-colors group"
          >
            <MailIcon className="h-5 w-5 text-gray-600 group-hover:text-primary flex-shrink-0" />
            <span className="break-all">{studio.email}</span>
          </a>

          {/* Website (if available) */}
          {studio.website && (
            <a
              href={studio.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 text-sm hover:text-primary transition-colors group"
            >
              <GlobeIcon className="h-5 w-5 text-gray-600 group-hover:text-primary flex-shrink-0" />
              <span className="break-all">{studio.website}</span>
              <ExternalLinkIcon className="h-3 w-3 flex-shrink-0" />
            </a>
          )}
        </div>
      </div>

      {/* Opening Hours (if available) */}
      {studio.openingHours !== null && studio.openingHours !== undefined && (
        <>
          <Separator />
          <OpeningHoursDisplay openingHours={studio.openingHours} />
        </>
      )}

      {/* Reviews Section */}
      <Separator />
      <div ref={setReviewsRef} className="scroll-mt-6">
        <ReviewsList studioId={studio.id} />
      </div>
    </div>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle>Studio Details</DialogTitle>
            <DialogDescription>
              Informationen über das Studio
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-6 overflow-y-auto">
            {content}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[90vh] rounded-t-[2rem] p-0"
      >
        <SheetHeader className="px-6 pt-6 pb-2">
          <SheetTitle>Studio Details</SheetTitle>
          <SheetDescription>
            Informationen über das Studio
          </SheetDescription>
        </SheetHeader>
        <div className="px-6 pb-6 overflow-y-auto h-[calc(100%-80px)]">
          {content}
        </div>
      </SheetContent>
    </Sheet>
  );
}
