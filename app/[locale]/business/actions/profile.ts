/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

/**
 * Update Studio Profile Schema
 */
const updateStudioProfileSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().min(10).max(500),
  phone: z.string().min(10).optional().nullable(),
  email: z.string().email().optional().nullable(),
  website: z.string().url().optional().nullable().or(z.literal('')),
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
    revalidatePath('/business/settings/location');
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
    revalidatePath('/business/settings/hours');
    revalidatePath('/business/settings/profile');
    revalidatePath('/business/settings/studio');
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

/**
 * Update Basic Info Schema (partial update)
 */
const updateBasicInfoSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().min(10).max(500),
});

export type UpdateBasicInfoInput = z.infer<typeof updateBasicInfoSchema>;

/**
 * Update studio basic info (name and description only)
 */
export async function updateStudioBasicInfo(
  data: UpdateBasicInfoInput
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
    const validated = updateBasicInfoSchema.safeParse(data);

    if (!validated.success) {
      return {
        success: false,
        error: 'Invalid data. Please check all fields and try again.',
      };
    }

    // 4. Update studio
    const updatedStudio = await prisma.studio.update({
      where: { id: studio.id },
      data: {
        name: validated.data.name,
        description: validated.data.description,
      },
    });

    // 5. Revalidate pages
    revalidatePath('/business/settings/profile');
    revalidatePath('/business/settings/studio');
    revalidatePath('/business');

    return {
      success: true,
      data: {
        id: updatedStudio.id,
        name: updatedStudio.name,
      },
    };
  } catch (error) {
    console.error('Update studio basic info error:', error);

    return {
      success: false,
      error: 'Failed to update studio basic info. Please try again.',
    };
  }
}

/**
 * Update Location & Contact Schema (partial update)
 */
const updateLocationContactSchema = z.object({
  address: z.string().min(5),
  city: z.string().min(2),
  postalCode: z.string().min(3),
  phone: z.string().min(10),
  email: z.string().email(),
  website: z.string().url().optional().nullable().or(z.literal('')),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
});

export type UpdateLocationContactInput = z.infer<typeof updateLocationContactSchema>;

/**
 * Update studio location and contact info
 */
export async function updateStudioLocationContact(
  data: UpdateLocationContactInput
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
    const validated = updateLocationContactSchema.safeParse(data);

    if (!validated.success) {
      return {
        success: false,
        error: 'Invalid data. Please check all fields and try again.',
      };
    }

    // 4. Update studio
    const updatedStudio = await prisma.studio.update({
      where: { id: studio.id },
      data: {
        address: validated.data.address,
        city: validated.data.city,
        postalCode: validated.data.postalCode,
        phone: validated.data.phone,
        email: validated.data.email,
        website: validated.data.website || undefined,
        latitude: validated.data.latitude || undefined,
        longitude: validated.data.longitude || undefined,
      },
    });

    // 5. Revalidate pages
    revalidatePath('/business/settings/location');
    revalidatePath('/business/settings/studio');
    revalidatePath('/business');

    return {
      success: true,
      data: {
        id: updatedStudio.id,
        name: updatedStudio.name,
      },
    };
  } catch (error) {
    console.error('Update studio location/contact error:', error);

    return {
      success: false,
      error: 'Failed to update studio location/contact. Please try again.',
    };
  }
}

/**
 * Update Address Schema (partial update - address only)
 */
const updateAddressSchema = z.object({
  address: z.string().min(5),
  line2: z.string().optional().nullable(),
  city: z.string().min(2),
  postalCode: z.string().min(3),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
});

export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;

/**
 * Update studio address only
 */
export async function updateStudioAddress(
  data: UpdateAddressInput
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
    const validated = updateAddressSchema.safeParse(data);

    if (!validated.success) {
      return {
        success: false,
        error: 'Invalid data. Please check all fields and try again.',
      };
    }

    // 4. Update studio
    const updatedStudio = await prisma.studio.update({
      where: { id: studio.id },
      data: {
        address: validated.data.address,
        city: validated.data.city,
        postalCode: validated.data.postalCode,
        latitude: validated.data.latitude || undefined,
        longitude: validated.data.longitude || undefined,
      },
    });

    // 5. Revalidate pages
    revalidatePath('/business/settings/location');
    revalidatePath('/business/settings/studio');
    revalidatePath('/business');

    return {
      success: true,
      data: {
        id: updatedStudio.id,
        name: updatedStudio.name,
      },
    };
  } catch (error) {
    console.error('Update studio address error:', error);

    return {
      success: false,
      error: 'Failed to update studio address. Please try again.',
    };
  }
}

/**
 * Update Contact Schema (partial update - contact only)
 */
const updateContactSchema = z.object({
  phone: z.string().min(10),
  email: z.string().email(),
  website: z.string().url().optional().nullable().or(z.literal('')),
});

export type UpdateContactInput = z.infer<typeof updateContactSchema>;

/**
 * Update studio contact info only
 */
export async function updateStudioContact(
  data: UpdateContactInput
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
    const validated = updateContactSchema.safeParse(data);

    if (!validated.success) {
      return {
        success: false,
        error: 'Invalid data. Please check all fields and try again.',
      };
    }

    // 4. Update studio
    const updatedStudio = await prisma.studio.update({
      where: { id: studio.id },
      data: {
        phone: validated.data.phone,
        email: validated.data.email,
        website: validated.data.website || undefined,
      },
    });

    // 5. Revalidate pages
    revalidatePath('/business/settings/location');
    revalidatePath('/business/settings/studio');
    revalidatePath('/business');

    return {
      success: true,
      data: {
        id: updatedStudio.id,
        name: updatedStudio.name,
      },
    };
  } catch (error) {
    console.error('Update studio contact error:', error);

    return {
      success: false,
      error: 'Failed to update studio contact. Please try again.',
    };
  }
}
