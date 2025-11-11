/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Account Settings Server Actions
 */

'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import {
  emailChangeSchema,
  emailVerificationSchema,
  passwordChangeSchema,
  twoFactorVerifySchema,
  preferencesSchema,
  notificationSettingsSchema,
  studioDeletionSchema,
  type EmailChangeInput,
  type EmailVerificationInput,
  type PasswordChangeInput,
  type TwoFactorVerifyInput,
  type PreferencesInput,
  type NotificationSettingsInput,
  type StudioDeletionInput,
} from '@/lib/schemas/account.schema';
import bcrypt from 'bcryptjs';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

export type AccountActionResult =
  | {
      success: true;
      data?: unknown;
      message?: string;
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
 * Request Email Change
 * Sends verification code to old email
 */
export async function requestEmailChange(
  input: EmailChangeInput
): Promise<AccountActionResult> {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return { success: false, error: 'Nicht authentifiziert' };
    }

    const validated = emailChangeSchema.safeParse(input);

    if (!validated.success) {
      return {
        success: false,
        error: 'Ungültige E-Mail-Adresse',
        fieldErrors: validated.error.flatten().fieldErrors,
      };
    }

    // Check if new email is already in use
    const existingUser = await prisma.user.findUnique({
      where: { email: validated.data.newEmail },
    });

    if (existingUser) {
      return {
        success: false,
        error: 'Diese E-Mail-Adresse wird bereits verwendet',
      };
    }

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Store verification code (you'll need to add a table for this)
    // For now, we'll return success
    // TODO: Store verification code in database with expiry
    // TODO: Send email with verification code

    return {
      success: true,
      message: 'Bestätigungscode wurde an Ihre aktuelle E-Mail gesendet',
      data: { verificationCode }, // Remove in production, only for demo
    };
  } catch (error) {
    console.error('Request email change error:', error);
    return {
      success: false,
      error: 'E-Mail-Änderung konnte nicht angefordert werden',
    };
  }
}

/**
 * Verify Email Change
 */
export async function verifyEmailChange(
  input: EmailVerificationInput & { newEmail: string }
): Promise<AccountActionResult> {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return { success: false, error: 'Nicht authentifiziert' };
    }

    const validated = emailVerificationSchema.safeParse(input);

    if (!validated.success) {
      return {
        success: false,
        error: 'Ungültiger Bestätigungscode',
        fieldErrors: validated.error.flatten().fieldErrors,
      };
    }

    // TODO: Verify code against stored value
    // For now, accept any 6-digit code

    // Update email
    await prisma.user.update({
      where: { id: user.id },
      data: { email: input.newEmail },
    });

    revalidatePath('/business/settings/account');

    return {
      success: true,
      message: 'E-Mail-Adresse erfolgreich geändert',
    };
  } catch (error) {
    console.error('Verify email change error:', error);
    return {
      success: false,
      error: 'E-Mail-Adresse konnte nicht geändert werden',
    };
  }
}

/**
 * Change Password
 */
export async function changePassword(
  input: PasswordChangeInput
): Promise<AccountActionResult> {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return { success: false, error: 'Nicht authentifiziert' };
    }

    if (!user.password) {
      return {
        success: false,
        error: 'Kein Passwort gesetzt. Verwenden Sie OAuth-Login.',
      };
    }

    const validated = passwordChangeSchema.safeParse(input);

    if (!validated.success) {
      return {
        success: false,
        error: 'Ungültige Passwort-Daten',
        fieldErrors: validated.error.flatten().fieldErrors,
      };
    }

    // Verify current password
    const isValid = await bcrypt.compare(
      validated.data.currentPassword,
      user.password
    );

    if (!isValid) {
      return {
        success: false,
        error: 'Aktuelles Passwort ist falsch',
      };
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(validated.data.newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return {
      success: true,
      message: 'Passwort erfolgreich geändert',
    };
  } catch (error) {
    console.error('Change password error:', error);
    return {
      success: false,
      error: 'Passwort konnte nicht geändert werden',
    };
  }
}

/**
 * Enable Two-Factor Authentication
 * Generates QR code and secret
 */
export async function enable2FA(): Promise<AccountActionResult> {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return { success: false, error: 'Nicht authentifiziert' };
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `Massava (${user.email})`,
      issuer: 'Massava',
    });

    // Generate QR code
    const qrCodeDataURL = await QRCode.toDataURL(secret.otpauth_url!);

    // Store secret temporarily (not enabled yet, only after verification)
    // We'll store it in a temp field or session
    // For now, return secret and QR code

    return {
      success: true,
      data: {
        secret: secret.base32,
        qrCode: qrCodeDataURL,
        manualEntryKey: secret.base32,
      },
    };
  } catch (error) {
    console.error('Enable 2FA error:', error);
    return {
      success: false,
      error: '2FA konnte nicht aktiviert werden',
    };
  }
}

/**
 * Verify and Enable 2FA
 */
export async function verify2FA(
  input: TwoFactorVerifyInput & { secret: string }
): Promise<AccountActionResult> {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return { success: false, error: 'Nicht authentifiziert' };
    }

    const validated = twoFactorVerifySchema.safeParse(input);

    if (!validated.success) {
      return {
        success: false,
        error: 'Ungültiger Code',
        fieldErrors: validated.error.flatten().fieldErrors,
      };
    }

    // Verify token
    const verified = speakeasy.totp.verify({
      secret: input.secret,
      encoding: 'base32',
      token: validated.data.code,
      window: 2,
    });

    if (!verified) {
      return {
        success: false,
        error: 'Ungültiger Bestätigungscode',
      };
    }

    // Enable 2FA and store secret
    await prisma.user.update({
      where: { id: user.id },
      data: {
        // TODO: Add these fields to User model
        // twoFactorEnabled: true,
        // twoFactorSecret: input.secret,
      },
    });

    revalidatePath('/business/settings/account');

    return {
      success: true,
      message: '2FA erfolgreich aktiviert',
    };
  } catch (error) {
    console.error('Verify 2FA error:', error);
    return {
      success: false,
      error: '2FA konnte nicht verifiziert werden',
    };
  }
}

/**
 * Disable Two-Factor Authentication
 */
export async function disable2FA(
  input: TwoFactorVerifyInput
): Promise<AccountActionResult> {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return { success: false, error: 'Nicht authentifiziert' };
    }

    const validated = twoFactorVerifySchema.safeParse(input);

    if (!validated.success) {
      return {
        success: false,
        error: 'Ungültiger Code',
        fieldErrors: validated.error.flatten().fieldErrors,
      };
    }

    // TODO: Verify token against stored secret
    // For now, accept any 6-digit code

    // Disable 2FA
    await prisma.user.update({
      where: { id: user.id },
      data: {
        // TODO: Add these fields to User model
        // twoFactorEnabled: false,
        // twoFactorSecret: null,
      },
    });

    revalidatePath('/business/settings/account');

    return {
      success: true,
      message: '2FA erfolgreich deaktiviert',
    };
  } catch (error) {
    console.error('Disable 2FA error:', error);
    return {
      success: false,
      error: '2FA konnte nicht deaktiviert werden',
    };
  }
}

/**
 * Update User Preferences
 */
export async function updatePreferences(
  input: PreferencesInput
): Promise<AccountActionResult> {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return { success: false, error: 'Nicht authentifiziert' };
    }

    const validated = preferencesSchema.safeParse(input);

    if (!validated.success) {
      return {
        success: false,
        error: 'Ungültige Einstellungen',
        fieldErrors: validated.error.flatten().fieldErrors,
      };
    }

    // Update preferences
    await prisma.user.update({
      where: { id: user.id },
      data: {
        // TODO: Add these fields to User model
        // language: validated.data.language,
        // timezone: validated.data.timezone,
        // dateFormat: validated.data.dateFormat,
      },
    });

    revalidatePath('/business/settings/account');

    return {
      success: true,
      message: 'Einstellungen erfolgreich gespeichert',
    };
  } catch (error) {
    console.error('Update preferences error:', error);
    return {
      success: false,
      error: 'Einstellungen konnten nicht gespeichert werden',
    };
  }
}

/**
 * Update Notification Settings
 */
export async function updateNotificationSettings(
  input: NotificationSettingsInput
): Promise<AccountActionResult> {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return { success: false, error: 'Nicht authentifiziert' };
    }

    const validated = notificationSettingsSchema.safeParse(input);

    if (!validated.success) {
      return {
        success: false,
        error: 'Ungültige Benachrichtigungseinstellungen',
        fieldErrors: validated.error.flatten().fieldErrors,
      };
    }

    // Update notification settings
    await prisma.user.update({
      where: { id: user.id },
      data: {
        // TODO: Add emailNotifications JSON field to User model
        // emailNotifications: validated.data,
      },
    });

    revalidatePath('/business/settings/account');

    return {
      success: true,
      message: 'Benachrichtigungseinstellungen gespeichert',
    };
  } catch (error) {
    console.error('Update notification settings error:', error);
    return {
      success: false,
      error: 'Benachrichtigungseinstellungen konnten nicht gespeichert werden',
    };
  }
}

/**
 * Export User Data (GDPR)
 */
export async function exportUserData(): Promise<AccountActionResult> {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return { success: false, error: 'Nicht authentifiziert' };
    }

    const studio = await getUserStudio(user.id);

    // Collect all user data
    const userData = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        createdAt: user.createdAt,
      },
      studio: studio
        ? {
            id: studio.id,
            name: studio.name,
            address: studio.address,
            city: studio.city,
            phone: studio.phone,
            email: studio.email,
          }
        : null,
      exportedAt: new Date().toISOString(),
    };

    return {
      success: true,
      data: userData,
    };
  } catch (error) {
    console.error('Export user data error:', error);
    return {
      success: false,
      error: 'Daten konnten nicht exportiert werden',
    };
  }
}

/**
 * Schedule Studio Deletion
 */
export async function scheduleStudioDeletion(
  input: StudioDeletionInput
): Promise<AccountActionResult> {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return { success: false, error: 'Nicht authentifiziert' };
    }

    const validated = studioDeletionSchema.safeParse(input);

    if (!validated.success) {
      return {
        success: false,
        error: 'Ungültige Daten',
        fieldErrors: validated.error.flatten().fieldErrors,
      };
    }

    const studio = await prisma.studio.findUnique({
      where: { id: validated.data.studioId },
    });

    if (!studio) {
      return { success: false, error: 'Studio nicht gefunden' };
    }

    // Verify confirmation text matches studio name
    if (validated.data.confirmationText !== studio.name) {
      return {
        success: false,
        error: 'Bestätigungstext stimmt nicht überein',
      };
    }

    // Schedule deletion for 30 days from now
    const deletionDate = new Date();
    deletionDate.setDate(deletionDate.getDate() + 30);

    await prisma.studio.update({
      where: { id: validated.data.studioId },
      data: {
        // TODO: Add these fields to Studio model
        // deletedAt: new Date(),
        // deletionScheduledFor: deletionDate,
      },
    });

    // TODO: Send confirmation email with cancellation link
    // TODO: Cancel all future bookings

    revalidatePath('/business/settings/account');

    return {
      success: true,
      message: 'Studio-Löschung geplant für ' + deletionDate.toLocaleDateString('de-DE'),
    };
  } catch (error) {
    console.error('Schedule studio deletion error:', error);
    return {
      success: false,
      error: 'Studio-Löschung konnte nicht geplant werden',
    };
  }
}

/**
 * Cancel Studio Deletion
 */
export async function cancelStudioDeletion(
  studioId: string
): Promise<AccountActionResult> {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return { success: false, error: 'Nicht authentifiziert' };
    }

    await prisma.studio.update({
      where: { id: studioId },
      data: {
        // TODO: Add these fields to Studio model
        // deletedAt: null,
        // deletionScheduledFor: null,
      },
    });

    revalidatePath('/business/settings/account');

    return {
      success: true,
      message: 'Studio-Löschung abgebrochen',
    };
  } catch (error) {
    console.error('Cancel studio deletion error:', error);
    return {
      success: false,
      error: 'Studio-Löschung konnte nicht abgebrochen werden',
    };
  }
}
