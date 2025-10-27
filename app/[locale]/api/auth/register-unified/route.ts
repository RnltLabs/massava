/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * User Registration API - Unified User Model
 * Phase 3: RBAC + Role-based Registration
 */

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { PrismaClient, UserRole } from '@/app/generated/prisma';
import { studioOwnerRegistrationSchema } from '@/lib/validation';
import { authRateLimit, getClientIp, rateLimitErrorResponse } from '@/lib/rate-limit';
import { logger, getCorrelationId, getClientIP, getUserAgent } from '@/lib/logger';
import { generateEmailVerificationURL } from '@/lib/email-verification';
import { sendVerificationEmail } from '@/lib/email/send';
import { createAuditLog } from '@/lib/audit';

const prisma = new PrismaClient();

// GDPR Art. 32 compliant bcrypt cost factor
const BCRYPT_ROUNDS = 12;

/**
 * POST /api/auth/register
 * Register new user (Studio Owner or Customer)
 */
export async function POST(request: NextRequest) {
  const correlationId = getCorrelationId(request);
  const ipAddress = getClientIP(request);
  const userAgent = getUserAgent(request);

  try {
    // Rate limiting: 5 attempts per 15 minutes per IP
    const clientIp = getClientIp(request);
    const rateLimitResult = authRateLimit(clientIp);

    if (!rateLimitResult.success) {
      logger.warn('Registration rate limit exceeded', {
        correlationId,
        ipAddress,
        action: 'REGISTER_USER',
        resource: 'user',
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
      logger.warn('Registration validation failed', {
        correlationId,
        ipAddress,
        action: 'REGISTER_USER',
        resource: 'user',
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

    const { email, password, name, role } = validation.data;

    // Determine role (default to STUDIO_OWNER for backwards compatibility)
    const userRole = (role as UserRole) || UserRole.STUDIO_OWNER;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      // Generic error message to prevent account enumeration
      logger.warn('Registration failed: Email already exists', {
        correlationId,
        ipAddress,
        email,
        action: 'REGISTER_USER',
        resource: 'user',
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
    const user = await prisma.user.create({
      data: {
        email,
        name: name || null,
        password: hashedPassword,
        primaryRole: userRole,
        isActive: true,
        isSuspended: false,
      },
    });

    // Create role assignment
    await prisma.userRoleAssignment.create({
      data: {
        userId: user.id,
        role: userRole,
        grantedBy: 'SELF_REGISTRATION',
        grantedAt: new Date(),
      },
    });

    // Audit log
    await createAuditLog({
      userId: user.id,
      action: 'USER_CREATED',
      resource: 'user',
      resourceId: user.id,
      metadata: {
        email,
        role: userRole,
        registrationMethod: 'password',
      },
      request,
    });

    // Generate email verification URL
    const verificationURL = await generateEmailVerificationURL(email);

    // Send verification email (non-blocking - don't fail registration if email fails)
    const emailResult = await sendVerificationEmail(email, verificationURL, 'de');

    logger.info('User registered successfully', {
      correlationId,
      ipAddress,
      userAgent,
      userId: user.id,
      email,
      role: userRole,
      action: 'REGISTER_USER',
      resource: 'user',
      resourceId: user.id,
      verificationURLGenerated: true,
      emailSent: emailResult.success,
    });

    return NextResponse.json(
      {
        success: true,
        user: { id: user.id, email: user.email, role: user.primaryRole },
        message: 'Registrierung erfolgreich. Bitte überprüfen Sie Ihre E-Mail zur Verifizierung.',
      },
      { status: 201 }
    );
  } catch (error) {
    // Generic error message - don't expose internal errors
    logger.error('Registration failed', {
      correlationId,
      ipAddress,
      userAgent,
      action: 'REGISTER_USER',
      resource: 'user',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: 'Registrierung fehlgeschlagen. Bitte versuchen Sie es später erneut.' },
      { status: 500 }
    );
  }
}
