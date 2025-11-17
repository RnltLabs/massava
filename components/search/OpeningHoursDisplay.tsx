/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Opening Hours Display Component
 * Formats and displays opening hours in a user-friendly format like Google Maps
 */

'use client';

import React from 'react';
import { ClockIcon } from 'lucide-react';

interface DaySchedule {
  open?: string;
  close?: string;
  closed?: boolean;
}

type DayValue = DaySchedule | string;

interface OpeningHoursData {
  monday?: DayValue;
  tuesday?: DayValue;
  wednesday?: DayValue;
  thursday?: DayValue;
  friday?: DayValue;
  saturday?: DayValue;
  sunday?: DayValue;
}

interface OpeningHoursDisplayProps {
  openingHours: unknown;
}

const DAY_NAMES: Record<string, string> = {
  monday: 'Montag',
  tuesday: 'Dienstag',
  wednesday: 'Mittwoch',
  thursday: 'Donnerstag',
  friday: 'Freitag',
  saturday: 'Samstag',
  sunday: 'Sonntag',
};

const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

/**
 * Formats time from "HH:mm" to "HH:mm" (ensures consistent format)
 */
const formatTime = (time: string): string => {
  if (!time) return '';
  // Remove any seconds if present
  const parts = time.split(':');
  if (parts.length >= 2) {
    return `${parts[0]}:${parts[1]}`;
  }
  return time;
};

/**
 * Parses opening hours string format (e.g., "09:00-21:00") to DaySchedule
 */
const parseTimeString = (value: string): DaySchedule | null => {
  if (!value || typeof value !== 'string') return null;

  // Check if closed
  if (value.toLowerCase().includes('geschlossen') || value.toLowerCase().includes('closed')) {
    return { closed: true };
  }

  // Parse "HH:mm-HH:mm" format
  const match = value.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
  if (match) {
    return {
      open: match[1],
      close: match[2],
    };
  }

  return null;
};

/**
 * Normalizes day value to DaySchedule format
 */
const normalizeDayValue = (value: DayValue | undefined): DaySchedule | null => {
  if (!value) return null;

  // Already in object format
  if (typeof value === 'object') {
    return value as DaySchedule;
  }

  // String format - parse it
  if (typeof value === 'string') {
    return parseTimeString(value);
  }

  return null;
};

/**
 * Checks if opening hours data is valid
 */
const isValidOpeningHours = (data: unknown): data is OpeningHoursData => {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;

  // Check if at least one day exists
  return DAY_ORDER.some((day) => day in obj);
};

export function OpeningHoursDisplay({ openingHours }: OpeningHoursDisplayProps): React.JSX.Element {
  if (!isValidOpeningHours(openingHours)) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <ClockIcon className="h-4 w-4" />
          Öffnungszeiten
        </h3>
        <p className="text-sm text-muted-foreground">Keine Öffnungszeiten verfügbar</p>
      </div>
    );
  }

  const hours = openingHours as OpeningHoursData;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
        <ClockIcon className="h-4 w-4" />
        Öffnungszeiten
      </h3>
      <div className="space-y-1">
        {DAY_ORDER.map((dayKey) => {
          const dayName = DAY_NAMES[dayKey];
          const rawValue = hours[dayKey as keyof OpeningHoursData];
          const schedule = normalizeDayValue(rawValue);

          if (!schedule) {
            return (
              <div key={dayKey} className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">{dayName}</span>
                <span className="text-muted-foreground">Nicht angegeben</span>
              </div>
            );
          }

          if (schedule.closed) {
            return (
              <div key={dayKey} className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">{dayName}</span>
                <span className="text-muted-foreground">Geschlossen</span>
              </div>
            );
          }

          if (schedule.open && schedule.close) {
            return (
              <div key={dayKey} className="flex justify-between items-center text-sm">
                <span className="font-medium">{dayName}</span>
                <span className="text-muted-foreground">
                  {formatTime(schedule.open)}–{formatTime(schedule.close)}
                </span>
              </div>
            );
          }

          return (
            <div key={dayKey} className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">{dayName}</span>
              <span className="text-muted-foreground">Nicht angegeben</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
