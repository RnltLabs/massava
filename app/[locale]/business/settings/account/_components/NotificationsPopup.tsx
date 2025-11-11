/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { useMediaQuery } from '@/hooks/use-media-query';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { updateNotificationSettings } from '@/app/[locale]/business/actions/account';
import { Loader2Icon, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotificationSettings {
  bookings: boolean;
  cancellations: boolean;
  reminders: boolean;
  marketing: boolean;
}

interface NotificationsPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialSettings: NotificationSettings;
}

export function NotificationsPopup({
  open,
  onOpenChange,
  initialSettings,
}: NotificationsPopupProps): React.JSX.Element {
  const [settings, setSettings] = useState<NotificationSettings>(initialSettings);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Reset settings when popup opens
  React.useEffect(() => {
    if (open) {
      setSettings(initialSettings);
    }
  }, [open, initialSettings]);

  const handleToggle = (key: keyof NotificationSettings) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);

    const result = await updateNotificationSettings(settings);

    if (result.success) {
      toast({
        title: 'Einstellungen gespeichert',
        description: result.message,
      });
      onOpenChange(false);
    } else {
      toast({
        title: 'Fehler',
        description: result.error,
        variant: 'destructive',
      });
    }

    setIsLoading(false);
  };

  const isMobile = useMediaQuery('(max-width: 767px)');

  const content = (
    <>
      {/* Custom Header for Mobile */}
      {isMobile && (
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">E-Mail-Benachrichtigungen</h2>
          <button
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="p-2 -mr-2 text-gray-500 hover:text-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Schließen"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      <div className="mt-6 space-y-6">
          {/* Booking Confirmations */}
          <div className="flex items-start justify-between py-3 border-b border-gray-100 last:border-0">
            <div className="flex-1 pr-4">
              <Label
                htmlFor="bookings"
                className="text-sm font-medium text-gray-900 cursor-pointer"
              >
                Buchungsbestätigungen
              </Label>
              <p className="text-sm text-gray-600 mt-0.5">
                Wenn eine neue Buchung eingeht
              </p>
            </div>
            <Switch
              id="bookings"
              checked={settings.bookings}
              onCheckedChange={() => handleToggle('bookings')}
              disabled={isLoading}
            />
          </div>

          {/* Booking Cancellations */}
          <div className="flex items-start justify-between py-3 border-b border-gray-100 last:border-0">
            <div className="flex-1 pr-4">
              <Label
                htmlFor="cancellations"
                className="text-sm font-medium text-gray-900 cursor-pointer"
              >
                Stornierungen
              </Label>
              <p className="text-sm text-gray-600 mt-0.5">
                Wenn ein Kunde eine Buchung storniert
              </p>
            </div>
            <Switch
              id="cancellations"
              checked={settings.cancellations}
              onCheckedChange={() => handleToggle('cancellations')}
              disabled={isLoading}
            />
          </div>

          {/* Booking Reminders */}
          <div className="flex items-start justify-between py-3 border-b border-gray-100 last:border-0">
            <div className="flex-1 pr-4">
              <Label
                htmlFor="reminders"
                className="text-sm font-medium text-gray-900 cursor-pointer"
              >
                Erinnerungen
              </Label>
              <p className="text-sm text-gray-600 mt-0.5">
                24 Stunden vor einem Termin
              </p>
            </div>
            <Switch
              id="reminders"
              checked={settings.reminders}
              onCheckedChange={() => handleToggle('reminders')}
              disabled={isLoading}
            />
          </div>

          {/* Marketing Emails */}
          <div className="flex items-start justify-between py-3">
            <div className="flex-1 pr-4">
              <Label
                htmlFor="marketing"
                className="text-sm font-medium text-gray-900 cursor-pointer"
              >
                Marketing
              </Label>
              <p className="text-sm text-gray-600 mt-0.5">
                Tipps, Updates und Angebote von Massava
              </p>
            </div>
            <Switch
              id="marketing"
              checked={settings.marketing}
              onCheckedChange={() => handleToggle('marketing')}
              disabled={isLoading}
            />
          </div>
        </div>

        <div className={cn(
          "flex gap-2 mt-6",
          isMobile ? "sticky bottom-0 bg-[#F4EDE8] py-4 border-t -mx-6 px-6" : ""
        )}>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="flex-1"
          >
            Abbrechen
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="flex-1 bg-[#B56550] hover:bg-[#A05540] text-white"
          >
            {isLoading && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
            Speichern
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
            <SheetTitle>E-Mail-Benachrichtigungen</SheetTitle>
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
          <DialogTitle>E-Mail-Benachrichtigungen</DialogTitle>
        </VisuallyHidden>
        {content}
      </DialogContent>
    </Dialog>
  );
}
