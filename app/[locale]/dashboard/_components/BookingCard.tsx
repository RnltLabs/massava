/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Booking Card Component
 * Displays booking information with large accept/decline buttons
 * Supports optimistic updates
 */

'use client';

import React, { useState } from 'react';
import { NewBooking, BookingStatus, Service, User } from '@/app/generated/prisma';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Clock, User as UserIcon, Phone, Mail, MessageSquare } from 'lucide-react';
import { format, parse } from 'date-fns';
import { de } from 'date-fns/locale';
import { confirmBooking, declineBooking } from '@/app/actions/studio/confirmBooking';
import { useToast } from '@/components/ui/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

type BookingWithRelations = NewBooking & {
  service: Service | null;
  customer: Pick<User, 'name' | 'email' | 'phone'> | null;
};

interface BookingCardProps {
  booking: BookingWithRelations;
  locale: string;
  studioId: string;
  compact?: boolean;
}

export function BookingCard({
  booking,
  locale,
  studioId,
  compact = false,
}: BookingCardProps): React.JSX.Element {
  const { toast } = useToast();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [optimisticStatus, setOptimisticStatus] = useState<BookingStatus | null>(null);

  const displayStatus = optimisticStatus || booking.status;
  const isPending = displayStatus === BookingStatus.PENDING;
  const isConfirmed = displayStatus === BookingStatus.CONFIRMED;
  const isCancelled = displayStatus === BookingStatus.CANCELLED;

  // Parse date
  const bookingDate = parse(booking.preferredDate, 'yyyy-MM-dd', new Date());
  const formattedDate = format(bookingDate, 'EEEE, d. MMMM yyyy', { locale: de });

  const handleConfirm = async (): Promise<void> => {
    setIsConfirming(true);
    setOptimisticStatus(BookingStatus.CONFIRMED);

    try {
      const result = await confirmBooking(booking.id);

      if (result.success) {
        toast({
          title: 'Buchung bestätigt',
          description: 'Die Buchung wurde erfolgreich bestätigt.',
        });
      } else {
        // Revert optimistic update
        setOptimisticStatus(null);
        toast({
          title: 'Fehler',
          description: result.error || 'Die Buchung konnte nicht bestätigt werden.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      // Revert optimistic update
      setOptimisticStatus(null);
      toast({
        title: 'Fehler',
        description: 'Ein unerwarteter Fehler ist aufgetreten.',
        variant: 'destructive',
      });
    } finally {
      setIsConfirming(false);
    }
  };

  const handleDecline = async (): Promise<void> => {
    setIsDeclining(true);
    setOptimisticStatus(BookingStatus.CANCELLED);
    setShowDeclineDialog(false);

    try {
      const result = await declineBooking(booking.id);

      if (result.success) {
        toast({
          title: 'Buchung abgelehnt',
          description: 'Die Buchung wurde abgelehnt.',
        });
      } else {
        // Revert optimistic update
        setOptimisticStatus(null);
        toast({
          title: 'Fehler',
          description: result.error || 'Die Buchung konnte nicht abgelehnt werden.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      // Revert optimistic update
      setOptimisticStatus(null);
      toast({
        title: 'Fehler',
        description: 'Ein unerwarteter Fehler ist aufgetreten.',
        variant: 'destructive',
      });
    } finally {
      setIsDeclining(false);
    }
  };

  return (
    <>
      <Card
        className={cn(
          'transition-all',
          isPending && 'border-l-4 border-l-orange-500',
          isConfirmed && 'border-l-4 border-l-green-500'
        )}
      >
        <CardContent className="p-4 md:p-5">
          {/* Status Badge */}
          <div className="flex items-start justify-between mb-3">
            <Badge
              variant={
                isPending
                  ? 'default'
                  : isConfirmed
                  ? 'default'
                  : 'secondary'
              }
              className={cn(
                isPending && 'bg-orange-500 hover:bg-orange-600',
                isConfirmed && 'bg-green-500 hover:bg-green-600'
              )}
            >
              {isPending
                ? 'Reserviert'
                : isConfirmed
                ? 'Bestätigt'
                : 'Abgesagt'}
            </Badge>
            {booking.service && (
              <span className="text-sm font-semibold text-foreground">
                {booking.service.name}
              </span>
            )}
          </div>

          {/* Date & Time */}
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-foreground">{formattedDate}</p>
              <p className="text-muted-foreground">{booking.preferredTime} Uhr</p>
            </div>
          </div>

          {!compact && (
            <>
              {/* Customer Info */}
              <div className="space-y-2 mb-3 text-sm">
                <div className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-foreground font-medium">
                    {booking.customerName}
                  </span>
                </div>
                {booking.customerEmail && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <a
                      href={`mailto:${booking.customerEmail}`}
                      className="text-muted-foreground hover:text-primary underline"
                    >
                      {booking.customerEmail}
                    </a>
                  </div>
                )}
                {booking.customerPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <a
                      href={`tel:${booking.customerPhone}`}
                      className="text-muted-foreground hover:text-primary underline"
                    >
                      {booking.customerPhone}
                    </a>
                  </div>
                )}
              </div>

              {/* Message */}
              {booking.message && (
                <div className="flex items-start gap-2 mb-3 p-3 bg-muted/50 rounded-lg">
                  <MessageSquare className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">{booking.message}</p>
                </div>
              )}
            </>
          )}

          {/* Action Buttons (only for pending bookings) */}
          {isPending && (
            <div className="grid grid-cols-2 gap-3 mt-4">
              <Button
                onClick={handleConfirm}
                disabled={isConfirming || isDeclining}
                className="h-14 bg-green-500 hover:bg-green-600 text-white font-semibold text-base"
              >
                {isConfirming ? (
                  'Wird bestätigt...'
                ) : (
                  <>
                    <Check className="h-5 w-5 mr-2" />
                    Annehmen
                  </>
                )}
              </Button>
              <Button
                onClick={() => setShowDeclineDialog(true)}
                disabled={isConfirming || isDeclining}
                variant="destructive"
                className="h-14 font-semibold text-base"
              >
                {isDeclining ? (
                  'Wird abgelehnt...'
                ) : (
                  <>
                    <X className="h-5 w-5 mr-2" />
                    Ablehnen
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Decline Confirmation Dialog */}
      <AlertDialog open={showDeclineDialog} onOpenChange={setShowDeclineDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Buchung ablehnen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchtest du diese Buchung wirklich ablehnen? Der Kunde wird per E-Mail benachrichtigt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDecline}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Ja, ablehnen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
