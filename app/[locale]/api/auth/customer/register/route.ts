/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { PrismaClient } from '@/app/generated/prisma';
import { customerRegistrationSchema } from '@/lib/validation';
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
      logger.warn('Customer registration rate limit exceeded', {
        correlationId,
        ipAddress,
        action: 'REGISTER_CUSTOMER',
        resource: 'customer',
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
    const validation = customerRegistrationSchema.safeParse(body);

    if (!validation.success) {
      logger.warn('Customer registration validation failed', {
        correlationId,
        ipAddress,
        action: 'REGISTER_CUSTOMER',
        resource: 'customer',
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

    const { name, email, password, phone } = validation.data;

    // Check if customer already exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { email },
    });

    if (existingCustomer) {
      // Generic error message to prevent account enumeration
      logger.warn('Customer registration failed: Email already exists', {
        correlationId,
        ipAddress,
        email,
        action: 'REGISTER_CUSTOMER',
        resource: 'customer',
        reason: 'EMAIL_EXISTS',
      });
      return NextResponse.json(
        { error: 'Registrierung fehlgeschlagen. Bitte überprüfen Sie Ihre Eingaben.' },
        { status: 400 }
      );
    }

    // Hash password with GDPR Art. 32 compliant cost factor (12 rounds)
    const hashedPassword = await hash(password, BCRYPT_ROUNDS);

    // Create customer
    const customer = await prisma.customer.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone: phone || null,
      },
    });

    // Generate email verification URL
    const verificationURL = await generateEmailVerificationURL(email);

    logger.info('Customer registered successfully', {
      correlationId,
      ipAddress,
      userAgent,
      userId: customer.id,
      email,
      action: 'REGISTER_CUSTOMER',
      resource: 'customer',
      resourceId: customer.id,
      verificationURLGenerated: true,
    });

    // TODO: Send verification email with verificationURL
    // This will be implemented with email service

    return NextResponse.json(
      {
        success: true,
        customer: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
        },
        message: 'Registrierung erfolgreich. Bitte überprüfen Sie Ihre E-Mail zur Verifizierung.',
      },
      { status: 201 }
    );
  } catch (error) {
    // Generic error message - don't expose internal errors
    logger.error('Customer registration failed', {
      correlationId,
      ipAddress,
      userAgent,
      action: 'REGISTER_CUSTOMER',
      resource: 'customer',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: 'Registrierung fehlgeschlagen. Bitte versuchen Sie es später erneut.' },
      { status: 500 }
    );
  }
}
