/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

'use client';

import React, { useState } from 'react';
import { Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { useMediaQuery } from '@/hooks/use-media-query';
import { TimePickerSheet } from '@/app/[locale]/dashboard/_components/studio-registration/components/TimePickerSheet';
import { cn } from '@/lib/utils';
import { updateOpeningHours } from '@/app/[locale]/business/actions/profile';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

type DayKey = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

const DAYS: { key: DayKey; label: string }[] = [
  { key: 'monday', label: 'Montag' },
  { key: 'tuesday', label: 'Dienstag' },
  { key: 'wednesday', label: 'Mittwoch' },
  { key: 'thursday', label: 'Donnerstag' },
  { key: 'friday', label: 'Freitag' },
  { key: 'saturday', label: 'Samstag' },
  { key: 'sunday', label: 'Sonntag' },
];

interface OpeningHoursPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData: Record<string, { open: string; close: string } | null>;
}

export function OpeningHoursPopup({ open, onOpenChange, initialData }: OpeningHoursPopupProps): React.JSX.Element {
  const { toast } = useToast();
  const router = useRouter();

  const [openingHours, setOpeningHours] = useState<Record<DayKey, { open: string; close: string } | null>>(
    initialData as Record<DayKey, { open: string; close: string } | null>
  );
  const [dayEnabled, setDayEnabled] = useState<Record<DayKey, boolean>>({
    monday: !!initialData.monday,
    tuesday: !!initialData.tuesday,
    wednesday: !!initialData.wednesday,
    thursday: !!initialData.thursday,
    friday: !!initialData.friday,
    saturday: !!initialData.saturday,
    sunday: !!initialData.sunday,
  });

  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<DayKey>('monday');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openTimePicker = (day: DayKey): void => {
    setSelectedDay(day);
    setTimePickerOpen(true);
  };

  const handleSaveTime = (hours: { open: string; close: string }): void => {
    setOpeningHours((prev) => ({
      ...prev,
      [selectedDay]: hours,
    }));
  };

  const handleToggleDay = (day: DayKey, enabled: boolean): void => {
    setDayEnabled((prev) => ({ ...prev, [day]: enabled }));
    if (!enabled) {
      // Clear hours when disabled
      setOpeningHours((prev) => ({ ...prev, [day]: null }));
    }
  };

  const handleSave = async (): Promise<void> => {
    // Check if at least one day is enabled
    const hasAnyDay = Object.values(dayEnabled).some((enabled) => enabled);
    if (!hasAnyDay) {
      toast({
        title: 'Fehler',
        description: 'Bitte mindestens einen Tag auswählen',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await updateOpeningHours({
        openingHours: openingHours as Record<string, { open: string; close: string } | null>,
      });

      if (result.success) {
        toast({
          title: 'Erfolgreich gespeichert',
          description: 'Öffnungszeiten wurden aktualisiert.',
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
    } catch (error) {
      console.error('Save opening hours error:', error);
      toast({
        title: 'Fehler',
        description: 'Ein unerwarteter Fehler ist aufgetreten.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimeRange = (hours: { open: string; close: string }): string => {
    return `${hours.open} - ${hours.close}`;
  };

  const isMobile = useMediaQuery('(max-width: 767px)');

  const content = (
    <>
      {/* Custom Header for Mobile */}
      {isMobile && (
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Öffnungszeiten bearbeiten</h2>
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

      <div className="space-y-4 py-6">
            {/* Different Hours - Day Cards */}
            <div className="space-y-2">
              {DAYS.map((day) => (
                <div
                  key={day.key}
                  className={cn(
                    'p-3 rounded-lg border-2 transition-all',
                    dayEnabled[day.key]
                      ? 'border-gray-200 bg-white'
                      : 'border-gray-100 bg-gray-50'
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Label
                      htmlFor={`day-${day.key}`}
                      className="text-sm font-medium text-gray-900 cursor-pointer"
                    >
                      {day.label}
                    </Label>
                    <Switch
                      id={`day-${day.key}`}
                      checked={dayEnabled[day.key]}
                      onCheckedChange={(checked) => handleToggleDay(day.key, checked)}
                      className="data-[state=checked]:bg-primary"
                    />
                  </div>
                  {dayEnabled[day.key] && (
                    <button
                      type="button"
                      onClick={() => openTimePicker(day.key)}
                      className="w-full mt-1 p-2.5 rounded-lg border border-gray-200 hover:border-primary hover:bg-gray-50 transition-all text-left"
                    >
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        {openingHours[day.key] ? (
                          <p className="text-sm text-gray-700">
                            {formatTimeRange(openingHours[day.key]!)}
                          </p>
                        ) : (
                          <p className="text-sm text-gray-500">Zeiten festlegen</p>
                        )}
                      </div>
                    </button>
                  )}
                </div>
              ))}
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

  const sheetOrDialog = isMobile ? (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        style={{ backgroundColor: '#F4EDE8' }}
        className="h-[80vh] rounded-t-3xl p-6 overflow-y-auto"
        showCloseButton={false}
      >
        <VisuallyHidden>
          <SheetTitle>Öffnungszeiten bearbeiten</SheetTitle>
        </VisuallyHidden>
        {content}
      </SheetContent>
    </Sheet>
  ) : (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        style={{ backgroundColor: '#F4EDE8' }}
        className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto"
        showCloseButton={false}
      >
        <VisuallyHidden>
          <DialogTitle>Öffnungszeiten bearbeiten</DialogTitle>
        </VisuallyHidden>
        {content}
      </DialogContent>
    </Dialog>
  );

  return (
    <>
      {sheetOrDialog}

      {/* Time Picker Sheet */}
      <TimePickerSheet
        isOpen={timePickerOpen}
        onClose={() => setTimePickerOpen(false)}
        onSave={handleSaveTime}
        dayName={DAYS.find((d) => d.key === selectedDay)?.label}
        initialHours={openingHours[selectedDay] || undefined}
      />
    </>
  );
}
