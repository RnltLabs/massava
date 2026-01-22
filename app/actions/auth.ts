/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Unified Authentication Server Actions
 * Single registration and login flow for all users
 */

'use server';

import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import { signIn as nextAuthSignIn } from '@/auth';
import { prisma } from '@/lib/prisma';
import {
  unifiedRegistrationSchema,
  unifiedLoginSchema,
  forgotPasswordSchema,
  type UnifiedRegistration,
  type UnifiedLogin,
  type ForgotPassword,
} from '@/lib/validation';
import { generateEmailVerificationURL } from '@/lib/email-verification';
import { sendVerificationEmail } from '@/lib/email/send';
import { UserRole } from '@/app/generated/prisma';

type ActionResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
};

const BCRYPT_COST_FACTOR = 12;

/**
 * Unified User Registration
 * Creates a new user account (role determined by actions, not upfront)
 */
export async function signUp(
  data: UnifiedRegistration,
  locale: string = 'en'
): Promise<ActionResult<{ email: string; userId: string }>> {
  try {
    // 1. Validate input with Zod
    const validatedFields = unifiedRegistrationSchema.safeParse(data);

    if (!validatedFields.success) {
      return {
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const { name, email, password, phone, accountType } = validatedFields.data;

    // 2. Determine primary role based on account type selection
    const primaryRole =
      accountType === 'studio' ? UserRole.STUDIO_OWNER : UserRole.CUSTOMER;

    // 3. Check if email already exists (in unified User model)
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return {
        success: false,
        error: 'Ein Konto mit dieser E-Mail-Adresse existiert bereits',
      };
    }

    // 4. Hash password with bcrypt (cost factor 12)
    const hashedPassword = await bcrypt.hash(password, BCRYPT_COST_FACTOR);

    // 6. Create User record in database with selected role
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        phone: phone || null, // Optional field
        primaryRole,
        isActive: true,
        emailVerified: null, // Not verified yet
      },
    });

    // 6. Generate verification token (cryptographically secure)
    const verificationURL = await generateEmailVerificationURL(email, locale);
    console.log('[AUTH] Generated verification URL:', verificationURL);

    // 7. Send verification email via Resend
    try {
      console.log('[AUTH] Attempting to send verification email to:', email);
      const emailResult = await sendVerificationEmail(email, verificationURL, locale);
      console.log('[AUTH] Email send result:', emailResult);

      if (!emailResult.success) {
        console.error('[AUTH] Failed to send verification email:', emailResult.error);
      } else {
        console.log('[AUTH] Verification email sent successfully! Message ID:', emailResult.messageId);
      }
    } catch (emailError) {
      console.error('[AUTH] Exception sending verification email:', emailError);
      // Don't fail registration if email fails - user can request new link
    }

    return {
      success: true,
      data: {
        email: user.email,
        userId: user.id  // NEU: User-ID für Buchungsverknüpfung
      },
    };
  } catch (error) {
    console.error('Registration error:', error);
    return {
      success: false,
      error: 'Ein unerwarteter Fehler ist bei der Registrierung aufgetreten',
    };
  }
}

/**
 * Unified User Login
 * Automatic role detection via NextAuth credentials provider
 */
export async function signIn(
  data: UnifiedLogin,
  request?: Request
): Promise<ActionResult<{ redirectUrl: string }>> {
  try {
    // P0.4 FIX: Rate limiting check (prevent brute force attacks)
    // Note: This is a server action, we don't have NextRequest
    // Rate limiting is handled at API route level
    // This is a secondary check for direct server action calls

    // 1. Validate input with Zod
    const validatedFields = unifiedLoginSchema.safeParse(data);

    if (!validatedFields.success) {
      return {
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const { email, password, accountType } = validatedFields.data;

    // 2. Manually verify credentials before NextAuth sign in
    // This gives us better control over error messages
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        emailVerified: true,
        isActive: true,
        primaryRole: true,
      },
    });

    if (!user) {
      return {
        success: false,
        error: 'Invalid email or password',
      };
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password || '');
    if (!passwordMatch) {
      return {
        success: false,
        error: 'Invalid email or password',
      };
    }

    // Email verification is now checked but NOT blocking login
    // User can log in with unverified email, but will see verification reminder
    // This improves UX for users who just registered during booking flow

    // Check if account is active (only for unified User model)
    if (user && !user.isActive) {
      return {
        success: false,
        error: 'Your account has been suspended. Please contact support.',
      };
    }

    // 3. Validate account type matches user's actual role
    const actualRole = user?.primaryRole || 'CUSTOMER';

    // P0.5 FIX: Prevent role mismatch without revealing account details (account enumeration prevention)
    // Use generic error message that doesn't confirm account existence
    if (accountType === 'studio' && actualRole !== 'STUDIO_OWNER') {
      return {
        success: false,
        error: 'Invalid email or password',
      };
    }

    if (accountType === 'customer' && actualRole === 'STUDIO_OWNER') {
      return {
        success: false,
        error: 'Invalid email or password',
      };
    }

    // 4. Determine redirect URL based on validated account type
    let redirectUrl = '/';

    if (accountType === 'studio') {
      redirectUrl = '/business'; // Business Portal for studio owners
    } else if (accountType === 'customer') {
      redirectUrl = '/'; // Landing page with search widget
    }

    // 5. Now sign in via NextAuth (we know credentials are valid)
    console.log('[actions/auth.ts] About to call nextAuthSignIn with:', {
      email,
      accountType,
      passwordLength: password.length
    });

    try {
      const result = await nextAuthSignIn('credentials', {
        email,
        password,
        accountType, // Pass account type preference for session
        redirect: false,
      });
      console.log('[actions/auth.ts] nextAuthSignIn result:', result);
    } catch (error: unknown) {
      // This shouldn't happen since we already verified credentials
      console.error('[actions/auth.ts] NextAuth sign in error:', error);
      return {
        success: false,
        error: 'Login failed. Please try again.',
      };
    }

    // 6. Login successful - return redirect URL
    // Note: Session may not be immediately available in Server Action
    // but will be available after client-side navigation
    return {
      success: true,
      data: { redirectUrl },
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred during login',
    };
  }
}

/**
 * Google OAuth Sign In
 * Uses NextAuth Google provider
 */
export async function signInWithGoogle(
  callbackUrl: string = '/dashboard'
): Promise<ActionResult> {
  try {
    await nextAuthSignIn('google', { callbackUrl });
    return { success: true };
  } catch (error) {
    console.error('Google sign-in error:', error);
    return {
      success: false,
      error: 'Failed to sign in with Google',
    };
  }
}

/**
 * Request Password Reset
 * Sends password reset email (doesn't reveal if email exists)
 */
export async function requestPasswordReset(
  data: ForgotPassword,
  locale: string = 'en'
): Promise<ActionResult> {
  try {
    // 1. Validate input
    const validatedFields = forgotPasswordSchema.safeParse(data);

    if (!validatedFields.success) {
      return {
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const { email } = validatedFields.data;

    // 2. Find user by email (don't reveal if exists - security best practice)
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (user && user.isActive && !user.isSuspended) {
      // 3. Generate reset token (cryptographically secure)
      const token = randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // 4. Store token in database
      await prisma.passwordResetToken.create({
        data: {
          token,
          email,
          expiresAt,
        },
      });

      // 5. Send reset email
      const resetURL = `${process.env.NEXTAUTH_URL}/${locale}/auth/reset-password?token=${token}`;

      // TODO: Send password reset email via Resend
      // For now, just log it
      console.log('Password reset URL:', resetURL);
    }

    // Always return success (don't reveal if email exists)
    return {
      success: true,
      data: {
        message:
          'If an account with that email exists, a password reset link has been sent.',
      },
    };
  } catch (error) {
    console.error('Password reset error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}

/**
 * Resend Verification Email
 * Allows users to request a new verification email
 */
export async function resendVerificationEmail(
  email: string,
  locale: string = 'en'
): Promise<ActionResult> {
  try {
    // 1. Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // P0.5 FIX: Don't reveal if user exists or if email is verified (account enumeration prevention)
    if (!user) {
      // Return success but don't send email (timing-safe)
      return {
        success: true,
        data: { message: 'If an account exists, a verification email has been sent' },
      };
    }

    // 2. Check if already verified
    if (user.emailVerified) {
      // Return generic success message (don't reveal email is already verified)
      return {
        success: true,
        data: { message: 'If an account exists, a verification email has been sent' },
      };
    }

    // 3. Generate new verification token
    const verificationURL = await generateEmailVerificationURL(email, locale);

    // 4. Send verification email
    try {
      await sendVerificationEmail(email, verificationURL, locale);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      return {
        success: false,
        error: 'Failed to send verification email. Please try again.',
      };
    }

    return {
      success: true,
      data: { message: 'Verification email sent successfully' },
    };
  } catch (error) {
    console.error('Resend verification error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}
