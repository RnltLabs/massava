'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { TimePickerSheet } from '../components/TimePickerSheet';
import { useStudioRegistration } from '../hooks/useStudioRegistration';
import { cn } from '@/lib/utils';
import type { OpeningHoursFormData } from '../validation/openingHoursSchema';

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

/**
 * Opening Hours Step - Step 4
 * Collects studio opening hours
 */
export function OpeningHoursStep(): React.JSX.Element {
  const {
    state,
    goToNextStep,
    setErrors,
    updateOpeningHours,
  } = useStudioRegistration();

  const [mode, setMode] = useState<'same' | 'different'>(
    state.formData.openingHours?.mode || 'same'
  );
  const [sameHours, setSameHours] = useState(state.formData.openingHours?.sameHours);
  const [differentHours, setDifferentHours] = useState<Record<DayKey, { open: string; close: string } | null>>(
    (state.formData.openingHours?.differentHours as Record<DayKey, { open: string; close: string } | null>) || {
      monday: null,
      tuesday: null,
      wednesday: null,
      thursday: null,
      friday: null,
      saturday: null,
      sunday: null,
    }
  );
  const [dayEnabled, setDayEnabled] = useState<Record<DayKey, boolean>>({
    monday: false,
    tuesday: false,
    wednesday: false,
    thursday: false,
    friday: false,
    saturday: false,
    sunday: false,
  });

  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<DayKey | 'same'>('same');

  // Initialize dayEnabled based on differentHours
  useEffect(() => {
    const enabled: Record<DayKey, boolean> = {
      monday: !!differentHours.monday,
      tuesday: !!differentHours.tuesday,
      wednesday: !!differentHours.wednesday,
      thursday: !!differentHours.thursday,
      friday: !!differentHours.friday,
      saturday: !!differentHours.saturday,
      sunday: !!differentHours.sunday,
    };
    setDayEnabled(enabled);
  }, [differentHours]);

  const openTimePicker = (day: DayKey | 'same'): void => {
    setSelectedDay(day);
    setTimePickerOpen(true);
  };

  const handleSaveTime = (hours: { open: string; close: string }): void => {
    if (selectedDay === 'same') {
      setSameHours(hours);
    } else {
      setDifferentHours((prev) => ({
        ...prev,
        [selectedDay]: hours,
      }));
    }
  };

  const handleToggleDay = (day: DayKey, enabled: boolean): void => {
    setDayEnabled((prev) => ({ ...prev, [day]: enabled }));
    if (!enabled) {
      // Clear hours when disabled
      setDifferentHours((prev) => ({ ...prev, [day]: null }));
    }
  };

  const handleContinue = (): void => {
    // Validate and prepare opening hours data
    let openingHoursData: OpeningHoursFormData | undefined;

    if (mode === 'same') {
      if (!sameHours) {
        setErrors({ openingHours: 'Bitte Öffnungszeiten festlegen' });
        return;
      }
      openingHoursData = {
        mode: 'same',
        sameHours,
      };
    } else {
      // Check if at least one day is enabled
      const hasAnyDay = Object.values(dayEnabled).some((enabled) => enabled);
      if (!hasAnyDay) {
        setErrors({ openingHours: 'Bitte mindestens einen Tag auswählen' });
        return;
      }

      openingHoursData = {
        mode: 'different',
        differentHours,
      };
    }

    // Save to context and move to next step
    updateOpeningHours(openingHoursData);
    setErrors({});
    goToNextStep();
  };

  const formatTimeRange = (hours: { open: string; close: string }): string => {
    return `${hours.open} - ${hours.close}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">Öffnungszeiten</h2>
        <p className="text-sm text-gray-600">Wann hat Ihr Studio geöffnet?</p>
      </div>

      {/* Mode Selection */}
      <div className="space-y-3">
        {/* Same Hours Every Day */}
        <button
          type="button"
          onClick={() => setMode('same')}
          className={cn(
            'w-full p-4 rounded-xl border-2 transition-all text-left',
            mode === 'same'
              ? 'border-[#B56550] bg-[#B56550]/5'
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          )}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900">Gleiche Zeiten jeden Tag</p>
              <p className="text-sm text-gray-600 mt-1">
                Ihr Studio hat immer die gleichen Öffnungszeiten
              </p>
            </div>
            <div
              className={cn(
                'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                mode === 'same' ? 'border-[#B56550]' : 'border-gray-300'
              )}
            >
              {mode === 'same' && (
                <div className="w-3 h-3 rounded-full bg-[#B56550]" />
              )}
            </div>
          </div>
        </button>

        {/* Different Hours */}
        <button
          type="button"
          onClick={() => setMode('different')}
          className={cn(
            'w-full p-4 rounded-xl border-2 transition-all text-left',
            mode === 'different'
              ? 'border-[#B56550] bg-[#B56550]/5'
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          )}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900">Unterschiedliche Zeiten</p>
              <p className="text-sm text-gray-600 mt-1">
                Verschiedene Öffnungszeiten für jeden Tag
              </p>
            </div>
            <div
              className={cn(
                'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                mode === 'different' ? 'border-[#B56550]' : 'border-gray-300'
              )}
            >
              {mode === 'different' && (
                <div className="w-3 h-3 rounded-full bg-[#B56550]" />
              )}
            </div>
          </div>
        </button>
      </div>

      {/* Hours Configuration */}
      {mode === 'same' ? (
        /* Same Hours Card */
        <button
          type="button"
          onClick={() => openTimePicker('same')}
          className={cn(
            'w-full p-4 rounded-xl border-2 transition-all text-left',
            'border-gray-200 hover:border-[#B56550] hover:bg-gray-50'
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-gray-500" />
              <div>
                <p className="font-medium text-gray-900">Jeden Tag</p>
                {sameHours && (
                  <p className="text-sm text-gray-600 mt-0.5">
                    {formatTimeRange(sameHours)}
                  </p>
                )}
              </div>
            </div>
            {!sameHours && (
              <p className="text-sm text-gray-500">Antippen um festzulegen</p>
            )}
          </div>
        </button>
      ) : (
        /* Different Hours - Day Cards */
        <div className="space-y-2">
          {DAYS.map((day) => (
            <div
              key={day.key}
              className={cn(
                'p-4 rounded-xl border-2 transition-all',
                dayEnabled[day.key]
                  ? 'border-gray-200 bg-white'
                  : 'border-gray-100 bg-gray-50'
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <Label
                  htmlFor={`day-${day.key}`}
                  className="font-medium text-gray-900 cursor-pointer"
                >
                  {day.label}
                </Label>
                <Switch
                  id={`day-${day.key}`}
                  checked={dayEnabled[day.key]}
                  onCheckedChange={(checked) => handleToggleDay(day.key, checked)}
                  className="data-[state=checked]:bg-[#B56550]"
                />
              </div>
              {dayEnabled[day.key] && (
                <button
                  type="button"
                  onClick={() => openTimePicker(day.key)}
                  className="w-full mt-2 p-3 rounded-lg border border-gray-200 hover:border-[#B56550] hover:bg-gray-50 transition-all text-left"
                >
                  {differentHours[day.key] ? (
                    <p className="text-sm text-gray-700">
                      {formatTimeRange(differentHours[day.key]!)}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500">Zeiten festlegen</p>
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Submit Error */}
      {state.errors.submit && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200">
          <p className="text-sm text-red-600">{state.errors.submit}</p>
        </div>
      )}

      {state.errors.openingHours && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200">
          <p className="text-sm text-red-600">{state.errors.openingHours}</p>
        </div>
      )}

      {/* Continue Button */}
      <Button
        onClick={handleContinue}
        style={{ backgroundColor: '#B56550' }}
        className="w-full h-12 text-white font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98] hover:opacity-90"
      >
        Weiter
      </Button>

      {/* Skip Button */}
      <div className="text-center space-y-2">
        <button
          type="button"
          onClick={goToNextStep}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors underline"
        >
          Jetzt überspringen
        </button>
        <p className="text-xs text-gray-400">
          Sie können die Öffnungszeiten später jederzeit ändern
        </p>
      </div>

      {/* Time Picker Sheet */}
      <TimePickerSheet
        isOpen={timePickerOpen}
        onClose={() => setTimePickerOpen(false)}
        onSave={handleSaveTime}
        dayName={selectedDay === 'same' ? undefined : DAYS.find((d) => d.key === selectedDay)?.label}
        initialHours={
          selectedDay === 'same'
            ? sameHours
            : (differentHours[selectedDay as DayKey] || undefined)
        }
      />
    </motion.div>
  );
}
