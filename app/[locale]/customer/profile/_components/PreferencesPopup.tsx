/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Customer Preferences Popup
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { useMediaQuery } from '@/hooks/use-media-query';
import { customerPreferencesSchema } from '@/lib/schemas/customer.schema';
import { cn } from '@/lib/utils';
import { updateCustomerPreferences } from '@/app/[locale]/customer/actions/profile';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PreferencesPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData: {
    language: 'de' | 'en';
    emailNotifications: {
      bookingConfirmed: boolean;
      bookingReminder: boolean;
      bookingCancelled: boolean;
      marketing: boolean;
    };
  };
}

export function PreferencesPopup({
  open,
  onOpenChange,
  initialData,
}: PreferencesPopupProps): React.JSX.Element {
  const { toast } = useToast();
  const router = useRouter();

  const [language, setLanguage] = useState<'de' | 'en'>(initialData.language);
  const [emailNotifications, setEmailNotifications] = useState(
    initialData.emailNotifications
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle notification toggle
  const handleNotificationToggle = (
    key: keyof typeof emailNotifications
  ): void => {
    setEmailNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Handle save
  const handleSave = async (): Promise<void> => {
    try {
      const validated = customerPreferencesSchema.parse({
        language,
        emailNotifications,
      });

      setIsSubmitting(true);

      // Call server action
      const result = await updateCustomerPreferences(validated);

      if (result.success) {
        toast({
          title: 'Erfolgreich gespeichert',
          description: 'Einstellungen wurden aktualisiert.',
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
      toast({
        title: 'Fehler',
        description: 'Ungültige Einstellungen.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isMobile = useMediaQuery('(max-width: 767px)');

  const content = (
    <>
      {/* Custom Header for Mobile */}
      {isMobile && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Einstellungen</h2>
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

      <div className="space-y-6">
        {/* Language Selection */}
        <div className="space-y-2">
          <Label htmlFor="language" className="text-sm font-medium">
            Sprache
          </Label>
          <Select
            value={language}
            onValueChange={(value) => setLanguage(value as 'de' | 'en')}
            disabled={isSubmitting}
          >
            <SelectTrigger id="language" className="w-full">
              <SelectValue placeholder="Sprache wählen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="de">Deutsch</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Email Notifications Section */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold mb-1">
              E-Mail-Benachrichtigungen
            </h3>
            <p className="text-xs text-gray-600">
              Wähle, welche Benachrichtigungen du erhalten möchtest
            </p>
          </div>

          {/* Booking Confirmed */}
          <div className="flex items-center justify-between py-2">
            <div className="flex-1">
              <Label
                htmlFor="notif-confirmed"
                className="text-sm font-medium cursor-pointer"
              >
                Buchungsbestätigung
              </Label>
              <p className="text-xs text-gray-600">
                Bei erfolgreicher Buchung
              </p>
            </div>
            <Switch
              id="notif-confirmed"
              checked={emailNotifications.bookingConfirmed}
              onCheckedChange={() =>
                handleNotificationToggle('bookingConfirmed')
              }
              disabled={isSubmitting}
            />
          </div>

          {/* Booking Reminder */}
          <div className="flex items-center justify-between py-2">
            <div className="flex-1">
              <Label
                htmlFor="notif-reminder"
                className="text-sm font-medium cursor-pointer"
              >
                Erinnerungen
              </Label>
              <p className="text-xs text-gray-600">
                24h vor deinem Termin
              </p>
            </div>
            <Switch
              id="notif-reminder"
              checked={emailNotifications.bookingReminder}
              onCheckedChange={() =>
                handleNotificationToggle('bookingReminder')
              }
              disabled={isSubmitting}
            />
          </div>

          {/* Booking Cancelled */}
          <div className="flex items-center justify-between py-2">
            <div className="flex-1">
              <Label
                htmlFor="notif-cancelled"
                className="text-sm font-medium cursor-pointer"
              >
                Stornierungen
              </Label>
              <p className="text-xs text-gray-600">
                Bei Absage eines Termins
              </p>
            </div>
            <Switch
              id="notif-cancelled"
              checked={emailNotifications.bookingCancelled}
              onCheckedChange={() =>
                handleNotificationToggle('bookingCancelled')
              }
              disabled={isSubmitting}
            />
          </div>

          {/* Marketing */}
          <div className="flex items-center justify-between py-2">
            <div className="flex-1">
              <Label
                htmlFor="notif-marketing"
                className="text-sm font-medium cursor-pointer"
              >
                Marketing & Angebote
              </Label>
              <p className="text-xs text-gray-600">
                Neuigkeiten und Rabatte
              </p>
            </div>
            <Switch
              id="notif-marketing"
              checked={emailNotifications.marketing}
              onCheckedChange={() => handleNotificationToggle('marketing')}
              disabled={isSubmitting}
            />
          </div>
        </div>
      </div>

      <div
        className={cn(
          'flex gap-2 mt-6',
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
          disabled={isSubmitting}
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
            <SheetTitle>Einstellungen</SheetTitle>
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
          <DialogTitle>Einstellungen</DialogTitle>
        </VisuallyHidden>
        {content}
      </DialogContent>
    </Dialog>
  );
}
