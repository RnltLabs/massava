/**
 * Studio Registration Server Action
 */

'use server';

import { z } from 'zod';
import { auth } from '@/auth-unified';
import { prisma } from '@/lib/prisma';

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

    const { name, description, address, contact } = validated.data;

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
