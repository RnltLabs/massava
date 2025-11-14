/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { confirmBooking, declineBooking } from '@/app/actions/studio/confirmBooking';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

interface BookingActionsProps {
  bookingId: string;
  customerName: string;
}

export function BookingActions({ bookingId, customerName }: BookingActionsProps): React.JSX.Element {
  const [isPending, startTransition] = useTransition();
  const [isDeclineDialogOpen, setIsDeclineDialogOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const { toast } = useToast();

  const handleConfirm = (): void => {
    startTransition(async () => {
      const result = await confirmBooking(bookingId);

      if (result.success) {
        toast({
          title: 'Buchung bestätigt',
          description: `Die Buchung von ${customerName} wurde erfolgreich bestätigt.`,
        });
      } else {
        toast({
          title: 'Fehler',
          description: result.error || 'Die Buchung konnte nicht bestätigt werden.',
          variant: 'destructive',
        });
      }
    });
  };

  const handleDeclineClick = (): void => {
    setIsDeclineDialogOpen(true);
  };

  const handleDeclineConfirm = (): void => {
    startTransition(async () => {
      const result = await declineBooking(bookingId, declineReason.trim() || undefined);

      if (result.success) {
        toast({
          title: 'Buchung abgelehnt',
          description: `Die Buchung von ${customerName} wurde abgelehnt.`,
        });
        setIsDeclineDialogOpen(false);
        setDeclineReason('');
      } else {
        toast({
          title: 'Fehler',
          description: result.error || 'Die Buchung konnte nicht abgelehnt werden.',
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <>
      <div className="flex flex-col gap-2 w-full sm:w-auto">
        <Button
          size="sm"
          className="w-full sm:w-auto"
          onClick={handleConfirm}
          disabled={isPending}
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Wird bearbeitet...
            </>
          ) : (
            'Bestätigen'
          )}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="w-full sm:w-auto"
          onClick={handleDeclineClick}
          disabled={isPending}
        >
          Ablehnen
        </Button>
      </div>

      <Dialog open={isDeclineDialogOpen} onOpenChange={setIsDeclineDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Buchung ablehnen</DialogTitle>
            <DialogDescription>
              Sie sind dabei, die Buchung von {customerName} abzulehnen. Sie können optional einen
              Grund angeben, der dem Kunden mitgeteilt wird.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="reason">Grund für die Ablehnung (optional)</Label>
              <Textarea
                id="reason"
                placeholder="z.B. Der gewünschte Termin ist leider nicht verfügbar..."
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                rows={4}
                maxLength={500}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                {declineReason.length}/500 Zeichen
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsDeclineDialogOpen(false);
                setDeclineReason('');
              }}
              disabled={isPending}
            >
              Abbrechen
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeclineConfirm}
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Wird abgelehnt...
                </>
              ) : (
                'Buchung ablehnen'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
