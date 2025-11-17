'use client';

import React, { useState } from 'react';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface TimePickerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (hours: { open: string; close: string }) => void;
  dayName?: string;
  initialHours?: { open: string; close: string };
}

const PRESET_OPENING_TIMES = ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00'];
const PRESET_CLOSING_TIMES = ['17:00', '18:00', '19:00', '20:00', '21:00', '22:00'];

/**
 * TimePickerSheet Component
 * Sheet for selecting opening and closing times
 */
export function TimePickerSheet({
  isOpen,
  onClose,
  onSave,
  dayName,
  initialHours,
}: TimePickerSheetProps): React.JSX.Element {
  const [openingTime, setOpeningTime] = useState(initialHours?.open || '');
  const [closingTime, setClosingTime] = useState(initialHours?.close || '');
  const [error, setError] = useState('');

  const handleSave = (): void => {
    // Validate
    if (!openingTime || !closingTime) {
      setError('Bitte wählen Sie beide Zeiten aus');
      return;
    }

    if (closingTime <= openingTime) {
      setError('Schließzeit muss nach Öffnungszeit liegen');
      return;
    }

    onSave({ open: openingTime, close: closingTime });
    handleClose();
  };

  const handleClose = (): void => {
    setError('');
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="h-auto max-h-[90vh] rounded-t-3xl p-6 bg-white">
        <SheetTitle className="text-xl font-bold text-gray-900 mb-2">
          Öffnungszeiten festlegen
        </SheetTitle>
        {dayName && (
          <SheetDescription className="text-sm text-gray-600 mb-6">
            für {dayName}
          </SheetDescription>
        )}

        <div className="space-y-6">
          {/* Opening Time */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-gray-700">Öffnungszeit</Label>

            {/* Preset Buttons */}
            <div className="grid grid-cols-3 gap-2">
              {PRESET_OPENING_TIMES.map((time) => (
                <button
                  key={time}
                  type="button"
                  onClick={() => {
                    setOpeningTime(time);
                    setError('');
                  }}
                  className={cn(
                    'px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
                    'border-2',
                    openingTime === time
                      ? 'border-[#B56550] bg-[#B56550] text-white shadow-md'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                  )}
                >
                  {time}
                </button>
              ))}
            </div>

            {/* Custom Time Input */}
            <div className="space-y-2">
              <Label htmlFor="custom-opening" className="text-xs text-gray-500">
                Oder benutzerdefinierte Zeit:
              </Label>
              <Input
                id="custom-opening"
                type="time"
                value={openingTime}
                onChange={(e) => {
                  setOpeningTime(e.target.value);
                  setError('');
                }}
                className="focus:border-[#B56550] focus:ring-2 focus:ring-[#B56550]/20"
              />
            </div>
          </div>

          {/* Closing Time */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-gray-700">Schließzeit</Label>

            {/* Preset Buttons */}
            <div className="grid grid-cols-3 gap-2">
              {PRESET_CLOSING_TIMES.map((time) => (
                <button
                  key={time}
                  type="button"
                  onClick={() => {
                    setClosingTime(time);
                    setError('');
                  }}
                  className={cn(
                    'px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
                    'border-2',
                    closingTime === time
                      ? 'border-[#B56550] bg-[#B56550] text-white shadow-md'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                  )}
                >
                  {time}
                </button>
              ))}
            </div>

            {/* Custom Time Input */}
            <div className="space-y-2">
              <Label htmlFor="custom-closing" className="text-xs text-gray-500">
                Oder benutzerdefinierte Zeit:
              </Label>
              <Input
                id="custom-closing"
                type="time"
                value={closingTime}
                onChange={(e) => {
                  setClosingTime(e.target.value);
                  setError('');
                }}
                className="focus:border-[#B56550] focus:ring-2 focus:ring-[#B56550]/20"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1 h-12 rounded-xl border-2 border-gray-200 hover:bg-gray-50"
            >
              Abbrechen
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              style={{ backgroundColor: '#B56550' }}
              className="flex-1 h-12 text-white font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98] hover:opacity-90"
            >
              Speichern
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
