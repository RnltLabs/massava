/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Dynamic Availability Calculator (DateTime-based)
 *
 * Calculates available time slots for a studio on a given date,
 * accounting for:
 * - Studio opening hours (including break times)
 * - Existing bookings (CONFIRMED and PENDING)
 * - Blocked times
 * - Studio capacity limits
 * - Minimum booking window (MIN_BOOKING_HOURS_AHEAD)
 * - Timezone-aware DateTime handling
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { Result, ok, err } from '@/lib/result';
import type { OpeningHours, DayOfWeek } from '@/lib/types/opening-hours';
import {
  formatInTimezone,
  toStudioLocalTime,
  toUTC,
  validateTimezoneOrThrow,
  isWithinBusinessHours,
} from '@/lib/timezone';
import { addMinutes, addHours, startOfDay, setHours, setMinutes, isAfter, isBefore } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { MIN_BOOKING_HOURS_AHEAD } from '@/lib/timezone/constants';

/**
 * Available slot information (DateTime-based)
 */
export interface AvailableSlot {
  /** Slot start time as Date object (UTC) */
  startTime: Date;
  /** Slot end time as Date object (UTC) */
  endTime: Date;
  /** Formatted start time in studio's timezone (HH:mm) */
  startTimeFormatted: string;
  /** Formatted end time in studio's timezone (HH:mm) */
  endTimeFormatted: string;
  /** Whether the slot is available for booking */
  available: boolean;
  /** Number of remaining capacity slots */
  remainingCapacity: number;
  /** Reason why slot is unavailable (if applicable) */
  reason?: 'outside_hours' | 'at_capacity' | 'blocked' | 'in_break' | 'in_past'; // 'in_past' includes slots within MIN_BOOKING_HOURS_AHEAD window
}

/**
 * Options for slot calculation
 */
export interface SlotCalculationOptions {
  /** Include unavailable slots in results (default: false) */
  includeUnavailable?: boolean;
  /** Minimum required capacity (default: 1) */
  minCapacity?: number;
}

/**
 * Error types for slot calculation
 */
export type SlotCalculationError =
  | { type: 'STUDIO_NOT_FOUND'; studioId: string }
  | { type: 'INVALID_DATE'; date: string }
  | { type: 'INVALID_OPENING_HOURS'; studioId: string }
  | { type: 'DATABASE_ERROR'; message: string };

/**
 * Calculate available slots for a studio on a given date (DateTime-based)
 *
 * @param studioId - Studio ID
 * @param date - Date in YYYY-MM-DD format or Date object
 * @param serviceId - Optional service ID filter
 * @param options - Calculation options
 * @returns Result with available slots (as DateTime objects) or error
 */
export async function calculateAvailableSlots(
  studioId: string,
  date: string | Date,
  serviceId?: string,
  options: SlotCalculationOptions = {}
): Promise<Result<AvailableSlot[], SlotCalculationError>> {
  const correlationId = `calc-slots-${Date.now()}`;
  logger.info('Calculating available slots', {
    correlationId,
    studioId,
    date: typeof date === 'string' ? date : date.toISOString(),
    serviceId,
    options,
  });

  try {
    // Parse date input
    let targetDate: Date;
    if (typeof date === 'string') {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(date)) {
        logger.warn('Invalid date format', { correlationId, date });
        return err({ type: 'INVALID_DATE', date });
      }
      targetDate = new Date(date + 'T00:00:00.000Z');
    } else {
      targetDate = date;
    }

    // Fetch studio with capacity and timezone
    const studio = await prisma.studio.findUnique({
      where: { id: studioId },
      select: {
        id: true,
        capacity: true,
        openingHours: true,
        timezone: true,
      },
    });

    if (!studio) {
      logger.warn('Studio not found', { correlationId, studioId });
      return err({ type: 'STUDIO_NOT_FOUND', studioId });
    }

    // Validate studio timezone
    validateTimezoneOrThrow(studio.timezone);

    // Convert target date to studio's timezone
    const studioDate = toZonedTime(targetDate, studio.timezone);
    const dayOfWeek = formatInTimezone(studioDate, studio.timezone, 'EEEE').toLowerCase() as DayOfWeek;

    // Parse opening hours for the day of week
    const dayHours = parseOpeningHours(studio.openingHours, dayOfWeek);

    logger.debug('Parsed opening hours', {
      correlationId,
      studioId,
      dayOfWeek,
      dayHours,
      rawOpeningHours: studio.openingHours,
    });

    if (!dayHours) {
      logger.warn('Invalid opening hours', { correlationId, studioId, dayOfWeek, rawOpeningHours: studio.openingHours });
      return err({ type: 'INVALID_OPENING_HOURS', studioId });
    }

    // If studio is closed, return empty slots or all unavailable
    if (!dayHours.isOpen) {
      logger.info('Studio is closed on this day', { correlationId, date: formatInTimezone(studioDate, studio.timezone, 'yyyy-MM-dd'), dayOfWeek });

      if (options.includeUnavailable) {
        const allSlots = generateDayTimeSlots(studioDate, studio.timezone, dayHours);
        return ok(allSlots.map(slotDate => ({
          startTime: slotDate,
          endTime: addMinutes(slotDate, 15),
          startTimeFormatted: formatInTimezone(slotDate, studio.timezone, 'HH:mm'),
          endTimeFormatted: formatInTimezone(addMinutes(slotDate, 15), studio.timezone, 'HH:mm'),
          available: false,
          remainingCapacity: 0,
          reason: 'outside_hours' as const,
        })));
      }

      return ok([]);
    }

    // Generate time slots for the day (in studio's timezone, returns UTC Date objects)
    const allTimeSlots = generateDayTimeSlots(studioDate, studio.timezone, dayHours);

    logger.debug('Generated time slots', {
      correlationId,
      studioId,
      totalSlots: allTimeSlots.length,
      openTime: dayHours.openTime,
      closeTime: dayHours.closeTime,
    });

    // Get start and end of day in studio's timezone (for DB query)
    const dayStart = fromZonedTime(startOfDay(studioDate), studio.timezone);
    const dayEnd = fromZonedTime(addMinutes(startOfDay(studioDate), 24 * 60), studio.timezone);

    // Fetch existing bookings for the date (CONFIRMED and PENDING only)
    const bookings = await prisma.newBooking.findMany({
      where: {
        studioId,
        preferredDateTime: {
          gte: dayStart,
          lt: dayEnd,
        },
        status: {
          in: ['CONFIRMED', 'PENDING'],
        },
        ...(serviceId && { serviceId }),
      },
      select: {
        preferredDateTime: true,
      },
    });

    // Count bookings per time slot (round to 15-minute grid)
    const bookingCounts = new Map<number, number>();
    for (const booking of bookings) {
      // Round to nearest 15-minute slot
      const slotTimestamp = roundToSlotBoundary(booking.preferredDateTime).getTime();
      bookingCounts.set(slotTimestamp, (bookingCounts.get(slotTimestamp) || 0) + 1);
    }

    // Fetch blocked times for the date
    const blockedTimes = await prisma.blockedTime.findMany({
      where: {
        studioId,
        OR: [
          // All-day blocks
          {
            isAllDay: true,
            startTime: {
              lte: dayEnd,
            },
            endTime: {
              gte: dayStart,
            },
          },
          // Specific time blocks
          {
            isAllDay: false,
            startTime: {
              lt: dayEnd,
            },
            endTime: {
              gt: dayStart,
            },
          },
        ],
      },
      select: {
        startTime: true,
        endTime: true,
        isAllDay: true,
      },
    });

    logger.debug('Fetched booking and blocked time data', {
      correlationId,
      bookingCount: bookings.length,
      blockedTimeCount: blockedTimes.length,
      capacity: studio.capacity,
    });

    // Calculate availability for each slot
    const slots: AvailableSlot[] = [];
    const now = new Date();

    for (const slotStart of allTimeSlots) {
      const slot = calculateSlotAvailability(
        slotStart,
        studio.capacity,
        studio.timezone,
        dayHours,
        bookingCounts,
        blockedTimes,
        now
      );

      // Apply minimum capacity filter
      const minCapacity = options.minCapacity ?? 1;
      if (slot.remainingCapacity < minCapacity) {
        slot.available = false;
        if (!slot.reason) {
          slot.reason = 'at_capacity';
        }
      }

      // Include based on availability filter
      if (options.includeUnavailable || slot.available) {
        slots.push(slot);
      }
    }

    logger.info('Slot calculation completed', {
      correlationId,
      totalSlots: slots.length,
      availableSlots: slots.filter(s => s.available).length,
    });

    return ok(slots);
  } catch (error) {
    logger.error('Error calculating slots', {
      correlationId,
      error: error instanceof Error ? error.message : 'Unknown error',
      studioId,
      date: typeof date === 'string' ? date : date.toISOString(),
    });

    return err({
      type: 'DATABASE_ERROR',
      message: error instanceof Error ? error.message : 'Datenbankfehler',
    });
  }
}

/**
 * Generate time slots for a specific day (returns UTC Date objects)
 */
function generateDayTimeSlots(
  date: Date,
  timezone: string,
  dayHours: { openTime: string; closeTime: string }
): Date[] {
  const slots: Date[] = [];

  // Parse opening and closing times
  const [openHour, openMin] = dayHours.openTime.split(':').map(Number);
  const [closeHour, closeMin] = dayHours.closeTime.split(':').map(Number);

  // Create dates in studio's local timezone
  const dayStart = startOfDay(toZonedTime(date, timezone));
  let currentSlot = setMinutes(setHours(dayStart, openHour), openMin);
  const closeTime = setMinutes(setHours(dayStart, closeHour), closeMin);

  // Generate 15-minute slots
  while (isBefore(currentSlot, closeTime)) {
    // Convert to UTC before storing
    slots.push(fromZonedTime(currentSlot, timezone));
    currentSlot = addMinutes(currentSlot, 15);
  }

  return slots;
}

/**
 * Round a DateTime to the nearest 15-minute slot boundary (floor)
 */
function roundToSlotBoundary(date: Date): Date {
  const minutes = date.getMinutes();
  const roundedMinutes = Math.floor(minutes / 15) * 15;
  const rounded = new Date(date);
  rounded.setMinutes(roundedMinutes);
  rounded.setSeconds(0);
  rounded.setMilliseconds(0);
  return rounded;
}

/**
 * Calculate availability for a single time slot (DateTime-based)
 */
function calculateSlotAvailability(
  slotStart: Date,
  capacity: number,
  studioTimezone: string,
  dayHours: { openTime: string; closeTime: string; breakStart?: string; breakEnd?: string },
  bookingCounts: Map<number, number>,
  blockedTimes: Array<{ startTime: Date; endTime: Date; isAllDay: boolean }>,
  now: Date
): AvailableSlot {
  const slotEnd = addMinutes(slotStart, 15);
  const slotTimestamp = roundToSlotBoundary(slotStart).getTime();
  const bookingCount = bookingCounts.get(slotTimestamp) || 0;
  const remainingCapacity = capacity - bookingCount;

  // Format times for display
  const startTimeFormatted = formatInTimezone(slotStart, studioTimezone, 'HH:mm');
  const endTimeFormatted = formatInTimezone(slotEnd, studioTimezone, 'HH:mm');

  // Check if slot is in the past or too close to book (less than MIN_BOOKING_HOURS_AHEAD)
  const minBookingTime = addHours(now, MIN_BOOKING_HOURS_AHEAD);
  if (isBefore(slotStart, minBookingTime)) {
    return {
      startTime: slotStart,
      endTime: slotEnd,
      startTimeFormatted,
      endTimeFormatted,
      available: false,
      remainingCapacity: 0,
      reason: 'in_past',
    };
  }

  // Check if slot is during break time
  if (dayHours.breakStart && dayHours.breakEnd) {
    const slotLocalTime = toZonedTime(slotStart, studioTimezone);
    const timeStr = formatInTimezone(slotLocalTime, studioTimezone, 'HH:mm');
    const [hours, minutes] = timeStr.split(':').map(Number);
    const timeMinutes = hours * 60 + minutes;

    const [breakStartHour, breakStartMin] = dayHours.breakStart.split(':').map(Number);
    const breakStartMinutes = breakStartHour * 60 + breakStartMin;

    const [breakEndHour, breakEndMin] = dayHours.breakEnd.split(':').map(Number);
    const breakEndMinutes = breakEndHour * 60 + breakEndMin;

    if (timeMinutes >= breakStartMinutes && timeMinutes < breakEndMinutes) {
      return {
        startTime: slotStart,
        endTime: slotEnd,
        startTimeFormatted,
        endTimeFormatted,
        available: false,
        remainingCapacity: 0,
        reason: 'in_break',
      };
    }
  }

  // Check if slot is blocked
  for (const blocked of blockedTimes) {
    if (blocked.isAllDay) {
      return {
        startTime: slotStart,
        endTime: slotEnd,
        startTimeFormatted,
        endTimeFormatted,
        available: false,
        remainingCapacity: 0,
        reason: 'blocked',
      };
    }

    // Check if slot overlaps with blocked time
    const isBlocked = isBefore(slotStart, blocked.endTime) && isAfter(slotEnd, blocked.startTime);
    if (isBlocked) {
      return {
        startTime: slotStart,
        endTime: slotEnd,
        startTimeFormatted,
        endTimeFormatted,
        available: false,
        remainingCapacity: 0,
        reason: 'blocked',
      };
    }
  }

  // Check capacity
  if (remainingCapacity <= 0) {
    return {
      startTime: slotStart,
      endTime: slotEnd,
      startTimeFormatted,
      endTimeFormatted,
      available: false,
      remainingCapacity: 0,
      reason: 'at_capacity',
    };
  }

  // Slot is available
  return {
    startTime: slotStart,
    endTime: slotEnd,
    startTimeFormatted,
    endTimeFormatted,
    available: true,
    remainingCapacity,
  };
}

/**
 * Parse opening hours JSON for a specific day
 */
function parseOpeningHours(
  openingHoursJson: unknown,
  dayOfWeek: DayOfWeek
): { isOpen: boolean; openTime: string; closeTime: string; breakStart?: string; breakEnd?: string } | null {
  if (!openingHoursJson || typeof openingHoursJson !== 'object') {
    return null;
  }

  const hours = openingHoursJson as Record<string, unknown>;
  const dayData = hours[dayOfWeek];

  if (!dayData || typeof dayData !== 'object') {
    return null;
  }

  const day = dayData as Record<string, unknown>;

  // Handle both new format (isOpen, openTime, closeTime) and old format (open, close)
  const isOpen = day.isOpen === true || (day.open !== null && day.open !== undefined);

  if (!isOpen) {
    return { isOpen: false, openTime: '00:00', closeTime: '00:00' };
  }

  // Extract times - support both formats
  const openTime = (day.openTime as string) || (day.open as string);
  const closeTime = (day.closeTime as string) || (day.close as string);

  if (!openTime || !closeTime) {
    return null;
  }

  const result: { isOpen: boolean; openTime: string; closeTime: string; breakStart?: string; breakEnd?: string } = {
    isOpen: true,
    openTime,
    closeTime,
  };

  // Include break times if present
  if (day.breakStart && typeof day.breakStart === 'string') {
    result.breakStart = day.breakStart;
  }
  if (day.breakEnd && typeof day.breakEnd === 'string') {
    result.breakEnd = day.breakEnd;
  }

  return result;
}
