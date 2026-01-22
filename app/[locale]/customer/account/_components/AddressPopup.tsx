/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Customer Address Popup
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { useMediaQuery } from '@/hooks/use-media-query';
import { AddressAutocomplete } from '@/app/[locale]/dashboard/_components/studio-registration/components/AddressAutocomplete';
import { customerAddressSchema } from '@/lib/schemas/customer.schema';
import { cn } from '@/lib/utils';
import { updateCustomerAddress } from '@/app/[locale]/customer/actions/profile';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AddressPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData: {
    street: string;
    line2?: string;
    city: string;
    postalCode: string;
    latitude?: number;
    longitude?: number;
  };
}

export function AddressPopup({
  open,
  onOpenChange,
  initialData,
}: AddressPopupProps): React.JSX.Element {
  const { toast } = useToast();
  const router = useRouter();

  const [street, setStreet] = useState(initialData.street || '');
  const [line2, setLine2] = useState(initialData.line2 || '');
  const [city, setCity] = useState(initialData.city || '');
  const [postalCode, setPostalCode] = useState(initialData.postalCode || '');
  const [latitude, setLatitude] = useState(initialData.latitude);
  const [longitude, setLongitude] = useState(initialData.longitude);

  const [touched, setTouched] = useState({
    street: false,
    city: false,
    postalCode: false,
  });
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate field
  const validateField = (field: string, value: string): void => {
    try {
      if (field === 'street') {
        customerAddressSchema.shape.street.parse(value);
      } else if (field === 'city') {
        customerAddressSchema.shape.city.parse(value);
      } else if (field === 'postalCode') {
        customerAddressSchema.shape.postalCode.parse(value);
      }
      setLocalErrors((prev) => ({ ...prev, [field]: '' }));
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'errors' in error) {
        const zodError = error as { errors: Array<{ message: string }> };
        const message = zodError.errors[0]?.message || 'Ungültiger Wert';
        setLocalErrors((prev) => ({ ...prev, [field]: message }));
      }
    }
  };

  // Handle blur
  const handleBlur = (field: string): void => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const values = { street, city, postalCode };
    validateField(field, values[field as keyof typeof values] as string);
  };

  // Handle address selection from autocomplete
  const handleAddressSelect = (address: {
    street: string;
    city: string;
    postalCode: string;
    country?: string;
    latitude?: number;
    longitude?: number;
  }): void => {
    setStreet(address.street);
    setCity(address.city);
    setPostalCode(address.postalCode);
    setLatitude(address.latitude);
    setLongitude(address.longitude);

    // Mark address fields as touched
    setTouched((prev) => ({
      ...prev,
      street: true,
      city: true,
      postalCode: true,
    }));

    // Clear errors for address fields
    setLocalErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.street;
      delete newErrors.city;
      delete newErrors.postalCode;
      return newErrors;
    });
  };

  // Handle save
  const handleSave = async (): Promise<void> => {
    // Mark all as touched
    setTouched({
      street: true,
      city: true,
      postalCode: true,
    });

    // Validate all fields
    try {
      const validatedAddress = customerAddressSchema.parse({
        street,
        line2,
        city,
        postalCode,
        latitude,
        longitude,
      });

      setIsSubmitting(true);

      // Call server action
      const result = await updateCustomerAddress(validatedAddress);

      if (result.success) {
        toast({
          title: 'Erfolgreich gespeichert',
          description: 'Adresse wurde aktualisiert.',
        });
        onOpenChange(false);
        router.refresh();
      } else {
        toast({
          title: 'Fehler',
          description: result.error || 'Speichern fehlgeschlagen.',
          variant: 'destructive',
        });
      }
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'errors' in error) {
        const zodError = error as { errors: Array<{ path: string[]; message: string }> };
        const errors: Record<string, string> = {};
        zodError.errors.forEach((err: { path: string[]; message: string }) => {
          if (err.path[0]) {
            errors[err.path[0]] = err.message;
          }
        });
        setLocalErrors(errors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid =
    street.trim().length >= 5 &&
    city.trim().length >= 2 &&
    postalCode.trim().length >= 3;

  const isMobile = useMediaQuery('(max-width: 767px)');

  const content = (
    <>
      {/* Custom Header for Mobile */}
      {isMobile && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Adresse bearbeiten</h2>
          <button
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="p-2 -mr-2 text-gray-500 hover:text-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Schließen"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      <div className="space-y-4">
        {/* Smart Address Autocomplete */}
        <div className="space-y-2">
          <AddressAutocomplete
            value={street}
            onChange={setStreet}
            onAddressSelect={handleAddressSelect}
            onBlur={() => handleBlur('street')}
            error={touched.street ? localErrors.street : undefined}
            required
          />
          <p className="text-xs text-gray-500">
            Beginne zu tippen für Vorschläge
          </p>
        </div>

        {/* Address Line 2 - Optional */}
        <div className="space-y-2">
          <Label htmlFor="line2" className="text-sm font-medium">
            Adresszusatz (Optional)
          </Label>
          <Input
            id="line2"
            name="line2"
            type="text"
            autoComplete="address-line2"
            value={line2}
            onChange={(e) => setLine2(e.target.value)}
            disabled={isSubmitting}
            placeholder="z.B. 2. OG, Hinterhaus"
          />
        </div>

        {/* Address Preview */}
        {(street || city || postalCode) && (
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <p className="text-xs font-semibold text-gray-600 mb-2">
              Adress-Vorschau:
            </p>
            <div className="space-y-0.5 text-sm text-gray-900 font-mono">
              {street && (
                <div>
                  {street}
                  {line2 ? `, ${line2}` : ''}
                </div>
              )}
              {(postalCode || city) && (
                <div>
                  {postalCode} {city}
                </div>
              )}
              <div>Deutschland</div>
            </div>
          </div>
        )}
      </div>

      <div
        className={cn(
          'flex gap-2 mt-4',
          isMobile ? 'sticky bottom-0 bg-[#F4EDE8] py-4 border-t -mx-6 px-6' : ''
        )}
      >
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={isSubmitting}
          className="flex-1"
        >
          Abbrechen
        </Button>
        <Button
          type="button"
          onClick={handleSave}
          disabled={!isValid || isSubmitting}
          className="flex-1"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Speichern...
            </>
          ) : (
            'Speichern'
          )}
        </Button>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          style={{ backgroundColor: '#F4EDE8' }}
          className="h-[80dvh] rounded-t-3xl p-6 overflow-y-auto"
          showCloseButton={false}
        >
          <VisuallyHidden>
            <SheetTitle>Adresse bearbeiten</SheetTitle>
          </VisuallyHidden>
          {content}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        style={{ backgroundColor: '#F4EDE8' }}
        className="sm:max-w-[500px] max-h-[90dvh] overflow-y-auto"
        showCloseButton={false}
      >
        <VisuallyHidden>
          <DialogTitle>Adresse bearbeiten</DialogTitle>
        </VisuallyHidden>
        {content}
      </DialogContent>
    </Dialog>
  );
}
