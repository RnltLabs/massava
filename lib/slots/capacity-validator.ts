/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Capacity Validator - Transaction-Safe Booking
 *
 * Prevents double bookings using Prisma transactions with Serializable isolation level.
 * Implements retry logic for concurrent booking conflicts.
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { Result, ok, err } from '@/lib/result';
import { Prisma } from '@/app/generated/prisma';
import type { BookingStatus } from '@/app/generated/prisma';
import { normalizeToGrid } from './slot-utils';

/**
 * Booking data for creation with capacity check
 */
export interface BookingData {
  studioId: string;
  serviceId?: string;
  customerId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  preferredDate: string;
  preferredTime: string;
  message?: string;
  explicitHealthConsent?: boolean;
  healthConsentGivenAt?: Date;
  healthConsentText?: string;
}

/**
 * Error types for capacity validation
 */
export type CapacityError =
  | { type: 'STUDIO_NOT_FOUND'; studioId: string }
  | { type: 'CAPACITY_EXCEEDED'; studioId: string; date: string; time: string; capacity: number; currentBookings: number }
  | { type: 'INVALID_TIME_GRID'; time: string; normalizedTime: string }
  | { type: 'CONCURRENT_BOOKING_CONFLICT'; retries: number }
  | { type: 'DATABASE_ERROR'; message: string };

/**
 * Result of capacity check
 */
export interface CapacityCheckResult {
  /** Whether capacity is available */
  available: boolean;
  /** Current number of bookings */
  currentBookings: number;
  /** Studio capacity */
  capacity: number;
  /** Remaining capacity */
  remainingCapacity: number;
}

/**
 * Check slot capacity without creating a booking
 *
 * Can be used within a transaction or standalone.
 *
 * @param studioId - Studio ID
 * @param date - Date in YYYY-MM-DD format
 * @param time - Time in HH:mm format (will be normalized to grid)
 * @param tx - Optional Prisma transaction client
 * @returns Result with capacity check or error
 */
export async function checkSlotCapacity(
  studioId: string,
  date: string,
  time: string,
  tx?: Prisma.TransactionClient
): Promise<Result<CapacityCheckResult, CapacityError>> {
  const correlationId = `check-capacity-${Date.now()}`;
  const normalizedTime = normalizeToGrid(time);

  logger.debug('Checking slot capacity', {
    correlationId,
    studioId,
    date,
    time,
    normalizedTime,
  });

  const client = tx || prisma;

  try {
    // Fetch studio capacity
    const studio = await client.studio.findUnique({
      where: { id: studioId },
      select: {
        id: true,
        capacity: true,
      },
    });

    if (!studio) {
      logger.warn('Studio not found for capacity check', { correlationId, studioId });
      return err({ type: 'STUDIO_NOT_FOUND', studioId });
    }

    // Count existing bookings at this slot (CONFIRMED and PENDING)
    const bookingCount = await client.newBooking.count({
      where: {
        studioId,
        preferredDate: date,
        preferredTime: normalizedTime,
        status: {
          in: ['CONFIRMED', 'PENDING'] as BookingStatus[],
        },
      },
    });

    const remainingCapacity = studio.capacity - bookingCount;
    const available = remainingCapacity > 0;

    logger.debug('Capacity check completed', {
      correlationId,
      studioId,
      date,
      time: normalizedTime,
      capacity: studio.capacity,
      currentBookings: bookingCount,
      remainingCapacity,
      available,
    });

    return ok({
      available,
      currentBookings: bookingCount,
      capacity: studio.capacity,
      remainingCapacity,
    });
  } catch (error) {
    logger.error('Error checking slot capacity', {
      correlationId,
      error: error instanceof Error ? error.message : 'Unknown error',
      studioId,
      date,
      time: normalizedTime,
    });

    return err({
      type: 'DATABASE_ERROR',
      message: error instanceof Error ? error.message : 'Datenbankfehler',
    });
  }
}

/**
 * Create a booking with capacity check in a transaction
 *
 * Uses Serializable isolation level to prevent race conditions.
 * Implements retry logic for concurrent booking conflicts.
 *
 * @param bookingData - Booking data
 * @param maxRetries - Maximum number of retries (default: 3)
 * @returns Result with created booking or error
 */
export async function createBookingWithCapacityCheck(
  bookingData: BookingData,
  maxRetries: number = 3
): Promise<Result<{ id: string }, CapacityError>> {
  const correlationId = `create-booking-${Date.now()}`;
  const normalizedTime = normalizeToGrid(bookingData.preferredTime);

  logger.info('Creating booking with capacity check', {
    correlationId,
    studioId: bookingData.studioId,
    date: bookingData.preferredDate,
    time: normalizedTime,
    customerEmail: bookingData.customerEmail,
  });

  // Warn if time is not on grid
  if (normalizedTime !== bookingData.preferredTime) {
    logger.warn('Time normalized to grid', {
      correlationId,
      originalTime: bookingData.preferredTime,
      normalizedTime,
    });
  }

  let lastError: CapacityError | null = null;

  // Retry loop for handling concurrent booking conflicts
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await prisma.$transaction(
        async (tx) => {
          // 1. Check capacity within transaction
          const capacityCheck = await checkSlotCapacity(
            bookingData.studioId,
            bookingData.preferredDate,
            normalizedTime,
            tx
          );

          if (!capacityCheck.ok) {
            throw new CapacityValidationError(capacityCheck.error);
          }

          if (!capacityCheck.value.available) {
            const capacityError: CapacityError = {
              type: 'CAPACITY_EXCEEDED',
              studioId: bookingData.studioId,
              date: bookingData.preferredDate,
              time: normalizedTime,
              capacity: capacityCheck.value.capacity,
              currentBookings: capacityCheck.value.currentBookings,
            };
            throw new CapacityValidationError(capacityError);
          }

          // 2. Create booking
          const booking = await tx.newBooking.create({
            data: {
              studioId: bookingData.studioId,
              serviceId: bookingData.serviceId,
              customerId: bookingData.customerId,
              customerName: bookingData.customerName,
              customerEmail: bookingData.customerEmail,
              customerPhone: bookingData.customerPhone,
              preferredDate: bookingData.preferredDate,
              preferredTime: normalizedTime,
              message: bookingData.message,
              explicitHealthConsent: bookingData.explicitHealthConsent,
              healthConsentGivenAt: bookingData.healthConsentGivenAt,
              healthConsentText: bookingData.healthConsentText,
              status: 'PENDING',
            },
            select: {
              id: true,
            },
          });

          logger.info('Booking created successfully', {
            correlationId,
            bookingId: booking.id,
            studioId: bookingData.studioId,
            date: bookingData.preferredDate,
            time: normalizedTime,
          });

          return booking;
        },
        {
          // Use Serializable isolation level to prevent race conditions
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          maxWait: 5000, // Max 5s wait for transaction
          timeout: 10000, // Max 10s transaction duration
        }
      );

      return ok(result);
    } catch (error) {
      // Handle our custom capacity validation errors
      if (error instanceof CapacityValidationError) {
        lastError = error.capacityError;
        logger.warn('Capacity validation failed', {
          correlationId,
          attempt: attempt + 1,
          maxRetries,
          errorType: lastError.type,
        });
        // Don't retry capacity exceeded errors
        break;
      }

      // Handle Prisma serialization failures (concurrent transaction conflict)
      if (error instanceof Error && error.message.includes('serialization failure')) {
        lastError = { type: 'CONCURRENT_BOOKING_CONFLICT', retries: attempt + 1 };
        logger.warn('Concurrent booking conflict, retrying', {
          correlationId,
          attempt: attempt + 1,
          maxRetries,
          error: error.message,
        });

        // Exponential backoff before retry
        if (attempt < maxRetries - 1) {
          const backoffMs = Math.min(100 * Math.pow(2, attempt), 1000);
          await new Promise(resolve => setTimeout(resolve, backoffMs));
          continue;
        }
      }

      // Handle other database errors
      logger.error('Error creating booking', {
        correlationId,
        error: error instanceof Error ? error.message : 'Unknown error',
        attempt: attempt + 1,
      });

      lastError = {
        type: 'DATABASE_ERROR',
        message: error instanceof Error ? error.message : 'Datenbankfehler',
      };
      break;
    }
  }

  // All retries exhausted
  logger.error('Failed to create booking after retries', {
    correlationId,
    maxRetries,
    lastError,
  });

  return err(lastError || {
    type: 'DATABASE_ERROR',
    message: 'Buchung konnte nicht erstellt werden',
  });
}

/**
 * Custom error class for capacity validation failures
 * Used to distinguish capacity errors from other database errors
 */
class CapacityValidationError extends Error {
  constructor(public capacityError: CapacityError) {
    super('Capacity validation failed');
    this.name = 'CapacityValidationError';
  }
}

/**
 * Batch check capacity for multiple time slots
 *
 * Useful for calendar views or availability checking.
 *
 * @param studioId - Studio ID
 * @param date - Date in YYYY-MM-DD format
 * @param times - Array of time strings in HH:mm format
 * @returns Map of time -> capacity check result
 */
export async function batchCheckCapacity(
  studioId: string,
  date: string,
  times: string[]
): Promise<Map<string, Result<CapacityCheckResult, CapacityError>>> {
  const correlationId = `batch-check-${Date.now()}`;
  logger.debug('Batch checking capacity', {
    correlationId,
    studioId,
    date,
    slotCount: times.length,
  });

  const results = new Map<string, Result<CapacityCheckResult, CapacityError>>();

  // Normalize all times
  const normalizedTimes = times.map(t => normalizeToGrid(t));

  try {
    // Fetch studio capacity once
    const studio = await prisma.studio.findUnique({
      where: { id: studioId },
      select: {
        id: true,
        capacity: true,
      },
    });

    if (!studio) {
      const error: CapacityError = { type: 'STUDIO_NOT_FOUND', studioId };
      for (const time of times) {
        results.set(time, err(error));
      }
      return results;
    }

    // Fetch all bookings for the date at once
    const bookings = await prisma.newBooking.findMany({
      where: {
        studioId,
        preferredDate: date,
        preferredTime: {
          in: normalizedTimes,
        },
        status: {
          in: ['CONFIRMED', 'PENDING'] as BookingStatus[],
        },
      },
      select: {
        preferredTime: true,
      },
    });

    // Count bookings per time slot
    const bookingCounts = new Map<string, number>();
    for (const booking of bookings) {
      const count = bookingCounts.get(booking.preferredTime) || 0;
      bookingCounts.set(booking.preferredTime, count + 1);
    }

    // Build results for each time
    for (let i = 0; i < times.length; i++) {
      const originalTime = times[i];
      const normalizedTime = normalizedTimes[i];
      const bookingCount = bookingCounts.get(normalizedTime) || 0;
      const remainingCapacity = studio.capacity - bookingCount;

      results.set(originalTime, ok({
        available: remainingCapacity > 0,
        currentBookings: bookingCount,
        capacity: studio.capacity,
        remainingCapacity,
      }));
    }

    logger.debug('Batch capacity check completed', {
      correlationId,
      studioId,
      date,
      slotCount: times.length,
    });
  } catch (error) {
    logger.error('Error in batch capacity check', {
      correlationId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    const dbError: CapacityError = {
      type: 'DATABASE_ERROR',
      message: error instanceof Error ? error.message : 'Datenbankfehler',
    };

    for (const time of times) {
      results.set(time, err(dbError));
    }
  }

  return results;
}
