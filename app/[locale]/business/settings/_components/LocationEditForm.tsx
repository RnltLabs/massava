/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { updateStudioProfile, type UpdateStudioProfileInput } from '../../actions/profile';
import { Loader2 } from 'lucide-react';

interface LocationEditFormProps {
  studio: {
    id: string;
    name: string;
    description: string | null;
    phone: string | null;
    email: string | null;
    address: string;
    city: string;
    postalCode: string | null;
    latitude: number | null;
    longitude: number | null;
  };
}

export function LocationEditForm({ studio }: LocationEditFormProps): JSX.Element {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);

    const data: UpdateStudioProfileInput = {
      name: studio.name,
      description: studio.description ?? '',
      phone: studio.phone,
      email: studio.email,
      address: formData.get('address') as string,
      city: formData.get('city') as string,
      postalCode: formData.get('postalCode') as string,
      latitude: formData.get('latitude')
        ? parseFloat(formData.get('latitude') as string)
        : null,
      longitude: formData.get('longitude')
        ? parseFloat(formData.get('longitude') as string)
        : null,
    };

    const result = await updateStudioProfile(data);

    if (result.success) {
      toast({
        title: 'Location updated',
        description: 'Your studio location has been updated successfully.',
      });
      router.refresh();
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to update location. Please try again.',
        variant: 'destructive',
      });
    }

    setIsLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="address">Street Address</Label>
        <Input id="address" name="address" defaultValue={studio.address} required />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input id="city" name="city" defaultValue={studio.city} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="postalCode">Postal Code</Label>
          <Input id="postalCode" name="postalCode" defaultValue={studio.postalCode ?? ''} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="latitude">Latitude</Label>
          <Input
            id="latitude"
            name="latitude"
            type="number"
            step="any"
            defaultValue={studio.latitude ?? ''}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="longitude">Longitude</Label>
          <Input
            id="longitude"
            name="longitude"
            type="number"
            step="any"
            defaultValue={studio.longitude ?? ''}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>
    </form>
  );
}
