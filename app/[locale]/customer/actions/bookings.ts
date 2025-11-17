/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Customer Bookings Server Actions
 */

'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import {
  cancelBookingSchema,
  rescheduleBookingSchema,
  type CancelBookingInput,
  type RescheduleBookingInput,
} from '@/lib/schemas/booking.schema';

/**
 * Booking type with relations
 */
export type BookingWithRelations = {
  id: string;
  studioId: string;
  serviceId: string | null;
  customerId: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  preferredDate: string;
  preferredTime: string;
  message: string | null;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  confirmedAt: Date | null;
  cancelledAt: Date | null;
  cancellationReason: string | null;
  reviewRequestSent: boolean;
  createdAt: Date;
  updatedAt: Date;
  studio: {
    id: string;
    name: string;
    address: string | null;
    city: string | null;
  };
  service: {
    id: string;
    name: string;
    price: number;
    duration: number;
  } | null;
  review: {
    id: string;
    rating: number;
    comment: string | null;
    createdAt: Date;
  } | null;
};

/**
 * Action result types
 */
export type BookingsListResult =
  | {
      success: true;
      data: {
        upcoming: BookingWithRelations[];
        past: BookingWithRelations[];
      };
    }
  | {
      success: false;
      error: string;
    };

export type BookingDetailsResult =
  | {
      success: true;
      data: BookingWithRelations;
    }
  | {
      success: false;
      error: string;
    };

export type BookingMutationResult =
  | {
      success: true;
      message: string;
    }
  | {
      success: false;
      error: string;
      fieldErrors?: Record<string, string[]>;
    };

/**
 * Get authenticated user
 */
async function getAuthenticatedUser() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  return prisma.user.findUnique({
    where: { id: session.user.id },
  });
}

/**
 * Check if a date is in the past
 */
function isDateInPast(dateString: string): boolean {
  try {
    const bookingDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return bookingDate < today;
  } catch {
    return false;
  }
}

/**
 * Get Customer Bookings
 * Fetches all bookings for the authenticated customer, split into upcoming and past
 */
export async function getCustomerBookings(): Promise<BookingsListResult> {
  try {
    // 1. Authenticate
    const user = await getAuthenticatedUser();

    if (!user) {
      return {
        success: false,
        error: 'Nicht authentifiziert. Bitte melden Sie sich an.',
      };
    }

    // 2. Fetch all bookings for the customer
    const bookings = await prisma.newBooking.findMany({
      where: {
        customerId: user.id,
      },
      include: {
        studio: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            price: true,
            duration: true,
          },
        },
        review: {
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // 3. Split into upcoming and past
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const upcoming: BookingWithRelations[] = [];
    const past: BookingWithRelations[] = [];

    for (const booking of bookings) {
      const isPast =
        isDateInPast(booking.preferredDate) || booking.status === 'CANCELLED';

      const bookingData: BookingWithRelations = {
        ...booking,
        status: booking.status as 'PENDING' | 'CONFIRMED' | 'CANCELLED',
      };

      if (isPast) {
        past.push(bookingData);
      } else {
        upcoming.push(bookingData);
      }
    }

    return {
      success: true,
      data: {
        upcoming,
        past,
      },
    };
  } catch (error) {
    console.error('Error fetching customer bookings:', error);
    return {
      success: false,
      error:
        'Fehler beim Laden der Buchungen. Bitte versuchen Sie es später erneut.',
    };
  }
}

/**
 * Get Booking Details
 * Fetches detailed information for a single booking
 */
export async function getBookingDetails(
  bookingId: string
): Promise<BookingDetailsResult> {
  try {
    // 1. Validate input
    if (!bookingId || typeof bookingId !== 'string') {
      return {
        success: false,
        error: 'Ungültige Buchungs-ID.',
      };
    }

    // 2. Authenticate
    const user = await getAuthenticatedUser();

    if (!user) {
      return {
        success: false,
        error: 'Nicht authentifiziert. Bitte melden Sie sich an.',
      };
    }

    // 3. Fetch booking with relations
    const booking = await prisma.newBooking.findUnique({
      where: {
        id: bookingId,
      },
      include: {
        studio: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            price: true,
            duration: true,
          },
        },
        review: {
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
          },
        },
      },
    });

    // 4. Verify booking exists
    if (!booking) {
      return {
        success: false,
        error: 'Buchung nicht gefunden.',
      };
    }

    // 5. Verify booking belongs to user
    if (booking.customerId !== user.id) {
      return {
        success: false,
        error: 'Sie haben keine Berechtigung, diese Buchung anzuzeigen.',
      };
    }

    // 6. Return booking details
    return {
      success: true,
      data: {
        ...booking,
        status: booking.status as 'PENDING' | 'CONFIRMED' | 'CANCELLED',
      },
    };
  } catch (error) {
    console.error('Error fetching booking details:', error);
    return {
      success: false,
      error:
        'Fehler beim Laden der Buchungsdetails. Bitte versuchen Sie es später erneut.',
    };
  }
}

/**
 * Cancel Booking
 * Cancels a customer booking with validation
 */
export async function cancelBooking(
  input: CancelBookingInput
): Promise<BookingMutationResult> {
  try {
    // 1. Authenticate
    const user = await getAuthenticatedUser();

    if (!user) {
      return {
        success: false,
        error: 'Nicht authentifiziert. Bitte melden Sie sich an.',
      };
    }

    // 2. Validate input
    const validated = cancelBookingSchema.safeParse(input);

    if (!validated.success) {
      return {
        success: false,
        error: 'Ungültige Eingabedaten.',
        fieldErrors: validated.error.flatten().fieldErrors,
      };
    }

    // 3. Fetch booking
    const booking = await prisma.newBooking.findUnique({
      where: {
        id: validated.data.bookingId,
      },
    });

    // 4. Verify booking exists
    if (!booking) {
      return {
        success: false,
        error: 'Buchung nicht gefunden.',
      };
    }

    // 5. Verify booking belongs to user
    if (booking.customerId !== user.id) {
      return {
        success: false,
        error: 'Sie haben keine Berechtigung, diese Buchung zu stornieren.',
      };
    }

    // 6. Verify booking can be cancelled
    if (booking.status === 'CANCELLED') {
      return {
        success: false,
        error: 'Diese Buchung wurde bereits storniert.',
      };
    }

    // 7. Check if booking is in the past
    if (isDateInPast(booking.preferredDate)) {
      return {
        success: false,
        error: 'Vergangene Buchungen können nicht storniert werden.',
      };
    }

    // 8. Verify booking status allows cancellation
    if (booking.status !== 'PENDING' && booking.status !== 'CONFIRMED') {
      return {
        success: false,
        error: 'Diese Buchung kann nicht storniert werden.',
      };
    }

    // 9. Update booking to CANCELLED
    await prisma.newBooking.update({
      where: {
        id: validated.data.bookingId,
      },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelledBy: user.id,
        cancellationReason: validated.data.reason || 'Vom Kunden storniert',
      },
    });

    // 10. Revalidate customer bookings page
    revalidatePath('/[locale]/customer/bookings', 'page');

    return {
      success: true,
      message: 'Buchung erfolgreich storniert.',
    };
  } catch (error) {
    console.error('Error cancelling booking:', error);
    return {
      success: false,
      error:
        'Fehler beim Stornieren der Buchung. Bitte versuchen Sie es später erneut.',
    };
  }
}

/**
 * Reschedule Booking
 * Updates the preferred date and time for a booking
 */
export async function rescheduleBooking(
  input: RescheduleBookingInput
): Promise<BookingMutationResult> {
  try {
    // 1. Authenticate
    const user = await getAuthenticatedUser();

    if (!user) {
      return {
        success: false,
        error: 'Nicht authentifiziert. Bitte melden Sie sich an.',
      };
    }

    // 2. Validate input
    const validated = rescheduleBookingSchema.safeParse(input);

    if (!validated.success) {
      return {
        success: false,
        error: 'Ungültige Eingabedaten.',
        fieldErrors: validated.error.flatten().fieldErrors,
      };
    }

    // 3. Validate new date is not in the past
    if (isDateInPast(validated.data.newDate)) {
      return {
        success: false,
        error: 'Das neue Datum darf nicht in der Vergangenheit liegen.',
      };
    }

    // 4. Fetch booking
    const booking = await prisma.newBooking.findUnique({
      where: {
        id: validated.data.bookingId,
      },
    });

    // 5. Verify booking exists
    if (!booking) {
      return {
        success: false,
        error: 'Buchung nicht gefunden.',
      };
    }

    // 6. Verify booking belongs to user
    if (booking.customerId !== user.id) {
      return {
        success: false,
        error: 'Sie haben keine Berechtigung, diese Buchung zu ändern.',
      };
    }

    // 7. Verify booking can be rescheduled
    if (booking.status === 'CANCELLED') {
      return {
        success: false,
        error: 'Stornierte Buchungen können nicht umgebucht werden.',
      };
    }

    // 8. Verify booking status allows rescheduling
    if (booking.status !== 'PENDING' && booking.status !== 'CONFIRMED') {
      return {
        success: false,
        error: 'Diese Buchung kann nicht umgebucht werden.',
      };
    }

    // 9. Update booking with new date and time
    await prisma.newBooking.update({
      where: {
        id: validated.data.bookingId,
      },
      data: {
        preferredDate: validated.data.newDate,
        preferredTime: validated.data.newTime,
        // Reset confirmation if booking was already confirmed
        ...(booking.status === 'CONFIRMED' && {
          status: 'PENDING',
          confirmedAt: null,
          confirmedBy: null,
        }),
      },
    });

    // 10. Revalidate customer bookings page
    revalidatePath('/[locale]/customer/bookings', 'page');

    return {
      success: true,
      message: 'Buchung erfolgreich umgebucht.',
    };
  } catch (error) {
    console.error('Error rescheduling booking:', error);
    return {
      success: false,
      error:
        'Fehler beim Umbuchen. Bitte versuchen Sie es später erneut.',
    };
  }
}
