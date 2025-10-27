/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Magic Link Verification API
 * Verifies magic link token and authenticates user
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PrismaClient } from '@/app/generated/prisma';
import { verifyMagicLink } from '@/lib/magic-link';
import { createAuditLog } from '@/lib/audit';
import { signIn } from '@/auth-unified';

const prisma = new PrismaClient();

// Validation schema
const verifySchema = z.object({
  token: z.string().min(1, 'Token ist erforderlich'),
});

/**
 * POST /api/auth/magic-link/verify
 * Verify magic link token and authenticate user
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = verifySchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        {
          error: 'Validierungsfehler',
          details: validatedData.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { token } = validatedData.data;

    // Verify the magic link token
    const email = await verifyMagicLink(token);

    if (!email) {
      return NextResponse.json(
        {
          error: 'Ungültiger oder abgelaufener Magic Link',
          message:
            'Der Magic Link ist ungültig, bereits verwendet oder abgelaufen. Bitte fordern Sie einen neuen an.',
        },
        { status: 400 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        {
          error: 'Benutzer nicht gefunden',
        },
        { status: 404 }
      );
    }

    // Audit log
    await createAuditLog({
      userId: user.id,
      action: 'USER_LOGIN',
      resource: 'user',
      resourceId: user.id,
      metadata: {
        method: 'magic_link',
        verified: true,
        emailVerified: !!user.emailVerified,
      },
      request,
    });

    // Sign in the user using NextAuth
    // This will create a session
    try {
      await signIn('credentials', {
        email: user.email,
        redirect: false,
      });

      return NextResponse.json({
        success: true,
        message: 'Erfolgreich angemeldet',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          emailVerified: !!user.emailVerified,
        },
      });
    } catch (signInError) {
      console.error('Sign in error:', signInError);

      // Return success anyway - the token was valid
      // Client should handle redirect manually
      return NextResponse.json({
        success: true,
        message: 'Magic Link verifiziert',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          emailVerified: !!user.emailVerified,
        },
      });
    }
  } catch (error) {
    console.error('Magic link verification error:', error);

    return NextResponse.json(
      {
        error: 'Interner Serverfehler',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/magic-link/verify?token=xxx
 * Verify magic link token via URL parameter (for email clicks)
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        {
          error: 'Token fehlt',
        },
        { status: 400 }
      );
    }

    // Verify the magic link token
    const email = await verifyMagicLink(token);

    if (!email) {
      // Redirect to error page
      return NextResponse.redirect(
        new URL('/auth/magic-link-expired', request.url)
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.redirect(
        new URL('/auth/error?error=UserNotFound', request.url)
      );
    }

    // Audit log
    await createAuditLog({
      userId: user.id,
      action: 'USER_LOGIN',
      resource: 'user',
      resourceId: user.id,
      metadata: {
        method: 'magic_link',
        verified: true,
        via: 'email_click',
      },
      request,
    });

    // Redirect to callback URL or dashboard
    const callbackUrl = request.nextUrl.searchParams.get('callbackUrl') || '/dashboard';

    // Set session cookie manually or redirect to sign-in with email
    return NextResponse.redirect(
      new URL(`/auth/signin?email=${encodeURIComponent(email)}&verified=true&callbackUrl=${encodeURIComponent(callbackUrl)}`, request.url)
    );
  } catch (error) {
    console.error('Magic link verification error:', error);

    return NextResponse.redirect(
      new URL('/auth/error?error=VerificationFailed', request.url)
    );
  }
}
