/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * API Route: Password Reset Request
 * POST /api/auth/reset-password
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { sendPasswordResetEmail } from '@/lib/email/send';
import { randomBytes } from 'crypto';

// Validation schema
const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
  locale: z.string().optional().default('de'),
});

type ResetPasswordRequest = z.infer<typeof resetPasswordSchema>;

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse and validate request body
    const body: unknown = await request.json();
    const validationResult = resetPasswordSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email address',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { email, locale }: ResetPasswordRequest = validationResult.data;

    // Check if user exists
    // Note: For security, we always return success even if user doesn't exist
    // This prevents email enumeration attacks
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, email: true, isActive: true },
    });

    // If user exists and is active, create reset token
    if (user && user.isActive) {
      // Generate secure random token
      const resetToken = randomBytes(32).toString('hex');

      // Create expiry time (1 hour from now)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);

      // Store token in database
      await prisma.passwordResetToken.create({
        data: {
          token: resetToken,
          email: user.email,
          expiresAt,
          used: false,
        },
      });

      // Generate reset URL
      const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/${locale}/auth/reset-password/${resetToken}`;

      // Send password reset email
      const emailResult = await sendPasswordResetEmail(
        user.email,
        resetUrl,
        locale
      );

      if (!emailResult.success) {
        console.error('Failed to send password reset email:', emailResult.error);
        // Don't expose email sending errors to the client
      }
    }

    // Always return success for security
    // This prevents attackers from determining if an email exists in the system
    return NextResponse.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.',
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An error occurred processing your request',
      },
      { status: 500 }
    );
  }
}
