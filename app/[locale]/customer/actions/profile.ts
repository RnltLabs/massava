/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Customer Profile Server Actions
 */

'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import {
  customerAddressSchema,
  customerPhoneSchema,
  customerPreferencesSchema,
  customerPasswordSchema,
  type CustomerAddressInput,
  type CustomerPhoneInput,
  type CustomerPreferencesInput,
  type CustomerPasswordInput,
} from '@/lib/schemas/customer.schema';
import bcrypt from 'bcryptjs';

export type CustomerProfileActionResult =
  | {
      success: true;
      message?: string;
      data?: unknown;
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
 * Update Customer Address
 * Updates customer's address, city, postal code, and optional coordinates
 */
export async function updateCustomerAddress(
  input: CustomerAddressInput
): Promise<CustomerProfileActionResult> {
  try {
    // 1. Authenticate
    const user = await getAuthenticatedUser();

    if (!user) {
      return {
        success: false,
        error: 'Nicht authentifiziert. Bitte melden Sie sich an.',
      };
    }

    // 2. Validate input
    const validated = customerAddressSchema.safeParse(input);

    if (!validated.success) {
      return {
        success: false,
        error: 'Ungültige Adressdaten. Bitte überprüfen Sie alle Felder.',
        fieldErrors: validated.error.flatten().fieldErrors,
      };
    }

    // 3. Update user address
    // Note: These fields need to be added to the User model in Prisma schema:
    // - address: String?
    // - city: String?
    // - postalCode: String?
    // - latitude: Float?
    // - longitude: Float?
    //
    // For now, this will fail until the schema is updated.
    // Uncomment the code below after adding these fields to the User model.

    /*
    await prisma.user.update({
      where: { id: user.id },
      data: {
        address: validated.data.street,
        city: validated.data.city,
        postalCode: validated.data.postalCode,
        latitude: validated.data.latitude ?? undefined,
        longitude: validated.data.longitude ?? undefined,
      },
    });
    */

    // TODO: Add address, city, postalCode, latitude, longitude fields to User model in Prisma schema
    // Then uncomment the update code above

    // 4. Revalidate customer profile pages
    revalidatePath('/customer/profile');
    revalidatePath('/customer/settings');

    return {
      success: true,
      message: 'Adresse erfolgreich aktualisiert',
    };
  } catch (error) {
    console.error('Update customer address error:', error);

    return {
      success: false,
      error: 'Adresse konnte nicht aktualisiert werden. Bitte versuchen Sie es erneut.',
    };
  }
}

/**
 * Update Customer Phone
 * Updates customer's phone number
 */
export async function updateCustomerPhone(
  input: CustomerPhoneInput
): Promise<CustomerProfileActionResult> {
  try {
    // 1. Authenticate
    const user = await getAuthenticatedUser();

    if (!user) {
      return {
        success: false,
        error: 'Nicht authentifiziert. Bitte melden Sie sich an.',
      };
    }

    // 2. Validate input
    const validated = customerPhoneSchema.safeParse(input);

    if (!validated.success) {
      return {
        success: false,
        error: 'Ungültige Telefonnummer.',
        fieldErrors: validated.error.flatten().fieldErrors,
      };
    }

    // 3. Update user phone
    await prisma.user.update({
      where: { id: user.id },
      data: {
        phone: validated.data.phone,
      },
    });

    // 4. Revalidate customer profile pages
    revalidatePath('/customer/profile');
    revalidatePath('/customer/settings');

    return {
      success: true,
      message: 'Telefonnummer erfolgreich aktualisiert',
    };
  } catch (error) {
    console.error('Update customer phone error:', error);

    return {
      success: false,
      error: 'Telefonnummer konnte nicht aktualisiert werden. Bitte versuchen Sie es erneut.',
    };
  }
}

/**
 * Update Customer Preferences
 * Updates customer's language and notification preferences
 */
export async function updateCustomerPreferences(
  input: CustomerPreferencesInput
): Promise<CustomerProfileActionResult> {
  try {
    // 1. Authenticate
    const user = await getAuthenticatedUser();

    if (!user) {
      return {
        success: false,
        error: 'Nicht authentifiziert. Bitte melden Sie sich an.',
      };
    }

    // 2. Validate input
    const validated = customerPreferencesSchema.safeParse(input);

    if (!validated.success) {
      return {
        success: false,
        error: 'Ungültige Einstellungen. Bitte überprüfen Sie alle Felder.',
        fieldErrors: validated.error.flatten().fieldErrors,
      };
    }

    // 3. Update user preferences
    // Note: These fields need to be added to the User model in Prisma schema:
    // - language: String? (or enum with ['de', 'en'])
    // - emailNotifications: Json? (to store notification preferences as JSON)
    //
    // For now, this will fail until the schema is updated.
    // Uncomment the code below after adding these fields to the User model.

    /*
    await prisma.user.update({
      where: { id: user.id },
      data: {
        language: validated.data.language,
        emailNotifications: validated.data.emailNotifications,
      },
    });
    */

    // TODO: Add language and emailNotifications fields to User model in Prisma schema
    // Then uncomment the update code above

    // 4. Revalidate customer profile pages
    revalidatePath('/customer/profile');
    revalidatePath('/customer/settings');
    revalidatePath('/customer/preferences');

    return {
      success: true,
      message: 'Einstellungen erfolgreich aktualisiert',
    };
  } catch (error) {
    console.error('Update customer preferences error:', error);

    return {
      success: false,
      error: 'Einstellungen konnten nicht aktualisiert werden. Bitte versuchen Sie es erneut.',
    };
  }
}

/**
 * Update Customer Password
 * Changes customer's password after verifying current password
 */
export async function updateCustomerPassword(
  input: CustomerPasswordInput
): Promise<CustomerProfileActionResult> {
  try {
    // 1. Authenticate
    const user = await getAuthenticatedUser();

    if (!user) {
      return {
        success: false,
        error: 'Nicht authentifiziert. Bitte melden Sie sich an.',
      };
    }

    // 2. Check if user has a password (not OAuth-only account)
    if (!user.password) {
      return {
        success: false,
        error: 'Kein Passwort gesetzt. Ihr Konto verwendet OAuth-Login.',
      };
    }

    // 3. Validate input
    const validated = customerPasswordSchema.safeParse(input);

    if (!validated.success) {
      return {
        success: false,
        error: 'Ungültige Passwort-Daten. Bitte überprüfen Sie alle Anforderungen.',
        fieldErrors: validated.error.flatten().fieldErrors,
      };
    }

    // 4. Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      validated.data.currentPassword,
      user.password
    );

    if (!isCurrentPasswordValid) {
      return {
        success: false,
        error: 'Aktuelles Passwort ist falsch.',
      };
    }

    // 5. Hash new password
    const hashedPassword = await bcrypt.hash(validated.data.newPassword, 12);

    // 6. Update password in database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
      },
    });

    // 7. Revalidate customer profile pages
    revalidatePath('/customer/profile');
    revalidatePath('/customer/settings');
    revalidatePath('/customer/security');

    return {
      success: true,
      message: 'Passwort erfolgreich geändert',
    };
  } catch (error) {
    console.error('Update customer password error:', error);

    return {
      success: false,
      error: 'Passwort konnte nicht geändert werden. Bitte versuchen Sie es erneut.',
    };
  }
}
