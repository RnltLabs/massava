/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Unblock Confirm Dialog Component
 * Confirmation dialog before unblocking time
 */

'use client';

import { useState } from 'react';
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
import { useToast } from '@/components/ui/use-toast';
import { unblockTime } from '../actions';
import type { BlockedTime } from '@/app/generated/prisma';

interface UnblockConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  blocked: BlockedTime | null;
}

export function UnblockConfirmDialog({
  open,
  onOpenChange,
  blocked,
}: UnblockConfirmDialogProps): React.JSX.Element {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    if (!blocked) return;

    setIsLoading(true);
    try {
      const result = await unblockTime(blocked.id);

      if (result.success) {
        toast({
          title: 'Zeit freigegeben',
          description: 'Die blockierte Zeit wurde entfernt.',
        });
        onOpenChange(false);
      } else {
        toast({
          title: 'Fehler',
          description: result.error || 'Zeit konnte nicht freigegeben werden.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      // TODO: Replace with proper logger when available
      // logger.error('Error unblocking time', { error, correlationId });
      toast({
        title: 'Fehler',
        description: 'Ein unerwarteter Fehler ist aufgetreten.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!blocked) return <></>;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Zeit freigeben?</AlertDialogTitle>
          <AlertDialogDescription>
            Möchten Sie die blockierte Zeit von{' '}
            <strong>
              {blocked.startTime.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} bis{' '}
              {blocked.endTime.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
            </strong>{' '}
            freigeben?
            {blocked.reason && (
              <>
                <br />
                Grund: <em>{blocked.reason}</em>
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Abbrechen</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? 'Wird freigegeben...' : 'Ja, freigeben'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
