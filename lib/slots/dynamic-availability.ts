/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Dynamic Availability Calculator
 *
 * Calculates available time slots for a studio on a given date,
 * accounting for:
 * - Studio opening hours (including break times)
 * - Existing bookings (CONFIRMED and PENDING)
 * - Blocked times
 * - Studio capacity limits
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { Result, ok, err } from '@/lib/result';
import type { OpeningHours, DayOfWeek } from '@/lib/types/opening-hours';
import {
  generateDayTimeSlots,
  isTimeInRange,
  getTimeDifferenceMinutes,
  normalizeToGrid,
} from './slot-utils';

/**
 * Available slot information
 */
export interface AvailableSlot {
  /** Slot start time in HH:mm format */
  startTime: string;
  /** Slot end time in HH:mm format (startTime + 15 minutes) */
  endTime: string;
  /** Whether the slot is available for booking */
  available: boolean;
  /** Number of remaining capacity slots */
  remainingCapacity: number;
  /** Reason why slot is unavailable (if applicable) */
  reason?: 'outside_hours' | 'at_capacity' | 'blocked' | 'in_break';
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
 * Calculate available slots for a studio on a given date
 *
 * @param studioId - Studio ID
 * @param date - Date in YYYY-MM-DD format
 * @param serviceId - Optional service ID filter
 * @param options - Calculation options
 * @returns Result with available slots or error
 */
export async function calculateAvailableSlots(
  studioId: string,
  date: string,
  serviceId?: string,
  options: SlotCalculationOptions = {}
): Promise<Result<AvailableSlot[], SlotCalculationError>> {
  const correlationId = `calc-slots-${Date.now()}`;
  logger.info('Calculating available slots', {
    correlationId,
    studioId,
    date,
    serviceId,
    options,
  });

  try {
    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      logger.warn('Invalid date format', { correlationId, date });
      return err({ type: 'INVALID_DATE', date });
    }

    // Fetch studio with capacity
    const studio = await prisma.studio.findUnique({
      where: { id: studioId },
      select: {
        id: true,
        capacity: true,
        openingHours: true,
      },
    });

    if (!studio) {
      logger.warn('Studio not found', { correlationId, studioId });
      return err({ type: 'STUDIO_NOT_FOUND', studioId });
    }

    // Parse opening hours for the day of week
    const dayOfWeek = getDayOfWeek(date);
    const dayHours = parseOpeningHours(studio.openingHours, dayOfWeek);

    if (!dayHours) {
      logger.warn('Invalid opening hours', { correlationId, studioId });
      return err({ type: 'INVALID_OPENING_HOURS', studioId });
    }

    // If studio is closed, return empty slots or all unavailable
    if (!dayHours.isOpen) {
      logger.info('Studio is closed on this day', { correlationId, date, dayOfWeek });

      if (options.includeUnavailable) {
        const allSlots = generateDayTimeSlots();
        return ok(allSlots.map(time => ({
          startTime: time,
          endTime: addMinutesToTime(time, 15),
          available: false,
          remainingCapacity: 0,
          reason: 'outside_hours' as const,
        })));
      }

      return ok([]);
    }

    // Generate time grid for the day
    const allTimeSlots = generateDayTimeSlots();

    // Fetch existing bookings for the date (CONFIRMED and PENDING only)
    const bookings = await prisma.newBooking.findMany({
      where: {
        studioId,
        preferredDate: date,
        status: {
          in: ['CONFIRMED', 'PENDING'],
        },
        ...(serviceId && { serviceId }),
      },
      select: {
        preferredTime: true,
      },
    });

    // Count bookings per time slot
    const bookingCounts = new Map<string, number>();
    for (const booking of bookings) {
      const normalizedTime = normalizeToGrid(booking.preferredTime);
      bookingCounts.set(normalizedTime, (bookingCounts.get(normalizedTime) || 0) + 1);
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
              lte: new Date(`${date}T23:59:59.999Z`),
            },
            endTime: {
              gte: new Date(`${date}T00:00:00.000Z`),
            },
          },
          // Specific time blocks
          {
            isAllDay: false,
            startTime: {
              gte: new Date(`${date}T00:00:00.000Z`),
              lt: new Date(`${date}T23:59:59.999Z`),
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

    for (const time of allTimeSlots) {
      const slot = calculateSlotAvailability(
        time,
        studio.capacity,
        dayHours,
        bookingCounts,
        blockedTimes,
        date
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
      date,
    });

    return err({
      type: 'DATABASE_ERROR',
      message: error instanceof Error ? error.message : 'Datenbankfehler',
    });
  }
}

/**
 * Calculate availability for a single time slot
 */
function calculateSlotAvailability(
  time: string,
  capacity: number,
  dayHours: { openTime: string; closeTime: string; breakStart?: string; breakEnd?: string },
  bookingCounts: Map<string, number>,
  blockedTimes: Array<{ startTime: Date; endTime: Date; isAllDay: boolean }>,
  date: string
): AvailableSlot {
  const endTime = addMinutesToTime(time, 15);
  const bookingCount = bookingCounts.get(time) || 0;
  const remainingCapacity = capacity - bookingCount;

  // Check if slot is within opening hours
  const isWithinHours = isTimeInRange(time, dayHours.openTime, dayHours.closeTime);
  if (!isWithinHours) {
    return {
      startTime: time,
      endTime,
      available: false,
      remainingCapacity: 0,
      reason: 'outside_hours',
    };
  }

  // Check if slot is during break time
  if (dayHours.breakStart && dayHours.breakEnd) {
    // Break time is inclusive of start, exclusive of end
    const timeMinutes = parseInt(time.split(':')[0]) * 60 + parseInt(time.split(':')[1]);
    const breakStartMinutes = parseInt(dayHours.breakStart.split(':')[0]) * 60 + parseInt(dayHours.breakStart.split(':')[1]);
    const breakEndMinutes = parseInt(dayHours.breakEnd.split(':')[0]) * 60 + parseInt(dayHours.breakEnd.split(':')[1]);

    const isInBreak = timeMinutes >= breakStartMinutes && timeMinutes < breakEndMinutes;
    if (isInBreak) {
      return {
        startTime: time,
        endTime,
        available: false,
        remainingCapacity: 0,
        reason: 'in_break',
      };
    }
  }

  // Check if slot is blocked
  const slotStart = new Date(`${date}T${time}:00.000Z`);
  const slotEnd = new Date(`${date}T${endTime}:00.000Z`);

  for (const blocked of blockedTimes) {
    if (blocked.isAllDay) {
      return {
        startTime: time,
        endTime,
        available: false,
        remainingCapacity: 0,
        reason: 'blocked',
      };
    }

    // Check if slot overlaps with blocked time
    const isBlocked = slotStart < blocked.endTime && slotEnd > blocked.startTime;
    if (isBlocked) {
      return {
        startTime: time,
        endTime,
        available: false,
        remainingCapacity: 0,
        reason: 'blocked',
      };
    }
  }

  // Check capacity
  if (remainingCapacity <= 0) {
    return {
      startTime: time,
      endTime,
      available: false,
      remainingCapacity: 0,
      reason: 'at_capacity',
    };
  }

  // Slot is available
  return {
    startTime: time,
    endTime,
    available: true,
    remainingCapacity,
  };
}

/**
 * Get day of week from date string
 */
function getDayOfWeek(date: string): DayOfWeek {
  const d = new Date(date + 'T12:00:00.000Z'); // Noon UTC to avoid timezone issues
  const days: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[d.getUTCDay()];
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

/**
 * Add minutes to time string (simple helper)
 */
function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  let totalMinutes = h * 60 + m + minutes;
  totalMinutes = totalMinutes % (24 * 60);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}
