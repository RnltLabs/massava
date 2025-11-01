/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Opening Hours Utilities
 * Generate virtual blocked times for hours outside business hours
 */

import { format, setHours, setMinutes, startOfDay } from 'date-fns';

export type OpeningHours = {
  mode?: 'same' | 'different';
  everyday?: { open: string; close: string };
  monday?: { open: string; close: string } | null;
  tuesday?: { open: string; close: string } | null;
  wednesday?: { open: string; close: string } | null;
  thursday?: { open: string; close: string } | null;
  friday?: { open: string; close: string } | null;
  saturday?: { open: string; close: string } | null;
  sunday?: { open: string; close: string } | null;
  [key: string]: any;
};

export type VirtualBlockedTime = {
  id: string;
  studioId: string;
  startTime: Date;
  endTime: Date;
  reason: string;
  isAllDay: boolean;
  isVirtual: true; // Flag to distinguish from DB entries
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Generate virtual blocked times for hours outside opening hours
 * For a given date and opening hours, returns array of blocked time periods
 */
export function generateClosedTimeBlocks(
  date: Date,
  openingHours: OpeningHours | null,
  studioId: string
): VirtualBlockedTime[] {
  if (!openingHours) {
    // No opening hours set - don't block anything
    return [];
  }

  const dayOfWeek = format(date, 'EEEE').toLowerCase(); // "monday", "tuesday", etc.
  const virtualBlocks: VirtualBlockedTime[] = [];

  let dayHours: { open: string; close: string } | null = null;

  // Determine hours for this specific day
  if (openingHours.everyday) {
    dayHours = openingHours.everyday;
  } else if (openingHours[dayOfWeek] !== undefined) {
    dayHours = openingHours[dayOfWeek];
  }

  // If day is closed (null or no hours), block entire day
  if (!dayHours) {
    virtualBlocks.push({
      id: `virtual-closed-all-day-${format(date, 'yyyy-MM-dd')}`,
      studioId,
      startTime: setHours(setMinutes(startOfDay(date), 0), 0), // 00:00
      endTime: setHours(setMinutes(startOfDay(date), 59), 23), // 23:59
      reason: 'Geschlossen',
      isAllDay: true,
      isVirtual: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return virtualBlocks;
  }

  // Parse opening and closing times
  const [openHour, openMinute] = dayHours.open.split(':').map(Number);
  const [closeHour, closeMinute] = dayHours.close.split(':').map(Number);

  const openTime = setMinutes(setHours(startOfDay(date), openHour), openMinute);
  const closeTime = setMinutes(setHours(startOfDay(date), closeHour), closeMinute);

  // Block time before opening (from 00:00 to opening time)
  if (openHour > 0 || openMinute > 0) {
    virtualBlocks.push({
      id: `virtual-before-open-${format(date, 'yyyy-MM-dd')}`,
      studioId,
      startTime: setHours(setMinutes(startOfDay(date), 0), 0),
      endTime: openTime,
      reason: 'Geschlossen',
      isAllDay: false,
      isVirtual: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // Block time after closing (from closing time to 23:59)
  if (closeHour < 23 || closeMinute < 59) {
    virtualBlocks.push({
      id: `virtual-after-close-${format(date, 'yyyy-MM-dd')}`,
      studioId,
      startTime: closeTime,
      endTime: setHours(setMinutes(startOfDay(date), 59), 23),
      reason: 'Geschlossen',
      isAllDay: false,
      isVirtual: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  return virtualBlocks;
}
