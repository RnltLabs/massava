/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@/app/generated/prisma';
import { studioOwnerRegistrationSchema } from '@/lib/validation';
import { authRateLimit, getClientIp, rateLimitErrorResponse } from '@/lib/rate-limit';
import { logger, getCorrelationId, getClientIP, getUserAgent } from '@/lib/logger';
import { generateEmailVerificationURL } from '@/lib/email-verification';

const prisma = new PrismaClient();

// GDPR Art. 32 compliant bcrypt cost factor
const BCRYPT_ROUNDS = 12;

export async function POST(request: NextRequest) {
  const correlationId = getCorrelationId(request);
  const ipAddress = getClientIP(request);
  const userAgent = getUserAgent(request);

  try {
    // Rate limiting: 5 attempts per 15 minutes per IP
    const clientIp = getClientIp(request);
    const rateLimitResult = authRateLimit(clientIp);

    if (!rateLimitResult.success) {
      logger.warn('Studio owner registration rate limit exceeded', {
        correlationId,
        ipAddress,
        action: 'REGISTER_STUDIO_OWNER',
        resource: 'studio_owner',
      });
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
      logger.warn('Studio owner registration validation failed', {
        correlationId,
        ipAddress,
        action: 'REGISTER_STUDIO_OWNER',
        resource: 'studio_owner',
        errors: validation.error.flatten().fieldErrors,
      });
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
      logger.warn('Studio owner registration failed: Email already exists', {
        correlationId,
        ipAddress,
        email,
        action: 'REGISTER_STUDIO_OWNER',
        resource: 'studio_owner',
        reason: 'EMAIL_EXISTS',
      });
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

    // Generate email verification URL
    const verificationURL = await generateEmailVerificationURL(email);

    logger.info('Studio owner registered successfully', {
      correlationId,
      ipAddress,
      userAgent,
      userId: user.id,
      email,
      action: 'REGISTER_STUDIO_OWNER',
      resource: 'studio_owner',
      resourceId: user.id,
      verificationURLGenerated: true,
    });

    // TODO: Send verification email with verificationURL
    // This will be implemented with email service

    return NextResponse.json(
      {
        success: true,
        user: { id: user.id, email: user.email },
        message: 'Registrierung erfolgreich. Bitte überprüfen Sie Ihre E-Mail zur Verifizierung.',
      },
      { status: 201 }
    );
  } catch (error) {
    // Generic error message - don't expose internal errors
    logger.error('Studio owner registration failed', {
      correlationId,
      ipAddress,
      userAgent,
      action: 'REGISTER_STUDIO_OWNER',
      resource: 'studio_owner',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: 'Registrierung fehlgeschlagen. Bitte versuchen Sie es später erneut.' },
      { status: 500 }
    );
  }
}
