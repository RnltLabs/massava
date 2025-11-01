/**
 * Studio Registration Server Action
 */

'use server';

import { z } from 'zod';
import { auth } from '@/auth-unified';
import { prisma } from '@/lib/prisma';

/**
 * Hours range schema
 */
const hoursSchema = z.object({
  open: z.string(),
  close: z.string(),
});

/**
 * Registration schema (server-side validation)
 * Note: No state/Bundesland field - postal code is sufficient for DACH region
 */
const registerStudioSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().min(10).max(500),
  address: z.object({
    street: z.string().min(5),
    line2: z.string().optional(),
    city: z.string().min(2),
    postalCode: z.string().min(3),
    country: z.string().min(2),
  }),
  contact: z.object({
    phone: z.string().min(10),
    email: z.string().email(),
    website: z.string().url().optional(),
  }),
  openingHours: z
    .object({
      mode: z.enum(['same', 'different']),
      sameHours: hoursSchema.optional(),
      differentHours: z.record(z.string(), hoursSchema.nullable()).optional(),
    })
    .optional(),
  capacity: z.number().int().min(1).max(10).optional().default(2), // Treatment beds/rooms
});

type RegisterStudioInput = z.infer<typeof registerStudioSchema>;

type ActionResult = {
  success: boolean;
  studioId?: string;
  error?: string;
};

/**
 * Register a new studio
 */
export async function registerStudio(
  data: RegisterStudioInput
): Promise<ActionResult> {
  try {
    // 1. Get authenticated user
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Unauthorized. Please sign in to register a studio.',
      };
    }

    // 2. Validate input
    const validated = registerStudioSchema.safeParse(data);

    if (!validated.success) {
      console.error('Validation error:', validated.error);
      return {
        success: false,
        error: 'Invalid data. Please check all fields and try again.',
      };
    }

    const { name, description, address, contact, openingHours, capacity } = validated.data;

    // Transform opening hours to database format
    let openingHoursJson: any = null;
    if (openingHours) {
      if (openingHours.mode === 'same' && openingHours.sameHours) {
        openingHoursJson = {
          everyday: openingHours.sameHours,
        };
      } else if (openingHours.mode === 'different' && openingHours.differentHours) {
        openingHoursJson = openingHours.differentHours;
      }
    }

    // 3. Create studio with ownership
    const studio = await prisma.studio.create({
      data: {
        name,
        description,
        // Address fields (adapt to your schema)
        address: `${address.street}${address.line2 ? ', ' + address.line2 : ''}`,
        city: address.city,
        postalCode: address.postalCode,
        // Contact fields
        phone: contact.phone,
        email: contact.email,
        // Opening hours (stored as JSON)
        openingHours: openingHoursJson,
        // Capacity (treatment beds/rooms)
        capacity: capacity || 2, // Default: 2
        // Create ownership relation
        ownerships: {
          create: {
            userId: session.user.id,
            canTransfer: true,
          },
        },
      },
    });

    // 5. Assign STUDIO_OWNER role if not already assigned
    const existingRole = await prisma.userRoleAssignment.findFirst({
      where: {
        userId: session.user.id,
        role: 'STUDIO_OWNER',
      },
    });

    if (!existingRole) {
      await prisma.userRoleAssignment.create({
        data: {
          userId: session.user.id,
          role: 'STUDIO_OWNER',
        },
      });
    }

    console.log('Studio registered successfully:', {
      studioId: studio.id,
      name: studio.name,
      userId: session.user.id,
    });

    return {
      success: true,
      studioId: studio.id,
    };
  } catch (error) {
    console.error('Studio registration error:', error);

    // Check for unique constraint violations
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as { code: string; meta?: { target?: string[] } };

      if (prismaError.code === 'P2002') {
        return {
          success: false,
          error: 'A studio with this information already exists.',
        };
      }
    }

    return {
      success: false,
      error: 'Failed to register studio. Please try again.',
    };
  }
}
