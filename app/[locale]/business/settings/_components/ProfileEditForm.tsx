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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { updateStudioProfile, type UpdateStudioProfileInput } from '../../actions/profile';
import { Loader2 } from 'lucide-react';

interface ProfileEditFormProps {
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

export function ProfileEditForm({ studio }: ProfileEditFormProps): JSX.Element {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);

    const data: UpdateStudioProfileInput = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string,
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
        title: 'Profile updated',
        description: 'Your studio profile has been updated successfully.',
      });
      router.refresh();
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    }

    setIsLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Studio Name</Label>
        <Input id="name" name="name" defaultValue={studio.name} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={studio.description ?? ''}
          rows={4}
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input id="phone" name="phone" type="tel" defaultValue={studio.phone ?? ''} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" defaultValue={studio.email ?? ''} />
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
