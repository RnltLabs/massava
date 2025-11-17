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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { updatePreferences, exportUserData } from '@/app/[locale]/business/actions/account';
import { Loader2Icon, GlobeIcon, ClockIcon, CalendarIcon, DownloadIcon, FileTextIcon, X } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface UserPreferences {
  language: 'de' | 'en';
  timezone: string;
  dateFormat: 'DD.MM.YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
}

interface PrivacyPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPreferences: UserPreferences;
  locale: string;
}

export function PrivacyPopup({
  open,
  onOpenChange,
  currentPreferences,
  locale,
}: PrivacyPopupProps): React.JSX.Element {
  const [preferences, setPreferences] = useState<UserPreferences>(currentPreferences);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  // Reset preferences when popup opens
  React.useEffect(() => {
    if (open) {
      setPreferences(currentPreferences);
    }
  }, [open, currentPreferences]);

  const commonTimezones = [
    'Europe/Berlin',
    'Europe/London',
    'Europe/Paris',
    'Europe/Vienna',
    'Europe/Zurich',
    'America/New_York',
    'America/Los_Angeles',
    'Asia/Tokyo',
    'Australia/Sydney',
  ];

  const handleSave = async () => {
    setIsLoading(true);

    const result = await updatePreferences(preferences);

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

  const handleExportData = async () => {
    setIsExporting(true);

    const result = await exportUserData();

    if (result.success && result.data) {
      // Convert data to JSON and download
      const dataStr = JSON.stringify(result.data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `massava-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'Daten exportiert',
        description: 'Ihre Daten wurden erfolgreich heruntergeladen',
      });
    } else {
      toast({
        title: 'Fehler',
        description: (result as { error: string }).error,
        variant: 'destructive',
      });
    }

    setIsExporting(false);
  };

  const isMobile = useMediaQuery('(max-width: 767px)');

  const content = (
    <>
      {/* Custom Header for Mobile */}
      {isMobile && (
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Datenschutz & Präferenzen</h2>
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
          {/* Preferences Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">
              Persönliche Einstellungen
            </h3>

            {/* Language */}
            <div className="space-y-2">
              <Label htmlFor="language" className="flex items-center gap-2">
                <GlobeIcon className="h-4 w-4 text-gray-400" />
                <span>Sprache</span>
              </Label>
              <Select
                value={preferences.language}
                onValueChange={(value: 'de' | 'en') =>
                  setPreferences((prev) => ({ ...prev, language: value }))
                }
                disabled={isLoading}
              >
                <SelectTrigger id="language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="de">Deutsch</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Timezone */}
            <div className="space-y-2">
              <Label htmlFor="timezone" className="flex items-center gap-2">
                <ClockIcon className="h-4 w-4 text-gray-400" />
                <span>Zeitzone</span>
              </Label>
              <Select
                value={preferences.timezone}
                onValueChange={(value) =>
                  setPreferences((prev) => ({ ...prev, timezone: value }))
                }
                disabled={isLoading}
              >
                <SelectTrigger id="timezone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <div className="px-2 py-1.5 text-xs font-semibold text-gray-500">
                    Häufig verwendet
                  </div>
                  {commonTimezones.map((tz) => (
                    <SelectItem key={tz} value={tz}>
                      {tz.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Format */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-gray-400" />
                <span>Datumsformat</span>
              </Label>
              <RadioGroup
                value={preferences.dateFormat}
                onValueChange={(value: 'DD.MM.YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD') =>
                  setPreferences((prev) => ({ ...prev, dateFormat: value }))
                }
                disabled={isLoading}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="DD.MM.YYYY" id="date-eu" />
                  <Label htmlFor="date-eu" className="font-normal cursor-pointer">
                    DD.MM.YYYY (Europäisch) - z.B. 15.03.2024
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="MM/DD/YYYY" id="date-us" />
                  <Label htmlFor="date-us" className="font-normal cursor-pointer">
                    MM/DD/YYYY (US) - z.B. 03/15/2024
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="YYYY-MM-DD" id="date-iso" />
                  <Label htmlFor="date-iso" className="font-normal cursor-pointer">
                    YYYY-MM-DD (ISO) - z.B. 2024-03-15
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <Separator />

          {/* Data Export Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">
              Datenexport (DSGVO)
            </h3>
            <div className="flex items-start justify-between py-3 border border-gray-200 rounded-lg px-4">
              <div className="flex-1 pr-4">
                <h4 className="text-sm font-medium text-gray-900 mb-1">
                  Meine Daten exportieren
                </h4>
                <p className="text-sm text-gray-600">
                  Laden Sie eine Kopie Ihrer Studio-Daten herunter
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportData}
                disabled={isExporting}
                className="flex-shrink-0"
              >
                {isExporting ? (
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <DownloadIcon className="mr-2 h-4 w-4" />
                )}
                Exportieren
              </Button>
            </div>
          </div>

          <Separator />

          {/* Legal Links */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <FileTextIcon className="h-4 w-4 text-gray-400" />
              <span>Rechtliche Dokumente</span>
            </h3>
            <div className="flex flex-col gap-2">
              <Link
                href={`/${locale}/datenschutz`}
                className="text-sm text-[#B56550] hover:text-[#A05540] hover:underline transition-colors"
                target="_blank"
              >
                Datenschutzerklärung
              </Link>
              <Link
                href={`/${locale}/terms`}
                className="text-sm text-[#B56550] hover:text-[#A05540] hover:underline transition-colors"
                target="_blank"
              >
                Nutzungsbedingungen
              </Link>
            </div>
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
            <SheetTitle>Datenschutz & Präferenzen</SheetTitle>
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
        className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto"
        showCloseButton={false}
      >
        <VisuallyHidden>
          <DialogTitle>Datenschutz & Präferenzen</DialogTitle>
        </VisuallyHidden>
        {content}
      </DialogContent>
    </Dialog>
  );
}
