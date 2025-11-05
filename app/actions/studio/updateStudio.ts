/**
 * Studio Update Server Action
 */

'use server';

import { z } from 'zod';
import { auth } from '@/auth-unified';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

/**
 * Hours range schema
 */
const hoursSchema = z.object({
  open: z.string(),
  close: z.string(),
});

/**
 * Update studio schema (all fields optional)
 */
const updateStudioSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  description: z.string().min(10).max(500).optional(),
  address: z
    .object({
      street: z.string().min(5),
      line2: z.string().optional(),
      city: z.string().min(2),
      postalCode: z.string().min(3),
      country: z.string().min(2),
    })
    .optional(),
  contact: z
    .object({
      phone: z.string().min(10),
      email: z.string().email(),
      website: z.string().url().optional(),
    })
    .optional(),
  openingHours: z
    .object({
      mode: z.enum(['same', 'different']),
      sameHours: hoursSchema.optional(),
      differentHours: z.record(z.string(), hoursSchema.nullable()).optional(),
    })
    .optional(),
  capacity: z.number().int().min(1).max(10).optional(),
});

type UpdateStudioInput = z.infer<typeof updateStudioSchema>;

type ActionResult = {
  success: boolean;
  error?: string;
};

/**
 * Update an existing studio
 */
export async function updateStudio(
  studioId: string,
  data: UpdateStudioInput
): Promise<ActionResult> {
  try {
    // 1. Get authenticated user
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Unauthorized. Please sign in.',
      };
    }

    // 2. Verify user owns the studio
    const ownership = await prisma.studioOwnership.findFirst({
      where: {
        studioId,
        userId: session.user.id,
      },
    });

    if (!ownership) {
      return {
        success: false,
        error: 'Not authorized to modify this studio',
      };
    }

    // 3. Validate input
    const validated = updateStudioSchema.safeParse(data);

    if (!validated.success) {
      console.error('Validation error:', validated.error);
      return {
        success: false,
        error: 'Invalid data. Please check all fields and try again.',
      };
    }

    const { name, description, address, contact, openingHours, capacity } = validated.data;

    // Build update data object
    const updateData: any = {};

    if (name) updateData.name = name;
    if (description) updateData.description = description;

    if (address) {
      updateData.address = `${address.street}${address.line2 ? ', ' + address.line2 : ''}`;
      updateData.city = address.city;
      updateData.postalCode = address.postalCode;
    }

    if (contact) {
      updateData.phone = contact.phone;
      updateData.email = contact.email;
    }

    if (openingHours) {
      if (openingHours.mode === 'same' && openingHours.sameHours) {
        updateData.openingHours = {
          everyday: openingHours.sameHours,
        };
      } else if (openingHours.mode === 'different' && openingHours.differentHours) {
        updateData.openingHours = openingHours.differentHours;
      }
    }

    if (capacity) updateData.capacity = capacity;

    // 4. Update studio
    await prisma.studio.update({
      where: { id: studioId },
      data: updateData,
    });

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/settings');

    console.log('Studio updated successfully:', {
      studioId,
      userId: session.user.id,
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error('Studio update error:', error);

    return {
      success: false,
      error: 'Failed to update studio. Please try again.',
    };
  }
}
