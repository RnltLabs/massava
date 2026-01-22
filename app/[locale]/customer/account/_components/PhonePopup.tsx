/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Customer Phone Popup
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { useMediaQuery } from '@/hooks/use-media-query';
import { PhoneInput } from '@/app/[locale]/dashboard/_components/studio-registration/components/PhoneInput';
import { customerPhoneSchema } from '@/lib/schemas/customer.schema';
import { cn } from '@/lib/utils';
import { updateCustomerPhone } from '@/app/[locale]/customer/actions/profile';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PhonePopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialPhone: string;
}

export function PhonePopup({
  open,
  onOpenChange,
  initialPhone,
}: PhonePopupProps): React.JSX.Element {
  const { toast } = useToast();
  const router = useRouter();

  const [phone, setPhone] = useState(initialPhone);
  const [touched, setTouched] = useState(false);
  const [localError, setLocalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate phone
  const validatePhone = (value: string): void => {
    try {
      customerPhoneSchema.parse({ phone: value });
      setLocalError('');
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'errors' in error) {
        const zodError = error as { errors: Array<{ message: string }> };
        const message = zodError.errors[0]?.message || 'Ungültige Telefonnummer';
        setLocalError(message);
      }
    }
  };

  // Handle blur
  const handleBlur = (): void => {
    setTouched(true);
    validatePhone(phone);
  };

  // Handle save
  const handleSave = async (): Promise<void> => {
    setTouched(true);

    // Validate
    try {
      const validated = customerPhoneSchema.parse({ phone });
      setIsSubmitting(true);

      // Call server action
      const result = await updateCustomerPhone(validated);

      if (result.success) {
        toast({
          title: 'Erfolgreich gespeichert',
          description: 'Telefonnummer wurde aktualisiert.',
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
        const zodError = error as { errors: Array<{ message: string }> };
        const message = zodError.errors[0]?.message || 'Ungültige Telefonnummer';
        setLocalError(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = phone.trim().length >= 10 && !localError;
  const isMobile = useMediaQuery('(max-width: 767px)');

  const content = (
    <>
      {/* Custom Header for Mobile */}
      {isMobile && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Telefonnummer bearbeiten</h2>
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
        <PhoneInput
          id="phone"
          name="phone"
          value={phone}
          onChange={setPhone}
          onBlur={handleBlur}
          error={touched ? localError : undefined}
          disabled={isSubmitting}
          required
          label="Telefonnummer"
        />

        <p className="text-xs text-gray-500">
          Wird für Buchungsbenachrichtigungen verwendet
        </p>
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
          className="h-[80vh] rounded-t-3xl p-6 overflow-y-auto"
          showCloseButton={false}
        >
          <VisuallyHidden>
            <SheetTitle>Telefonnummer bearbeiten</SheetTitle>
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
        className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto"
        showCloseButton={false}
      >
        <VisuallyHidden>
          <DialogTitle>Telefonnummer bearbeiten</DialogTitle>
        </VisuallyHidden>
        {content}
      </DialogContent>
    </Dialog>
  );
}
