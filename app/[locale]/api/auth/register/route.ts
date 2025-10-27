/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@/app/generated/prisma';
import { studioOwnerRegistrationSchema } from '@/lib/validation';
import { authRateLimit, getClientIp, rateLimitErrorResponse } from '@/lib/rate-limit';

const prisma = new PrismaClient();

// GDPR Art. 32 compliant bcrypt cost factor
const BCRYPT_ROUNDS = 12;

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 5 attempts per 15 minutes per IP
    const clientIp = getClientIp(request);
    const rateLimitResult = authRateLimit(clientIp);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        rateLimitErrorResponse(rateLimitResult),
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rateLimitResult.reset - Date.now()) / 1000)),
          },
        }
      );
    }

    const body = await request.json();

    // Validate inputs with Zod schema
    const validation = studioOwnerRegistrationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validierungsfehler',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { email, password, name } = validation.data;

    // Check if user exists
    const existingUser = await prisma.studioOwner.findUnique({
      where: { email },
    });

    if (existingUser) {
      // Generic error message to prevent account enumeration
      return NextResponse.json(
        { error: 'Registrierung fehlgeschlagen. Bitte überprüfen Sie Ihre Eingaben.' },
        { status: 400 }
      );
    }

    // Hash password with GDPR Art. 32 compliant cost factor (12 rounds)
    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Create user
    const user = await prisma.studioOwner.create({
      data: {
        email,
        name: name || null,
        password: hashedPassword,
      },
    });

    return NextResponse.json(
      { success: true, user: { id: user.id, email: user.email } },
      { status: 201 }
    );
  } catch (error) {
    // Generic error message - don't expose internal errors
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Registrierung fehlgeschlagen. Bitte versuchen Sie es später erneut.' },
      { status: 500 }
    );
  }
}
