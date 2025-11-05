/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth-unified';
import { prisma } from '@/lib/prisma';

/**
 * Update Studio Profile Schema
 */
const updateStudioProfileSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().min(10).max(500),
  phone: z.string().min(10).optional().nullable(),
  email: z.string().email().optional().nullable(),
  address: z.string().min(5),
  city: z.string().min(2),
  postalCode: z.string().min(3).optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
});

export type UpdateStudioProfileInput = z.infer<typeof updateStudioProfileSchema>;

export type ProfileActionResult = {
  success: boolean;
  error?: string;
  data?: {
    id: string;
    name: string;
  };
};

/**
 * Get user's studio
 */
async function getUserStudio(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      ownedStudios: {
        include: {
          studio: true,
        },
      },
    },
  });

  return user?.ownedStudios[0]?.studio ?? null;
}

/**
 * Update studio profile
 */
export async function updateStudioProfile(
  data: UpdateStudioProfileInput
): Promise<ProfileActionResult> {
  try {
    // 1. Authenticate
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Unauthorized. Please sign in.',
      };
    }

    // 2. Get user's studio
    const studio = await getUserStudio(session.user.id);

    if (!studio) {
      return {
        success: false,
        error: 'No studio found. Please register a studio first.',
      };
    }

    // 3. Validate input
    const validated = updateStudioProfileSchema.safeParse(data);

    if (!validated.success) {
      return {
        success: false,
        error: 'Invalid data. Please check all fields and try again.',
      };
    }

    // 4. Update studio
    // Convert null to undefined for Prisma
    const updateData = Object.fromEntries(
      Object.entries(validated.data).map(([key, value]) => [
        key,
        value === null ? undefined : value,
      ])
    );

    const updatedStudio = await prisma.studio.update({
      where: { id: studio.id },
      data: updateData,
    });

    // 5. Revalidate pages
    revalidatePath('/business/settings/profile');
    revalidatePath('/business');

    return {
      success: true,
      data: {
        id: updatedStudio.id,
        name: updatedStudio.name,
      },
    };
  } catch (error) {
    console.error('Update studio profile error:', error);

    return {
      success: false,
      error: 'Failed to update studio profile. Please try again.',
    };
  }
}

/**
 * Update Opening Hours Schema
 */
const updateOpeningHoursSchema = z.object({
  openingHours: z.record(
    z.string(),
    z
      .object({
        open: z.string(),
        close: z.string(),
      })
      .nullable()
  ),
});

export type UpdateOpeningHoursInput = z.infer<typeof updateOpeningHoursSchema>;

/**
 * Update opening hours
 */
export async function updateOpeningHours(
  data: UpdateOpeningHoursInput
): Promise<ProfileActionResult> {
  try {
    // 1. Authenticate
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Unauthorized. Please sign in.',
      };
    }

    // 2. Get user's studio
    const studio = await getUserStudio(session.user.id);

    if (!studio) {
      return {
        success: false,
        error: 'No studio found. Please register a studio first.',
      };
    }

    // 3. Validate input
    const validated = updateOpeningHoursSchema.safeParse(data);

    if (!validated.success) {
      return {
        success: false,
        error: 'Invalid opening hours format.',
      };
    }

    // 4. Update opening hours
    const updatedStudio = await prisma.studio.update({
      where: { id: studio.id },
      data: {
        openingHours: validated.data.openingHours as any,
      },
    });

    // 5. Revalidate pages
    revalidatePath('/business/settings/profile');
    revalidatePath('/business');

    return {
      success: true,
      data: {
        id: updatedStudio.id,
        name: updatedStudio.name,
      },
    };
  } catch (error) {
    console.error('Update opening hours error:', error);

    return {
      success: false,
      error: 'Failed to update opening hours. Please try again.',
    };
  }
}
