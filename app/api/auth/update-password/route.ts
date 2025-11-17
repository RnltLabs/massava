/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * API Route: Update Password with Reset Token
 * POST /api/auth/update-password
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// Validation schema
const updatePasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type UpdatePasswordRequest = z.infer<typeof updatePasswordSchema>;

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse and validate request body
    const body: unknown = await request.json();
    const validationResult = updatePasswordSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { token, password }: UpdatePasswordRequest = validationResult.data;

    // Find token in database
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      select: {
        id: true,
        email: true,
        expiresAt: true,
        used: true,
      },
    });

    // Validate token
    if (!resetToken) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid token',
        },
        { status: 404 }
      );
    }

    if (resetToken.used) {
      return NextResponse.json(
        {
          success: false,
          error: 'Token has already been used',
        },
        { status: 400 }
      );
    }

    const now = new Date();
    if (resetToken.expiresAt < now) {
      return NextResponse.json(
        {
          success: false,
          error: 'Token has expired',
          expired: true,
        },
        { status: 400 }
      );
    }

    // Hash password server-side
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user password and mark token as used in a transaction
    await prisma.$transaction([
      // Update user password
      prisma.user.update({
        where: { email: resetToken.email },
        data: { password: hashedPassword },
      }),
      // Mark token as used
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    console.error('Password update error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An error occurred updating your password',
      },
      { status: 500 }
    );
  }
}
