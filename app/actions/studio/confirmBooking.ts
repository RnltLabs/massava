/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Studio Booking Management Actions
 * Server actions for confirming and declining bookings
 */

'use server';

import { auth } from '@/auth-unified';
import { db } from '@/lib/db';
import { BookingStatus } from '@/app/generated/prisma';
import { revalidatePath } from 'next/cache';

export interface ActionResult {
  success: boolean;
  error?: string;
}

/**
 * Confirm a pending booking
 */
export async function confirmBooking(bookingId: string): Promise<ActionResult> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Nicht authentifiziert',
      };
    }

    // Get booking with studio
    const booking = await db.newBooking.findUnique({
      where: { id: bookingId },
      include: {
        studio: {
          include: {
            ownerships: {
              where: {
                userId: session.user.id,
              },
            },
          },
        },
      },
    });

    if (!booking) {
      return {
        success: false,
        error: 'Buchung nicht gefunden',
      };
    }

    // Verify user owns the studio
    if (booking.studio.ownerships.length === 0) {
      return {
        success: false,
        error: 'Keine Berechtigung für diese Buchung',
      };
    }

    // Check if booking is already confirmed or cancelled
    if (booking.status !== BookingStatus.PENDING) {
      return {
        success: false,
        error: 'Diese Buchung wurde bereits bearbeitet',
      };
    }

    // Update booking status
    await db.newBooking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.CONFIRMED,
        confirmedBy: session.user.id,
        confirmedAt: new Date(),
      },
    });

    // Revalidate dashboard pages
    revalidatePath('/[locale]/dashboard/owner');
    revalidatePath('/[locale]/dashboard/owner/calendar');

    return {
      success: true,
    };
  } catch (error) {
    console.error('Error confirming booking:', error);
    return {
      success: false,
      error: 'Ein Fehler ist aufgetreten',
    };
  }
}

/**
 * Decline a pending booking
 */
export async function declineBooking(
  bookingId: string,
  reason?: string
): Promise<ActionResult> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Nicht authentifiziert',
      };
    }

    // Get booking with studio
    const booking = await db.newBooking.findUnique({
      where: { id: bookingId },
      include: {
        studio: {
          include: {
            ownerships: {
              where: {
                userId: session.user.id,
              },
            },
          },
        },
      },
    });

    if (!booking) {
      return {
        success: false,
        error: 'Buchung nicht gefunden',
      };
    }

    // Verify user owns the studio
    if (booking.studio.ownerships.length === 0) {
      return {
        success: false,
        error: 'Keine Berechtigung für diese Buchung',
      };
    }

    // Check if booking is already confirmed or cancelled
    if (booking.status !== BookingStatus.PENDING) {
      return {
        success: false,
        error: 'Diese Buchung wurde bereits bearbeitet',
      };
    }

    // Update booking status
    await db.newBooking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.CANCELLED,
        cancelledBy: session.user.id,
        cancelledAt: new Date(),
      },
    });

    // TODO: Send cancellation email to customer
    // This would be implemented when email service is ready

    // Revalidate dashboard pages
    revalidatePath('/[locale]/dashboard/owner');
    revalidatePath('/[locale]/dashboard/owner/calendar');

    return {
      success: true,
    };
  } catch (error) {
    console.error('Error declining booking:', error);
    return {
      success: false,
      error: 'Ein Fehler ist aufgetreten',
    };
  }
}
