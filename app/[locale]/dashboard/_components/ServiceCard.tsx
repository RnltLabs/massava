/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Service Card Component
 * Displays service information with edit/delete actions
 */

'use client';

import React, { useState } from 'react';
import { Service } from '@/app/generated/prisma';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit2, Trash2, Clock, Euro } from 'lucide-react';
import { ServiceManagementTrigger } from './service-management/ServiceManagementTrigger';
import { deleteService } from '@/app/actions/studio/serviceActions';
import { useToast } from '@/components/ui/use-toast';
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

interface ServiceCardProps {
  service: Service;
  studioId: string;
  locale: string;
}

export function ServiceCard({
  service,
  studioId,
  locale,
}: ServiceCardProps): React.JSX.Element {
  const { toast } = useToast();
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (): Promise<void> => {
    setIsDeleting(true);

    try {
      const result = await deleteService(service.id);

      if (result.success) {
        toast({
          title: 'Service gelöscht',
          description: 'Der Service wurde erfolgreich gelöscht.',
        });
        router.refresh();
      } else {
        toast({
          title: 'Fehler',
          description: result.error || 'Der Service konnte nicht gelöscht werden.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Ein unerwarteter Fehler ist aufgetreten.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="pt-6">
          {/* Service Name */}
          <h3 className="text-xl font-bold text-foreground mb-4">{service.name}</h3>

          {/* Details */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground">{service.duration} Minuten</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Euro className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-foreground font-semibold">
                {service.price.toFixed(2)} €
              </span>
            </div>
          </div>

          {/* Description (if exists) */}
          {service.description && (
            <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
              {service.description}
            </p>
          )}
        </CardContent>

        <CardFooter className="flex gap-2">
          {/* Edit Button */}
          <ServiceManagementTrigger
            studioId={studioId}
            buttonText="Bearbeiten"
            buttonIcon={<Edit2 className="h-4 w-4 mr-2" />}
            variant="outline"
            size="sm"
            className="flex-1"
            editService={{
              id: service.id,
              name: service.name,
              duration: service.duration,
              price: service.price,
            }}
          />

          {/* Delete Button */}
          <Button
            onClick={() => setShowDeleteDialog(true)}
            variant="outline"
            size="sm"
            className="flex-1 text-destructive hover:text-destructive"
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Löschen
          </Button>
        </CardFooter>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Service löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchtest du &quot;{service.name}&quot; wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Ja, löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
