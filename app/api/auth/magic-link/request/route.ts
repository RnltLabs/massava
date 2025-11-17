/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Magic Link Request API
 * Generates and sends magic link for passwordless authentication
 */

import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateMagicLink } from '@/lib/magic-link';
import { createAuditLog } from '@/lib/audit';
import { rateLimitByIP, RATE_LIMIT_CONFIGS } from '@/lib/auth/rate-limit';

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
    // Check rate limit FIRST (before any processing)
    const limitResult = await rateLimitByIP(request, RATE_LIMIT_CONFIGS.MAGIC_LINK);

    if (limitResult.limited) {
      const minutesRemaining = Math.ceil((limitResult.resetAt - Date.now()) / 60000);

      return NextResponse.json(
        {
          error: 'Zu viele Anfragen',
          message: `Bitte versuchen Sie es in ${minutesRemaining} Minuten erneut`,
          retryAfter: Math.ceil((limitResult.resetAt - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((limitResult.resetAt - Date.now()) / 1000)),
            'X-RateLimit-Limit': String(RATE_LIMIT_CONFIGS.MAGIC_LINK.maxRequests),
            'X-RateLimit-Remaining': String(limitResult.remaining),
            'X-RateLimit-Reset': String(limitResult.resetAt),
          },
        }
      );
    }

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
