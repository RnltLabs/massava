/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

'use client';

import React from 'react';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { deleteService } from '../../actions/services';
import { Loader2 } from 'lucide-react';

interface ServiceDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  service: {
    id: string;
    name: string;
  };
}

export function ServiceDeleteDialog({
  isOpen,
  onClose,
  service,
}: ServiceDeleteDialogProps): React.JSX.Element {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  async function handleDelete(): Promise<void> {
    setIsLoading(true);

    const result = await deleteService(service.id);

    if (result.success) {
      toast({
        title: 'Service deleted',
        description: `${service.name} has been deleted successfully.`,
      });
      router.refresh();
      onClose();
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to delete service. Please try again.',
        variant: 'destructive',
      });
    }

    setIsLoading(false);
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete <strong>{service.name}</strong>. This action cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isLoading} className="bg-red-600">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete Service'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
