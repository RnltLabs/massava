/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Calendar Server Actions
 * Block/unblock time slots in the calendar
 */

'use server';

import { auth } from '@/auth-unified';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// Validation schemas
const blockTimeSchema = z.object({
  studioId: z.string().min(1),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  reason: z.string().optional(),
  isAllDay: z.boolean().default(false),
});

type BlockTimeInput = z.infer<typeof blockTimeSchema>;

/**
 * Block a time period in the calendar
 */
export async function blockTime(input: BlockTimeInput): Promise<{
  success: boolean;
  error?: string;
  data?: { id: string };
}> {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Validate input
    const validated = blockTimeSchema.safeParse(input);
    if (!validated.success) {
      const firstError = validated.error.issues[0];
      return {
        success: false,
        error: 'Invalid input: ' + firstError?.message || 'Validation failed',
      };
    }

    const { studioId, startTime, endTime, reason, isAllDay } = validated.data;

    // Verify studio ownership
    const ownership = await db.studioOwnership.findFirst({
      where: {
        userId: session.user.id,
        studioId: studioId,
      },
    });

    if (!ownership) {
      return { success: false, error: 'Not authorized for this studio' };
    }

    // Validate time range
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (end <= start) {
      return { success: false, error: 'Endzeit muss nach Startzeit liegen' };
    }

    // Check for overlapping bookings (warn only, don't block)
    const overlappingBookings = await db.newBooking.count({
      where: {
        studioId: studioId,
        status: 'CONFIRMED',
        preferredDate: {
          gte: start.toISOString().split('T')[0],
          lte: end.toISOString().split('T')[0],
        },
      },
    });

    if (overlappingBookings > 0) {
      return {
        success: false,
        error: `Es gibt ${overlappingBookings} Buchung(en) in diesem Zeitraum. Bitte zuerst stornieren.`,
      };
    }

    // Create blocked time
    const blocked = await db.blockedTime.create({
      data: {
        studioId,
        startTime: start,
        endTime: end,
        reason,
        isAllDay,
      },
    });

    // Revalidate calendar page
    revalidatePath('/[locale]/dashboard/owner/calendar');

    return {
      success: true,
      data: { id: blocked.id },
    };
  } catch (error) {
    // TODO: Replace with proper logger when available
    // logger.error('Error blocking time', { error, studioId, userId, correlationId });
    return {
      success: false,
      error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.',
    };
  }
}

/**
 * Unblock a previously blocked time period
 */
export async function unblockTime(blockedTimeId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Fetch blocked time with studio ownership check
    const blocked = await db.blockedTime.findUnique({
      where: { id: blockedTimeId },
      include: {
        studio: {
          include: {
            ownerships: {
              where: { userId: session.user.id },
            },
          },
        },
      },
    });

    if (!blocked) {
      return { success: false, error: 'Blocked time not found' };
    }

    if (blocked.studio.ownerships.length === 0) {
      return { success: false, error: 'Not authorized for this studio' };
    }

    // Delete blocked time
    await db.blockedTime.delete({
      where: { id: blockedTimeId },
    });

    // Revalidate calendar page
    revalidatePath('/[locale]/dashboard/owner/calendar');

    return { success: true };
  } catch (error) {
    // TODO: Replace with proper logger when available
    // logger.error('Error unblocking time', { error, blockedTimeId, userId, correlationId });
    return {
      success: false,
      error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.',
    };
  }
}

/**
 * Get blocked times for a specific date range
 */
export async function getBlockedTimes(
  studioId: string,
  startDate: Date,
  endDate: Date
): Promise<{
  success: boolean;
  data?: Array<{
    id: string;
    startTime: Date;
    endTime: Date;
    reason: string | null;
    isAllDay: boolean;
  }>;
  error?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify ownership
    const ownership = await db.studioOwnership.findFirst({
      where: {
        userId: session.user.id,
        studioId: studioId,
      },
    });

    if (!ownership) {
      return { success: false, error: 'Not authorized' };
    }

    // Fetch blocked times
    const blockedTimes = await db.blockedTime.findMany({
      where: {
        studioId,
        startTime: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { startTime: 'asc' },
    });

    return {
      success: true,
      data: blockedTimes,
    };
  } catch (error) {
    // TODO: Replace with proper logger when available
    // logger.error('Error fetching blocked times', { error, studioId, correlationId });
    return {
      success: false,
      error: 'Failed to fetch blocked times',
    };
  }
}

// Manual Booking Creation Schema
const createManualBookingSchema = z.object({
  studioId: z.string().min(1),
  customerName: z.string().min(2, 'Name muss mindestens 2 Zeichen lang sein'),
  customerPhone: z.string().min(1, 'Telefonnummer ist erforderlich'),
  serviceId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  time: z.string().regex(/^\d{2}:\d{2}$/), // HH:mm
  notes: z.string().optional(),
  overrideCapacity: z.boolean().optional(), // Allow overbooking when capacity is full
});

type CreateManualBookingInput = z.infer<typeof createManualBookingSchema>;

/**
 * Create a manual booking (for walk-ins, phone calls)
 * Auto-confirms the booking
 * Includes capacity checking for parallel bookings
 */
export async function createManualBooking(input: CreateManualBookingInput): Promise<{
  success: boolean;
  error?: string;
  data?: { id: string };
  capacityWarning?: {
    current: number;
    max: number;
    bookings: Array<{ id: string; customerName: string; serviceName: string }>;
  };
}> {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Validate input
    const validated = createManualBookingSchema.safeParse(input);
    if (!validated.success) {
      const firstError = validated.error.issues[0];
      return {
        success: false,
        error: 'Ungültige Eingabe: ' + (firstError?.message || 'Validation failed'),
      };
    }

    const { studioId, customerName, customerPhone, serviceId, date, time, notes, overrideCapacity } = validated.data;

    // Verify studio ownership and get capacity
    const ownership = await db.studioOwnership.findFirst({
      where: {
        userId: session.user.id,
        studioId: studioId,
      },
      include: {
        studio: {
          select: {
            capacity: true,
          },
        },
      },
    });

    if (!ownership) {
      return { success: false, error: 'Nicht autorisiert für dieses Studio' };
    }

    const studioCapacity = ownership.studio.capacity;

    // Get service to determine duration
    const service = await db.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      return { success: false, error: 'Service nicht gefunden' };
    }

    // Check capacity: Count existing confirmed bookings at this time
    const existingBookings = await db.newBooking.findMany({
      where: {
        studioId: studioId,
        preferredDate: date,
        preferredTime: time,
        status: 'CONFIRMED',
      },
      include: {
        service: {
          select: {
            name: true,
          },
        },
      },
    });

    const currentCount = existingBookings.length;

    // If capacity is full and override is not allowed, return warning
    if (currentCount >= studioCapacity && !overrideCapacity) {
      return {
        success: false,
        error: 'capacity_full', // Special error code for UI
        capacityWarning: {
          current: currentCount,
          max: studioCapacity,
          bookings: existingBookings.map((b) => ({
            id: b.id,
            customerName: b.customerName,
            serviceName: b.service?.name || 'Service gelöscht',
          })),
        },
      };
    }

    // Create or find user for this booking
    // Try to find existing user by phone first
    let user = await db.user.findFirst({
      where: { phone: customerPhone },
    });

    if (!user) {
      // Create minimal user profile for phone bookings
      // Use phone-based email to avoid duplicates
      const phoneClean = customerPhone.replace(/[^0-9]/g, '');
      user = await db.user.create({
        data: {
          name: customerName,
          phone: customerPhone,
          email: `phone-${phoneClean}@massava.local`,
          primaryRole: 'CUSTOMER',
        },
      });
    }

    // Create booking (auto-confirmed for manual bookings)
    const booking = await db.newBooking.create({
      data: {
        studioId: studioId,
        customerId: user.id,
        serviceId: serviceId,
        customerName: customerName,
        customerEmail: user.email,
        customerPhone: customerPhone,
        preferredDate: date,
        preferredTime: time,
        message: notes,
        status: 'CONFIRMED',
        confirmedAt: new Date(),
        confirmedBy: session.user.id,
      },
    });

    // Revalidate calendar page
    revalidatePath('/[locale]/dashboard/owner/calendar');

    return {
      success: true,
      data: { id: booking.id },
    };
  } catch (error) {
    // TODO: Replace with proper logger when available
    // logger.error('Error creating manual booking', { error, studioId, userId, correlationId });
    return {
      success: false,
      error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.',
    };
  }
}
