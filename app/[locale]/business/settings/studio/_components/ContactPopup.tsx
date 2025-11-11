/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
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
import { PhoneInput } from '@/app/[locale]/dashboard/_components/studio-registration/components/PhoneInput';
import { contactSchema } from '@/app/[locale]/dashboard/_components/studio-registration/validation/studioSchemas';
import { cn } from '@/lib/utils';
import { updateStudioContact } from '@/app/[locale]/business/actions/profile';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ContactPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData: {
    phone: string;
    email: string;
    website?: string;
  };
}

export function ContactPopup({ open, onOpenChange, initialData }: ContactPopupProps): React.JSX.Element {
  const { toast } = useToast();
  const router = useRouter();

  const [phone, setPhone] = useState(initialData.phone || '');
  const [email, setEmail] = useState(initialData.email || '');
  const [website, setWebsite] = useState(initialData.website || '');

  const [touched, setTouched] = useState({
    phone: false,
    email: false,
    website: false,
  });
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate field
  const validateField = (field: string, value: string): void => {
    try {
      if (field === 'phone') {
        contactSchema.shape.phone.parse(value);
      } else if (field === 'email') {
        contactSchema.shape.email.parse(value);
      } else if (field === 'website') {
        contactSchema.shape.website.parse(value || '');
      }
      setLocalErrors((prev) => ({ ...prev, [field]: '' }));
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'errors' in error) {
        const zodError = error as { errors: Array<{ message: string }> };
        const message = zodError.errors[0]?.message || 'Invalid value';
        setLocalErrors((prev) => ({ ...prev, [field]: message }));
      }
    }
  };

  // Handle blur
  const handleBlur = (field: string): void => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const values = { phone, email, website };
    validateField(field, values[field as keyof typeof values] as string);
  };

  // Handle save
  const handleSave = async (): Promise<void> => {
    // Mark all as touched
    setTouched({
      phone: true,
      email: true,
      website: true,
    });

    // Validate all fields
    try {
      const validatedContact = contactSchema.parse({
        phone,
        email,
        website: website || undefined,
      });

      setIsSubmitting(true);

      // Call server action
      const result = await updateStudioContact({
        phone: validatedContact.phone,
        email: validatedContact.email,
        website: validatedContact.website || null,
      });

      if (result.success) {
        toast({
          title: 'Erfolgreich gespeichert',
          description: 'Kontaktdaten wurden aktualisiert.',
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
    phone.trim().length >= 10 &&
    email.trim().length > 0 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const isMobile = useMediaQuery('(max-width: 767px)');

  const content = (
    <>
      {/* Custom Header for Mobile */}
      {isMobile && (
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Kontakt bearbeiten</h2>
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

      <div className="space-y-6 py-6">
        {/* Phone */}
        <PhoneInput
          id="phone"
          name="phone"
          label="Telefonnummer"
          value={phone}
          onChange={setPhone}
          onBlur={() => handleBlur('phone')}
          error={touched.phone ? localErrors.phone : undefined}
          disabled={isSubmitting}
          required
        />

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email" className="after:content-['*'] after:ml-0.5 after:text-red-500">
            E-Mail-Adresse
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => handleBlur('email')}
            disabled={isSubmitting}
            required
            className={cn(
              touched.email && localErrors.email && 'border-red-500 focus:border-red-500 focus:ring-red-100'
            )}
            placeholder="kontakt@studio.de"
            aria-invalid={touched.email && !!localErrors.email}
            aria-describedby={touched.email && localErrors.email ? 'email-error' : undefined}
          />
          {touched.email && localErrors.email && (
            <p id="email-error" className="text-sm text-red-600" role="alert">
              {localErrors.email}
            </p>
          )}
        </div>

        {/* Website */}
        <div className="space-y-2">
          <Label htmlFor="website">Webseite (Optional)</Label>
          <Input
            id="website"
            name="website"
            type="url"
            autoComplete="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            onBlur={() => handleBlur('website')}
            disabled={isSubmitting}
            className={cn(
              touched.website && localErrors.website && 'border-red-500 focus:border-red-500 focus:ring-red-100'
            )}
            placeholder="https://www.deinstudio.de"
            aria-invalid={touched.website && !!localErrors.website}
            aria-describedby={touched.website && localErrors.website ? 'website-error' : undefined}
          />
          {touched.website && localErrors.website && (
            <p id="website-error" className="text-sm text-red-600" role="alert">
              {localErrors.website}
            </p>
          )}
        </div>
      </div>

      <div className={cn(
        "flex gap-2 mt-6",
        isMobile ? "sticky bottom-0 bg-[#F4EDE8] py-4 border-t -mx-6 px-6" : ""
      )}>
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
            <SheetTitle>Kontakt bearbeiten</SheetTitle>
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
          <DialogTitle>Kontakt bearbeiten</DialogTitle>
        </VisuallyHidden>
        {content}
      </DialogContent>
    </Dialog>
  );
}
