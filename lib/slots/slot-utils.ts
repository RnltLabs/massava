/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Slot Utilities - Time Grid Management
 *
 * Handles 15-minute time grid normalization and validation.
 * All booking times must align to 00, 15, 30, 45 minute marks.
 *
 * Supports both:
 * - String-based time slots (legacy, HH:mm format)
 * - DateTime-based slots (new, timezone-aware)
 */

import { isSameMinute, isAfter, isBefore } from 'date-fns';
import { formatInTimezone } from '@/lib/timezone';

/**
 * Valid minute values for time grid (00, 15, 30, 45)
 */
const VALID_MINUTES = [0, 15, 30, 45] as const;

/**
 * Grid interval in minutes
 */
export const GRID_INTERVAL_MINUTES = 15;

/**
 * Normalize a time string to the nearest 15-minute grid slot
 *
 * Rounds DOWN to the nearest grid slot (00, 15, 30, 45 minutes).
 *
 * @example
 * normalizeToGrid("09:00") // "09:00"
 * normalizeToGrid("09:07") // "09:00"
 * normalizeToGrid("09:18") // "09:15"
 * normalizeToGrid("09:42") // "09:30"
 *
 * @param time - Time string in HH:mm format
 * @returns Normalized time string in HH:mm format
 * @throws {Error} If time format is invalid
 */
export function normalizeToGrid(time: string): string {
  const parsed = parseTime(time);
  if (!parsed) {
    throw new Error(`Ungültiges Zeitformat: ${time}. Erwartet: HH:mm`);
  }

  const { hours, minutes } = parsed;

  // Find the largest grid minute that is <= current minute
  const normalizedMinute = Math.floor(minutes / GRID_INTERVAL_MINUTES) * GRID_INTERVAL_MINUTES;

  return formatTime(hours, normalizedMinute);
}

/**
 * Check if a time is exactly on the 15-minute grid
 *
 * @example
 * isOnGrid("09:00") // true
 * isOnGrid("09:15") // true
 * isOnGrid("09:07") // false
 *
 * @param time - Time string in HH:mm format
 * @returns true if time is on grid (00, 15, 30, 45 minutes)
 */
export function isOnGrid(time: string): boolean {
  const parsed = parseTime(time);
  if (!parsed) {
    return false;
  }

  return VALID_MINUTES.includes(parsed.minutes as typeof VALID_MINUTES[number]);
}

/**
 * Get the next grid slot after the given time
 *
 * @example
 * getNextGridSlot("09:00") // "09:15"
 * getNextGridSlot("09:07") // "09:15"
 * getNextGridSlot("09:45") // "10:00"
 * getNextGridSlot("23:45") // "00:00"
 *
 * @param time - Time string in HH:mm format
 * @returns Next grid slot in HH:mm format
 * @throws {Error} If time format is invalid
 */
export function getNextGridSlot(time: string): string {
  const parsed = parseTime(time);
  if (!parsed) {
    throw new Error(`Ungültiges Zeitformat: ${time}. Erwartet: HH:mm`);
  }

  // First normalize to current grid slot, then add 15 minutes
  const normalized = normalizeToGrid(time);
  const normalizedParsed = parseTime(normalized)!;

  let { hours, minutes } = normalizedParsed;

  // Add 15 minutes
  minutes += GRID_INTERVAL_MINUTES;

  // Handle minute overflow
  if (minutes >= 60) {
    minutes = 0;
    hours = (hours + 1) % 24;
  }

  return formatTime(hours, minutes);
}

/**
 * Get the previous grid slot before the given time
 *
 * @example
 * getPreviousGridSlot("09:15") // "09:00"
 * getPreviousGridSlot("09:07") // "09:00"
 * getPreviousGridSlot("09:00") // "08:45"
 * getPreviousGridSlot("00:00") // "23:45"
 *
 * @param time - Time string in HH:mm format
 * @returns Previous grid slot in HH:mm format
 * @throws {Error} If time format is invalid
 */
export function getPreviousGridSlot(time: string): string {
  const parsed = parseTime(time);
  if (!parsed) {
    throw new Error(`Ungültiges Zeitformat: ${time}. Erwartet: HH:mm`);
  }

  let { hours, minutes } = parsed;

  // If already on grid, go back one slot
  if (VALID_MINUTES.includes(minutes as typeof VALID_MINUTES[number])) {
    minutes -= GRID_INTERVAL_MINUTES;
  } else {
    // Otherwise, normalize down
    minutes = Math.floor(minutes / GRID_INTERVAL_MINUTES) * GRID_INTERVAL_MINUTES;
  }

  // Handle minute underflow
  if (minutes < 0) {
    minutes = 45;
    hours = (hours - 1 + 24) % 24;
  }

  return formatTime(hours, minutes);
}

/**
 * Generate all time slots for a day on the 15-minute grid
 *
 * @param startTime - Optional start time (default: "00:00")
 * @param endTime - Optional end time (default: "23:45")
 * @returns Array of time strings on the grid
 */
export function generateDayTimeSlots(
  startTime: string = "00:00",
  endTime: string = "23:45"
): string[] {
  const start = parseTime(startTime);
  const end = parseTime(endTime);

  if (!start || !end) {
    throw new Error("Ungültige Start- oder Endzeit");
  }

  const slots: string[] = [];
  let currentMinutes = start.hours * 60 + start.minutes;
  const endMinutes = end.hours * 60 + end.minutes;

  // Normalize start to grid
  currentMinutes = Math.floor(currentMinutes / GRID_INTERVAL_MINUTES) * GRID_INTERVAL_MINUTES;

  while (currentMinutes <= endMinutes) {
    const hours = Math.floor(currentMinutes / 60);
    const minutes = currentMinutes % 60;
    slots.push(formatTime(hours, minutes));
    currentMinutes += GRID_INTERVAL_MINUTES;
  }

  return slots;
}

/**
 * Calculate time difference in minutes
 *
 * @param startTime - Start time in HH:mm format
 * @param endTime - End time in HH:mm format
 * @returns Difference in minutes (positive if endTime is after startTime)
 */
export function getTimeDifferenceMinutes(startTime: string, endTime: string): number {
  const start = parseTime(startTime);
  const end = parseTime(endTime);

  if (!start || !end) {
    throw new Error("Ungültige Zeit für Differenzberechnung");
  }

  const startMinutes = start.hours * 60 + start.minutes;
  const endMinutes = end.hours * 60 + end.minutes;

  return endMinutes - startMinutes;
}

/**
 * Check if time is within a range (inclusive)
 *
 * @param time - Time to check
 * @param startTime - Range start
 * @param endTime - Range end
 * @returns true if time is within range
 */
export function isTimeInRange(time: string, startTime: string, endTime: string): boolean {
  const t = parseTime(time);
  const start = parseTime(startTime);
  const end = parseTime(endTime);

  if (!t || !start || !end) {
    return false;
  }

  const timeMinutes = t.hours * 60 + t.minutes;
  const startMinutes = start.hours * 60 + start.minutes;
  const endMinutes = end.hours * 60 + end.minutes;

  return timeMinutes >= startMinutes && timeMinutes <= endMinutes;
}

/**
 * Parse time string into hours and minutes
 *
 * @internal
 */
function parseTime(time: string): { hours: number; minutes: number } | null {
  const match = time.match(/^(\d{2}):(\d{2})$/);
  if (!match) {
    return null;
  }

  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }

  return { hours, minutes };
}

/**
 * Format hours and minutes into HH:mm string
 *
 * @internal
 */
function formatTime(hours: number, minutes: number): string {
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Validate time string format
 *
 * @param time - Time string to validate
 * @returns true if valid HH:mm format
 */
export function isValidTimeFormat(time: string): boolean {
  return parseTime(time) !== null;
}

/**
 * Add minutes to a time string
 *
 * @param time - Time string in HH:mm format
 * @param minutesToAdd - Minutes to add (can be negative)
 * @returns New time string in HH:mm format
 */
export function addMinutes(time: string, minutesToAdd: number): string {
  const parsed = parseTime(time);
  if (!parsed) {
    throw new Error(`Ungültiges Zeitformat: ${time}`);
  }

  let totalMinutes = parsed.hours * 60 + parsed.minutes + minutesToAdd;

  // Handle overflow/underflow
  totalMinutes = ((totalMinutes % (24 * 60)) + (24 * 60)) % (24 * 60);

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return formatTime(hours, minutes);
}

/* ============================================================
 * DateTime-based Utility Functions (NEW)
 * ============================================================ */

/**
 * Check if a DateTime slot is available (not booked, not in past)
 *
 * @param slot - Slot DateTime to check
 * @param bookedSlots - Array of booked DateTime slots
 * @param studioTimezone - Studio's IANA timezone
 * @returns true if slot is available
 */
export function isSlotAvailable(
  slot: Date,
  bookedSlots: Date[],
  studioTimezone: string
): boolean {
  const now = new Date();

  // Slot must be in future
  if (!isAfter(slot, now)) {
    return false;
  }

  // Slot must not be booked (check if same minute)
  return !bookedSlots.some((bookedSlot) => isSameMinute(bookedSlot, slot));
}

/**
 * Filter DateTime slots to only show available ones
 *
 * @param allSlots - All potential slot DateTimes
 * @param bookedSlots - Already booked DateTime slots
 * @param studioTimezone - Studio's IANA timezone
 * @returns Filtered array of available DateTime slots
 */
export function filterAvailableSlots(
  allSlots: Date[],
  bookedSlots: Date[],
  studioTimezone: string
): Date[] {
  return allSlots.filter((slot) => isSlotAvailable(slot, bookedSlots, studioTimezone));
}

/**
 * Format a DateTime slot for display in studio's timezone
 *
 * @param slot - DateTime slot
 * @param studioTimezone - Studio's IANA timezone
 * @returns Formatted time string (HH:mm)
 */
export function formatSlotForDisplay(slot: Date, studioTimezone: string): string {
  return formatInTimezone(slot, studioTimezone, 'HH:mm');
}

/**
 * Group DateTime slots by date in studio's timezone
 *
 * @param slots - Array of DateTime slots
 * @param studioTimezone - Studio's IANA timezone
 * @returns Record mapping date strings (yyyy-MM-dd) to DateTime arrays
 */
export function groupSlotsByDate(
  slots: Date[],
  studioTimezone: string
): Record<string, Date[]> {
  const grouped: Record<string, Date[]> = {};

  for (const slot of slots) {
    const dateKey = formatInTimezone(slot, studioTimezone, 'yyyy-MM-dd');
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(slot);
  }

  return grouped;
}

/**
 * Round a DateTime to the nearest 15-minute slot boundary (floor)
 *
 * @param date - DateTime to round
 * @returns Rounded DateTime
 */
export function roundDateToSlotGrid(date: Date): Date {
  const minutes = date.getMinutes();
  const roundedMinutes = Math.floor(minutes / GRID_INTERVAL_MINUTES) * GRID_INTERVAL_MINUTES;
  const rounded = new Date(date);
  rounded.setMinutes(roundedMinutes);
  rounded.setSeconds(0);
  rounded.setMilliseconds(0);
  return rounded;
}

/**
 * Check if a DateTime is on the 15-minute grid
 *
 * @param date - DateTime to check
 * @returns true if on grid (00, 15, 30, 45 minutes)
 */
export function isDateOnSlotGrid(date: Date): boolean {
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  const milliseconds = date.getMilliseconds();

  return (
    VALID_MINUTES.includes(minutes as typeof VALID_MINUTES[number]) &&
    seconds === 0 &&
    milliseconds === 0
  );
}
