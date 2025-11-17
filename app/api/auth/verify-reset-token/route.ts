/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * API Route: Verify Password Reset Token
 * POST /api/auth/verify-reset-token
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

// Validation schema
const verifyTokenSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

type VerifyTokenRequest = z.infer<typeof verifyTokenSchema>;

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse and validate request body
    const body: unknown = await request.json();
    const validationResult = verifyTokenSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          valid: false,
          error: 'Invalid token',
        },
        { status: 400 }
      );
    }

    const { token }: VerifyTokenRequest = validationResult.data;

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

    // Check if token exists
    if (!resetToken) {
      return NextResponse.json({
        valid: false,
        error: 'Token not found',
      });
    }

    // Check if token has been used
    if (resetToken.used) {
      return NextResponse.json({
        valid: false,
        error: 'Token already used',
      });
    }

    // Check if token has expired
    const now = new Date();
    if (resetToken.expiresAt < now) {
      return NextResponse.json({
        valid: false,
        expired: true,
        error: 'Token has expired',
      });
    }

    // Token is valid
    return NextResponse.json({
      valid: true,
      email: resetToken.email,
    });
  } catch (error) {
    console.error('Token verification error:', error);
    return NextResponse.json(
      {
        valid: false,
        error: 'An error occurred verifying the token',
      },
      { status: 500 }
    );
  }
}
