/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Service Management Actions
 * Server actions for creating, updating, and deleting services
 */

'use server';

import { auth } from '@/auth-unified';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export interface ServiceActionResult {
  success: boolean;
  error?: string;
  serviceId?: string;
}

interface ServiceFormData {
  name: string;
  duration: number;
  price: number;
  description?: string;
}

/**
 * Create a new service
 */
export async function createService(
  studioId: string,
  data: ServiceFormData
): Promise<ServiceActionResult> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Nicht authentifiziert',
      };
    }

    // Verify user owns the studio
    const ownership = await db.studioOwnership.findFirst({
      where: {
        studioId,
        userId: session.user.id,
      },
    });

    if (!ownership) {
      return {
        success: false,
        error: 'Keine Berechtigung für dieses Studio',
      };
    }

    // Validate data
    if (!data.name || data.name.length < 3 || data.name.length > 100) {
      return {
        success: false,
        error: 'Service-Name muss zwischen 3 und 100 Zeichen lang sein',
      };
    }

    if (!data.duration || data.duration < 15 || data.duration > 240) {
      return {
        success: false,
        error: 'Dauer muss zwischen 15 und 240 Minuten liegen',
      };
    }

    if (!data.price || data.price < 5 || data.price > 500) {
      return {
        success: false,
        error: 'Preis muss zwischen 5€ und 500€ liegen',
      };
    }

    // Create service
    const service = await db.service.create({
      data: {
        studioId,
        name: data.name.trim(),
        duration: data.duration,
        price: data.price,
        description: data.description?.trim() || null,
      },
    });

    // Revalidate pages
    revalidatePath('/[locale]/dashboard/owner/services');
    revalidatePath('/[locale]/dashboard/owner');

    return {
      success: true,
      serviceId: service.id,
    };
  } catch (error) {
    console.error('Error creating service:', error);
    return {
      success: false,
      error: 'Ein Fehler ist aufgetreten',
    };
  }
}

/**
 * Update an existing service
 */
export async function updateService(
  serviceId: string,
  data: Partial<ServiceFormData>
): Promise<ServiceActionResult> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Nicht authentifiziert',
      };
    }

    // Get service with studio
    const service = await db.service.findUnique({
      where: { id: serviceId },
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

    if (!service) {
      return {
        success: false,
        error: 'Service nicht gefunden',
      };
    }

    // Verify user owns the studio
    if (service.studio.ownerships.length === 0) {
      return {
        success: false,
        error: 'Keine Berechtigung für diesen Service',
      };
    }

    // Validate data if provided
    if (data.name !== undefined) {
      if (data.name.length < 3 || data.name.length > 100) {
        return {
          success: false,
          error: 'Service-Name muss zwischen 3 und 100 Zeichen lang sein',
        };
      }
    }

    if (data.duration !== undefined) {
      if (data.duration < 15 || data.duration > 240) {
        return {
          success: false,
          error: 'Dauer muss zwischen 15 und 240 Minuten liegen',
        };
      }
    }

    if (data.price !== undefined) {
      if (data.price < 5 || data.price > 500) {
        return {
          success: false,
          error: 'Preis muss zwischen 5€ und 500€ liegen',
        };
      }
    }

    // Update service
    const updateData: Partial<ServiceFormData> = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.duration !== undefined) updateData.duration = data.duration;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.description !== undefined)
      updateData.description = data.description.trim() || undefined;

    await db.service.update({
      where: { id: serviceId },
      data: updateData,
    });

    // Revalidate pages
    revalidatePath('/[locale]/dashboard/owner/services');
    revalidatePath('/[locale]/dashboard/owner');

    return {
      success: true,
      serviceId,
    };
  } catch (error) {
    console.error('Error updating service:', error);
    return {
      success: false,
      error: 'Ein Fehler ist aufgetreten',
    };
  }
}

/**
 * Delete a service (hard delete)
 * NOTE: Service model doesn't have deletedAt field yet
 * Using hard delete for now - prevents deletion if active bookings exist
 */
export async function deleteService(serviceId: string): Promise<ServiceActionResult> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Nicht authentifiziert',
      };
    }

    // Get service with studio
    const service = await db.service.findUnique({
      where: { id: serviceId },
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
        _count: {
          select: {
            newBookings: {
              where: {
                status: {
                  in: ['PENDING', 'CONFIRMED'],
                },
              },
            },
          },
        },
      },
    });

    if (!service) {
      return {
        success: false,
        error: 'Service nicht gefunden',
      };
    }

    // Verify user owns the studio
    if (service.studio.ownerships.length === 0) {
      return {
        success: false,
        error: 'Keine Berechtigung für diesen Service',
      };
    }

    // Check for active bookings
    if (service._count.newBookings > 0) {
      return {
        success: false,
        error: `Dieser Service hat ${service._count.newBookings} aktive Buchung(en) und kann nicht gelöscht werden`,
      };
    }

    // Hard delete (since deletedAt doesn't exist in schema yet)
    await db.service.delete({
      where: { id: serviceId },
    });

    // Revalidate pages
    revalidatePath('/[locale]/dashboard/owner/services');
    revalidatePath('/[locale]/dashboard/owner');

    return {
      success: true,
    };
  } catch (error) {
    console.error('Error deleting service:', error);
    return {
      success: false,
      error: 'Ein Fehler ist aufgetreten',
    };
  }
}
