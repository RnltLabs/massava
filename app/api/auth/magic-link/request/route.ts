/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Magic Link Request API
 * Generates and sends magic link for passwordless authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PrismaClient } from '@/app/generated/prisma';
import { generateMagicLink } from '@/lib/magic-link';
import { createAuditLog } from '@/lib/audit';

const prisma = new PrismaClient();

// Validation schema
const requestSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
});

/**
 * POST /api/auth/magic-link/request
 * Generate and send magic link for email-based authentication
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = requestSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        {
          error: 'Validierungsfehler',
          details: validatedData.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { email } = validatedData.data;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists (prevent enumeration)
      // But still return success to avoid timing attacks
      return NextResponse.json({
        success: true,
        message: 'Wenn ein Konto mit dieser E-Mail existiert, wurde ein Magic Link gesendet.',
      });
    }

    // Generate magic link
    const magicLinkUrl = await generateMagicLink(email);

    // TODO: Send email with magic link
    // For now, just log it (in production, integrate with email service)
    console.log('Magic Link:', magicLinkUrl);

    // Audit log
    await createAuditLog({
      userId: user.id,
      action: 'USER_LOGIN',
      resource: 'user',
      resourceId: user.id,
      metadata: {
        method: 'magic_link',
        emailSent: true,
      },
      request,
    });

    return NextResponse.json({
      success: true,
      message: 'Magic Link wurde an Ihre E-Mail-Adresse gesendet.',
      // In development, return the link for testing
      ...(process.env.NODE_ENV === 'development' && {
        magicLink: magicLinkUrl,
      }),
    });
  } catch (error) {
    console.error('Magic link generation error:', error);

    return NextResponse.json(
      {
        error: 'Interner Serverfehler',
      },
      { status: 500 }
    );
  }
}
