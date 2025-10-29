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
import { signIn as nextAuthSignIn } from '@/auth-unified';
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
): Promise<ActionResult<{ email: string }>> {
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
        error: 'An account with this email already exists',
      };
    }

    // 4. Check legacy models (for backward compatibility)
    const legacyCustomer = await prisma.customer.findUnique({
      where: { email },
    });

    const legacyStudioOwner = await prisma.studioOwner.findUnique({
      where: { email },
    });

    if (legacyCustomer || legacyStudioOwner) {
      return {
        success: false,
        error: 'An account with this email already exists',
      };
    }

    // 5. Hash password with bcrypt (cost factor 12)
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
      data: { email: user.email },
    };
  } catch (error) {
    console.error('Registration error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred during registration',
    };
  }
}

/**
 * Unified User Login
 * Automatic role detection via NextAuth credentials provider
 */
export async function signIn(
  data: UnifiedLogin
): Promise<ActionResult<{ redirectUrl: string }>> {
  try {
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

    // Check legacy models if not found in unified User model
    let legacyUser = null;
    if (!user) {
      const customer = await prisma.customer.findUnique({
        where: { email },
        select: { id: true, email: true, password: true, emailVerified: true },
      });

      const studioOwner = await prisma.studioOwner.findUnique({
        where: { email },
        select: { id: true, email: true, password: true, emailVerified: true },
      });

      legacyUser = customer || studioOwner;
    }

    const foundUser = user || legacyUser;

    if (!foundUser) {
      return {
        success: false,
        error: 'Invalid email or password',
      };
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, foundUser.password || '');
    if (!passwordMatch) {
      return {
        success: false,
        error: 'Invalid email or password',
      };
    }

    // Check email verification
    if (!foundUser.emailVerified) {
      return {
        success: false,
        error: 'Please verify your email address before logging in',
      };
    }

    // Check if account is active (only for unified User model)
    if (user && !user.isActive) {
      return {
        success: false,
        error: 'Your account has been suspended. Please contact support.',
      };
    }

    // 3. Validate account type matches user's actual role
    const actualRole = user?.primaryRole || 'CUSTOMER';

    // Prevent role mismatch: Studio owners cannot log in as customers and vice versa
    if (accountType === 'studio' && actualRole !== 'STUDIO_OWNER') {
      return {
        success: false,
        error: 'This account is registered as a customer. Please select "Customer" to log in.',
      };
    }

    if (accountType === 'customer' && actualRole === 'STUDIO_OWNER') {
      return {
        success: false,
        error: 'This account is registered as a studio owner. Please select "Studio Owner" to log in.',
      };
    }

    // 4. Determine redirect URL based on validated account type
    let redirectUrl = '/dashboard';

    if (accountType === 'studio') {
      redirectUrl = '/dashboard'; // Studio dashboard view
    } else if (accountType === 'customer') {
      redirectUrl = '/'; // Landing page with search widget
    }

    // 5. Now sign in via NextAuth (we know credentials are valid)
    try {
      await nextAuthSignIn('credentials', {
        email,
        password,
        accountType, // Pass account type preference for session
        redirect: false,
      });
    } catch (error: unknown) {
      // This shouldn't happen since we already verified credentials
      console.error('NextAuth sign in error:', error);
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

    if (!user) {
      return {
        success: false,
        error: 'No account found with this email address',
      };
    }

    // 2. Check if already verified
    if (user.emailVerified) {
      return {
        success: false,
        error: 'This email address is already verified',
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
