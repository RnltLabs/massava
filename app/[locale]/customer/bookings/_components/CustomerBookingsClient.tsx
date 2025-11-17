/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Customer Bookings Client Component
 */

'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookingCard } from './BookingCard';
import { BookingDetailsSheet } from './BookingDetailsSheet';
import { CancelBookingDialog } from './CancelBookingDialog';
import { RescheduleDialog } from './RescheduleDialog';
import { ReviewDialog } from './ReviewDialog';
import { CalendarIcon, ClockIcon } from 'lucide-react';
import type { BookingWithRelations } from '@/app/[locale]/customer/actions/bookings';

interface CustomerBookingsClientProps {
  bookings: {
    upcoming: BookingWithRelations[];
    past: BookingWithRelations[];
  };
  locale: string;
}

export function CustomerBookingsClient({
  bookings,
  locale,
}: CustomerBookingsClientProps): React.JSX.Element {
  const [selectedBooking, setSelectedBooking] = useState<BookingWithRelations | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);

  const handleViewDetails = (booking: BookingWithRelations) => {
    setSelectedBooking(booking);
  };

  const handleCloseDetails = () => {
    setSelectedBooking(null);
  };

  const handleOpenCancel = (booking: BookingWithRelations) => {
    setSelectedBooking(booking);
    setCancelDialogOpen(true);
  };

  const handleCloseCancel = () => {
    setCancelDialogOpen(false);
  };

  const handleOpenReschedule = (booking: BookingWithRelations) => {
    setSelectedBooking(booking);
    setRescheduleDialogOpen(true);
  };

  const handleCloseReschedule = () => {
    setRescheduleDialogOpen(false);
  };

  const handleOpenReview = (booking: BookingWithRelations) => {
    setSelectedBooking(booking);
    setReviewDialogOpen(true);
  };

  const handleCloseReview = () => {
    setReviewDialogOpen(false);
  };

  return (
    <div className="fixed inset-0 top-14 bottom-0 flex flex-col bg-neutral-50 md:static md:h-full md:top-auto">
      {/* Fixed Header Section with backdrop blur */}
      <div className="flex-shrink-0 px-4 pt-4 pb-6 md:px-0 md:pt-0 md:pb-6 backdrop-blur-lg bg-neutral-50/95 sticky top-0 z-10">
        <PageHeader
          title="Meine Buchungen"
          subtitle="Verwalte deine Termine"
          breadcrumb="Buchungen"
          backHref={`/${locale}/customer`}
          backLabel="Zurück"
          showBackButton={true}
        />
      </div>

      {/* Scrollable Content with Tabs */}
      <div className="flex-1 overflow-y-auto px-4 pb-24 md:px-0 md:pb-8">
        <div className="max-w-5xl mx-auto">
          <Tabs defaultValue="upcoming" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="upcoming" className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Anstehend ({bookings.upcoming.length})
              </TabsTrigger>
              <TabsTrigger value="past" className="flex items-center gap-2">
                <ClockIcon className="h-4 w-4" />
                Vergangen ({bookings.past.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="mt-0">
              {bookings.upcoming.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                  <div className="rounded-full bg-primary/10 p-6 mb-4">
                    <CalendarIcon className="h-12 w-12 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    Keine anstehenden Buchungen
                  </h3>
                  <p className="text-muted-foreground max-w-md">
                    Du hast derzeit keine bevorstehenden Termine. Buche einen Service,
                    um loszulegen.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {bookings.upcoming.map((booking) => (
                    <BookingCard
                      key={booking.id}
                      booking={booking}
                      onViewDetails={handleViewDetails}
                      onCancel={handleOpenCancel}
                      onReschedule={handleOpenReschedule}
                      onReview={handleOpenReview}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="past" className="mt-0">
              {bookings.past.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                  <div className="rounded-full bg-gray-100 p-6 mb-4">
                    <ClockIcon className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    Keine vergangenen Buchungen
                  </h3>
                  <p className="text-muted-foreground max-w-md">
                    Hier werden deine abgeschlossenen und stornierten Termine angezeigt.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {bookings.past.map((booking) => (
                    <BookingCard
                      key={booking.id}
                      booking={booking}
                      onViewDetails={handleViewDetails}
                      onReview={handleOpenReview}
                      isPast={true}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Booking Details Sheet */}
      {selectedBooking && (
        <BookingDetailsSheet
          booking={selectedBooking}
          open={!!selectedBooking && !cancelDialogOpen && !rescheduleDialogOpen && !reviewDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              handleCloseDetails();
            }
          }}
          onCancel={handleOpenCancel}
          onReschedule={handleOpenReschedule}
        />
      )}

      {/* Cancel Booking Dialog */}
      {selectedBooking && (
        <CancelBookingDialog
          booking={selectedBooking}
          open={cancelDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              handleCloseCancel();
            }
          }}
        />
      )}

      {/* Reschedule Dialog */}
      {selectedBooking && (
        <RescheduleDialog
          booking={selectedBooking}
          open={rescheduleDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              handleCloseReschedule();
            }
          }}
        />
      )}

      {/* Review Dialog */}
      {selectedBooking && (
        <ReviewDialog
          booking={selectedBooking}
          open={reviewDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              handleCloseReview();
            }
          }}
        />
      )}
    </div>
  );
}
