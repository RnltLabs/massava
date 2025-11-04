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
 * Create Service Schema
 */
const createServiceSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().min(10).max(500),
  price: z.number().positive(),
  duration: z.number().int().positive(),
  category: z.string().min(2).max(50).optional(),
});

export type CreateServiceInput = z.infer<typeof createServiceSchema>;

/**
 * Update Service Schema
 */
const updateServiceSchema = z.object({
  id: z.string(),
  name: z.string().min(3).max(100),
  description: z.string().min(10).max(500),
  price: z.number().positive(),
  duration: z.number().int().positive(),
  category: z.string().min(2).max(50).optional(),
});

export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;

export type ServiceActionResult = {
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
 * Create a new service
 */
export async function createService(data: CreateServiceInput): Promise<ServiceActionResult> {
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
    const validated = createServiceSchema.safeParse(data);

    if (!validated.success) {
      return {
        success: false,
        error: 'Invalid data. Please check all fields and try again.',
      };
    }

    // 4. Create service
    const service = await prisma.service.create({
      data: {
        ...validated.data,
        studioId: studio.id,
      },
    });

    // 5. Revalidate pages
    revalidatePath('/business/settings/services');
    revalidatePath('/business');

    return {
      success: true,
      data: {
        id: service.id,
        name: service.name,
      },
    };
  } catch (error) {
    console.error('Create service error:', error);

    return {
      success: false,
      error: 'Failed to create service. Please try again.',
    };
  }
}

/**
 * Update an existing service
 */
export async function updateService(data: UpdateServiceInput): Promise<ServiceActionResult> {
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
    const validated = updateServiceSchema.safeParse(data);

    if (!validated.success) {
      return {
        success: false,
        error: 'Invalid data. Please check all fields and try again.',
      };
    }

    // 4. Verify service belongs to user's studio
    const existingService = await prisma.service.findFirst({
      where: {
        id: validated.data.id,
        studioId: studio.id,
      },
    });

    if (!existingService) {
      return {
        success: false,
        error: 'Service not found or you do not have permission to edit it.',
      };
    }

    // 5. Update service
    const { id, ...updateData } = validated.data;
    const service = await prisma.service.update({
      where: { id },
      data: updateData,
    });

    // 6. Revalidate pages
    revalidatePath('/business/settings/services');
    revalidatePath('/business');

    return {
      success: true,
      data: {
        id: service.id,
        name: service.name,
      },
    };
  } catch (error) {
    console.error('Update service error:', error);

    return {
      success: false,
      error: 'Failed to update service. Please try again.',
    };
  }
}

/**
 * Delete a service
 */
export async function deleteService(serviceId: string): Promise<ServiceActionResult> {
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

    // 3. Verify service belongs to user's studio
    const service = await prisma.service.findFirst({
      where: {
        id: serviceId,
        studioId: studio.id,
      },
    });

    if (!service) {
      return {
        success: false,
        error: 'Service not found or you do not have permission to delete it.',
      };
    }

    // 4. Delete service
    await prisma.service.delete({
      where: { id: serviceId },
    });

    // 5. Revalidate pages
    revalidatePath('/business/settings/services');
    revalidatePath('/business');

    return {
      success: true,
      data: {
        id: service.id,
        name: service.name,
      },
    };
  } catch (error) {
    console.error('Delete service error:', error);

    return {
      success: false,
      error: 'Failed to delete service. Please try again.',
    };
  }
}
