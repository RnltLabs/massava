/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { useMediaQuery } from '@/hooks/use-media-query';
import { basicInfoSchema, type BasicInfoFormData } from '@/app/[locale]/dashboard/_components/studio-registration/validation/studioSchemas';
import { cn } from '@/lib/utils';
import { updateStudioBasicInfo } from '@/app/[locale]/business/actions/profile';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface BasicInfoPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData: {
    name: string;
    description: string;
  };
}

export function BasicInfoPopup({ open, onOpenChange, initialData }: BasicInfoPopupProps): React.JSX.Element {
  const { toast } = useToast();
  const router = useRouter();

  const [name, setName] = useState(initialData.name || '');
  const [description, setDescription] = useState(initialData.description || '');
  const [touched, setTouched] = useState({ name: false, description: false });
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Character limits
  const NAME_MAX = 100;
  const DESCRIPTION_MAX = 500;

  // Validate field
  const validateField = (field: 'name' | 'description', value: string): void => {
    try {
      if (field === 'name') {
        basicInfoSchema.shape.name.parse(value);
        setLocalErrors((prev) => ({ ...prev, name: '' }));
      } else {
        basicInfoSchema.shape.description.parse(value);
        setLocalErrors((prev) => ({ ...prev, description: '' }));
      }
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'errors' in error) {
        const zodError = error as { errors: Array<{ message: string }> };
        const message = zodError.errors[0]?.message || 'Invalid value';
        setLocalErrors((prev) => ({ ...prev, [field]: message }));
      }
    }
  };

  // Handle blur
  const handleBlur = (field: 'name' | 'description'): void => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field, field === 'name' ? name : description);
  };

  // Handle save
  const handleSave = async (): Promise<void> => {
    // Mark all as touched
    setTouched({ name: true, description: true });

    // Validate all fields
    try {
      const validated = basicInfoSchema.parse({ name, description });

      setIsSubmitting(true);

      // Call server action
      const result = await updateStudioBasicInfo({
        name: validated.name,
        description: validated.description,
      });

      if (result.success) {
        toast({
          title: 'Erfolgreich gespeichert',
          description: 'Studio-Informationen wurden aktualisiert.',
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

  const isValid = name.trim().length >= 3 && description.trim().length >= 10;

  const isMobile = useMediaQuery('(max-width: 767px)');

  const content = (
    <>
      {/* Custom Header for Mobile */}
      {isMobile && (
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Grundinformationen bearbeiten</h2>
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

      <div className="space-y-4 py-4">
          {/* Studio Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="after:content-['*'] after:ml-0.5 after:text-red-500">
              Studio-Name
            </Label>
            <Input
              id="name"
              name="name"
              type="text"
              autoComplete="organization"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => handleBlur('name')}
              maxLength={NAME_MAX}
              required
              disabled={isSubmitting}
              className={cn(
                'transition-colors',
                touched.name && localErrors.name && 'border-red-500 focus:border-red-500 focus:ring-red-100'
              )}
              placeholder="z.B. Serenity Wellness Studio"
              aria-invalid={touched.name && !!localErrors.name}
              aria-describedby={touched.name && localErrors.name ? 'name-error' : 'name-hint'}
            />
            <div className="flex justify-between items-start">
              {touched.name && localErrors.name ? (
                <p id="name-error" className="text-sm text-red-600" role="alert">
                  {localErrors.name}
                </p>
              ) : (
                <p id="name-hint" className="text-sm text-gray-500">
                  Wird Kunden angezeigt
                </p>
              )}
              <p className={cn(
                'text-sm',
                name.length > NAME_MAX * 0.9 ? 'text-orange-600' : 'text-gray-400'
              )}>
                {name.length}/{NAME_MAX}
              </p>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="after:content-['*'] after:ml-0.5 after:text-red-500">
              Beschreibung
            </Label>
            <Textarea
              id="description"
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => handleBlur('description')}
              maxLength={DESCRIPTION_MAX}
              rows={4}
              required
              disabled={isSubmitting}
              className={cn(
                'transition-colors resize-none',
                touched.description && localErrors.description && 'border-red-500 focus:border-red-500 focus:ring-red-100'
              )}
              placeholder="Beschreibe dein Studio, deine Services und was dich besonders macht..."
              aria-invalid={touched.description && !!localErrors.description}
              aria-describedby={touched.description && localErrors.description ? 'description-error' : 'description-hint'}
            />
            <div className="flex justify-between items-start">
              {touched.description && localErrors.description ? (
                <p id="description-error" className="text-sm text-red-600" role="alert">
                  {localErrors.description}
                </p>
              ) : (
                <p id="description-hint" className="text-sm text-gray-500">
                  Hebe deine Spezialitäten und besonderen Angebote hervor
                </p>
              )}
              <p className={cn(
                'text-sm',
                description.length > DESCRIPTION_MAX * 0.9 ? 'text-orange-600' : 'text-gray-400'
              )}>
                {description.length}/{DESCRIPTION_MAX}
              </p>
            </div>
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
            <SheetTitle>Grundinformationen bearbeiten</SheetTitle>
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
          <DialogTitle>Grundinformationen bearbeiten</DialogTitle>
        </VisuallyHidden>
        <DialogHeader>
          <DialogTitle>Grundinformationen bearbeiten</DialogTitle>
          <DialogDescription>
            Ändere den Namen und die Beschreibung deines Studios
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
