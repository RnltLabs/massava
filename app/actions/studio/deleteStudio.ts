/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Studio Deletion Action
 * Secure server action for permanently deleting a studio
 */

'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import fs from 'fs/promises';
import path from 'path';
import { checkDeletionRateLimit } from '@/lib/rate-limit';
import { sendStudioDeletionConfirmedEmail } from '@/lib/email/send';

// Validation schema
const deleteStudioSchema = z.object({
  studioId: z.string().min(1),
  password: z.string().min(1),
});

type DeleteStudioInput = z.infer<typeof deleteStudioSchema>;

/**
 * Delete studio images from file system
 */
async function deleteStudioImages(studioId: string): Promise<void> {
  try {
    const studioDir = path.join(process.cwd(), 'public', 'uploads', 'studios', studioId);

    // Check if directory exists
    try {
      await fs.access(studioDir);
      // Directory exists, delete it
      await fs.rm(studioDir, { recursive: true, force: true });
      console.log(`[deleteStudio] Deleted studio images directory: ${studioDir}`);
    } catch (error) {
      // Directory doesn't exist, skip
      console.log(`[deleteStudio] No images directory to delete for studio: ${studioId}`);
    }
  } catch (error) {
    console.error('[deleteStudio] Error deleting studio images:', error);
    // Don't throw - we still want to delete the database records
  }
}

/**
 * Delete studio and all related data
 * Requires password verification and ownership check
 */
export async function deleteStudio(input: DeleteStudioInput): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // 1. Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Nicht authentifiziert' };
    }

    const userId = session.user.id;

    // 2. Rate limiting check (distributed with Redis)
    const rateLimitCheck = await checkDeletionRateLimit(userId);
    if (!rateLimitCheck.allowed) {
      return { success: false, error: rateLimitCheck.error };
    }

    // 3. Validate input
    const validated = deleteStudioSchema.safeParse(input);
    if (!validated.success) {
      return { success: false, error: 'Ungültige Eingabe' };
    }

    const { studioId, password } = validated.data;

    // 4. Get user with password hash
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        password: true,
        email: true,
        name: true,
      },
    });

    if (!user) {
      return { success: false, error: 'Benutzer nicht gefunden' };
    }

    // 5. Verify password
    if (!user.password) {
      return {
        success: false,
        error: 'Passwort-Verifizierung fehlgeschlagen. Bitte setzen Sie Ihr Passwort zurück.'
      };
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return { success: false, error: 'Falsches Passwort. Bitte versuchen Sie es erneut.' };
    }

    // 6. Verify studio ownership
    const ownership = await prisma.studioOwnership.findFirst({
      where: {
        userId: userId,
        studioId: studioId,
      },
      include: {
        studio: {
          select: {
            id: true,
            name: true,
            galleryImages: true,
            logoUrl: true,
          },
        },
      },
    });

    if (!ownership) {
      return { success: false, error: 'Studio nicht gefunden oder keine Berechtigung' };
    }

    const studioName = ownership.studio.name;

    // 7. Delete images from file system BEFORE database transaction
    // Rationale: If DB transaction succeeds but file deletion fails, we have orphaned DB records (bad).
    // If file deletion succeeds but DB fails, transaction rolls back and files can be cleaned up manually (better).
    await deleteStudioImages(studioId);

    // 8. Delete all related data in a transaction
    // Order matters: child records first, then parent
    await prisma.$transaction(async (tx) => {
      // Delete services
      const deletedServices = await tx.service.deleteMany({
        where: { studioId },
      });
      console.log(`[deleteStudio] Deleted ${deletedServices.count} services for studio ${studioId}`);

      // Delete bookings (NewBooking table)
      const deletedBookings = await tx.newBooking.deleteMany({
        where: { studioId },
      });
      console.log(`[deleteStudio] Deleted ${deletedBookings.count} bookings for studio ${studioId}`);

      // Delete studio ownership records
      const deletedOwnerships = await tx.studioOwnership.deleteMany({
        where: { studioId },
      });
      console.log(`[deleteStudio] Deleted ${deletedOwnerships.count} ownership records for studio ${studioId}`);

      // Delete studio itself
      await tx.studio.delete({
        where: { id: studioId },
      });
      console.log(`[deleteStudio] Deleted studio ${studioId} (${studioName})`);
    });

    // 9. Audit log
    console.log(
      `[AUDIT] User ${userId} (${user.email}) deleted studio ${studioId} (${studioName}) at ${new Date().toISOString()}`
    );

    // 10. TASK 3.4: Send studio deletion confirmed email
    try {
      const emailResult = await sendStudioDeletionConfirmedEmail(
        user.email,
        {
          studioName,
          ownerName: user.name || 'Studio Owner',
        },
        'de'
      );

      if (!emailResult.success) {
        console.error('Failed to send studio deletion confirmed email:', emailResult.error);
        // Note: We don't fail the entire operation if email fails
      } else {
        console.log('Studio deletion confirmed email sent successfully');
      }
    } catch (emailError) {
      console.error('Exception sending studio deletion confirmed email:', emailError);
      // Note: We don't fail the entire operation if email fails
    }

    // 11. Revalidate paths
    revalidatePath('/[locale]/dashboard');
    revalidatePath('/[locale]/dashboard/owner/settings');

    return { success: true };
  } catch (error) {
    console.error('[deleteStudio] Error deleting studio:', error);

    // Check for specific errors
    if (error instanceof Error) {
      // Foreign key constraint errors
      if (error.message.includes('foreign key constraint')) {
        return {
          success: false,
          error: 'Studio konnte nicht gelöscht werden. Bitte kontaktieren Sie den Support.',
        };
      }
    }

    return {
      success: false,
      error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.',
    };
  }
}

/**
 * Verify user password (without deletion)
 * Used for password verification step
 */
export async function verifyUserPassword(password: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Nicht authentifiziert' };
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { password: true },
    });

    if (!user || !user.password) {
      return { success: false, error: 'Passwort nicht gefunden' };
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return { success: false, error: 'Falsches Passwort' };
    }

    return { success: true };
  } catch (error) {
    console.error('[verifyUserPassword] Error:', error);
    return { success: false, error: 'Fehler bei der Passwort-Verifizierung' };
  }
}
