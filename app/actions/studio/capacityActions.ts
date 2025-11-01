/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Studio Capacity Management Actions
 * Server actions for capacity settings and parallel booking management
 */

'use server';

import { auth } from '@/auth-unified';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// Validation schema
const updateCapacitySchema = z.object({
  studioId: z.string().min(1),
  capacity: z.number().int().min(1).max(10),
});

type UpdateCapacityInput = z.infer<typeof updateCapacitySchema>;

/**
 * Update studio capacity setting
 */
export async function updateStudioCapacity(input: UpdateCapacityInput): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Nicht authentifiziert' };
    }

    // Validate input
    const validated = updateCapacitySchema.safeParse(input);
    if (!validated.success) {
      return {
        success: false,
        error: 'Ungültige Eingabe: Kapazität muss zwischen 1 und 10 liegen',
      };
    }

    const { studioId, capacity } = validated.data;

    // Verify ownership
    const ownership = await db.studioOwnership.findFirst({
      where: {
        userId: session.user.id,
        studioId: studioId,
      },
    });

    if (!ownership) {
      return { success: false, error: 'Keine Berechtigung für dieses Studio' };
    }

    // Update capacity
    await db.studio.update({
      where: { id: studioId },
      data: { capacity },
    });

    // Revalidate relevant pages
    revalidatePath('/[locale]/dashboard/owner/settings');
    revalidatePath('/[locale]/dashboard/owner/calendar');

    return { success: true };
  } catch (error) {
    console.error('Error updating capacity:', error);
    return {
      success: false,
      error: 'Fehler beim Speichern der Kapazität',
    };
  }
}

/**
 * Get current capacity setting
 */
export async function getStudioCapacity(studioId: string): Promise<{
  success: boolean;
  capacity?: number;
  error?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Nicht authentifiziert' };
    }

    // Verify ownership
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
      return { success: false, error: 'Keine Berechtigung' };
    }

    return {
      success: true,
      capacity: ownership.studio.capacity,
    };
  } catch (error) {
    console.error('Error fetching capacity:', error);
    return { success: false, error: 'Fehler beim Laden der Kapazität' };
  }
}

/**
 * Check capacity for a specific timeslot
 * Returns current bookings count and max capacity
 */
export async function checkTimeslotCapacity(
  studioId: string,
  date: string,
  time: string
): Promise<{
  success: boolean;
  current?: number;
  max?: number;
  isFull?: boolean;
  bookings?: Array<{
    id: string;
    customerName: string;
    serviceName: string;
  }>;
  error?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Nicht authentifiziert' };
    }

    // Verify ownership and get capacity
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
      return { success: false, error: 'Keine Berechtigung' };
    }

    const maxCapacity = ownership.studio.capacity;

    // Count confirmed bookings for this timeslot
    const bookings = await db.newBooking.findMany({
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

    const currentCount = bookings.length;
    const isFull = currentCount >= maxCapacity;

    return {
      success: true,
      current: currentCount,
      max: maxCapacity,
      isFull,
      bookings: bookings.map((b) => ({
        id: b.id,
        customerName: b.customerName,
        serviceName: b.service?.name || 'Service gelöscht',
      })),
    };
  } catch (error) {
    console.error('Error checking capacity:', error);
    return { success: false, error: 'Fehler beim Prüfen der Kapazität' };
  }
}
