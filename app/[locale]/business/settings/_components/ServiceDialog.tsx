/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import {
  createService,
  updateService,
  type CreateServiceInput,
  type UpdateServiceInput,
} from '../../actions/services';
import { Loader2 } from 'lucide-react';

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  category?: string | null;
}

interface ServiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  service?: Service | null;
  mode: 'create' | 'edit';
}

export function ServiceDialog({
  isOpen,
  onClose,
  service,
  mode,
}: ServiceDialogProps): JSX.Element {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);

    if (mode === 'create') {
      const data: CreateServiceInput = {
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        price: parseFloat(formData.get('price') as string),
        duration: parseInt(formData.get('duration') as string, 10),
        category: formData.get('category') as string,
      };

      const result = await createService(data);

      if (result.success) {
        toast({
          title: 'Service created',
          description: 'Your service has been created successfully.',
        });
        router.refresh();
        onClose();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to create service. Please try again.',
          variant: 'destructive',
        });
      }
    } else if (mode === 'edit' && service) {
      const data: UpdateServiceInput = {
        id: service.id,
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        price: parseFloat(formData.get('price') as string),
        duration: parseInt(formData.get('duration') as string, 10),
        category: formData.get('category') as string,
      };

      const result = await updateService(data);

      if (result.success) {
        toast({
          title: 'Service updated',
          description: 'Your service has been updated successfully.',
        });
        router.refresh();
        onClose();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update service. Please try again.',
          variant: 'destructive',
        });
      }
    }

    setIsLoading(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Add Service' : 'Edit Service'}</DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Create a new service for your studio.'
              : 'Update the details of this service.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Service Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g., Swedish Massage"
                defaultValue={service?.name ?? ''}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Describe your service..."
                defaultValue={service?.description ?? ''}
                rows={3}
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="price">Price (€)</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="49.99"
                  defaultValue={service?.price ?? ''}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  name="duration"
                  type="number"
                  min="5"
                  step="5"
                  placeholder="60"
                  defaultValue={service?.duration ?? ''}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category (optional)</Label>
              <Input
                id="category"
                name="category"
                placeholder="e.g., Massage, Facial"
                defaultValue={service?.category ?? ''}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === 'create' ? 'Creating...' : 'Updating...'}
                </>
              ) : mode === 'create' ? (
                'Create Service'
              ) : (
                'Update Service'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
